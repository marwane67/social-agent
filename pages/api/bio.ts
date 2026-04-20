import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es expert en optimisation de bio sur les réseaux sociaux. Tu sais ce qui convertit en 2026 :
- Hook ultra-court (qui es-tu en 3 mots)
- Proof (chiffre, achievement)
- Niche (à qui tu parles)
- CTA clair (lien, action)
- Personnalité (humain, pas corporate)

Tu génères TOUJOURS plusieurs variantes pour A/B test.`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { network = 'twitter', currentBio = '', goal = '', stats = '', voiceProfile } = req.body

  const charLimit = network === 'twitter' ? 160 : network === 'linkedin' ? 220 : 150

  let voiceBlock = ''
  if (voiceProfile) voiceBlock = `\nProfil de voix : ${voiceProfile.signature}\nTon : ${voiceProfile.toneOfVoice}`

  const prompt = `Génère 5 variantes de bio optimisées pour ${network === 'twitter' ? 'Twitter/X' : network === 'linkedin' ? 'LinkedIn (headline + about)' : network}.${voiceBlock}

Limite : ${charLimit} caractères max
Bio actuelle : "${currentBio || 'aucune'}"
Objectif : ${goal || 'attirer des entrepreneurs/founders francophones intéressés par IA et acquisition de business digitaux'}
Stats récentes : ${stats || 'non précisé'}

Tu dois :
- Générer 5 variantes avec 5 angles différents
- Chacune doit respecter la limite ${charLimit} chars
- Mettre en avant : Axora (marketplace acquisition business digitaux FR/BE), Pulsa (agence IA Bruxelles), Brussels-based, build in public

Format JSON strict :
{
  "current_audit": "Brève analyse de la bio actuelle (forces/faiblesses) en 2-3 phrases",
  "variants": [
    {
      "label": "A — Angle direct/proof",
      "bio": "le texte exact de la bio (sous ${charLimit} chars)",
      "chars": <nombre exact de caractères>,
      "strategy": "pourquoi cette version pourrait marcher",
      "best_for": "quel type d'audience"
    },
    ... 5 variantes au total
  ],
  "recommended": "Numéro de la variante recommandée (1-5) + pourquoi"
}

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
        max_tokens: 2500,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: 'Bio generation failed' })

    const raw = data.choices?.[0]?.message?.content || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    res.status(200).json(parsed)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Bio generation failed' })
  }
}
