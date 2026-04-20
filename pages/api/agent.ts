import type { NextApiRequest, NextApiResponse } from 'next'

// Single-shot agent : 1 appel à Claude, retourne text + tool_calls.
// Le CLIENT exécute les tool calls (évite les timeouts Vercel).
export const config = {
  maxDuration: 30,
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es Pulse, l'agent IA personnel de Marwane (entrepreneur tech à Bruxelles, fondateur de Axora marketplace + Pulsa Creatives).

Ton job : aider Marwane à gérer sa présence Twitter/X et LinkedIn.

Tu PEUX faire des choses concrètes via tes outils. Quand tu utilises un outil :
- Réponds D'ABORD avec un message court qui dit ce que tu vas faire (genre "OK je planifie ta semaine sur Twitter…")
- PUIS appelle l'outil
- Le client va exécuter l'outil et afficher le résultat. Tu n'as pas besoin de re-confirmer.

Style :
- Direct, opérationnel, en français
- Pas de questions inutiles : assume des choix raisonnables et exécute
- Tu connais Marwane : building Axora (marketplace acquisition business digitaux FR/BE), build in public, ton direct/cash
- Réponses courtes (1-3 phrases max quand tu utilises un outil)`

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'plan_calendar',
      description: "Planifie un calendrier de contenu sur N jours (1-14). Génère N posts (un par jour) avec sujets variés. Le client va appeler /api/series pour créer les posts et les ajouter au calendrier.",
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Nombre de jours à planifier (1-14, max 14 pour éviter timeouts)' },
          network: { type: 'string', enum: ['twitter', 'linkedin'], description: 'Réseau cible' },
          theme: { type: 'string', description: "Thème global de la planification" },
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
      description: "Génère un post unique avec un format et un sujet précis.",
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
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
          text: { type: 'string' },
          network: { type: 'string', enum: ['twitter', 'linkedin'] },
          format: { type: 'string' },
          scheduled_at: { type: 'string', description: 'ISO datetime' },
          topic: { type: 'string' },
        },
        required: ['text', 'network', 'scheduled_at'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_performance_summary',
      description: "Lit les insights de performance de Marwane.",
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
  {
    type: 'function',
    function: {
      name: 'sync_to_google_calendar',
      description: "Synchronise les posts du calendrier vers Google Calendar (l'utilisateur doit être connecté à Google).",
      parameters: {
        type: 'object',
        properties: {
          which: { type: 'string', enum: ['all', 'upcoming'], description: 'all = tous les posts, upcoming = seulement les futurs' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_to_buffer',
      description: "Envoie les posts du calendrier dans la queue Buffer pour publication automatique (Twitter/LinkedIn). Le post sera publié à la date prévue par Buffer.",
      parameters: {
        type: 'object',
        properties: {
          which: { type: 'string', enum: ['all', 'upcoming'], description: 'all = tous, upcoming = seulement les futurs' },
        },
        required: [],
      },
    },
  },
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { messages = [], clientState = {} } = req.body
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages must be an array' })

  const networkContext = clientState.network
    ? `\n\nRéseau actif : ${clientState.network}`
    : ''
  const perfHint = clientState.performanceInsights?.totalPosts > 0
    ? `\n\nL'utilisateur a tracké ${clientState.performanceInsights.totalPosts} posts.`
    : ''

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [
          { role: 'system', content: SYSTEM + networkContext + perfHint },
          ...messages,
        ],
        tools: TOOLS,
        tool_choice: 'auto',
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('OpenRouter error:', data)
      return res.status(500).json({ error: data.error?.message || 'Agent failed' })
    }

    const message = data.choices?.[0]?.message
    if (!message) {
      return res.status(500).json({ error: 'Réponse vide' })
    }

    // Renvoie le texte + les tool calls. Le client va les exécuter.
    return res.status(200).json({
      message: message.content || '',
      tool_calls: (message.tool_calls || []).map((tc: any) => ({
        id: tc.id,
        name: tc.function?.name,
        args: (() => { try { return JSON.parse(tc.function?.arguments || '{}') } catch { return {} } })(),
      })),
    })
  } catch (e: any) {
    console.error('Agent error:', e)
    return res.status(500).json({ error: e.message || 'Agent failed' })
  }
}
