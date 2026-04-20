import type { NextApiRequest, NextApiResponse } from 'next'

// Single-shot agent : 1 appel à Claude, retourne text + tool_calls.
// Le CLIENT exécute les tool calls (évite les timeouts Vercel).
export const config = {
  maxDuration: 30,
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es Pulse, l'agent IA personnel de Marwane. Tu parles UNIQUEMENT français. Zéro emoji. Direct, opérationnel.

QUI EST MARWANE
- Entrepreneur à Bruxelles, fondateur de deux projets
- Axora : marketplace pour ACHETER ET VENDRE DES ENTREPRISES (marché FR/BE). C'est une plateforme de transmission d'entreprises, moderne et transparente. Ce N'EST PAS une marketplace de business digitaux, ce N'EST PAS une solution IA. Ne parle jamais d'IA/d'agent dans les posts Axora.
- Pulsa Creatives : agence de création de SITES WEB à Bruxelles. Ce N'EST PAS une agence IA. Ils font des sites web propres et rapides pour PME, startups, entrepreneurs.
- Marwane personnel : contenu perso où il partage son quotidien d'entrepreneur qui gère ses 2 projets, les sites web qu'il livre avec Pulsa, les features Axora qu'il ship.

MODE END-TO-END (PAR DÉFAUT)
Quand Marwane demande de planifier/préparer des posts, tu fais TOUT en un seul coup :
1. Tu génères les posts (plan_calendar ou plan_by_axis)
2. Tu les ajoutes au calendrier automatiquement
3. Tu les uploades dans Buffer automatiquement (publish_to_buffer: true par défaut)

Marwane n'a PAS à aller manuellement sur le calendrier ou Buffer. Tu exécutes tout seul.
Passe publish_to_buffer: false UNIQUEMENT si Marwane dit "juste dans le calendrier" / "sans Buffer" / "pas encore".

Quand tu appelles plan_calendar, ajoute projectId pour router vers les bons channels :
- projectId: "axora" pour tout contenu sur la marketplace Axora
- projectId: "pulsa" pour tout contenu sur les sites web de Pulsa
- projectId: "personal" pour le contenu perso de Marwane

RÈGLES DE ROUTING (CRITIQUE)
- Axora : peut aller sur axora-app LinkedIn + Marwane LinkedIn + mrwn_one Twitter
- Pulsa : UNIQUEMENT Marwane LinkedIn. Jamais sur axora-app. Jamais sur Twitter.
- Personal : Marwane LinkedIn + Twitter. Jamais sur axora-app.

RÈGLES IMAGES
- Si Marwane dit "avec images/photos/visuel" → with_images: true
- Sinon, pas d'images par défaut

STYLE DE RÉPONSE
- Français uniquement, zéro emoji
- 1-3 phrases max quand tu utilises un outil
- Exemple : "OK, je planifie 7 jours de Pulsa sur ton LinkedIn, avec images, j'upload direct dans Buffer."
- Assume des choix raisonnables, ne pose de question QUE si vraiment ambigu

NE JAMAIS
- Utiliser d'emojis dans tes réponses ni dans les posts générés
- Parler d'IA/d'agent dans les posts Axora (Axora n'est pas un produit IA)
- Poster du contenu Pulsa sur la page Axora ou sur Twitter`

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'plan_calendar',
      description: "Planifie un calendrier de contenu sur N jours (1-14). Génère N posts variés (texte + optionnellement images) et les ajoute au calendrier.",
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Nombre de jours à planifier (1-14)' },
          network: { type: 'string', enum: ['twitter', 'linkedin'], description: 'Réseau cible' },
          theme: { type: 'string', description: "Thème global de la planification" },
          start_date: { type: 'string', description: 'Date de départ ISO (YYYY-MM-DD), defaults to today' },
          with_images: { type: 'boolean', description: "Si true, génère aussi une image pour chaque post. Default: false." },
          publish_to_buffer: { type: 'boolean', description: "Si true, après la planification, envoie directement les posts dans Buffer pour publication auto. Default: true (mode end-to-end)." },
          projectId: { type: 'string', description: "Optionnel : projet concerné (axora, pulsa, personal). Détermine le routing Buffer." },
        },
        required: ['days', 'network', 'theme'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_post',
      description: "Génère un post unique avec format + sujet + optionnellement une image.",
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          format: { type: 'string', description: 'ex: raw_build, hot_take, storytelling, transparency, value_bomb' },
          network: { type: 'string', enum: ['twitter', 'linkedin'] },
          with_image: { type: 'boolean', description: "Si true, génère aussi une image. Default: false." },
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
      description: "Envoie les posts du calendrier dans la queue Buffer pour publication automatique. Si projectId ou axisId fourni, filtre et route vers les bons channels Buffer.",
      parameters: {
        type: 'object',
        properties: {
          which: { type: 'string', enum: ['all', 'upcoming'], description: 'all = tous, upcoming = seulement les futurs' },
          projectId: { type: 'string', description: 'Optionnel : filtre les posts par projet (axora, pulsa, personal). Utilise le brain pour router vers les bons channels.' },
          axisId: { type: 'string', description: 'Optionnel : filtre par axe stratégique (axora_launch, pulsa_offer, etc.).' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'plan_by_axis',
      description: "Planifie un calendrier de N posts pour un AXE stratégique du brain. Routes auto vers les bons channels Buffer.",
      parameters: {
        type: 'object',
        properties: {
          axisId: { type: 'string', description: 'ID de l\'axe dans le brain' },
          days: { type: 'number', description: '1-14 jours' },
          start_date: { type: 'string', description: 'YYYY-MM-DD, défaut = aujourd\'hui' },
          with_images: { type: 'boolean', description: 'Si true, génère aussi les images. Default: false.' },
          publish_to_buffer: { type: 'boolean', description: "Si true, envoie direct dans Buffer après planification. Default: true." },
        },
        required: ['axisId', 'days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_images_for_calendar',
      description: "Génère des images pour les posts DÉJÀ planifiés dans le calendrier qui n'en ont pas encore. Utile pour rattraper une planif faite sans images.",
      parameters: {
        type: 'object',
        properties: {
          which: { type: 'string', enum: ['upcoming', 'all', 'without_image'], description: 'upcoming = à venir sans image, all = tous sans image, without_image = synonyme' },
          limit: { type: 'number', description: 'Max images à générer (défaut 10)' },
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
  const brainContext = clientState.brain
    ? `\n\n${clientState.brain}`
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
          { role: 'system', content: SYSTEM + networkContext + perfHint + brainContext },
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
