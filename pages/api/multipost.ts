import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es le stratège social media d'Ismaa (@ismaa_pxl), entrepreneur tech à Bruxelles.
Projets : Axora (marketplace acquisition business digitaux francophone), Pulsa Creatives (agence IA Bruxelles).
Style : direct, cash, authentique, mélange FR/EN naturel, zéro bullshit.`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { idea, network } = req.body
  if (!idea) return res.status(400).json({ error: 'Missing idea' })

  const isTwitter = network === 'twitter'
  const maxChars = isTwitter ? 280 : 1500
  const platform = isTwitter ? 'Twitter/X' : 'LinkedIn'

  const prompt = `À partir de CETTE SEULE IDÉE, génère 5 posts ${platform} avec 5 angles COMPLÈTEMENT différents.

IDÉE : "${idea}"

Format JSON strict :
{"posts":[
  {"format":"RAW BUILD","text":"...","why":"pourquoi cet angle marche"},
  {"format":"HOT TAKE","text":"...","why":"..."},
  {"format":"MICRO STORY","text":"...","why":"..."},
  {"format":"ONE-LINER","text":"...","why":"..."},
  {"format":"AXORA/BUSINESS","text":"...","why":"..."}
]}

Règles par format :
- RAW BUILD : update brute, authentique, "je viens de..."
- HOT TAKE : opinion tranchée, controversée mais intelligente
- MICRO STORY : mini histoire avec tension → résolution
- ONE-LINER : une seule phrase, screenshot-worthy${isTwitter ? ', max 140 chars' : ''}
- AXORA/BUSINESS : lier le sujet à Axora ou au business d'Ismaa

Règles globales :
- Max ${maxChars} chars chacun
- Hook ultra-fort en ligne 1
- Chaque post doit être autonome et excellent
- ${isTwitter ? 'Zéro ou 1 hashtag max. Pas d\'emojis.' : 'Format aéré, 1 idée par ligne, CTA naturel à la fin'}
- Les 5 posts doivent être TELLEMENT différents qu'on ne dirait pas qu'ils viennent de la même idée
- JSON uniquement`

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        max_tokens: 2500,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: 'Generation failed' })

    const rawText = data.choices?.[0]?.message?.content || ''
    const clean = rawText.replace(/```json|```/g, '').trim()
    res.status(200).json(JSON.parse(clean))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Generation failed' })
  }
}
