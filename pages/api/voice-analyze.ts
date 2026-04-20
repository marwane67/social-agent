import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es un expert en analyse stylistique. Tu reçois un échantillon de posts d'un entrepreneur sur les réseaux sociaux. Ton job : extraire son STYLE EXACT pour qu'une IA puisse l'imiter parfaitement.

Tu dois être ultra-précis. Pas de généralités. Donne des éléments concrets et applicables.`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { samples } = req.body
  if (!Array.isArray(samples) || samples.length < 3) {
    return res.status(400).json({ error: 'Au moins 3 posts requis pour une analyse fiable' })
  }

  const samplesText = samples
    .map((s: any, i: number) => `--- POST ${i + 1} (${s.network}${s.performance ? ', perf: ' + s.performance : ''}) ---\n${s.text}`)
    .join('\n\n')

  const prompt = `Voici ${samples.length} posts d'un entrepreneur. Analyse son style et renvoie UN SEUL JSON valide :

${samplesText}

Renvoie EXACTEMENT ce JSON (sans bloc code, juste le JSON) :
{
  "toneOfVoice": "description du ton en 1 phrase précise (ex: 'direct sans être agressif, vulnérable mais jamais victime, mélange naturel français/anglais tech')",
  "averageLength": <nombre de caractères moyen>,
  "sentenceStyle": "structure typique (ex: 'phrases courtes de 5-12 mots, retours à la ligne fréquents, jamais de pavés')",
  "vocabularyTics": ["mot1", "expression2", "tic3"],
  "topicsRecurring": ["thème1", "thème2", "thème3"],
  "emojiUsage": "habitudes d'emojis précises",
  "hookStyle": "type de hooks utilisés (questions, déclaratifs, chiffres, etc.)",
  "punctuationHabits": "habitudes de ponctuation spécifiques",
  "signature": "ce qui rend ce style unique en 1 phrase"
}`

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
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('OpenRouter error:', data)
      return res.status(500).json({ error: 'Analyse échouée' })
    }

    const raw = data.choices?.[0]?.message?.content || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    parsed.lastAnalyzed = new Date().toISOString()

    res.status(200).json({ profile: parsed })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Analyse échouée' })
  }
}
