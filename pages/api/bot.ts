import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es le bot Telegram personnel de Marwane (@ismaa_pxl), entrepreneur tech à Bruxelles.
Projets : Axora (marketplace acquisition business digitaux francophone), Pulsa Creatives (agence IA Bruxelles).
Style : direct, cash, authentique, mélange FR/EN naturel, zéro bullshit.

Tu génères des posts pour Twitter/X et LinkedIn. Quand on te demande de poster, tu génères le contenu.`

const FORMATS = ['raw_build', 'hot_take', 'behind_scenes', 'ai_authority', 'storytelling', 'one_liner', 'axora_hype', 'engagement_bait']

const FORMAT_LABELS: Record<string, string> = {
  raw_build: 'Raw Build', hot_take: 'Hot Take', behind_scenes: 'BTS',
  ai_authority: 'AI Authority', storytelling: 'Micro Story',
  one_liner: 'One-Liner', axora_hype: 'Axora Hype', engagement_bait: 'Reply Magnet'
}

async function generatePost(topic: string, format: string, network: string) {
  const isTwitter = network !== 'linkedin'
  const maxChars = isTwitter ? 280 : 1500

  const prompt = `Génère 1 post ${isTwitter ? 'Twitter/X' : 'LinkedIn'} au format "${FORMAT_LABELS[format] || format}".

Sujet/contexte : "${topic}"

Réponds UNIQUEMENT avec le texte du post. Pas de JSON, pas d'explication, juste le post prêt à copier-coller.

Règles :
- Max ${maxChars} caractères
- Hook ultra-fort en ligne 1
- ${isTwitter ? 'Zéro hashtag sauf #BuildInPublic ou #Axora (max 1). Pas d\'emojis.' : 'Format aéré, 1 idée par ligne, CTA naturel à la fin.'}
- Le post doit être prêt à publier tel quel`

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-6',
      max_tokens: 600,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error('Generation failed')
  return data.choices?.[0]?.message?.content?.trim() || ''
}

async function generateWeek(topic: string, network: string) {
  const isTwitter = network !== 'linkedin'

  const prompt = `Génère 7 posts ${isTwitter ? 'Twitter/X' : 'LinkedIn'} pour la semaine, un par jour, chacun avec un format différent.

Thème de la semaine : "${topic}"

Réponds en JSON strict :
{"posts":[
  {"day":"Lundi","format":"Raw Build","text":"..."},
  {"day":"Mardi","format":"Hot Take","text":"..."},
  {"day":"Mercredi","format":"Micro Story","text":"..."},
  {"day":"Jeudi","format":"AI Authority","text":"..."},
  {"day":"Vendredi","format":"Reply Magnet","text":"..."},
  {"day":"Samedi","format":"One-Liner","text":"..."},
  {"day":"Dimanche","format":"Axora Hype","text":"..."}
]}

Règles :
- Max ${isTwitter ? '280' : '1500'} caractères chacun
- Hook ultra-fort en ligne 1
- Chaque post est autonome et excellent
- Les 7 posts racontent une progression narrative à travers la semaine
- JSON uniquement`

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error('Generation failed')
  const raw = data.choices?.[0]?.message?.content?.trim() || ''
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

/*
  Bot API — called by n8n Telegram trigger

  POST /api/bot
  body: { command, topic?, network?, format? }

  Commands:
    "today"     → génère 1 post pour aujourd'hui
    "tomorrow"  → génère 1 post pour demain (retourne le post + info)
    "week"      → génère 7 posts pour la semaine
    "post"      → génère 1 post custom (requires topic)
    "formats"   → liste les formats dispo
    "help"      → aide
*/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // Auth (disabled for now — re-enable later)
  // const secret = process.env.N8N_SECRET
  // const authHeader = req.headers.authorization
  // if (secret && authHeader !== `Bearer ${secret}`) {
  //   return res.status(401).json({ error: 'Unauthorized' })
  // }

  const { command, topic, network = 'twitter', format } = req.body

  try {
    switch (command) {
      case 'today':
      case 'demain':
      case 'tomorrow': {
        const dayLabel = command === 'today' ? "aujourd'hui" : 'demain'
        const selectedFormat = format || FORMATS[Math.floor(Math.random() * FORMATS.length)]
        const text = await generatePost(
          topic || `Ce que je build ${dayLabel} sur Axora/Pulsa`,
          selectedFormat,
          network
        )
        return res.status(200).json({
          message: `Post ${dayLabel} (${FORMAT_LABELS[selectedFormat]}) :\n\n${text}`,
          post: text,
          format: FORMAT_LABELS[selectedFormat],
          network,
          when: dayLabel,
          ready_to_post: true,
        })
      }

      case 'week':
      case 'semaine': {
        const weekData = await generateWeek(
          topic || 'Building Axora et Pulsa Creatives, IA, entrepreneuriat',
          network
        )
        const formatted = weekData.posts.map((p: any) =>
          `${p.day} (${p.format}):\n${p.text}`
        ).join('\n\n---\n\n')

        return res.status(200).json({
          message: `7 posts pour la semaine :\n\n${formatted}`,
          posts: weekData.posts,
          network,
          ready_to_post: true,
        })
      }

      case 'post': {
        if (!topic) return res.status(400).json({ message: 'Donne-moi un sujet. Ex: /post J\'ai shippé une feature Axora' })
        const selectedFormat = format || FORMATS[Math.floor(Math.random() * FORMATS.length)]
        const text = await generatePost(topic, selectedFormat, network)
        return res.status(200).json({
          message: `Post (${FORMAT_LABELS[selectedFormat]}) :\n\n${text}`,
          post: text,
          format: FORMAT_LABELS[selectedFormat],
          network,
          ready_to_post: true,
        })
      }

      case 'formats': {
        const list = Object.entries(FORMAT_LABELS).map(([id, label]) => `• ${label}`).join('\n')
        return res.status(200).json({
          message: `Formats disponibles :\n\n${list}\n\nUtilise /post [sujet] pour générer.`,
        })
      }

      case 'help':
      default: {
        return res.status(200).json({
          message: ` Social Agent Bot\n\nCommandes :\n\n/today — Génère 1 post pour aujourd'hui\n/tomorrow — Génère 1 post pour demain\n/week — Génère 7 posts pour la semaine\n/post [sujet] — Génère 1 post sur un sujet\n/formats — Liste les formats\n\nOptions :\n• Ajoute "linkedin" pour LinkedIn (défaut: Twitter)\n• Ajoute un sujet pour personnaliser\n\nExemples :\n/today J'ai shippé le matching IA d'Axora\n/week linkedin building in public\n/post hot take sur les agences IA`,
        })
      }
    }
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: 'Erreur de génération. Réessaie.' })
  }
}
