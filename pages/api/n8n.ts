import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es le stratège social media de Marwane (@ismaa_pxl), entrepreneur tech à Bruxelles.
Projets : Axora (marketplace acquisition business digitaux francophone), Pulsa Creatives (agence IA Bruxelles).
Style : direct, cash, authentique, mélange FR/EN naturel, zéro bullshit, 0-1 emoji max.`

/*
  ENDPOINTS:

  GET  /api/n8n?action=scheduled    → retourne les posts programmés prêts à publier
  GET  /api/n8n?action=generate&format=raw_build&network=twitter&input=...  → génère un post à la volée
  POST /api/n8n  body: { action: "generate", format, network, input }  → idem en POST
  POST /api/n8n  body: { action: "mark_posted", id }  → marque un post comme publié
  POST /api/n8n  body: { action: "auto_generate", network, topic }  → génère 1 post auto basé sur un sujet
*/

const FORMATS_PROMPTS: Record<string, string> = {
  raw_build: 'un post "building in public" authentique et brut',
  hot_take: 'une opinion tranchée et controversée mais intelligente',
  behind_scenes: 'un post "behind the scenes" montrant les coulisses',
  ai_authority: 'un post positionnant Marwane comme référence IA',
  storytelling: 'une micro-story percutante avec tension → résolution',
  one_liner: 'un one-liner screenshot-worthy, UNE seule phrase',
  axora_hype: "un post créant de l'engouement autour d'Axora",
  engagement_bait: 'un post conçu pour maximiser les replies',
}

async function generatePost(input: string, format: string, network: string) {
  const formatDesc = FORMATS_PROMPTS[format] || FORMATS_PROMPTS.raw_build
  const isTwitter = network !== 'linkedin'
  const maxChars = isTwitter ? 280 : 1500

  const prompt = `Contexte : "${input}"

Génère ${formatDesc} pour ${isTwitter ? 'Twitter/X' : 'LinkedIn'}.

Réponds en JSON strict :
{"post":{"text":"...","format":"${format}","network":"${network}"}}

Règles :
- Max ${maxChars} caractères
- Hook ultra-fort en ligne 1
- ${isTwitter ? 'Pas de hashtags sauf #BuildInPublic ou #Axora (max 1). Pas d\'emojis.' : 'Format aéré, sauts de ligne, CTA naturel à la fin.'}
- JSON uniquement`

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-6',
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error('Generation failed')

  const rawText = data.choices?.[0]?.message?.content || ''
  const clean = rawText.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple API key auth (set N8N_SECRET in Vercel env vars)
  const authHeader = req.headers.authorization
  const secret = process.env.N8N_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const action = req.method === 'GET' ? (req.query.action as string) : req.body?.action

  try {
    switch (action) {
      case 'generate': {
        const input = (req.method === 'GET' ? req.query.input : req.body?.input) as string
        const format = (req.method === 'GET' ? req.query.format : req.body?.format) as string || 'raw_build'
        const network = (req.method === 'GET' ? req.query.network : req.body?.network) as string || 'twitter'

        if (!input) return res.status(400).json({ error: 'Missing input' })

        const result = await generatePost(input, format, network)
        return res.status(200).json(result)
      }

      case 'auto_generate': {
        const network = req.body?.network || 'twitter'
        const topic = req.body?.topic || "update sur ce que je build aujourd'hui"

        // Rotate through formats
        const formats = Object.keys(FORMATS_PROMPTS)
        const today = new Date()
        const formatIndex = (today.getDay() * 3 + today.getHours()) % formats.length
        const format = formats[formatIndex]

        const result = await generatePost(topic, format, network)
        return res.status(200).json({
          ...result,
          meta: { auto: true, format_used: format, generated_at: today.toISOString() }
        })
      }

      case 'formats': {
        return res.status(200).json({
          formats: Object.entries(FORMATS_PROMPTS).map(([id, desc]) => ({ id, description: desc }))
        })
      }

      case 'health': {
        return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
      }

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: [
            'generate — generate a post (requires: input, optional: format, network)',
            'auto_generate — auto-generate based on topic + auto-rotate format (optional: topic, network)',
            'formats — list available formats',
            'health — health check',
          ]
        })
    }
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Internal error' })
  }
}
