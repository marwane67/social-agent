import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM = `Tu es l'expert en outreach LinkedIn de Marwane (@ismaa_pxl), entrepreneur tech à Bruxelles.
Projets : Axora (marketplace acquisition business digitaux francophone), Pulsa Creatives (agence IA Bruxelles).

RÈGLES DE MESSAGES LINKEDIN :
- Court. 3-5 lignes MAX. Les pavés sont ignorés.
- Première phrase = pourquoi tu écris à CETTE personne spécifiquement (pas générique)
- Pas de "J'espère que vous allez bien"
- Pas de "Je me permets de vous contacter"
- Pas de pitch dans le premier message
- Ton naturel, comme si tu parlais à un collègue
- Personnaliser avec le nom, le poste, l'entreprise, ou un post récent
- Objectif du 1er message = créer une connexion, PAS vendre`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, title, company, context, goal, messageType } = req.body
  if (!goal) return res.status(400).json({ error: 'Missing goal' })

  const types: Record<string, string> = {
    connect: `Message de DEMANDE DE CONNEXION (max 300 chars, c'est la limite LinkedIn).
Objectif : que la personne accepte la connexion.
Pas de pitch, juste un point commun ou une raison sincère de se connecter.`,

    first_dm: `PREMIER MESSAGE après connexion acceptée.
Objectif : engager la conversation naturellement.
Référencer quelque chose de spécifique (post, projet, parcours).
Poser UNE question ouverte. Pas de lien, pas de pitch.`,

    follow_up: `MESSAGE DE RELANCE (la personne n'a pas répondu).
Objectif : relancer sans être lourd.
Apporter de la valeur (insight, article, outil) plutôt que "juste pour relancer".
Court et léger.`,

    pitch: `MESSAGE DE PROPOSITION (après échange).
Objectif : proposer un call/une collab/un service.
Résumer le problème identifié, proposer la solution en 1 phrase.
CTA clair : "Un call de 15 min cette semaine ?"`,

    collab: `MESSAGE DE PROPOSITION DE COLLABORATION.
Objectif : proposer un partenariat ou une collab.
Montrer ce que TU apportes, pas ce que tu veux.
Être spécifique sur le format de la collab.`,

    thank: `MESSAGE DE REMERCIEMENT après un échange, un call, ou une interaction.
Objectif : renforcer la relation.
Mentionner un point précis de l'échange.
Proposer un next step naturel.`,
  }

  const typeInstr = types[messageType] || types.first_dm

  const personInfo = [
    name && `Nom : ${name}`,
    title && `Poste : ${title}`,
    company && `Entreprise : ${company}`,
    context && `Contexte : ${context}`,
  ].filter(Boolean).join('\n')

  const prompt = `${personInfo ? `INFORMATIONS SUR LA PERSONNE :\n${personInfo}\n\n` : ''}OBJECTIF : ${goal}

TYPE DE MESSAGE :
${typeInstr}

Génère 3 messages LinkedIn personnalisés et différents en JSON strict :
{"messages":[
  {"type":"DIRECT","text":"...","why":"pourquoi ce message va fonctionner"},
  {"type":"VALEUR D'ABORD","text":"...","why":"..."},
  {"type":"CONNEXION PERSO","text":"...","why":"..."}
]}

- DIRECT = aller droit au but avec élégance
- VALEUR D'ABORD = offrir quelque chose (insight, ressource) avant de demander
- CONNEXION PERSO = trouver un point commun personnel
- Chaque message doit être DIFFÉRENT dans l'approche
- ${messageType === 'connect' ? 'MAX 300 CARACTÈRES (limite LinkedIn)' : 'MAX 500 CARACTÈRES'}
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
        max_tokens: 1200,
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
