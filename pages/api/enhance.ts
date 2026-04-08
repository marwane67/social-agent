import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { post, action, network } = req.body
  if (!post || !action) return res.status(400).json({ error: 'Missing fields' })

  const prompts: Record<string, string> = {
    score: `Analyse ce post ${network === 'linkedin' ? 'LinkedIn' : 'Twitter/X'} et donne un score de potentiel viral.

POST : "${post}"

Réponds en JSON strict :
{"score":{"viral":X,"engagement":X,"authority":X,"overall":X},"strengths":["...","..."],"weaknesses":["..."],"suggestion":"une amélioration concrète en 1 phrase"}

Règles :
- Chaque score est sur 10
- viral = potentiel de partage/retweet
- engagement = potentiel de replies/commentaires
- authority = positionnement expert
- overall = note globale
- strengths = 2 points forts max
- weaknesses = 1 point faible max
- suggestion = 1 amélioration actionnable
- JSON uniquement`,

    translate: `Traduis ce post ${network === 'linkedin' ? 'LinkedIn' : 'Twitter/X'} en anglais en gardant le MÊME impact, le MÊME ton, et la MÊME énergie. Ce n'est PAS une traduction littérale — c'est une adaptation pour une audience anglophone tech/startup.

POST ORIGINAL : "${post}"

Réponds en JSON strict :
{"translation":"...","note":"une note courte sur l'adaptation"}

Règles :
- Garde le même punch, le même rythme
- Adapte les références culturelles si nécessaire
- ${network === 'twitter' ? 'Max 280 caractères' : 'Garde la même longueur'}
- Le post traduit doit être aussi bon que l'original, pas une version fade
- JSON uniquement`,

    visual: `Suggère le visuel idéal pour accompagner ce post ${network === 'linkedin' ? 'LinkedIn' : 'Twitter/X'}.

POST : "${post}"

Réponds en JSON strict :
{"visual":{"type":"screenshot|carrousel|meme|infographie|photo|aucun","description":"description détaillée du visuel","text_on_image":"texte à mettre sur l'image si applicable","colors":"palette de couleurs suggérée","tool":"outil recommandé pour le créer (Canva, Figma, screenshot, etc.)","impact":"pourquoi ce visuel va booster le post"}}

Règles :
- Sois spécifique dans la description (pas "une belle image")
- Si le post est mieux sans visuel, dis "aucun" et explique pourquoi
- Le visuel doit AMPLIFIER le message, pas juste décorer
- JSON uniquement`,

    persona: `Analyse ce commentaire et identifie le type de personne qui l'a écrit.

COMMENTAIRE : "${post}"

Réponds en JSON strict :
{"persona":{"type":"fan|prospect|influenceur|hater|curieux|expert|troll","confidence":X,"intent":"ce que la personne cherche vraiment","recommended_tone":"smart|friendly|debate|expert","strategy":"comment répondre stratégiquement en 1 phrase"}}

Règles :
- type = le profil du commentateur
- confidence = confiance dans l'analyse (1-10)
- intent = l'intention cachée derrière le commentaire
- recommended_tone = le ton optimal pour la réponse
- strategy = la stratégie de réponse en 1 phrase
- JSON uniquement`,
  }

  const prompt = prompts[action]
  if (!prompt) return res.status(400).json({ error: 'Invalid action' })

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('OpenRouter error:', data)
      return res.status(500).json({ error: 'Enhancement failed' })
    }

    const rawText = data.choices?.[0]?.message?.content || ''
    const clean = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    res.status(200).json(parsed)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Enhancement failed' })
  }
}
