import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es Pulse, l'agent IA personnel de Marwane (entrepreneur tech à Bruxelles, fondateur de Axora marketplace + Pulsa Creatives).

Ton job : aider Marwane à gérer sa présence Twitter/X et LinkedIn de bout en bout.

Tu PEUX faire des choses concrètes via tes outils :
- Planifier un calendrier de contenu (1 jour, 1 semaine, 1 mois)
- Générer des posts spécifiques
- Programmer des posts dans le calendrier
- Lire les performances passées
- Suggérer des hooks et frameworks
- Optimiser la bio
- Générer un brief du jour

Tu es proactif et concret :
- Tu poses MAX 1 question si vraiment nécessaire, sinon tu proposes directement
- Tu utilises tes outils plutôt que de juste discuter
- Tu adaptes ton style au réseau actif (Twitter = punchy, LinkedIn = pro)
- Tu connais Marwane : building Axora (marketplace acquisition business digitaux FR/BE), il build in public, ton direct/cash, mélange FR/EN naturel
- Réponses courtes, claires, en français
- Tu confirmes brièvement les actions faites avec leurs résultats

Quand l'utilisateur te demande quelque chose de vague, ASSUME des choix raisonnables et exécute. Demande seulement si vraiment ambigu.`

// === TOOLS DEFINITIONS (OpenAI function-calling format) ===
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'plan_calendar',
      description: "Planifie un calendrier de contenu sur N jours. Génère N posts (un par jour) avec sujets, formats variés, et heures optimales. Le résultat est ajouté au calendrier de l'utilisateur.",
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Nombre de jours à planifier (1-30)' },
          network: { type: 'string', enum: ['twitter', 'linkedin', 'both'], description: 'Réseau cible' },
          theme: { type: 'string', description: "Thème global de la planification (ex: 'Lancement Axora', 'Building in public IA', 'Personal branding')" },
          start_date: { type: 'string', description: 'Date de départ ISO (YYYY-MM-DD), defaults to today' },
        },
        required: ['days', 'network', 'theme'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_post',
      description: "Génère un post unique avec un format et un sujet précis. NE l'ajoute PAS au calendrier — juste retourne le texte.",
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: "Sujet ou contexte du post" },
          format: { type: 'string', description: 'ex: raw_build, hot_take, storytelling, transparency, value_bomb' },
          network: { type: 'string', enum: ['twitter', 'linkedin'] },
        },
        required: ['topic', 'format', 'network'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_post',
      description: "Ajoute un post déjà rédigé au calendrier à une date/heure précise.",
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Texte complet du post' },
          network: { type: 'string', enum: ['twitter', 'linkedin'] },
          format: { type: 'string', description: 'Format du post' },
          scheduled_at: { type: 'string', description: 'Date/heure ISO (YYYY-MM-DDTHH:mm)' },
          topic: { type: 'string', description: 'Sujet court (résumé)' },
        },
        required: ['text', 'network', 'scheduled_at'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_performance_summary',
      description: "Lit les insights de performance de Marwane : meilleur format, meilleur hook, top posts, tendance.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_hooks',
      description: "Suggère 5 hooks viraux pertinents pour un sujet donné.",
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          category: { type: 'string', enum: ['curiosite', 'autorite', 'controverse', 'empathie', 'storytelling', 'urgence', 'question', 'all'] },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_brief',
      description: "Génère le brief du jour : 5 idées de posts, 3 tendances, 1 viral angle.",
      parameters: {
        type: 'object',
        properties: { context: { type: 'string', description: 'Contexte semaine optionnel' } },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'optimize_bio',
      description: "Génère 5 variantes optimisées de bio pour un réseau.",
      parameters: {
        type: 'object',
        properties: {
          network: { type: 'string', enum: ['twitter', 'linkedin'] },
          current_bio: { type: 'string' },
          goal: { type: 'string' },
        },
        required: ['network'],
      },
    },
  },
]

// === HELPERS ===
function getBaseUrl(req: NextApiRequest): string {
  const host = req.headers.host
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  return `${proto}://${host}`
}

async function executeTool(name: string, args: any, baseUrl: string, clientState: any): Promise<any> {
  switch (name) {
    case 'plan_calendar': {
      const { days, network, theme, start_date } = args
      const start = start_date ? new Date(start_date) : new Date()
      const targetNetwork = network === 'both' ? 'twitter' : network

      // Generate via /api/series for >7 days, else generate one by one
      const res = await fetch(`${baseUrl}/api/series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: days,
          network: targetNetwork,
          launchDate: start.toISOString().split('T')[0],
          productPitch: theme,
          voiceProfile: clientState?.voiceProfile,
        }),
      })
      const data = await res.json()
      if (!data.posts) return { success: false, error: data.error || 'Échec génération' }

      // Build calendar entries
      const entries = data.posts.map((p: any, i: number) => {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        d.setHours(10, 0, 0, 0) // 10h par défaut
        return {
          network: targetNetwork,
          format: p.type || 'storytelling',
          topic: p.goal || p.phase,
          text: p.text,
          scheduledAt: d.toISOString(),
          status: 'scheduled' as const,
        }
      })
      return {
        success: true,
        days_planned: days,
        network: targetNetwork,
        theme,
        entries, // client will save them
        summary: `${days} posts planifiés pour ${targetNetwork} sur le thème "${theme}". Tous ajoutés au calendrier à 10h chaque jour.`,
      }
    }

    case 'generate_post': {
      const { topic, format, network } = args
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: topic,
          format,
          network,
          voiceProfile: clientState?.voiceProfile,
        }),
      })
      const data = await res.json()
      if (!data.posts || !data.posts.length) return { success: false, error: 'Échec' }
      return { success: true, posts: data.posts }
    }

    case 'schedule_post': {
      const { text, network, format, scheduled_at, topic } = args
      const entry = {
        network,
        format: format || 'manual',
        topic: topic || text.slice(0, 50),
        text,
        scheduledAt: new Date(scheduled_at).toISOString(),
        status: 'scheduled' as const,
      }
      return { success: true, entry, summary: `Post programmé pour le ${new Date(scheduled_at).toLocaleString('fr-FR')}` }
    }

    case 'get_performance_summary': {
      // Returns from clientState (passed by frontend)
      const insights = clientState?.performanceInsights
      if (!insights || insights.totalPosts === 0) {
        return { success: true, message: 'Aucun post tracké pour le moment. Va dans /analytics pour ajouter tes stats.' }
      }
      return {
        success: true,
        total_posts: insights.totalPosts,
        avg_impressions: insights.avgImpressions,
        avg_engagement_rate: insights.avgEngagementRate,
        trend: insights.trend,
        top_format: insights.topFormat?.format,
        top_hook_id: insights.topHook?.hookId,
        top_framework: insights.topFramework?.framework,
        top_network: insights.topNetwork,
      }
    }

    case 'suggest_hooks': {
      const { HOOKS } = await import('../../lib/hooks')
      const filtered = args.category && args.category !== 'all'
        ? HOOKS.filter(h => h.category === args.category)
        : HOOKS
      const sample = [...filtered].sort(() => Math.random() - 0.5).slice(0, 5)
      return { success: true, topic: args.topic, hooks: sample.map(h => ({ id: h.id, text: h.text, category: h.category })) }
    }

    case 'generate_brief': {
      const res = await fetch(`${baseUrl}/api/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: args.context, voiceProfile: clientState?.voiceProfile }),
      })
      const data = await res.json()
      if (!data.headline) return { success: false, error: 'Échec brief' }
      return { success: true, brief: data }
    }

    case 'optimize_bio': {
      const res = await fetch(`${baseUrl}/api/bio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: args.network,
          currentBio: args.current_bio || '',
          goal: args.goal || '',
          voiceProfile: clientState?.voiceProfile,
        }),
      })
      const data = await res.json()
      if (!data.variants) return { success: false, error: 'Échec' }
      return { success: true, variants: data.variants, recommended: data.recommended }
    }

    default:
      return { success: false, error: `Tool inconnu : ${name}` }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { messages = [], clientState = {} } = req.body
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages must be an array' })

  // Add system prompt + current network context
  const networkContext = clientState.network
    ? `\n\nRéseau actif : ${clientState.network}${clientState.network === 'linkedin' ? ' (style pro, posts longs aérés)' : ' (style punchy, max 280 chars)'}`
    : ''

  const fullMessages = [
    { role: 'system', content: SYSTEM + networkContext },
    ...messages,
  ]

  const baseUrl = getBaseUrl(req)
  const MAX_ITERATIONS = 5
  let iteration = 0
  let currentMessages = [...fullMessages]
  const allActions: any[] = []

  try {
    while (iteration < MAX_ITERATIONS) {
      iteration++
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4-6',
          max_tokens: 3000,
          messages: currentMessages,
          tools: TOOLS,
          tool_choice: 'auto',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        console.error('OpenRouter error:', data)
        return res.status(500).json({ error: data.error?.message || 'Agent failed' })
      }

      const choice = data.choices?.[0]
      const message = choice?.message

      if (!message) {
        return res.status(500).json({ error: 'Réponse vide' })
      }

      // Si pas de tool calls → réponse finale
      if (!message.tool_calls || message.tool_calls.length === 0) {
        return res.status(200).json({
          message: message.content || '',
          actions: allActions,
        })
      }

      // Sinon : exécuter les tools et continuer la boucle
      currentMessages.push(message)

      for (const tc of message.tool_calls) {
        const toolName = tc.function.name
        let toolArgs: any = {}
        try { toolArgs = JSON.parse(tc.function.arguments || '{}') } catch {}

        const result = await executeTool(toolName, toolArgs, baseUrl, clientState)
        allActions.push({ tool: toolName, args: toolArgs, result })

        currentMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        })
      }
    }

    return res.status(200).json({
      message: 'Trop d\'itérations, je m\'arrête. Reformule ?',
      actions: allActions,
    })
  } catch (e: any) {
    console.error('Agent error:', e)
    return res.status(500).json({ error: e.message || 'Agent failed' })
  }
}
