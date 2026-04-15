import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es un assistant de prospection B2B. Tu génères des listes de prospects réalistes et pertinentes basées sur les critères fournis.

IMPORTANT : Tu dois générer des prospects FICTIFS mais RÉALISTES — des profils qui ressemblent à de vrais professionnels dans les secteurs demandés. Utilise des noms francophones réalistes, des entreprises plausibles, des postes cohérents.

Pour chaque prospect, fournis :
- Nom complet (réaliste, francophone)
- Poste/titre professionnel
- Nom de l'entreprise (plausible)
- Site web (plausible)
- URL LinkedIn (format : linkedin.com/in/prenom-nom-xxxxx)
- Ville
- Pays
- Compétences clés (3-5 skills)`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { query } = req.body
  if (!query) return res.status(400).json({ error: 'Missing query' })

  const prompt = `Recherche de prospects : "${query}"

Génère 15 prospects qui correspondent à cette recherche en JSON strict :
{"prospects":[
  {"name":"Prénom Nom","title":"Poste","company":"Entreprise","website":"site.com","linkedin":"linkedin.com/in/prenom-nom-12345","city":"Ville","country":"Pays","skills":"skill1, skill2, skill3"}
]}

Règles :
- 15 prospects exactement
- Noms francophones réalistes et variés
- Entreprises plausibles pour le secteur demandé
- Postes cohérents avec la recherche
- Villes en Belgique et/ou France selon la recherche
- Skills pertinentes pour le poste
- URLs LinkedIn au format réaliste
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
        max_tokens: 3000,
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
