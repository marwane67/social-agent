import type { NextApiRequest, NextApiResponse } from 'next'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const ISMAA_CONTEXT = `Ismaa (@ismaa_pxl), entrepreneur tech à Bruxelles. Fondateur d'Axora (marketplace acquisition business digitaux, équivalent Acquire.com avec IA pour le marché francophone) et Pulsa Creatives (agence IA Bruxelles). Build in public, référence IA francophone.`

const TOOLS: Record<string, (input: string, network: string) => { system: string; prompt: string }> = {
  thread: (input, network) => ({
    system: `Tu es un expert en story threads ${network === 'twitter' ? 'Twitter/X' : 'LinkedIn'}. ${ISMAA_CONTEXT}`,
    prompt: `Contexte : "${input}"

Génère un "story thread" de 3 tweets/posts liés qui racontent une progression narrative. PAS un thread classique numéroté. Chaque tweet est AUTONOME mais ensemble ils forment une histoire.

JSON strict :
{"thread":[
  {"position":1,"hook":"la première ligne accrocheuse","text":"tweet complet","transition":"ce qui donne envie de lire le suivant"},
  {"position":2,"hook":"...","text":"...","transition":"..."},
  {"position":3,"hook":"...","text":"...","transition":"conclusion/CTA"}
],"strategy":"pourquoi cette structure va marcher"}

- Chaque tweet max ${network === 'twitter' ? '280' : '1500'} chars
- Le premier crée la TENSION
- Le deuxième apporte le DÉVELOPPEMENT
- Le troisième donne la RÉSOLUTION + insight
- Pas de "1/3", "Thread", ou numérotation visible`
  }),

  repurpose: (input, network) => ({
    system: `Tu es un expert en adaptation cross-platform. ${ISMAA_CONTEXT}`,
    prompt: `Post original (${network === 'twitter' ? 'Twitter → adapte pour LinkedIn' : 'LinkedIn → adapte pour Twitter'}) :
"${input}"

Adapte ce post pour l'AUTRE plateforme. Pas une traduction — une ADAPTATION au format et à la culture de la plateforme cible.

JSON strict :
{"original_platform":"${network}","target_platform":"${network === 'twitter' ? 'linkedin' : 'twitter'}","adapted_post":"le post adapté","changes":["ce qui a été changé et pourquoi"],"tips":"conseil pour maximiser l'impact sur la plateforme cible"}

${network === 'twitter' ? 'Twitter → LinkedIn : développe, ajoute du contexte, structure avec sauts de ligne, ajoute un CTA/question, 800-1500 chars' : 'LinkedIn → Twitter : condense le message essentiel, garde le hook, max 280 chars, supprime le superflu'}`
  }),

  trend: (input) => ({
    system: `Tu es un expert en newsjacking et trend surfing. ${ISMAA_CONTEXT}`,
    prompt: `Sujet/tendance trending : "${input}"

Génère 3 posts qui surfent sur cette tendance avec l'ANGLE UNIQUE d'Ismaa (entrepreneur IA, building in public, Axora/Pulsa).

JSON strict :
{"posts":[
  {"type":"RÉACTION RAPIDE","text":"...","angle":"pourquoi cet angle"},
  {"type":"LIEN AVEC MON PROJET","text":"...","angle":"..."},
  {"type":"TAKE CONTRARIAN","text":"...","angle":"..."}
]}

- "RÉACTION RAPIDE" = réaction à chaud, opinion directe
- "LIEN AVEC MON PROJET" = comment cette tendance impacte Axora/Pulsa/l'IA
- "TAKE CONTRARIAN" = aller à contre-courant de l'opinion majoritaire
- Max 280 chars chacun, hooks forts`
  }),

  bio: (input, network) => ({
    system: `Tu es un expert en personal branding et optimisation de profils sociaux. ${ISMAA_CONTEXT}`,
    prompt: `Contexte/focus actuel : "${input}"

Génère 3 versions de bio ${network === 'twitter' ? 'Twitter/X (max 160 chars)' : 'LinkedIn (headline max 120 chars + résumé 300 chars)'} optimisées.

JSON strict :
{"bios":[
  {"type":"AUTHORITY","${network === 'twitter' ? 'bio' : 'headline'}":"...","${network === 'twitter' ? 'note' : 'summary'}":"..."},
  {"type":"CURIOSITY","${network === 'twitter' ? 'bio' : 'headline'}":"...","${network === 'twitter' ? 'note' : 'summary'}":"..."},
  {"type":"SOCIAL PROOF","${network === 'twitter' ? 'bio' : 'headline'}":"...","${network === 'twitter' ? 'note' : 'summary'}":"..."}
],"tips":["conseil 1","conseil 2"]}

- AUTHORITY = positionne comme expert/référence
- CURIOSITY = donne envie d'en savoir plus
- SOCIAL PROOF = met en avant les réalisations
- Pas de clichés ("passionné", "serial entrepreneur")`
  }),

  carousel: (input, network) => ({
    system: `Tu es un expert en carrousels ${network === 'twitter' ? 'Twitter/X' : 'LinkedIn'}. ${ISMAA_CONTEXT}`,
    prompt: `Sujet : "${input}"

Génère le contenu complet d'un carrousel de 8 slides prêt à designer.

JSON strict :
{"carousel":{"title":"titre du carrousel","slides":[
  {"slide":1,"type":"cover","title":"titre accrocheur","subtitle":"sous-titre"},
  {"slide":2,"type":"problem","title":"...","body":"..."},
  {"slide":3,"type":"content","title":"...","body":"..."},
  {"slide":4,"type":"content","title":"...","body":"..."},
  {"slide":5,"type":"content","title":"...","body":"..."},
  {"slide":6,"type":"content","title":"...","body":"..."},
  {"slide":7,"type":"result","title":"...","body":"..."},
  {"slide":8,"type":"cta","title":"...","body":"...","cta":"appel à l'action"}
],"post_text":"le post qui accompagne le carrousel","design_tips":"conseils design (couleurs, typo, style)"}}`
  }),

  poll: (input, network) => ({
    system: `Tu es un expert en sondages viraux. ${ISMAA_CONTEXT}`,
    prompt: `Sujet : "${input}"

Génère 3 sondages stratégiques pour ${network === 'twitter' ? 'Twitter/X' : 'LinkedIn'} qui boostent l'engagement.

JSON strict :
{"polls":[
  {"type":"DÉBAT","question":"la question du sondage","options":["option 1","option 2","option 3","option 4"],"post_text":"le post qui accompagne le sondage","strategy":"pourquoi ce sondage va marcher"},
  {"type":"INSIGHT","question":"...","options":["...","...","..."],"post_text":"...","strategy":"..."},
  {"type":"COMMUNAUTÉ","question":"...","options":["...","...","..."],"post_text":"...","strategy":"..."}
]}

- DÉBAT = divise l'audience, génère des commentaires
- INSIGHT = révèle une donnée intéressante sur l'audience
- COMMUNAUTÉ = crée du lien, les gens se reconnaissent dans les options
- ${network === 'twitter' ? 'Max 4 options, 25 chars par option' : 'Max 4 options'}`
  }),

  cta: (input, network) => ({
    system: `Tu es un expert en copywriting et CTA. ${ISMAA_CONTEXT}`,
    prompt: `Contexte/objectif : "${input}"

Génère des CTAs optimisés pour différents usages sur ${network === 'twitter' ? 'Twitter/X' : 'LinkedIn'}.

JSON strict :
{"ctas":{
  "bio":"CTA pour la bio (max 30 chars)",
  "post_end":["3 CTAs pour fins de posts"],
  "dm_opener":"message d'ouverture de DM",
  "link_tease":"phrase pour teaser un lien sans le mettre (l'algo pénalise les liens)",
  "waitlist":"CTA pour la waitlist Axora",
  "engagement":["3 phrases pour inciter à commenter/partager sans être cringe"]
}}`
  }),

  analyze: (input) => ({
    system: `Tu es un analyste de performance social media. ${ISMAA_CONTEXT}`,
    prompt: `Voici les données de performance des posts d'Ismaa :
${input}

Analyse ces données et donne des insights actionnables.

JSON strict :
{"analysis":{
  "best_format":"le format qui performe le mieux et pourquoi",
  "best_time":"le meilleur créneau horaire",
  "best_hook_style":"le style de hook qui marche le mieux",
  "engagement_trend":"tendance générale (hausse/baisse/stable)",
  "top_post":"le post qui a le mieux marché et pourquoi",
  "weak_spot":"le point faible à améliorer",
  "recommendations":["3 recommandations concrètes pour améliorer"],
  "next_week_plan":"plan de contenu recommandé pour la semaine prochaine"
}}`
  }),

  recycle: (input, network) => ({
    system: `Tu es un expert en recyclage de contenu. ${ISMAA_CONTEXT}`,
    prompt: `Ancien post qui a bien marché :
"${input}"

Réécris ce post avec 3 angles frais et différents pour ${network === 'twitter' ? 'Twitter/X' : 'LinkedIn'}. Le message de fond reste le même mais la forme change complètement.

JSON strict :
{"recycled":[
  {"type":"NOUVEL ANGLE","text":"...","angle":"ce qui a changé par rapport à l'original"},
  {"type":"MISE À JOUR","text":"...","angle":"..."},
  {"type":"FORMAT DIFFÉRENT","text":"...","angle":"..."}
]}

- Max ${network === 'twitter' ? '280' : '1500'} chars chacun
- Chaque version doit être suffisamment différente pour ne pas ressembler à un repost`
  }),

  competitor: (input) => ({
    system: `Tu es un analyste de stratégie social media. ${ISMAA_CONTEXT}`,
    prompt: `Post d'un concurrent/compte dans la niche d'Ismaa :
"${input}"

Analyse ce post et trouve les opportunités pour Ismaa.

JSON strict :
{"analysis":{
  "strategy":"la stratégie derrière ce post",
  "strengths":"ce qui marche bien dans ce post",
  "weaknesses":"les faiblesses ou angles manqués",
  "missed_angles":"les angles que ce concurrent ne couvre pas et qu'Ismaa pourrait prendre",
  "counter_posts":["3 idées de posts qu'Ismaa pourrait faire en réponse/complément"]
}}`
  }),

  dm: (input, network) => ({
    system: `Tu es un expert en cold outreach et networking. ${ISMAA_CONTEXT}`,
    prompt: `Objectif du DM : "${input}"
Plateforme : ${network === 'twitter' ? 'Twitter/X' : 'LinkedIn'}

Génère 3 templates de DM.

JSON strict :
{"dms":[
  {"type":"DIRECT","text":"...","strategy":"pourquoi ça marche"},
  {"type":"VALEUR D'ABORD","text":"...","strategy":"..."},
  {"type":"CONNEXION PERSO","text":"...","strategy":"..."}
]}

- DIRECT = aller droit au but avec respect
- VALEUR D'ABORD = offrir quelque chose avant de demander
- CONNEXION PERSO = créer un lien personnel d'abord
- Court (3-5 lignes max), naturel, pas template-like
- Pas de "J'espère que vous allez bien" ou "Je me permets de..."
- Ton naturel d'Ismaa`
  }),
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { input, tool, network } = req.body
  if (!input || !tool) return res.status(400).json({ error: 'Missing fields' })

  const toolFn = TOOLS[tool]
  if (!toolFn) return res.status(400).json({ error: 'Invalid tool' })

  const { system, prompt } = toolFn(input, network || 'twitter')

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        max_tokens: 2500,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('OpenRouter error:', data)
      return res.status(500).json({ error: 'Tool failed' })
    }

    const rawText = data.choices?.[0]?.message?.content || ''
    const clean = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    res.status(200).json(parsed)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Tool failed' })
  }
}
