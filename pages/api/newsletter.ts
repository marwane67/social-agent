import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es le rédacteur en chef de la newsletter de Marwane, "Build in Public" — une newsletter hebdo où il partage ses meilleures idées, leçons et coulisses de Axora + Pulsa.

Style :
- Direct, personnel, comme un email d'un pote entrepreneur
- Pas de "Bonjour cher lecteur" formel
- Format clair avec sections distinctes
- 5-8 minutes de lecture
- Ton authentique de Marwane`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { posts, weekContext, voiceProfile } = req.body
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return res.status(400).json({ error: 'Pas de posts fournis' })
  }

  let voiceBlock = ''
  if (voiceProfile) {
    voiceBlock = `\nProfil de voix : ${voiceProfile.signature}`
  }

  const postsBlock = posts.map((p: any, i: number) => `[${i + 1}] ${p.text || p}`).join('\n\n')

  const prompt = `Voici les meilleurs posts de Marwane de la semaine :

${postsBlock}

${weekContext ? `Contexte de la semaine : ${weekContext}\n` : ''}${voiceBlock}

Génère une NEWSLETTER hebdomadaire complète au format JSON :

{
  "subject": "Titre catchy (sous 60 chars)",
  "preheader": "Preview text (sous 100 chars)",
  "intro": "Intro perso de Marwane (3-5 lignes, mood de la semaine)",
  "sections": [
    {
      "title": "Titre de section (ex: 'La leçon de la semaine', 'Behind the build', 'Ce que j'ai appris')",
      "content": "contenu complet de la section, plusieurs paragraphes possible"
    },
    ... 3-4 sections
  ],
  "highlight_post": "Le post de la semaine reformaté en story longue (8-12 lignes)",
  "weekly_lesson": "1 leçon clé en 2-3 phrases impactantes",
  "cta": "Appel à l'action en fin (ex: 'Réponds-moi avec ta plus grosse galère cette semaine')",
  "ps": "P.S. perso et léger (1-2 lignes)"
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
        max_tokens: 4000,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: 'Newsletter failed' })

    const raw = data.choices?.[0]?.message?.content || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    res.status(200).json(parsed)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Newsletter failed' })
  }
}
