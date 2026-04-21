import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useNetwork } from '../lib/network-context'
import { saveBatch, saveEntry } from '../lib/calendar'
import { computeInsights, getPerformances } from '../lib/performance'

type Role = 'user' | 'assistant'
type Action = { tool: string; args: any; result: any }
type Msg = {
  id: string
  role: Role
  content: string
  actions?: Action[]
  ts: number
}

const SUGGESTIONS = [
  { label: 'Semaine complète (3 comptes × 3/jour)', prompt: 'Planifie ma semaine complète : 3 posts par jour sur les 3 comptes (axora-app, Marwane LI, Twitter), 7 jours, avec les tendances actuelles' },
  { label: '3 jours complets avec images', prompt: 'Planifie 3 jours complets sur les 3 comptes, 3 posts/jour chacun, avec images' },
  { label: 'Images pour posts existants', prompt: 'Génère des images pour tous mes posts planifiés qui n\'en ont pas encore' },
  { label: 'Brief du jour', prompt: 'Donne-moi le brief du jour avec 5 idées de posts' },
  { label: 'Mes performances', prompt: 'Analyse mes performances et dis-moi ce qui marche le mieux' },
  { label: 'Mettre à jour tendances', prompt: 'Rappelle-moi comment ajouter des tendances actuelles dans le brain' },
]

type Resources = {
  hooks: number
  frameworks: number
  voiceProfile: boolean
  perfPosts: number
  calendarEntries: number
  brainProjects: number
  brainAxes: number
  bufferChannels: number
}

export default function AgentPage() {
  const router = useRouter()
  const { network, isLi } = useNetwork()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [resources, setResources] = useState<Resources | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load history + resources summary
  useEffect(() => {
    try {
      const saved = localStorage.getItem('agent-history')
      if (saved) setMessages(JSON.parse(saved))
    } catch {}
    // Compute what resources Pulse has access to
    ;(async () => {
      try {
        const { HOOKS } = await import('../lib/hooks')
        const { FRAMEWORKS } = await import('../lib/frameworks')
        const { getEntries } = await import('../lib/calendar')
        const { getBrain } = await import('../lib/brain')
        const brain = getBrain()
        const vp = localStorage.getItem('voice-profile')
        let perfPosts = 0
        try {
          const perf = JSON.parse(localStorage.getItem('post-performance') || '[]')
          perfPosts = perf.length
        } catch {}
        setResources({
          hooks: HOOKS.length,
          frameworks: FRAMEWORKS.length,
          voiceProfile: !!vp,
          perfPosts,
          calendarEntries: getEntries().length,
          brainProjects: brain.projects.length,
          brainAxes: brain.axes.length,
          bufferChannels: brain.channels.length,
        })
      } catch {}
    })()
  }, [])

  // Save history
  useEffect(() => {
    try { localStorage.setItem('agent-history', JSON.stringify(messages.slice(-30))) } catch {}
  }, [messages])

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // === CLIENT-SIDE TOOL EXECUTOR ===
  // Each tool runs in the browser, calling the right API directly.
  // This bypasses Vercel function timeouts on the agent endpoint.
  const executeTool = async (name: string, args: any): Promise<{ success: boolean; summary: string; data?: any }> => {
    try {
      switch (name) {
        case 'plan_calendar': {
          const days = Math.min(Math.max(args.days || 7, 1), 14)
          const startDate = args.start_date ? new Date(args.start_date) : new Date()
          const net = args.network || network
          const theme = args.theme

          // === Load all ressources to inject in generation ===
          const { sampleHooks } = await import('../lib/hooks')
          const { frameworksFor } = await import('../lib/frameworks')
          const { computeInsights, insightsAsPromptBlock, getPerformances } = await import('../lib/performance')
          const { getEntries } = await import('../lib/calendar')

          let voiceProfile: any = null
          try {
            const vp = localStorage.getItem('voice-profile')
            if (vp) voiceProfile = JSON.parse(vp)
          } catch {}

          const insights = computeInsights(getPerformances())
          const perfBlock = insights.totalPosts >= 5 ? insightsAsPromptBlock(insights) : undefined

          // Avoid topic duplication : collect recent planned topics
          const recentEntries = getEntries().slice(-20)
          const recentTopicsHint = recentEntries.length > 0
            ? `\n\nÉVITE les sujets déjà planifiés récemment : ${recentEntries.map(e => (e.topic || '').slice(0, 40)).join(' | ')}`
            : ''

          // Format rotation
          const formatPool = net === 'twitter'
            ? ['raw_build', 'hot_take', 'storytelling', 'one_liner', 'behind_scenes', 'ai_authority', 'axora_hype']
            : ['storytelling_li', 'transparency', 'thought_leadership', 'value_bomb', 'personal_brand', 'debate_li', 'axora_linkedin']

          // Pre-pick hooks (one unique per day)
          const pickedHooks = sampleHooks(days)
          // For LinkedIn : rotate frameworks too
          const liFrameworks = net === 'linkedin' ? frameworksFor('linkedin') : []

          const requests = Array.from({ length: days }, (_, i) => {
            const format = formatPool[i % formatPool.length]
            const hook = pickedHooks[i % pickedHooks.length]
            const framework = net === 'linkedin' ? liFrameworks[i % liFrameworks.length]?.id : undefined
            const dayContext =
              i === 0 ? 'Premier post : pose le contexte, le problème, ou l\'annonce.' :
              i === days - 1 ? 'Dernier post : conclusion forte ou call to action.' :
              `Post ${i + 1}/${days} : avance la narrative, varie l'angle.`
            return fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                input: `Série sur "${theme}". ${dayContext}${recentTopicsHint}`,
                format,
                network: net,
                voiceProfile,
                performanceInsights: perfBlock,
                hookId: hook?.id,
                framework,
              }),
            })
              .then(r => r.json())
              .then(data => {
                const post = data.posts?.[0]
                if (!post) return null
                return { day: i, format, type: post.type, text: post.text, hookId: hook?.id, framework }
              })
              .catch(() => null)
          })

          const results = await Promise.all(requests)
          const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null)

          if (validResults.length === 0) {
            return { success: false, summary: 'Échec génération — réessaye avec moins de jours ou un thème plus simple' }
          }

          // === Optional : generate images in parallel for each post ===
          let imageUrls: Record<number, string> = {}
          if (args.with_images) {
            const imgRequests = validResults.map(r =>
              fetch('/api/post-image', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postText: r.text, style: 'modern' }),
              })
                .then(res => res.json())
                .then(d => ({ day: r.day, url: d.url || null }))
                .catch(() => ({ day: r.day, url: null }))
            )
            const imgResults = await Promise.all(imgRequests)
            imgResults.forEach(i => { if (i.url) imageUrls[i.day] = i.url })
          }

          const entries = validResults.map(r => {
            const d = new Date(startDate)
            d.setDate(d.getDate() + r.day)
            d.setHours(10, 0, 0, 0)
            return {
              network: net as 'twitter' | 'linkedin',
              format: r.format,
              topic: r.type,
              text: r.text,
              scheduledAt: d.toISOString(),
              status: 'scheduled' as const,
              hookId: r.hookId,
              framework: r.framework,
              imageUrl: imageUrls[r.day],
            }
          })
          saveBatch(entries)

          const imgCount = Object.keys(imageUrls).length

          // === End-to-end : auto-publish to Buffer by default ===
          let bufferMsg = ''
          const shouldPublish = args.publish_to_buffer !== false // default true
          if (shouldPublish) {
            try {
              const { getBrain, getChannelsForProject } = await import('../lib/brain')
              const brain = getBrain()
              let forcedProfileIds: string[] | undefined
              if (args.projectId) {
                const chans = getChannelsForProject(brain, args.projectId)
                if (chans.length > 0) forcedProfileIds = chans.map(c => c.id)
              }
              const bufferBody: any = { entries }
              if (forcedProfileIds) bufferBody.profileIds = forcedProfileIds
              const bufRes = await fetch('/api/buffer/schedule', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bufferBody),
              })
              const bufData = await bufRes.json()
              if (bufRes.ok && bufData.created > 0) {
                bufferMsg = ` · ${bufData.created}/${bufData.total} uploadés dans Buffer`
              } else if (bufRes.ok) {
                bufferMsg = ` · Buffer : 0 uploadé (${bufData.details?.failed?.[0]?.error || 'pas de profil'})`
              } else {
                bufferMsg = ` · Buffer indisponible`
              }
            } catch {
              bufferMsg = ' · Buffer indisponible'
            }
          }

          const resourcesUsed = [
            `${days} hooks`,
            net === 'linkedin' ? `${liFrameworks.length} frameworks` : '',
            voiceProfile ? 'voice' : '',
            perfBlock ? 'perfs' : '',
            recentEntries.length > 0 ? 'dedup' : '',
            args.with_images ? `${imgCount} images` : '',
          ].filter(Boolean).join(' + ')

          return {
            success: true,
            summary: `${validResults.length}/${days} posts sur ${net === 'twitter' ? 'Twitter' : 'LinkedIn'} [${resourcesUsed}]${bufferMsg}`,
            data: { entries_count: entries.length, images: imgCount },
          }
        }

        case 'generate_post': {
          const { sampleHooks } = await import('../lib/hooks')
          const { frameworksFor } = await import('../lib/frameworks')

          const body: any = { input: args.topic, format: args.format, network: args.network }
          try {
            const vp = localStorage.getItem('voice-profile')
            if (vp) body.voiceProfile = JSON.parse(vp)
          } catch {}
          try {
            const { computeInsights, insightsAsPromptBlock, getPerformances } = await import('../lib/performance')
            const insights = computeInsights(getPerformances())
            if (insights.totalPosts >= 5) body.performanceInsights = insightsAsPromptBlock(insights)
          } catch {}

          const pickedHook = sampleHooks(1)[0]
          if (pickedHook) body.hookId = pickedHook.id

          if (args.network === 'linkedin') {
            const liFrameworks = frameworksFor('linkedin')
            const pickedFw = liFrameworks[Math.floor(Math.random() * liFrameworks.length)]
            if (pickedFw) body.framework = pickedFw.id
          }

          const res = await fetch('/api/generate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const data = await res.json()
          if (!data.posts?.length) return { success: false, summary: data.error || 'Échec génération' }
          const firstPost = data.posts[0]

          // Optionally generate image for first variant in parallel
          let imageUrl: string | null = null
          if (args.with_image && firstPost?.text) {
            try {
              const imgRes = await fetch('/api/post-image', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postText: firstPost.text, style: 'modern' }),
              })
              const imgData = await imgRes.json()
              if (imgData.url) imageUrl = imgData.url
            } catch {}
          }

          const usedHook = pickedHook ? `Hook #${pickedHook.id}` : ''
          const usedFw = body.framework ? ` + ${body.framework}` : ''
          const imgMark = imageUrl ? ' + image générée ✓' : ''
          return {
            success: true,
            summary: `${data.posts.length} variantes · ${usedHook}${usedFw}${imgMark}`,
            data: { posts: data.posts, hook: pickedHook, framework: body.framework, imageUrl },
          }
        }

        case 'schedule_post': {
          saveEntry({
            network: args.network,
            format: args.format || 'manual',
            topic: args.topic || args.text.slice(0, 50),
            text: args.text,
            scheduledAt: new Date(args.scheduled_at).toISOString(),
            status: 'scheduled',
          })
          return {
            success: true,
            summary: `Post programmé pour le ${new Date(args.scheduled_at).toLocaleString('fr-FR')}`,
          }
        }

        case 'get_performance_summary': {
          const insights = computeInsights(getPerformances())
          if (insights.totalPosts === 0) {
            return { success: true, summary: 'Aucun post tracké. Va dans /analytics pour ajouter des stats.' }
          }
          const parts = [
            `${insights.totalPosts} posts trackés`,
            `${insights.avgImpressions.toLocaleString()} vues/post en moyenne`,
            `${insights.avgEngagementRate}% engagement`,
            `tendance ${insights.trend === 'up' ? '↗' : insights.trend === 'down' ? '↘' : '→'}`,
          ]
          if (insights.topFormat) parts.push(`top format: ${insights.topFormat.format}`)
          return { success: true, summary: parts.join(' · '), data: insights }
        }

        case 'suggest_hooks': {
          const { HOOKS } = await import('../lib/hooks')
          const filtered = args.category && args.category !== 'all'
            ? HOOKS.filter(h => h.category === args.category)
            : HOOKS
          const sample = [...filtered].sort(() => Math.random() - 0.5).slice(0, 5)
          return {
            success: true,
            summary: `5 hooks pour "${args.topic}" : ${sample.map(h => `"${h.text}"`).join(' · ')}`,
            data: { hooks: sample },
          }
        }

        case 'generate_brief': {
          const res = await fetch('/api/brief', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: args.context }),
          })
          const data = await res.json()
          if (!data.headline) return { success: false, summary: 'Échec brief' }
          return { success: true, summary: `Brief : ${data.headline}`, data }
        }

        case 'optimize_bio': {
          const res = await fetch('/api/bio', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              network: args.network, currentBio: args.current_bio || '', goal: args.goal || '',
            }),
          })
          const data = await res.json()
          if (!data.variants) return { success: false, summary: 'Échec' }
          return { success: true, summary: `${data.variants.length} variantes de bio générées`, data }
        }

        case 'sync_to_google_calendar': {
          const which = args.which || 'upcoming'
          const { getEntries } = await import('../lib/calendar')
          const allEntries = getEntries()
          const toSync = which === 'all'
            ? allEntries
            : allEntries.filter((e: any) => new Date(e.scheduledAt).getTime() > Date.now())
          if (toSync.length === 0) return { success: false, summary: 'Aucun post à syncer' }
          const res = await fetch('/api/google/sync', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: toSync }),
          })
          const data = await res.json()
          if (!res.ok) return { success: false, summary: data.message || 'Sync échouée — connecte Google Calendar d\'abord' }
          return { success: true, summary: `${data.created}/${data.total} évènements synchronisés sur Google Calendar` }
        }

        case 'send_to_buffer': {
          const which = args.which || 'upcoming'
          const { getEntries } = await import('../lib/calendar')
          const { getBrain, getChannelsForProject, getChannelsForAxis } = await import('../lib/brain')
          const brain = getBrain()
          let allEntries = getEntries()

          // Optional filter by project/axis
          let forcedProfileIds: string[] | undefined
          if (args.projectId) {
            const channels = getChannelsForProject(brain, args.projectId)
            if (channels.length === 0) return { success: false, summary: `Aucun channel Buffer pour le projet "${args.projectId}"` }
            forcedProfileIds = channels.map(c => c.id)
            // filter entries by matching project (look for project name/id in topic or text)
            allEntries = allEntries.filter((e: any) => {
              const hay = `${e.topic || ''} ${e.text || ''}`.toLowerCase()
              return hay.includes(args.projectId.toLowerCase())
            })
          } else if (args.axisId) {
            const channels = getChannelsForAxis(brain, args.axisId)
            if (channels.length === 0) return { success: false, summary: `Aucun channel pour l'axe "${args.axisId}"` }
            forcedProfileIds = channels.map(c => c.id)
          }

          const toSend = which === 'all'
            ? allEntries
            : allEntries.filter((e: any) => new Date(e.scheduledAt).getTime() > Date.now())
          if (toSend.length === 0) return { success: false, summary: 'Aucun post à envoyer (vérifie le filtre)' }

          const body: any = { entries: toSend }
          if (forcedProfileIds) body.profileIds = forcedProfileIds

          const res = await fetch('/api/buffer/schedule', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const data = await res.json()
          if (!res.ok) return { success: false, summary: data.error || 'Buffer échoué' }
          if (data.created === 0) {
            const firstErr = data.details?.failed?.[0]?.error || 'aucun profil match'
            return { success: false, summary: `0 envoyé : ${firstErr}` }
          }
          const routing = forcedProfileIds ? ` (routé vers ${forcedProfileIds.length} channel(s))` : ''
          return { success: true, summary: `${data.created}/${data.total} posts envoyés dans Buffer${routing}` }
        }

        case 'plan_weekly_multi_account': {
          const days = Math.min(Math.max(args.days || 7, 1), 7)
          const startDate = args.start_date ? new Date(args.start_date) : new Date()
          const context = args.context || ''

          const { getBrain } = await import('../lib/brain')
          const { sampleHooks } = await import('../lib/hooks')
          const { frameworksFor } = await import('../lib/frameworks')
          const { computeInsights, insightsAsPromptBlock, getPerformances } = await import('../lib/performance')
          const { getEntries } = await import('../lib/calendar')

          const brain = getBrain()

          let voiceProfile: any = null
          try {
            const vp = localStorage.getItem('voice-profile')
            if (vp) voiceProfile = JSON.parse(vp)
          } catch {}

          const insights = computeInsights(getPerformances())
          const perfBlock = insights.totalPosts >= 5 ? insightsAsPromptBlock(insights) : undefined

          const recentTopics = getEntries().slice(-30).map(e => (e.topic || '').slice(0, 40)).filter(Boolean).join(' | ')
          const dedupHint = recentTopics ? `\n\nÉVITE ces sujets déjà planifiés récemment : ${recentTopics}` : ''

          // Build trend string
          const trendsStr = (brain.trends || []).map(t => `"${t.title}" (${t.description})`).join(' | ')
          const trendsHint = trendsStr ? `\n\nTENDANCES À SURFER : ${trendsStr}. Intègre au moins 1 de ces tendances par jour et par compte.` : ''

          // Build requests for all channels × days × posts_per_day
          const requests: Promise<any>[] = []

          for (const cadence of brain.cadence || []) {
            const channel = brain.channels.find(c => c.id === cadence.channelId)
            if (!channel) continue
            const net: 'twitter' | 'linkedin' = channel.service === 'twitter' ? 'twitter' : 'linkedin'

            for (let day = 0; day < days; day++) {
              for (let p = 0; p < cadence.postsPerDay; p++) {
                // Check : is this the lead magnet slot? (last post of the day marked as leadMagnetDay)
                const isLeadMagnetDay = cadence.leadMagnetDay && (day + 1) === cadence.leadMagnetDay
                const isLastPostOfDay = p === cadence.postsPerDay - 1
                const isLeadMagnet = isLeadMagnetDay && isLastPostOfDay

                const angle = isLeadMagnet ? 'lead_magnet' : cadence.angleRotation[p % cadence.angleRotation.length]
                const time = cadence.times[p] || '10:00'
                // Rotate project for this channel if projectMix is set
                const projectId = cadence.projectMix
                  ? cadence.projectMix[(day * cadence.postsPerDay + p) % cadence.projectMix.length]
                  : channel.projects[0]
                const project = brain.projects.find(pr => pr.id === projectId)
                if (!project) continue

                // Format selection based on angle
                const formatByAngle: Record<string, string> = {
                  build_in_public: net === 'twitter' ? 'raw_build' : 'transparency',
                  build_in_public_mix: net === 'twitter' ? 'raw_build' : 'transparency',
                  insight_actualite: net === 'twitter' ? 'hot_take' : 'thought_leadership',
                  engagement_question: net === 'twitter' ? 'engagement_bait' : 'debate_li',
                  hot_take: net === 'twitter' ? 'hot_take' : 'debate_li',
                  personal_story: net === 'twitter' ? 'storytelling' : 'storytelling_li',
                  lead_magnet: net === 'twitter' ? 'engagement_bait' : 'lead_magnet',
                }
                const format = formatByAngle[angle] || (net === 'twitter' ? 'raw_build' : 'storytelling_li')

                // Pick hook
                const hook = sampleHooks(1)[0]

                // Pick framework for LinkedIn long form
                const liFrameworks = net === 'linkedin' ? frameworksFor('linkedin') : []
                const framework = liFrameworks[(day * cadence.postsPerDay + p) % Math.max(1, liFrameworks.length)]?.id

                // Build topic instruction
                const leadMagnetByProject: Record<string, string> = {
                  axora: `Guide/checklist sur l'achat ou la vente d'entreprises. Ex: "Comment évaluer la vraie valeur d'une boîte en 7 points", "Checklist due diligence avant acquisition", "Template pitch deck pour vendre son business".`,
                  pulsa: `Ressource sur les sites web qui convertissent. Ex: "Checklist d'un site web qui convertit", "Template de landing page", "Les 10 erreurs à éviter sur son site".`,
                  personal: `Framework/ressource perso de Marwane. Ex: "Ma routine pour gérer 2 business", "Mon workflow content", "Template de calendrier de posts".`,
                }
                const leadMagnetInstruction = `LEAD MAGNET (post final de cycle — CONVERTIT l'engagement des 6 jours en leads) :
- Type de ressource : ${cadence.leadMagnetType || 'guide'}
- Sujet suggéré : ${leadMagnetByProject[project.id] || leadMagnetByProject.axora}
- Structure : Hook fort + 80% valeur partagée dans le post + 20% en bonus téléchargeable
- CTA obligatoire : "Commente [MOT-CLÉ] et je t'envoie [la ressource] en DM" ou "Like + commente [MOT-CLÉ] pour recevoir le PDF"
- Le MOT-CLÉ doit être simple et mémorable (ex: AXORA, GUIDE, TEMPLATE, PULSA)`

                const angleInstruction: Record<string, string> = {
                  build_in_public: `Montre une coulisse concrète / feature / chiffre de ${project.name}. Building in public, zéro bullshit.`,
                  build_in_public_mix: `Montre une coulisse de ${project.name} (${project.pitch.slice(0, 80)}).`,
                  insight_actualite: `Relie une tendance tech actuelle à l'expérience Marwane/${project.name}. Intègre une tendance du brain si pertinent.`,
                  engagement_question: `Pose une question ouverte sur ${project.name} qui force une réponse. Bonus si l'audience peut partager son expérience.`,
                  hot_take: `Opinion tranchée sur ${project.name === 'Axora' ? 'le marché de l\'acquisition d\'entreprises' : project.name === 'Pulsa Creatives' ? 'la création de sites web' : 'l\'entrepreneuriat'}. Défendable mais contrariante.`,
                  personal_story: `Anecdote perso de Marwane qui montre son quotidien entre ses 2 projets. Touche humaine.`,
                  lead_magnet: leadMagnetInstruction,
                }

                const inputText = `[Jour ${day + 1}/${days}, post ${p + 1}/${cadence.postsPerDay} sur ${channel.name}]
Projet : ${project.name}
Angle : ${angle} — ${angleInstruction[angle] || 'varie le sujet'}
${context ? 'Contexte semaine : ' + context : ''}${trendsHint}${dedupHint}`

                const promise = fetch('/api/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    input: inputText,
                    format,
                    network: net,
                    voiceProfile,
                    performanceInsights: perfBlock,
                    hookId: hook?.id,
                    framework,
                  }),
                }).then(r => r.json()).then(data => {
                  const post = data.posts?.[0]
                  if (!post) return null
                  const scheduledAt = new Date(startDate)
                  scheduledAt.setDate(scheduledAt.getDate() + day)
                  const [hh, mm] = time.split(':').map(Number)
                  scheduledAt.setHours(hh, mm, 0, 0)
                  return {
                    network: net,
                    format,
                    topic: isLeadMagnet ? `[LEAD MAGNET · ${project.name}]` : `[${project.name}] ${angle}`,
                    text: post.text,
                    scheduledAt: scheduledAt.toISOString(),
                    status: 'scheduled' as const,
                    hookId: hook?.id,
                    framework,
                    channelId: channel.id,
                    projectId: project.id,
                  }
                }).catch(() => null)

                requests.push(promise)
              }
            }
          }

          const results = (await Promise.all(requests)).filter((r: any): r is NonNullable<typeof r> => !!r)

          if (results.length === 0) {
            return { success: false, summary: 'Échec — aucune cadence configurée dans le brain ou génération plantée.' }
          }

          // Optional images generation
          if (args.with_images) {
            const imgResults = await Promise.all(results.map(async (r: any) => {
              try {
                const res = await fetch('/api/post-image', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ postText: r.text, style: 'modern' }),
                })
                const d = await res.json()
                if (d.url) r.imageUrl = d.url
              } catch {}
              return r
            }))
          }

          saveBatch(results)

          // Auto-publish to Buffer by channel
          let bufferMsg = ''
          if (args.publish_to_buffer !== false) {
            try {
              // Group by channelId
              const byChannel: Record<string, any[]> = {}
              for (const r of results) {
                if (!byChannel[r.channelId]) byChannel[r.channelId] = []
                byChannel[r.channelId].push(r)
              }
              let totalCreated = 0
              let totalFailed = 0
              for (const [chId, entries] of Object.entries(byChannel)) {
                const res = await fetch('/api/buffer/schedule', {
                  method: 'POST',
                  headers: (() => {
                    const h: Record<string, string> = { 'Content-Type': 'application/json' }
                    try {
                      const t = localStorage.getItem('buffer-user-token')
                      if (t) h['x-buffer-token'] = t
                    } catch {}
                    return h
                  })(),
                  body: JSON.stringify({ entries, profileIds: [chId] }),
                })
                const d = await res.json()
                if (res.ok) { totalCreated += d.created || 0; totalFailed += d.failed || 0 }
              }
              bufferMsg = ` · Buffer : ${totalCreated} uploadés${totalFailed > 0 ? ` (${totalFailed} échecs)` : ''}`
            } catch {
              bufferMsg = ' · Buffer indisponible'
            }
          }

          return {
            success: true,
            summary: `${results.length} posts planifiés sur ${brain.cadence.length} comptes × ${days} jours.${bufferMsg}`,
          }
        }

        case 'generate_images_for_calendar': {
          const limit = Math.min(args.limit || 10, 20)
          const which = args.which || 'upcoming'
          const { getEntries, updateEntry } = await import('../lib/calendar')
          const entries = getEntries()

          // Filter : posts without image
          let target = entries.filter((e: any) => !e.imageUrl)
          if (which === 'upcoming') {
            target = target.filter((e: any) => new Date(e.scheduledAt).getTime() > Date.now())
          }
          target = target.slice(0, limit)

          if (target.length === 0) {
            return { success: true, summary: 'Tous les posts ont déjà une image ✓' }
          }

          // Parallel generation
          const imgResults = await Promise.all(
            target.map(async (e: any) => {
              try {
                const res = await fetch('/api/post-image', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ postText: e.text, style: 'modern' }),
                })
                const data = await res.json()
                if (data.url) {
                  updateEntry(e.id, { imageUrl: data.url })
                  return { id: e.id, ok: true }
                }
              } catch {}
              return { id: e.id, ok: false }
            })
          )
          const ok = imgResults.filter(r => r.ok).length
          return {
            success: true,
            summary: `${ok}/${target.length} images générées pour posts existants`,
          }
        }

        case 'plan_by_axis': {
          const { getBrain } = await import('../lib/brain')
          const brain = getBrain()
          const axis = brain.axes.find(a => a.id === args.axisId)
          if (!axis) return { success: false, summary: `Axe "${args.axisId}" introuvable dans le brain` }

          const days = Math.min(Math.max(args.days || 7, 1), 14)
          const startDate = args.start_date ? new Date(args.start_date) : new Date()

          // Determine network : if axis has at least one linkedin channel, plan LinkedIn version;
          // if has twitter, plan Twitter. We pick the primary (first) channel's service.
          const primaryChannel = brain.channels.find(c => axis.channels.includes(c.id))
          const net = (primaryChannel?.service || 'linkedin') as 'twitter' | 'linkedin'
          const primaryProject = brain.projects.find(p => axis.projects.includes(p.id))
          const theme = axis.name + (primaryProject ? ` (${primaryProject.pitch})` : '')

          // === Use ALL resources ===
          const { sampleHooks } = await import('../lib/hooks')
          const { frameworksFor } = await import('../lib/frameworks')
          const { computeInsights, insightsAsPromptBlock, getPerformances } = await import('../lib/performance')
          const { getEntries } = await import('../lib/calendar')

          let voiceProfile: any = null
          try {
            const vp = localStorage.getItem('voice-profile')
            if (vp) voiceProfile = JSON.parse(vp)
          } catch {}
          const insights = computeInsights(getPerformances())
          const perfBlock = insights.totalPosts >= 5 ? insightsAsPromptBlock(insights) : undefined
          const recentTopics = getEntries().slice(-15).map(e => (e.topic || '').slice(0, 40)).join(' | ')
          const dedupHint = recentTopics ? `\n\nÉVITE ces sujets déjà planifiés : ${recentTopics}` : ''

          const formatPool = net === 'twitter'
            ? ['raw_build', 'hot_take', 'storytelling', 'one_liner', 'behind_scenes']
            : ['storytelling_li', 'transparency', 'thought_leadership', 'value_bomb', 'personal_brand']

          const pickedHooks = sampleHooks(days)
          const liFrameworks = net === 'linkedin' ? frameworksFor('linkedin') : []

          const requests = Array.from({ length: days }, (_, i) => {
            const format = formatPool[i % formatPool.length]
            const hook = pickedHooks[i % pickedHooks.length]
            const framework = net === 'linkedin' ? liFrameworks[i % liFrameworks.length]?.id : undefined
            const dayContext = `Post ${i + 1}/${days} sur l'axe "${axis.name}". ${axis.description}. Avance la narrative.${dedupHint}`
            return fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                input: `${theme}. ${dayContext}`,
                format,
                network: net,
                voiceProfile,
                performanceInsights: perfBlock,
                hookId: hook?.id,
                framework,
              }),
            }).then(r => r.json()).then(data => {
              const p = data.posts?.[0]
              return p ? { day: i, format, type: p.type, text: p.text, hookId: hook?.id, framework } : null
            }).catch(() => null)
          })

          const results = (await Promise.all(requests)).filter((r): r is NonNullable<typeof r> => r !== null)
          if (results.length === 0) return { success: false, summary: 'Échec génération — réessaye plus tard' }

          // Optional parallel image generation
          let imageUrls: Record<number, string> = {}
          if (args.with_images) {
            const imgRequests = results.map(r =>
              fetch('/api/post-image', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postText: r.text, style: 'modern' }),
              })
                .then(res => res.json())
                .then(d => ({ day: r.day, url: d.url || null }))
                .catch(() => ({ day: r.day, url: null }))
            )
            const imgResults = await Promise.all(imgRequests)
            imgResults.forEach(i => { if (i.url) imageUrls[i.day] = i.url })
          }

          const entries = results.map(r => {
            const d = new Date(startDate)
            d.setDate(d.getDate() + r.day)
            d.setHours(10, 0, 0, 0)
            return {
              network: net,
              format: r.format,
              topic: `[${axis.name}] ${r.type}`,
              text: r.text,
              scheduledAt: d.toISOString(),
              status: 'scheduled' as const,
              hookId: r.hookId,
              framework: r.framework,
              imageUrl: imageUrls[r.day],
            }
          })
          saveBatch(entries)

          const imgCount = Object.keys(imageUrls).length

          // === End-to-end : auto-publish to Buffer with axis-based routing ===
          let bufferMsg = ''
          const shouldPublish = args.publish_to_buffer !== false
          if (shouldPublish) {
            try {
              const { getChannelsForAxis } = await import('../lib/brain')
              const chans = getChannelsForAxis(brain, axis.id)
              const forcedProfileIds = chans.length > 0 ? chans.map(c => c.id) : undefined
              const bufferBody: any = { entries }
              if (forcedProfileIds) bufferBody.profileIds = forcedProfileIds
              const bufRes = await fetch('/api/buffer/schedule', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bufferBody),
              })
              const bufData = await bufRes.json()
              if (bufRes.ok && bufData.created > 0) {
                bufferMsg = ` · ${bufData.created}/${bufData.total} uploadés dans Buffer (${chans.length} channels)`
              } else if (bufRes.ok) {
                bufferMsg = ` · Buffer : 0 uploadé (${bufData.details?.failed?.[0]?.error || 'pas de profil'})`
              } else {
                bufferMsg = ` · Buffer indisponible`
              }
            } catch {
              bufferMsg = ' · Buffer indisponible'
            }
          }

          const resources = [
            `${days} hooks`,
            net === 'linkedin' ? `${liFrameworks.length} frameworks` : '',
            voiceProfile ? 'voice' : '',
            perfBlock ? 'perfs' : '',
            args.with_images ? `${imgCount} images` : '',
          ].filter(Boolean).join(' + ')

          return {
            success: true,
            summary: `${results.length}/${days} posts axe "${axis.name}" [${resources}]${bufferMsg}`,
          }
        }

        default:
          return { success: false, summary: `Outil inconnu : ${name}` }
      }
    } catch (e: any) {
      return { success: false, summary: 'Erreur : ' + (e.message || 'inconnue') }
    }
  }

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      ts: Date.now(),
    }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    const clientState: any = { network }
    try {
      const vp = localStorage.getItem('voice-profile')
      if (vp) clientState.voiceProfile = JSON.parse(vp)
    } catch {}
    try {
      clientState.performanceInsights = computeInsights(getPerformances())
    } catch {}
    // Inject brain (strategy) as a prompt block
    try {
      const { getBrain, brainAsPromptBlock } = await import('../lib/brain')
      clientState.brain = brainAsPromptBlock(getBrain())
    } catch {}

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)

    try {
      const apiMessages = newMsgs.map(m => ({ role: m.role, content: m.content }))

      // 1. Quick call to agent → get text + tool_calls
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, clientState }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      let data: any
      const rawText = await res.text()
      try { data = JSON.parse(rawText) }
      catch { throw new Error(`Réponse non-JSON (HTTP ${res.status})`) }

      if (!res.ok) throw new Error(data.error || `Erreur HTTP ${res.status}`)

      // 2. Add the assistant message immediately (text only)
      const assistantMsgId = (Date.now() + 1).toString()
      const initialMsg: Msg = {
        id: assistantMsgId,
        role: 'assistant',
        content: data.message || (data.tool_calls?.length ? '' : 'Pas de réponse'),
        actions: [],
        ts: Date.now(),
      }
      setMessages([...newMsgs, initialMsg])

      // 3. Execute tool calls in parallel (browser-side)
      if (data.tool_calls?.length) {
        const actions: Action[] = []
        await Promise.all(
          data.tool_calls.map(async (tc: any) => {
            const result = await executeTool(tc.name, tc.args)
            actions.push({ tool: tc.name, args: tc.args, result })
          })
        )
        // Update message with actions
        setMessages(curr => curr.map(m => m.id === assistantMsgId ? { ...m, actions } : m))
      }
    } catch (e: any) {
      clearTimeout(timeoutId)
      const isAbort = e.name === 'AbortError'
      const errMsg: Msg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isAbort ? '⚠️ Pulse n\'a pas répondu (timeout 30s). Réessaye.' : '⚠️ ' + (e.message || 'erreur'),
        ts: Date.now(),
      }
      setMessages([...newMsgs, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    if (!confirm('Effacer la conversation ?')) return
    setMessages([])
    localStorage.removeItem('agent-history')
  }

  return (
    <>
      <Head><title>Pulse — Agent IA</title></Head>
      <Layout title="Pulse" subtitle="Ton agent IA personnel · planifie, génère, exécute">
        <div className="agent">
          {/* Messages */}
          <div className="thread" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="welcome">
                <div className="welcome-orb">
                  <div className="orb-core" />
                  <div className="orb-ring" />
                </div>
                <h2>Salut Marwane.</h2>
                <p>Je suis Pulse. Demande-moi de planifier ta semaine, générer des posts, analyser ta perf, ou optimiser ta bio.</p>
                <div className="suggestions">
                  {SUGGESTIONS.map(s => (
                    <button key={s.label} className="sugg" onClick={() => send(s.prompt)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`msg msg-${m.role}`}>
                  {m.role === 'assistant' && (
                    <div className="avatar">
                      <div className="avatar-dot" />
                    </div>
                  )}
                  <div className="bubble">
                    {m.actions && m.actions.length > 0 && (
                      <div className="actions">
                        {m.actions.map((a, i) => (
                          <ActionRow key={i} action={a} onOpen={(href) => router.push(href)} />
                        ))}
                      </div>
                    )}
                    {m.content && <div className="content">{renderContent(m.content)}</div>}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="msg msg-assistant">
                <div className="avatar"><div className="avatar-dot" /></div>
                <div className="bubble">
                  <div className="thinking">
                    <span /><span /><span />
                    <span className="thinking-label">Pulse réfléchit · jusqu'à 60s pour les tâches complexes</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resources bar */}
          {resources && (
            <div className="resources" title="Ressources que Pulse utilise automatiquement">
              <span className="res-label">Ressources actives :</span>
              <span className="res-chip" onClick={() => router.push('/library')}>{resources.hooks} hooks</span>
              <span className="res-chip" onClick={() => router.push('/library')}>{resources.frameworks} frameworks</span>
              <span className={`res-chip ${resources.voiceProfile ? 'res-on' : 'res-off'}`} onClick={() => router.push('/voice')}>
                voice {resources.voiceProfile ? '✓' : '—'}
              </span>
              <span className={`res-chip ${resources.perfPosts >= 5 ? 'res-on' : 'res-off'}`} onClick={() => router.push('/analytics')}>
                {resources.perfPosts} perf{resources.perfPosts > 1 ? 's' : ''}
              </span>
              <span className="res-chip" onClick={() => router.push('/strategy')}>
                brain · {resources.brainAxes} axes
              </span>
              <span className="res-chip" onClick={() => router.push('/calendar')}>
                {resources.calendarEntries} au calendrier
              </span>
              <span className="res-chip">{resources.bufferChannels} channels Buffer</span>
            </div>
          )}

          {/* Input */}
          <div className="input-bar">
            <textarea
              className="input"
              placeholder={`Parle à Pulse · ${isLi ? 'mode LinkedIn' : 'mode Twitter'}`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
              }}
              rows={1}
              disabled={loading}
            />
            <button className="send" onClick={() => send(input)} disabled={loading || !input.trim()}>
              {loading ? <span className="spin" /> : <SendIcon />}
            </button>
          </div>
          {messages.length > 0 && (
            <button onClick={clear} className="clear">Effacer la conversation</button>
          )}
        </div>

        <style jsx>{`
          .agent {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 180px);
            min-height: 500px;
            margin: -8px 0;
          }

          .thread {
            flex: 1;
            overflow-y: auto;
            padding: 8px 4px 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          /* Welcome */
          .welcome {
            margin: auto;
            text-align: center;
            max-width: 480px;
            padding: 24px;
          }
          .welcome-orb {
            position: relative;
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .orb-core {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--net);
            box-shadow: 0 0 40px var(--net), 0 0 80px var(--net-soft);
            animation: pulse-soft 2.4s ease-in-out infinite;
          }
          .orb-ring {
            position: absolute;
            inset: 0;
            border: 2px solid var(--net-soft);
            border-radius: 50%;
            animation: orb-ring 3s ease-in-out infinite;
          }
          @keyframes orb-ring {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.2; }
          }
          .welcome h2 {
            font-size: 24px;
            font-weight: 700;
            color: var(--text);
            margin: 0 0 8px;
            letter-spacing: -0.02em;
          }
          .welcome p {
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.6;
            margin: 0 0 24px;
          }
          .suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: center;
          }
          .sugg {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
            padding: 7px 14px;
            border-radius: 100px;
            font-weight: 500;
            transition: all var(--t-fast) var(--ease);
          }
          .sugg:hover {
            background: var(--bg-card-hover);
            border-color: var(--border-strong);
            color: var(--text);
            transform: translateY(-1px);
          }

          /* Messages */
          .msg {
            display: flex;
            gap: 12px;
            animation: fade-in var(--t-med) var(--ease);
          }
          .msg-user { justify-content: flex-end; }

          .avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--bg-card);
            border: 1px solid var(--border-strong);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 4px;
          }
          .avatar-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--net);
            box-shadow: 0 0 8px var(--net);
          }

          .bubble {
            max-width: 76%;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .msg-user .bubble {
            background: var(--accent);
            color: var(--accent-text-on);
            padding: 12px 16px;
            border-radius: 16px 16px 4px 16px;
          }
          .msg-assistant .bubble .content {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--text);
            padding: 12px 16px;
            border-radius: 4px 16px 16px 16px;
          }
          .content {
            font-size: 14px;
            line-height: 1.55;
            white-space: pre-wrap;
          }

          .thinking {
            display: inline-flex;
            gap: 6px;
            align-items: center;
            padding: 12px 16px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 4px 16px 16px 16px;
          }
          .thinking-label {
            font-size: 11px;
            color: var(--text-muted);
            margin-left: 8px;
            font-family: var(--mono);
          }
          .thinking span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--text-muted);
            animation: bounce 1.2s ease-in-out infinite;
          }
          .thinking span:nth-child(2) { animation-delay: 0.15s; }
          .thinking span:nth-child(3) { animation-delay: 0.3s; }
          @keyframes bounce {
            0%, 100% { opacity: 0.3; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-3px); }
          }

          /* Resources bar */
          .resources {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            align-items: center;
            padding: 8px 4px;
            font-size: 10px;
            color: var(--text-muted);
            font-family: var(--mono);
          }
          .res-label {
            color: var(--text-faint);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-right: 4px;
          }
          .res-chip {
            background: var(--bg-card);
            border: 1px solid var(--border);
            padding: 2px 8px;
            border-radius: 100px;
            cursor: pointer;
            color: var(--text-secondary);
            transition: all var(--t-fast) var(--ease);
          }
          .res-chip:hover { border-color: var(--net); color: var(--net); }
          .res-chip.res-on { border-color: rgba(74,222,128,0.3); color: var(--success); }
          .res-chip.res-off { opacity: 0.5; }

          /* Input */
          .input-bar {
            display: flex;
            gap: 8px;
            padding: 12px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-xl);
            margin-top: 12px;
            transition: border-color var(--t-fast) var(--ease);
          }
          .input-bar:focus-within {
            border-color: var(--border-focus);
          }
          .input {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--text);
            font-size: 14px;
            line-height: 1.5;
            resize: none;
            font-family: var(--font);
            padding: 6px 4px;
            min-height: 24px;
            max-height: 200px;
          }
          .input::placeholder { color: var(--text-muted); }
          .input:focus { box-shadow: none; }

          .send {
            background: var(--accent);
            color: var(--accent-text-on);
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .send:hover:not(:disabled) { transform: scale(1.05); }
          .send:disabled { background: var(--bg-card); color: var(--text-faint); }

          .spin {
            width: 14px;
            height: 14px;
            border: 1.5px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }

          .clear {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 11px;
            font-family: var(--mono);
            padding: 8px;
            margin-top: 4px;
            align-self: flex-end;
          }
          .clear:hover { color: var(--danger); }
        `}</style>
      </Layout>
    </>
  )
}

function renderContent(text: string) {
  // Simple markdown-like rendering : bold + line breaks
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>
    }
    return <span key={i}>{p}</span>
  })
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </svg>
  )
}

function ActionRow({ action, onOpen }: { action: Action; onOpen: (href: string) => void }) {
  const labels: Record<string, string> = {
    plan_calendar: 'Calendrier planifié',
    generate_post: 'Post généré',
    schedule_post: 'Post programmé',
    get_performance_summary: 'Performance',
    suggest_hooks: 'Hooks suggérés',
    generate_brief: 'Brief généré',
    optimize_bio: 'Bio optimisée',
    sync_to_google_calendar: 'Sync Google Calendar',
    send_to_buffer: 'Envoi Buffer',
    plan_by_axis: 'Calendrier par axe',
    generate_images_for_calendar: 'Images pour calendrier',
    plan_weekly_multi_account: 'Semaine complète (3 comptes × 3/jour)',
  }
  const label = labels[action.tool] || action.tool
  const ok = action.result?.success !== false
  const summary = action.result?.summary || action.result?.message || ''

  // Quick links per action
  const link =
    action.tool === 'plan_calendar' || action.tool === 'schedule_post' || action.tool === 'sync_to_google_calendar' ? '/calendar' :
    action.tool === 'generate_brief' ? '/brief' :
    action.tool === 'get_performance_summary' ? '/analytics' :
    action.tool === 'optimize_bio' ? '/bio' :
    action.tool === 'generate_post' ? '/' : ''

  return (
    <div className={`action ${ok ? 'ok' : 'fail'}`}>
      <div className="action-icon">{ok ? '✓' : '✗'}</div>
      <div className="action-body">
        <div className="action-name">{label}</div>
        {summary && <div className="action-summary">{summary}</div>}
      </div>
      {link && (
        <button className="action-link" onClick={() => onOpen(link)}>
          Voir →
        </button>
      )}

      <style jsx>{`
        .action {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border-strong);
          border-radius: var(--r-md);
          padding: 10px 12px;
          font-size: 12px;
        }
        .action.ok { border-left: 3px solid var(--success); }
        .action.fail { border-left: 3px solid var(--danger); }
        .action-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${'var(--net-soft)'};
          color: var(--net);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .action.fail .action-icon { background: rgba(239,68,68,.1); color: var(--danger); }
        .action-body { flex: 1; min-width: 0; }
        .action-name {
          font-weight: 600;
          color: var(--text);
          font-size: 12px;
        }
        .action-summary {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
          line-height: 1.4;
        }
        .action-link {
          background: transparent;
          border: 1px solid var(--border-strong);
          color: var(--text-secondary);
          font-size: 11px;
          padding: 4px 10px;
          border-radius: var(--r-sm);
          font-family: var(--mono);
          flex-shrink: 0;
        }
        .action-link:hover { color: var(--text); border-color: var(--text-faint); }
      `}</style>
    </div>
  )
}
