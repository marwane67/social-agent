import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es le strategist en chef du lancement d'Axora — la marketplace francophone d'acquisition de business digitaux fondée par Ismaa.

Ton job : créer des arcs narratifs de lancement sur plusieurs jours/semaines.
Chaque post doit faire avancer la story globale. Crescendo. Build-up. FOMO.

Tu connais les principes :
- J-30 à J-15 : Plant the seed (problème marché, vision)
- J-14 à J-7 : Build-up (proof, behind the scenes, teasers)
- J-6 à J-1 : Hype (countdown, sneak peeks, urgency)
- J-Day : Launch
- J+1 à J+7 : Momentum (résultats, témoignages, next steps)

Chaque jour = 1 post avec un objectif narratif précis.`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { duration = 30, network = 'twitter', launchDate, productPitch, voiceProfile } = req.body

  let voiceBlock = ''
  if (voiceProfile) {
    voiceBlock = `\n\nProfil de voix d'Ismaa :\n- Ton : ${voiceProfile.toneOfVoice}\n- Signature : ${voiceProfile.signature}`
  }

  const prompt = `Crée une SÉRIE de lancement de ${duration} jours pour Axora sur ${network === 'twitter' ? 'Twitter/X' : 'LinkedIn'}.${voiceBlock}

Date de lancement prévue : ${launchDate || 'à définir'}
Pitch produit : ${productPitch || "Marketplace francophone d'acquisition de business digitaux. Comme Acquire.com mais avec IA, matching intelligent, escrow, due diligence automatisée. Pour le marché BE/FR."}

Renvoie UN SEUL JSON strict :

{
  "title": "Titre de la série",
  "phases": [
    { "name": "Phase 1: Plant the seed", "days": "J-30 à J-15", "goal": "objectif narratif" },
    { "name": "Phase 2: Build-up", "days": "...", "goal": "..." },
    { "name": "Phase 3: Hype", "days": "...", "goal": "..." },
    { "name": "Phase 4: Launch", "days": "J-Day", "goal": "..." },
    { "name": "Phase 5: Momentum", "days": "...", "goal": "..." }
  ],
  "posts": [
    {
      "day": 1,
      "phase": "Plant the seed",
      "type": "raw_build / hot_take / storytelling / etc.",
      "hook": "première ligne du post",
      "text": "le post complet, prêt à publier (${network === 'twitter' ? '280 chars max' : '800-1500 chars'})",
      "goal": "ce que ce post doit accomplir",
      "cta": "appel à l'action (optionnel)"
    },
    ... ${duration} posts au total
  ]
}

Règles :
- ${duration} posts, un par jour
- Chaque post fait progresser la story
- Mélange formats : pas que des teasers, alterner stories perso, behind the scenes, controverses, valeur pure
- Hook fort à chaque post
- Le ton monte en intensité vers le launch day
- Après le launch : montrer les premiers résultats, témoignages, next steps

JSON uniquement. Pas de bloc code.`

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('OpenRouter error:', data)
      return res.status(500).json({ error: 'Series generation failed' })
    }

    const raw = data.choices?.[0]?.message?.content || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    res.status(200).json(parsed)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Series generation failed' })
  }
}
