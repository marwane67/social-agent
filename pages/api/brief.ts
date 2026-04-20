import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es le brief manager quotidien d'Ismaa, entrepreneur tech à Bruxelles (Axora marketplace + Pulsa Creatives agency IA).

Chaque matin, tu lui prépares un BRIEF court et actionnable pour qu'il sache exactement quoi poster aujourd'hui.

Style :
- Direct, opérationnel, zéro blabla
- Format clair avec sections nettes
- 5 idées de posts concrètes (pas génériques) basées sur l'actu IA + ses projets
- Tendances à surfer maintenant
- 1 angle viral à exploiter aujourd'hui

Pas de motivation creuse. Que de l'opérationnel.`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end()

  const { context, voiceProfile, scheduledToday } = (req.method === 'POST' ? req.body : req.query) || {}

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  let voiceBlock = ''
  if (voiceProfile && typeof voiceProfile === 'object') {
    voiceBlock = `\n\nProfil de voix d'Ismaa :\n- Ton : ${voiceProfile.toneOfVoice}\n- Signature : ${voiceProfile.signature}\n- Thèmes : ${(voiceProfile.topicsRecurring || []).join(', ')}`
  }

  let scheduledBlock = ''
  if (scheduledToday) {
    scheduledBlock = `\n\nDéjà prévu aujourd'hui : ${scheduledToday}`
  }

  let contextBlock = ''
  if (context) {
    contextBlock = `\n\nContexte semaine d'Ismaa : ${context}`
  }

  const prompt = `Date : ${today}${voiceBlock}${scheduledBlock}${contextBlock}

Génère le BRIEF QUOTIDIEN d'Ismaa au format JSON strict :

{
  "headline": "1 phrase d'accroche pour la journée (mood/focus du jour)",
  "ideas": [
    { "hook": "première ligne du post", "angle": "angle/sujet en 1 phrase", "network": "twitter ou linkedin", "format": "raw_build / storytelling / hot_take / etc." },
    { ... 5 idées au total }
  ],
  "trends": [
    { "topic": "tendance IA actuelle", "angle": "comment Ismaa peut la surfer aujourd'hui" },
    { ... 3 tendances }
  ],
  "viral_angle": {
    "topic": "LE sujet viral à exploiter aujourd'hui",
    "why": "pourquoi ça va marcher",
    "hook_suggestion": "exemple de première ligne"
  },
  "reminder": "1 phrase de rappel stratégique (objectif Axora launch, audience, etc.)"
}

JSON uniquement, rien d'autre.`

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
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('OpenRouter error:', data)
      return res.status(500).json({ error: 'Brief failed' })
    }

    const raw = data.choices?.[0]?.message?.content || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    res.status(200).json(parsed)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Brief failed' })
  }
}
