import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es un assistant de prospection B2B. On te donne une recherche en langage naturel. Tu dois la convertir en critères structurés pour une API de prospection.

Extrais les critères suivants :
- pays (codes ISO : BE, FR, etc.)
- secteur/industrie (en anglais pour LinkedIn categories)
- taille d'entreprise (1-10, 11-50, 51-200, etc.)
- niveau de poste (c-suite, director, manager, owner)
- autres filtres pertinents`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { query } = req.body
  if (!query) return res.status(400).json({ error: 'Missing query' })

  // Use Claude to parse the query into structured filters
  try {
    const parseRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        max_tokens: 500,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Recherche : "${query}"

Réponds en JSON strict avec les critères extraits :
{"countries":["BE"],"industries":["restaurants","retail"],"company_size":["1-10","11-50"],"job_levels":["c-suite","owner"],"keywords":["restaurant","commerce"],"target":"businesses ou prospects"}

JSON uniquement.` },
        ],
      }),
    })

    const parseData = await parseRes.json()
    const rawText = parseData.choices?.[0]?.message?.content || ''
    const clean = rawText.replace(/```json|```/g, '').trim()
    const criteria = JSON.parse(clean)

    // Now generate realistic prospects based on these criteria using Claude
    const genRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Tu es un outil de prospection B2B. Génère 15 prospects RÉELS et VÉRIFIABLES basés sur ces critères :

Pays : ${criteria.countries?.join(', ') || 'BE, FR'}
Industries : ${criteria.industries?.join(', ') || 'general'}
Taille : ${criteria.company_size?.join(', ') || '1-50'}
Niveau : ${criteria.job_levels?.join(', ') || 'c-suite'}
Mots-clés : ${criteria.keywords?.join(', ') || ''}

RÈGLES CRITIQUES :
- Utilise des VRAIES entreprises qui existent réellement dans ces pays et secteurs
- Utilise les VRAIS noms des dirigeants de ces entreprises (information publique)
- Utilise les VRAIS sites web de ces entreprises
- Pour LinkedIn, utilise le format : linkedin.com/in/prenom-nom (sans numéros aléatoires, juste le format probable)
- Vérifie que les entreprises correspondent au secteur et à la taille demandée
- Inclus des entreprises variées (pas juste les plus connues)

Format JSON strict :
{"prospects":[
  {"name":"Vrai Nom","title":"Vrai Poste","company":"Vraie Entreprise","website":"vraisite.com","linkedin":"linkedin.com/in/prenom-nom","city":"Vraie Ville","country":"Pays","skills":"skill1, skill2, skill3"}
]}

15 prospects. JSON uniquement.`
        }],
      }),
    })

    const genData = await genRes.json()
    const genText = genData.choices?.[0]?.message?.content || ''
    const genClean = genText.replace(/```json|```/g, '').trim()
    const result = JSON.parse(genClean)

    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Prospection failed' })
  }
}
