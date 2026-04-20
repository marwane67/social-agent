// Frameworks de storytelling utilisés par l'agent pour structurer les posts longs.
// Source : @shift.hq + classiques de la narration

export type Framework = {
  id: string
  name: string
  desc: string
  steps: { name: string; explanation: string }[]
  promptInjection: string  // Bloc texte à injecter dans le prompt système quand ce framework est demandé
  bestFor: ('twitter' | 'linkedin')[]
}

export const FRAMEWORKS: Framework[] = [
  {
    id: 'hero_journey',
    name: 'Le voyage du héros',
    desc: "Emmène ton audience dans le parcours avec toi : déclic → saut → lutte → déclic majeur → évolution",
    steps: [
      { name: 'Le déclic', explanation: "Tu repères un problème dans ta niche" },
      { name: 'Le saut', explanation: "Tu te lances, tu testes des solutions" },
      { name: 'La lutte', explanation: "Ça ne marche pas toujours, tu ajustes" },
      { name: 'Le déclic majeur', explanation: "Tu trouves enfin ce qui fonctionne" },
      { name: "L'évolution", explanation: "Tu partages, tu aides, tu progresses" },
    ],
    promptInjection: `STRUCTURE OBLIGATOIRE — VOYAGE DU HÉROS (5 actes) :
1. Le déclic : un problème qu'Ismaa a repéré (1-2 lignes)
2. Le saut : la décision de s'y attaquer (1-2 lignes)
3. La lutte : ce qui n'a pas marché, les tentatives ratées (2-3 lignes, c'est le coeur émotionnel)
4. Le déclic majeur : le moment où ça clique, la solution trouvée (1-2 lignes)
5. L'évolution : ce qui a changé, ce qu'Ismaa partage maintenant (1-2 lignes + insight final)

Le but : que le lecteur vive le parcours AVEC Ismaa.`,
    bestFor: ['linkedin'],
  },

  {
    id: 'golden_circle',
    name: "Le Cercle d'Or",
    desc: "Pourquoi → Comment → Quoi. Commence par expliquer POURQUOI tu fais ça, et l'audience s'attache.",
    steps: [
      { name: 'Pourquoi', explanation: "La raison profonde derrière ce que tu fais" },
      { name: 'Comment', explanation: "Ton process, ta manière unique d'apporter de la valeur" },
      { name: 'Quoi', explanation: "Le résultat concret : posts, vidéos, produit, insights" },
    ],
    promptInjection: `STRUCTURE OBLIGATOIRE — CERCLE D'OR (Simon Sinek) :
1. POURQUOI (hook + 2-3 lignes) : commence par la conviction, la raison profonde. Ce qui fait qu'Ismaa se lève le matin pour Axora/Pulsa.
2. COMMENT (3-4 lignes) : la manière unique dont Ismaa s'y prend. Le process, l'angle.
3. QUOI (2-3 lignes) : le résultat concret, le produit, le post, le service.

Règle d'or : ne JAMAIS commencer par le QUOI. Toujours par le POURQUOI. C'est ce qui crée l'attachement.`,
    bestFor: ['linkedin'],
  },

  {
    id: 'freytag',
    name: 'La pyramide de Freytag',
    desc: "Arc narratif classique : Début (tension monte) → Milieu (point de bascule) → Fin (résolution + leçon)",
    steps: [
      { name: 'Début — Départ', explanation: "Tu poses le contexte avec un problème concret" },
      { name: 'Début — La tension monte', explanation: "Tu partages les difficultés, tentatives ratées" },
      { name: 'Milieu — Tu continues', explanation: "Tu insistes malgré tout" },
      { name: 'Milieu — Point de bascule', explanation: "Le moment où ça fonctionne enfin" },
      { name: 'Fin — Stabilisation', explanation: "Les choses se mettent en place" },
      { name: 'Fin — Apprentissage', explanation: "Ce que les autres peuvent appliquer" },
    ],
    promptInjection: `STRUCTURE OBLIGATOIRE — PYRAMIDE DE FREYTAG :
1. DÉBUT (3-4 lignes) :
   - Départ : situation initiale, problème concret de la niche
   - La tension monte : galères, tentatives ratées, doutes
2. MILIEU (3-4 lignes) :
   - Tu continues d'avancer malgré tout
   - POINT DE BASCULE : le moment "ça y est, ça marche" — c'est le pic émotionnel
3. FIN (3-4 lignes) :
   - Les choses se stabilisent, les résultats arrivent
   - Ce que tu as appris (leçon universelle applicable)

Le pic doit se sentir. Le lecteur doit ressentir le soulagement quand le point de bascule arrive.`,
    bestFor: ['linkedin'],
  },

  {
    id: 'before_after_bridge',
    name: 'Before-After-Bridge',
    desc: "Avant (douleur) → Après (rêve) → Pont (comment y arriver). Le framework copywriting le plus efficace.",
    steps: [
      { name: 'Before', explanation: "La situation actuelle douloureuse de ton lecteur" },
      { name: 'After', explanation: "Le monde idéal après résolution du problème" },
      { name: 'Bridge', explanation: "Ta solution qui fait le pont entre les deux" },
    ],
    promptInjection: `STRUCTURE OBLIGATOIRE — BEFORE / AFTER / BRIDGE :
1. BEFORE (2-3 lignes) : peins la situation actuelle douloureuse du lecteur. Sois précis et concret. Le lecteur doit se reconnaître.
2. AFTER (2-3 lignes) : décris le monde idéal une fois le problème résolu. Vivant, désirable.
3. BRIDGE (3-5 lignes) : montre LE pont — ta méthode, ton outil, ton insight — qui fait passer du Before au After.

C'est le framework le plus puissant en copywriting. Marche pour 90% des posts à conversion.`,
    bestFor: ['linkedin', 'twitter'],
  },

  {
    id: 'pas',
    name: 'PAS — Problem / Agitate / Solve',
    desc: "Identifie le problème → Aggrave la douleur → Apporte la solution. Format ultra-direct.",
    steps: [
      { name: 'Problem', explanation: "Le problème précis du lecteur" },
      { name: 'Agitate', explanation: "Tu remues le couteau dans la plaie" },
      { name: 'Solve', explanation: "Tu apportes la solution claire" },
    ],
    promptInjection: `STRUCTURE OBLIGATOIRE — PAS (Problem / Agitate / Solve) :
1. PROBLEM (1-2 lignes) : nomme le problème concret. Le lecteur doit dire "c'est exactement moi".
2. AGITATE (2-3 lignes) : aggrave la conscience du problème. Liste les conséquences invisibles, les coûts cachés.
3. SOLVE (2-4 lignes) : apporte LA solution. Concrète. Actionnable.

Format direct, pas de fioritures. Marche très bien pour les posts courts (Twitter) ou LinkedIn punchy.`,
    bestFor: ['twitter', 'linkedin'],
  },
]

export function frameworkById(id: string): Framework | undefined {
  return FRAMEWORKS.find(f => f.id === id)
}

export function frameworksFor(network: 'twitter' | 'linkedin'): Framework[] {
  return FRAMEWORKS.filter(f => f.bestFor.includes(network))
}
