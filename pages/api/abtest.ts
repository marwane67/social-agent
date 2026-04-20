import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { input, network = 'twitter', voiceProfile } = req.body
  if (!input) return res.status(400).json({ error: 'Missing input' })

  let voiceBlock = ''
  if (voiceProfile) {
    voiceBlock = `\nProfil de voix imposé : ${voiceProfile.signature || ''}\nTon : ${voiceProfile.toneOfVoice || ''}`
  }

  const system = `Tu es expert A/B testing copywriting réseaux sociaux. Tu génères 2 VARIANTES d'un même post avec des angles RADICALEMENT DIFFÉRENTS pour tester ce qui marche le mieux.${voiceBlock}`

  const prompt = `Idée/contexte : "${input}"
Réseau : ${network === 'twitter' ? 'Twitter (280 chars max)' : 'LinkedIn (800-1500 chars)'}

Génère 2 variantes A/B très différentes. JSON strict :

{
  "variants": [
    {
      "label": "A",
      "approach": "ex: Hook émotionnel + storytelling personnel",
      "text": "le post complet",
      "hypothesis": "ce que tu testes (pourquoi ça pourrait mieux marcher)"
    },
    {
      "label": "B",
      "approach": "ex: Hook chiffré + structure listée",
      "text": "le post complet",
      "hypothesis": "ce que tu testes"
    }
  ],
  "test_protocol": "Comment tester (ex: Poste A lundi 10h, B mardi 10h, compare 48h après)"
}

Les 2 variantes doivent tester des HYPOTHÈSES OPPOSÉES (ex: court vs long, émotion vs logique, question vs déclaratif).
JSON uniquement.`

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: 'AB test failed' })

    const raw = data.choices?.[0]?.message?.content || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    res.status(200).json(parsed)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'AB test failed' })
  }
}
