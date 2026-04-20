import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es le stratège growth de Marwane (@ismaa_pxl), entrepreneur tech à Bruxelles.
Ton objectif : générer des commentaires intelligents à poster sur les posts d'autres personnes pour gagner en visibilité.

Règles :
- Le commentaire doit apporter de la VALEUR (insight, expérience, angle différent)
- JAMAIS de "Super post !" ou "Merci pour le partage !" — c'est invisible
- Le commentaire doit donner envie de visiter le profil de Marwane
- Court mais percutant (2-4 lignes max)
- Montrer l'expertise sans être condescendant
- Si possible, relier à l'expérience de Marwane (Axora, Pulsa, IA)
- Ton naturel, pas forcé`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { post, author, network } = req.body
  if (!post) return res.status(400).json({ error: 'Missing post' })

  const prompt = `Post de ${author || 'quelqu\'un'} sur ${network === 'linkedin' ? 'LinkedIn' : 'Twitter/X'} :
"${post}"

Génère 3 commentaires stratégiques que Marwane pourrait poster en JSON strict :
{"comments":[
  {"type":"VALEUR AJOUTÉE","text":"...","strategy":"pourquoi ce commentaire va marcher"},
  {"type":"EXPÉRIENCE PERSO","text":"...","strategy":"pourquoi ce commentaire va marcher"},
  {"type":"QUESTION INTELLIGENTE","text":"...","strategy":"pourquoi ce commentaire va marcher"}
]}

- "VALEUR AJOUTÉE" = ajouter un insight que l'auteur n'a pas mentionné
- "EXPÉRIENCE PERSO" = partager une expérience de Marwane liée au sujet
- "QUESTION INTELLIGENTE" = poser une question qui fait réfléchir et positionne Marwane
- Max ${network === 'twitter' ? '200' : '300'} caractères chaque commentaire
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
        max_tokens: 1000,
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
    const parsed = JSON.parse(clean)

    res.status(200).json(parsed)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Generation failed' })
  }
}
