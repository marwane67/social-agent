import type { NextApiRequest, NextApiResponse } from 'next'
import { sampleHooks, hooksAsPromptBlock, HOOKS } from '../../lib/hooks'
import { frameworkById } from '../../lib/frameworks'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Bloc hooks injecté dans chaque prompt — l'IA pioche dans cette liste pour ouvrir
function buildHookBlock(): string {
  const sample = sampleHooks(12)
  return `═══ BANQUE DE HOOKS À UTILISER ═══
Voici 12 hooks viraux FR éprouvés. Pour CHAQUE post généré, ouvre par UN de ces hooks (en l'adaptant au contexte) OU par un hook que tu inventes dans le même style :

${hooksAsPromptBlock(sample)}

Règle absolue : la PREMIÈRE LIGNE doit donner envie de lire la suite. Si elle est plate, le post est mort.`
}

const SYSTEM_TWITTER = `Tu es le stratège Twitter/X #1 d'Ismaa (@ismaa_pxl), entrepreneur tech à Bruxelles qui build in public.

═══ QUI EST ISMAA ═══
- Fondateur de Axora : marketplace d'acquisition de business digitaux pour le marché francophone (Belgique/France). C'est l'équivalent d'Acquire.com avec IA, matching intelligent, escrow, due diligence automatisée. En phase de développement, building in public.
- Fondateur de Pulsa Creatives : agence IA à Bruxelles. "L'agence IA de Bruxelles. On livre en jours ce que les autres promettent en mois."
- Pixel Company : holding qui chapeaute tout.
- Basé à Bruxelles, francophone, mélange naturel français/anglais tech.

═══ OBJECTIF STRATÉGIQUE ═══
Devenir LA référence francophone "IA + entrepreneuriat". Comme les gros comptes US qui parlent de Claude/ChatGPT mais avec un angle entrepreneur qui BUILD, pas juste qui commente. Chaque post doit positionner Ismaa comme quelqu'un qui FAIT, pas qui parle.

═══ TON & STYLE TWITTER ═══
- Direct, cash, zéro bullshit. Pas de "je suis ravi de partager..."
- Phrases courtes. Percutantes. Une idée = une ligne.
- Mélange français/anglais naturel (comme les vrais devs/entrepreneurs parlent)
- Vulnérable quand il faut (les galères, les doutes) mais jamais victime
- Confiant sans être arrogant. Les faits parlent.
- JAMAIS de hashtags sauf #BuildInPublic ou #Axora (max 1 par post)
- JAMAIS d'emojis en excès. 0-2 max. Préférer aucun.
- Pas de "🚀" "💡" "🔥" — c'est mort ça.

═══ CE QUI MARCHE SUR TWITTER/X EN 2025-2026 ═══
1. Single tweets percutants > threads (les threads sont morts pour l'engagement)
2. Le hook (première ligne) décide de tout — si ça accroche pas en 1 sec, c'est mort
3. Les espaces et retours à la ligne créent du rythme visuel
4. Les takes controversées/contrariantes génèrent des replies
5. Les vrais chiffres (revenus, users, taux) créent de la crédibilité
6. Le storytelling personnel bat le contenu éducatif générique
7. Les posts "behind the scenes" d'un produit en construction fascinent
8. Les comparaisons "avant/après" ou "ce que les gens pensent vs réalité" marchent
9. Les one-liners qui font réfléchir sont partagés massivement
10. Le format "J'ai fait X. Voilà ce qui s'est passé :" est addictif

═══ INTERDITS ═══
- Pas de "Thread 🧵" ou "1/n"
- Pas de listes numérotées classiques type "5 tips pour..."
- Pas de "Tu veux savoir comment j'ai fait ?" cliché
- Pas de "DM moi" ou "Like si tu es d'accord"
- Pas de platitudes motivationnelles vides
- Pas de posts qui ressemblent à du LinkedIn
- Pas de corporate speak
- JAMAIS copier le style des gros comptes US mot pour mot`

const SYSTEM_LINKEDIN = `Tu es le stratège LinkedIn #1 d'Ismaa, entrepreneur tech à Bruxelles qui build in public.

═══ QUI EST ISMAA ═══
- Fondateur de Axora : marketplace d'acquisition de business digitaux pour le marché francophone (Belgique/France). Équivalent d'Acquire.com avec IA, matching intelligent, escrow, due diligence automatisée. En phase de développement.
- Fondateur de Pulsa Creatives : agence IA à Bruxelles. "L'agence IA de Bruxelles. On livre en jours ce que les autres promettent en mois."
- Pixel Company : holding qui chapeaute tout.
- Basé à Bruxelles, francophone.

═══ OBJECTIF STRATÉGIQUE ═══
Devenir LA référence francophone sur LinkedIn pour "IA + entrepreneuriat + building in public". Se positionner comme le fondateur qui montre tout : les coulisses, les chiffres, les décisions. Un thought leader qui BUILD, pas un consultant qui donne des conseils creux.

═══ TON & STYLE LINKEDIN ═══
- Professionnel mais HUMAIN. Pas corporate. Pas fake.
- Hook ultra-fort en ligne 1 (c'est coupé après "voir plus" — cette ligne décide de tout)
- Phrases courtes, aérées. Sauts de ligne fréquents.
- 1 idée par ligne. Jamais de pavés.
- Storytelling > Conseils. "J'ai vécu X" > "Vous devriez faire X"
- Emojis : 0-3 max, stratégiques, jamais en début de ligne
- Pas de "🚀" "💡" à tout va — c'est la marque du post LinkedIn cringe
- CTA naturel à la fin (question, invitation à commenter) — jamais forcé
- Ton vulnérable quand il faut (doutes, échecs) mais toujours avec un learning
- Mélange français/anglais tech naturel

═══ CE QUI MARCHE SUR LINKEDIN EN 2025-2026 ═══
1. Le hook "voir plus" est TOUT — la 1ère ligne doit créer une tension/curiosité irrésistible
2. Les posts personnels battent les posts "expert" en engagement
3. Le format "J'ai fait X. Voilà les résultats :" marche très bien
4. Les carrousels sont top mais en texte seul, le storytelling domine
5. Les posts transparents sur les chiffres (CA, croissance, échecs) fascinent
6. Le format problème → solution → résultat est efficace
7. Les controverses modérées génèrent des commentaires
8. La longueur optimale : 800-1500 caractères (pas trop court, pas trop long)
9. Terminer par une question ouverte multiplie les commentaires x3
10. Les retours d'expérience authentiques > les "conseils"

═══ INTERDITS ═══
- Pas de "Je suis ravi/fier/honoré de..."
- Pas de "Agree?" tout seul à la fin
- Pas de listes "10 choses que j'ai apprises"
- Pas de storytelling fake ou exagéré
- Pas de motivation creuse type "Tout est possible si tu crois en toi"
- Pas de posts qui ressemblent à du Facebook
- Pas de tags massifs de personnes
- JAMAIS de hashtags en excès (max 3, en fin de post si pertinent)`

type FormatDef = {
  id: string
  label: string
  icon: string
  desc: string
  types: string[]
  prompt: (input: string) => string
}

const TWITTER_FORMATS: Record<string, FormatDef> = {
  raw_build: {
    id: 'raw_build',
    label: 'Raw Build Update',
    icon: '///',
    desc: "Ce que tu as build aujourd'hui, brut, réel",
    types: ['SCREENSHOT MENTAL', 'DÉCISION BRUTE', 'CHIFFRE NU'],
    prompt: (input) => `Contexte de la journée : "${input}"

Génère 3 posts Twitter "raw building in public" — le genre de post qui donne l'impression d'être dans la pièce avec l'entrepreneur pendant qu'il build.

Format JSON strict :
{"posts":[
  {"type":"SCREENSHOT MENTAL","text":"..."},
  {"type":"DÉCISION BRUTE","text":"..."},
  {"type":"CHIFFRE NU","text":"..."}
]}

Règles :
- Chaque post doit sentir l'authenticité brute. Pas polished. Vrai.
- Le "SCREENSHOT MENTAL" = décrire un moment précis de la journée comme si tu prenais une photo mentale
- La "DÉCISION BRUTE" = une décision prise aujourd'hui et POURQUOI, sans la justifier trop
- Le "CHIFFRE NU" = un chiffre réel (même petit/embarrassant) + ce qu'il signifie
- Max 280 caractères chacun
- Hook ligne 1 obligatoire — doit arrêter le scroll`
  },

  hot_take: {
    id: 'hot_take',
    label: 'Hot Take',
    icon: '!!!',
    desc: 'Opinion tranchée qui génère du débat',
    types: ['CONTRARIAN', 'VÉRITÉ INCONFORTABLE', 'PRÉDICTION'],
    prompt: (input) => `Sujet/contexte : "${input}"

Génère 3 posts Twitter "hot take" — des opinions tranchées qui font réagir et positionnent Ismaa comme quelqu'un qui pense différemment.

Format JSON strict :
{"posts":[
  {"type":"CONTRARIAN","text":"..."},
  {"type":"VÉRITÉ INCONFORTABLE","text":"..."},
  {"type":"PRÉDICTION","text":"..."}
]}

Règles :
- Le "CONTRARIAN" = une opinion qui va à contre-courant de ce que tout le monde dit. Doit être défendable et intelligente.
- La "VÉRITÉ INCONFORTABLE" = quelque chose que tout le monde sait mais que personne ne dit. Direct.
- La "PRÉDICTION" = une prédiction bold sur l'industrie/le marché basée sur ce qu'Ismaa voit en construisant
- Ces posts doivent générer des replies. Les gens doivent avoir envie de répondre (d'accord ou pas)
- Max 280 caractères. Chaque mot compte.
- Tone : confiant, pas agressif. Intelligent, pas prétentieux.`
  },

  behind_scenes: {
    id: 'behind_scenes',
    label: 'Behind The Scenes',
    icon: 'BTS',
    desc: "Coulisses de la construction d'Axora/Pulsa",
    types: ['PROCESS REVEAL', 'STACK REVEAL', 'CONVERSATION RÉELLE'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 posts Twitter "behind the scenes" — le genre de contenu qui donne un accès exclusif aux coulisses.

Format JSON strict :
{"posts":[
  {"type":"PROCESS REVEAL","text":"..."},
  {"type":"STACK REVEAL","text":"..."},
  {"type":"CONVERSATION RÉELLE","text":"..."}
]}

Règles :
- "PROCESS REVEAL" = montrer comment une décision a été prise, quel process a été suivi
- "STACK REVEAL" = parler de la stack tech, des outils, de l'architecture
- "CONVERSATION RÉELLE" = recréer un échange qui révèle quelque chose d'important
- Max 280 chars ou multi-ligne percutant (max 5-6 lignes courtes)`
  },

  ai_authority: {
    id: 'ai_authority',
    label: 'AI Authority',
    icon: 'AI',
    desc: 'Se positionner comme référence IA francophone',
    types: ['USE CASE RÉEL', 'AI vs RÉALITÉ', 'FUTUR PROCHE'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 posts Twitter qui positionnent Ismaa comme référence IA francophone — quelqu'un qui UTILISE l'IA pour builder, pas juste qui en parle.

Format JSON strict :
{"posts":[
  {"type":"USE CASE RÉEL","text":"..."},
  {"type":"AI vs RÉALITÉ","text":"..."},
  {"type":"FUTUR PROCHE","text":"..."}
]}

Règles :
- "USE CASE RÉEL" = montrer concrètement comment Ismaa utilise Claude/l'IA dans Axora ou Pulsa. Réel.
- "AI vs RÉALITÉ" = déconstruire un mythe sur l'IA avec l'expérience terrain
- "FUTUR PROCHE" = une vision de ce qui va changer dans les 6-12 mois
- Max 280 chars. Punchy.`
  },

  storytelling: {
    id: 'storytelling',
    label: 'Micro Story',
    icon: '...',
    desc: 'Mini histoire qui marque les esprits',
    types: ['MOMENT PIVOT', 'GALÈRE → LEÇON', 'CONVERSATION QUI A TOUT CHANGÉ'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 micro-stories Twitter — des histoires courtes (1 tweet) qui marquent et qu'on retient.

Format JSON strict :
{"posts":[
  {"type":"MOMENT PIVOT","text":"..."},
  {"type":"GALÈRE → LEÇON","text":"..."},
  {"type":"CONVERSATION QUI A TOUT CHANGÉ","text":"..."}
]}

Règles :
- Structure : tension → tournant → insight
- Le lecteur doit ressentir quelque chose
- Max 280 chars. Chaque mot est pesé.`
  },

  engagement_bait: {
    id: 'engagement_bait',
    label: 'Reply Magnet',
    icon: '???',
    desc: 'Posts qui génèrent un max de replies',
    types: ['QUESTION OUVERTE', 'CE QUE VOUS EN PENSEZ', 'DÉBAT LANCÉ'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 posts Twitter conçus pour maximiser les replies et l'engagement — sans être cringe.

Format JSON strict :
{"posts":[
  {"type":"QUESTION OUVERTE","text":"..."},
  {"type":"CE QUE VOUS EN PENSEZ","text":"..."},
  {"type":"DÉBAT LANCÉ","text":"..."}
]}

Règles :
- Vraies questions liées à ce qu'il build
- JAMAIS de "Like si..." ou "RT si..."
- La question doit être spécifique pour donner envie de répondre
- Max 280 chars`
  },

  one_liner: {
    id: 'one_liner',
    label: 'One-Liner',
    icon: '—',
    desc: 'Une phrase. Un impact. Point.',
    types: ['VÉRITÉ EN UNE PHRASE', 'PUNCHLINE BUSINESS', 'APHORISME TECH'],
    prompt: (input) => `Contexte/thème : "${input}"

Génère 3 one-liners Twitter — des tweets d'UNE SEULE phrase qui frappent fort et qu'on screenshot.

Format JSON strict :
{"posts":[
  {"type":"VÉRITÉ EN UNE PHRASE","text":"..."},
  {"type":"PUNCHLINE BUSINESS","text":"..."},
  {"type":"APHORISME TECH","text":"..."}
]}

Règles :
- UNE seule phrase. Courte. Percutante. Mémorable.
- Le genre de phrase qu'on screenshot et qu'on partage
- Max 140 caractères idéalement. Jamais plus de 200.`
  },

  axora_hype: {
    id: 'axora_hype',
    label: 'Axora Hype',
    icon: 'AX',
    desc: "Créer l'engouement autour d'Axora",
    types: ['TEASER FEATURE', 'VISION MARCHÉ', 'WAITLIST TRIGGER'],
    prompt: (input) => `Contexte sur Axora : "${input}"

Génère 3 posts Twitter pour créer de l'engouement et du FOMO autour d'Axora — sans être publicitaire.

Format JSON strict :
{"posts":[
  {"type":"TEASER FEATURE","text":"..."},
  {"type":"VISION MARCHÉ","text":"..."},
  {"type":"WAITLIST TRIGGER","text":"..."}
]}

Règles :
- Montrer, pas dire. C'est du building in public pour un produit, pas de la pub.
- Max 280 chars`
  },
}

const LINKEDIN_FORMATS: Record<string, FormatDef> = {
  transparency: {
    id: 'transparency',
    label: 'Transparence Radicale',
    icon: '%',
    desc: 'Chiffres réels, coulisses, décisions — tout montrer',
    types: ['CHIFFRES OUVERTS', 'COULISSES DÉCISION', 'ERREUR PUBLIQUE'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 posts LinkedIn "transparence radicale" — montrer les vraies coulisses de l'entrepreneuriat sans filtre.

Format JSON strict :
{"posts":[
  {"type":"CHIFFRES OUVERTS","text":"..."},
  {"type":"COULISSES DÉCISION","text":"..."},
  {"type":"ERREUR PUBLIQUE","text":"..."}
]}

Règles :
- "CHIFFRES OUVERTS" = partager des chiffres réels (CA, users, coûts, taux). Les gens adorent la transparence financière.
- "COULISSES DÉCISION" = expliquer une décision difficile prise récemment et le raisonnement derrière
- "ERREUR PUBLIQUE" = admettre une erreur, ce qu'elle a coûté, et ce qu'Ismaa en a tiré
- Hook ultra-fort en ligne 1 (coupé après "voir plus")
- Format aéré : 1 idée = 1 ligne, sauts de ligne
- 800-1500 caractères max
- Terminer par une question ouverte pour générer des commentaires
- Ton : honnête, vulnérable mais pas victimisant`
  },

  thought_leadership: {
    id: 'thought_leadership',
    label: 'Thought Leader',
    icon: 'TL',
    desc: 'Se positionner comme expert IA + business',
    types: ['VISION INDUSTRIE', 'FRAMEWORK MAISON', 'PRÉDICTION MARCHÉ'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 posts LinkedIn "thought leadership" — positionner Ismaa comme LA référence francophone IA + entrepreneuriat.

Format JSON strict :
{"posts":[
  {"type":"VISION INDUSTRIE","text":"..."},
  {"type":"FRAMEWORK MAISON","text":"..."},
  {"type":"PRÉDICTION MARCHÉ","text":"..."}
]}

Règles :
- "VISION INDUSTRIE" = une observation sur l'industrie que personne n'a encore formulée. Basée sur l'expérience terrain.
- "FRAMEWORK MAISON" = un framework/méthode qu'Ismaa a développé en construisant. Concret, applicable.
- "PRÉDICTION MARCHÉ" = une prédiction bold sur le futur du marché (IA, SaaS, acquisition de business)
- Hook : la première ligne doit être une affirmation forte ou une question provocatrice
- Développement : 4-6 points courts qui soutiennent l'argument
- Conclusion : insight final + question pour les commentaires
- 800-1500 caractères`
  },

  storytelling_li: {
    id: 'storytelling_li',
    label: 'Storytelling',
    icon: '...',
    desc: 'Histoires personnelles qui résonnent',
    types: ['MOMENT FONDATEUR', 'PIVOT DÉCISIF', 'LEÇON INATTENDUE'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 posts LinkedIn storytelling — des histoires personnelles qui résonnent professionnellement.

Format JSON strict :
{"posts":[
  {"type":"MOMENT FONDATEUR","text":"..."},
  {"type":"PIVOT DÉCISIF","text":"..."},
  {"type":"LEÇON INATTENDUE","text":"..."}
]}

Règles :
- "MOMENT FONDATEUR" = le moment où tout a commencé ou tout a changé. Détails sensoriels, émotion, puis la leçon.
- "PIVOT DÉCISIF" = un choix difficile entre deux options, pourquoi Ismaa a choisi celle-là, et le résultat
- "LEÇON INATTENDUE" = quelque chose d'inattendu appris en construisant. Le genre de truc qu'aucun livre ne t'apprend.
- Structure narrative : situation → tension → résolution → insight
- Hook émotionnel en ligne 1
- Aéré, 1 idée par ligne
- 800-1500 caractères
- Fin : la leçon universelle + question ouverte`
  },

  value_bomb: {
    id: 'value_bomb',
    label: 'Value Bomb',
    icon: 'VB',
    desc: 'Contenu ultra-actionnable, 100% valeur',
    types: ['PROCESS DÉVOILÉ', 'OUTIL SECRET', 'HACK TESTÉ'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 posts LinkedIn "value bomb" — du contenu tellement actionnable que les gens le sauvegardent.

Format JSON strict :
{"posts":[
  {"type":"PROCESS DÉVOILÉ","text":"..."},
  {"type":"OUTIL SECRET","text":"..."},
  {"type":"HACK TESTÉ","text":"..."}
]}

Règles :
- "PROCESS DÉVOILÉ" = montrer étape par étape un process qu'Ismaa utilise. Pas de théorie, que du pratique.
- "OUTIL SECRET" = partager un outil, une stack, une config que les gens ne connaissent pas
- "HACK TESTÉ" = un truc contre-intuitif qui a marché. Avec les chiffres avant/après.
- Hook : "Ce process m'a fait gagner..." ou "J'aurais aimé savoir ça avant..."
- Format : étapes numérotées courtes OU paragraphes aérés
- Pas de théorie. Que du vécu, du testé, du prouvé.
- 800-1500 caractères
- CTA : "Sauvegardez ce post" ou question liée`
  },

  axora_linkedin: {
    id: 'axora_linkedin',
    label: 'Axora Vision',
    icon: 'AX',
    desc: "Positionner Axora comme incontournable",
    types: ['PROBLÈME MARCHÉ', 'BEHIND THE BUILD', 'VISION PRODUIT'],
    prompt: (input) => `Contexte sur Axora : "${input}"

Génère 3 posts LinkedIn pour positionner Axora comme la solution incontournable du marché francophone — en mode building in public.

Format JSON strict :
{"posts":[
  {"type":"PROBLÈME MARCHÉ","text":"..."},
  {"type":"BEHIND THE BUILD","text":"..."},
  {"type":"VISION PRODUIT","text":"..."}
]}

Règles :
- "PROBLÈME MARCHÉ" = identifier un problème clair dans le marché de l'acquisition de business en francophonie. Données si possible.
- "BEHIND THE BUILD" = montrer les coulisses de la construction d'Axora. Ce qui marche, ce qui échoue, les décisions.
- "VISION PRODUIT" = la vision long terme d'Axora et pourquoi elle va changer le marché. Ambitieux mais ancré.
- Pas publicitaire. C'est du building in public professionnel.
- Hook : la première ligne doit identifier un pain point ou une vision
- 800-1500 caractères
- CTA naturel (s'inscrire à la waitlist, donner un avis, etc.)`
  },

  debate_li: {
    id: 'debate_li',
    label: 'Debate Starter',
    icon: '><',
    desc: 'Opinions qui génèrent des commentaires',
    types: ['OPINION TRANCHÉE', 'MYTHE DÉTRUIT', 'QUESTION POLÉMIQUE'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 posts LinkedIn conçus pour créer du débat intelligent et maximiser les commentaires.

Format JSON strict :
{"posts":[
  {"type":"OPINION TRANCHÉE","text":"..."},
  {"type":"MYTHE DÉTRUIT","text":"..."},
  {"type":"QUESTION POLÉMIQUE","text":"..."}
]}

Règles :
- "OPINION TRANCHÉE" = prendre position sur un sujet où la plupart des gens sont neutres. Arguments solides.
- "MYTHE DÉTRUIT" = s'attaquer à une croyance populaire dans le milieu tech/startup avec des faits
- "QUESTION POLÉMIQUE" = poser une question qui divise et inviter au débat. Les deux côtés doivent être défendables.
- Hook provocateur mais intelligent (pas clickbait)
- Développer l'argument en 3-4 points
- Finir TOUJOURS par "Et vous, qu'en pensez-vous ?" ou variante
- 800-1500 caractères
- Ton : assertif, pas agressif. Ouvert au débat.`
  },

  personal_brand: {
    id: 'personal_brand',
    label: 'Personal Brand',
    icon: 'ME',
    desc: "Montrer qui est Ismaa au-delà du business",
    types: ['VALEURS', 'ROUTINE', 'RÉFLEXION PERSO'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 posts LinkedIn personal branding — montrer qui est Ismaa au-delà des projets, créer une connexion humaine.

Format JSON strict :
{"posts":[
  {"type":"VALEURS","text":"..."},
  {"type":"ROUTINE","text":"..."},
  {"type":"RÉFLEXION PERSO","text":"..."}
]}

Règles :
- "VALEURS" = un post qui révèle une valeur fondamentale d'Ismaa à travers une anecdote concrète
- "ROUTINE" = partager un élément de la routine quotidienne/hebdo qui contribue au succès. Pas pour se vanter, pour inspirer.
- "RÉFLEXION PERSO" = une pensée profonde sur l'entrepreneuriat, la vie, les choix. Personnel et universel.
- Authentique avant tout. Pas de personal branding "calculé" qui sonne fake.
- Hook : phrase personnelle qui crée de l'empathie immédiate
- 800-1500 caractères
- Fin : réflexion universelle + question`
  },

  ai_expert_li: {
    id: 'ai_expert_li',
    label: 'AI Expert',
    icon: 'AI',
    desc: 'Référence IA francophone sur LinkedIn',
    types: ['USE CASE CONCRET', 'AVANT/APRÈS IA', 'TENDANCE IA'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 posts LinkedIn positionnant Ismaa comme l'expert IA francophone qui UTILISE l'IA, pas juste qui en parle.

Format JSON strict :
{"posts":[
  {"type":"USE CASE CONCRET","text":"..."},
  {"type":"AVANT/APRÈS IA","text":"..."},
  {"type":"TENDANCE IA","text":"..."}
]}

Règles :
- "USE CASE CONCRET" = montrer exactement comment l'IA est utilisée dans Axora ou Pulsa. Workflow réel, pas théorique.
- "AVANT/APRÈS IA" = comparer un process avant l'IA et après. Avec des chiffres (temps gagné, coût réduit).
- "TENDANCE IA" = analyser une tendance IA émergente et ce qu'elle signifie pour les entrepreneurs/PME
- Positionner = "Je construis AVEC l'IA au quotidien, voilà ce que je vois"
- Hook : affirmation forte ou chiffre surprenant
- 800-1500 caractères
- Éducatif mais pas condescendant`
  },

  lead_magnet: {
    id: 'lead_magnet',
    label: 'Lead Magnet',
    icon: 'LM',
    desc: 'Générer des lead magnets qui captent des emails et des abonnés',
    types: ['POST + CHECKLIST', 'POST + CARROUSEL', 'POST + FREEBIE'],
    prompt: (input) => `Contexte : "${input}"

Génère 3 posts LinkedIn qui servent de lead magnets. Chaque post doit donner 80% de la valeur gratuitement, puis proposer un bonus à récupérer.

Format JSON strict :
{"posts":[
  {"type":"POST + CHECKLIST","text":"le post LinkedIn complet (800-1200 chars). Le post doit être éducatif et finir par : Commente CHECKLIST et je te l'envoie en DM."},
  {"type":"POST + CARROUSEL","text":"le post LinkedIn qui accompagne un carrousel (800-1200 chars). Décris le contenu des 7 slides dans le post lui-même. Finis par : Like + commente pour recevoir le PDF."},
  {"type":"POST + FREEBIE","text":"le post LinkedIn qui tease un template/outil gratuit (800-1200 chars). Montre le résultat obtenu avec l'outil AVANT de le proposer. Finis par : Commente TEMPLATE et je t'envoie le lien."}
]}

Règles :
- Hook ultra-fort en ligne 1 (coupé après "voir plus")
- Format aéré : 1 idée par ligne, sauts de ligne
- Le post doit être excellent MÊME sans télécharger le lead magnet
- Lié à : IA, entrepreneuriat, acquisition de business, building in public
- Ton naturel, pas commercial
- JSON uniquement, rien d'autre`
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { input, format, network, framework, hookId, voiceProfile, performanceInsights } = req.body
  if (!input || !format || !network) return res.status(400).json({ error: 'Missing fields' })

  const formats = network === 'linkedin' ? LINKEDIN_FORMATS : TWITTER_FORMATS
  const baseSystem = network === 'linkedin' ? SYSTEM_LINKEDIN : SYSTEM_TWITTER
  const f = formats[format]
  if (!f) return res.status(400).json({ error: 'Invalid format' })

  // Injection du framework storytelling si demandé
  let frameworkBlock = ''
  if (framework) {
    const fw = frameworkById(framework)
    if (fw) frameworkBlock = `\n\n═══ FRAMEWORK STORYTELLING IMPOSÉ ═══\n${fw.promptInjection}`
  }

  // Injection d'un hook spécifique si demandé (sinon banque aléatoire)
  let hookBlock = ''
  if (hookId) {
    const h = HOOKS.find(x => x.id === Number(hookId))
    if (h) hookBlock = `\n\n═══ HOOK D'OUVERTURE IMPOSÉ ═══\nLa PREMIÈRE LIGNE de chaque post doit être (ou démarrer par) :\n"${h.text}"\nAdapte-le au contexte mais garde l'esprit du hook.`
  } else {
    hookBlock = `\n\n${buildHookBlock()}`
  }

  // Injection du profil de voix de l'utilisateur si fourni
  let voiceBlock = ''
  if (voiceProfile) {
    voiceBlock = `\n\n═══ STYLE ISMAA — VOICE PROFILE ═══
Tu DOIS imiter le style exact d'Ismaa, extrait de ses meilleurs posts :

- TON : ${voiceProfile.toneOfVoice}
- LONGUEUR MOYENNE : ${voiceProfile.averageLength} caractères par post
- STRUCTURE DE PHRASE : ${voiceProfile.sentenceStyle}
- TICS DE VOCABULAIRE (à réutiliser naturellement) : ${(voiceProfile.vocabularyTics || []).join(', ')}
- THÈMES RÉCURRENTS : ${(voiceProfile.topicsRecurring || []).join(', ')}
- EMOJIS : ${voiceProfile.emojiUsage}
- HOOKS PRÉFÉRÉS : ${voiceProfile.hookStyle}
- PONCTUATION : ${voiceProfile.punctuationHabits}
- SIGNATURE : ${voiceProfile.signature}

Règle absolue : le post doit ressembler à du Ismaa pur. Si quelqu'un qui le connaît lit le post, il doit dire "c'est lui qui l'a écrit". Pas de tournures IA. Pas de phrases trop polished.`
  }

  // Inject performance insights if provided
  let perfBlock = ''
  if (performanceInsights && typeof performanceInsights === 'string') {
    perfBlock = '\n\n' + performanceInsights
  }

  const system = baseSystem + voiceBlock + perfBlock + hookBlock + frameworkBlock

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
          { role: 'system', content: system },
          { role: 'user', content: f.prompt(input) },
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
