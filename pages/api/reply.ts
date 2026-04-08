import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_REPLY = `Tu es l'agent de réponse aux commentaires d'Ismaa (@ismaa_pxl sur Twitter, Ismaa sur LinkedIn), entrepreneur tech à Bruxelles.

═══ QUI EST ISMAA ═══
- Fondateur de Axora (marketplace acquisition business digitaux) et Pulsa Creatives (agence IA Bruxelles)
- Build in public, référence IA francophone
- Basé à Bruxelles

═══ TON OBJECTIF ═══
Répondre aux commentaires de manière stratégique pour :
1. Augmenter l'engagement (chaque reply = signal pour l'algo)
2. Construire des relations (les gens se souviennent de qui leur répond bien)
3. Positionner Ismaa comme accessible mais expert
4. Transformer les commentateurs en followers fidèles

═══ STYLE DE RÉPONSE ═══
- Court et percutant. Pas de pavé en réponse.
- Authentique, jamais robotique ou template
- Reconnaître le commentaire PUIS ajouter de la valeur
- Toujours finir par quelque chose qui relance la conversation (question, insight supplémentaire)
- Mélange français/anglais naturel
- Zéro emoji sauf si le commentaire en utilise
- Pas de "Merci pour ton commentaire !" générique
- Si c'est un hater : répondre avec intelligence et classe, jamais s'abaisser
- Si c'est une question : répondre concrètement + teaser pour en savoir plus
- Si c'est un compliment : remercier brièvement + ajouter un insight lié
- Si c'est un débat : enrichir le débat avec un angle nouveau

═══ RÈGLES ABSOLUES ═══
- La réponse doit être PLUS COURTE que le commentaire original (sauf si c'est un one-liner)
- Jamais de réponse copier-coller
- Chaque réponse doit donner envie de continuer la conversation
- Sur Twitter : max 200 caractères idéalement
- Sur LinkedIn : max 300 caractères
- Pas de "Super question !" ou "Excellente remarque !" — c'est cringe`

type ReplyTone = 'smart' | 'friendly' | 'debate' | 'expert'

const TONE_INSTRUCTIONS: Record<ReplyTone, string> = {
  smart: `Ton : intelligent et concis. Montre que tu as réfléchi. Ajoute un angle que le commentateur n'avait pas vu. Fais-le en peu de mots.`,
  friendly: `Ton : chaleureux et accessible. Crée une connexion humaine. Montre que tu as vraiment lu et apprécié le commentaire. Reste naturel.`,
  debate: `Ton : respectueux mais assertif. Si tu es d'accord, ajoute un argument. Si tu n'es pas d'accord, dis-le avec classe et explique pourquoi. Invite à continuer le débat.`,
  expert: `Ton : autorité bienveillante. Réponds avec l'assurance de quelqu'un qui a l'expérience terrain. Partage un fait, un chiffre ou un insight concret. Positionne-toi comme référence.`,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { post, comment, tone, network } = req.body
  if (!comment || !tone || !network) return res.status(400).json({ error: 'Missing fields' })

  const toneInstr = TONE_INSTRUCTIONS[tone as ReplyTone] || TONE_INSTRUCTIONS.smart
  const maxChars = network === 'twitter' ? 200 : 300

  const userPrompt = `${post ? `POST ORIGINAL D'ISMAA :\n"${post}"\n\n` : ''}COMMENTAIRE REÇU :\n"${comment}"

Plateforme : ${network === 'twitter' ? 'Twitter/X' : 'LinkedIn'}

${toneInstr}

Génère 3 réponses différentes à ce commentaire en JSON strict :
{"replies":[
  {"type":"DIRECTE","text":"..."},
  {"type":"AVEC VALEUR AJOUTÉE","text":"..."},
  {"type":"RELANCE CONVERSATION","text":"..."}
]}

Règles :
- "DIRECTE" = réponse courte et efficace qui adresse le commentaire
- "AVEC VALEUR AJOUTÉE" = réponse qui apporte un insight, un fait ou une perspective supplémentaire
- "RELANCE CONVERSATION" = réponse qui pousse le commentateur à répondre encore (question, provocation intelligente)
- Max ${maxChars} caractères chacune
- JSON uniquement, rien d'autre`

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: SYSTEM_REPLY },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('OpenRouter error:', data)
      return res.status(500).json({ error: 'Generation failed' })
    }

    const rawText = data.choices?.[0]?.message?.content || ''
    const clean = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    res.status(200).json(parsed)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Generation failed' })
  }
}
