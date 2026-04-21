// Brain = la base de connaissance stratégique de Marwane.
// Pulse lit ce contexte à chaque interaction pour prendre des décisions smart
// (ex: router un post "Axora update" vers les 3 channels pertinents, éviter
// de parler de Pulsa offer sur le Twitter personnel, etc.)

export type Project = {
  id: string                        // 'axora', 'pulsa', 'personal'
  name: string                      // nom affiché
  status: string                    // ex: "lancé avril 2026", "en dev"
  pitch: string                     // 1-2 phrases
  audience: string                  // cible
  key_messages: string[]            // points-clés à marteler
  tone: string                      // ton spécifique
  cta?: string                      // call-to-action récurrent
}

export type Channel = {
  id: string                        // Buffer channel ID
  name: string                      // display name
  service: 'twitter' | 'linkedin'
  purpose: string                   // "Marwane personnel", "Axora company", etc.
  projects: string[]                // ids des projects qui vont sur ce channel
  voice: string                     // style d'écriture spécifique
}

export type Axis = {
  id: string                        // 'building_public_axora', 'pulsa_offer', etc.
  name: string                      // affiché
  description: string               // angle, storyline
  projects: string[]                // projets concernés
  channels: string[]                // channels Buffer cibles
  frequency: string                 // ex: "3x/semaine", "daily"
}

export type Trend = {
  id: string
  title: string                     // ex: "GPT-5.5 sortie"
  description: string               // contexte, pourquoi c'est pertinent
  addedAt: string
}

export type CadenceRule = {
  channelId: string                 // Buffer channel ID
  postsPerDay: number               // 3 par défaut
  times: string[]                   // ex: ["09:00", "13:00", "18:00"]
  angleRotation: string[]           // ex: ["build_in_public", "insight_actualite", "engagement_question"]
  projectMix?: string[]             // pour channels multi-projet : rotation des projets
}

export type Brain = {
  projects: Project[]
  channels: Channel[]
  axes: Axis[]
  trends: Trend[]                   // tendances actuelles à surfer
  cadence: CadenceRule[]            // règles de publication par channel
  lastUpdated: string
}

const KEY = 'sa-brain'

// Default brain pré-rempli avec le contexte réel de Marwane
export const DEFAULT_BRAIN: Brain = {
  projects: [
    {
      id: 'axora',
      name: 'Axora',
      status: 'Lancé avril 2026 — building in public',
      pitch: "LA plus grande marketplace francophone pour acheter et vendre des entreprises. TOUS types : digitales, physiques, SaaS, e-commerce, services. Transmission d'entreprises moderne, transparente, avec annonces vérifiées.",
      audience: 'Entrepreneurs, repreneurs, vendeurs d\'entreprises (tous secteurs) en Belgique et France',
      key_messages: [
        'Axora couvre TOUS les types de business : SaaS, e-commerce, physique, services, digital',
        'Acheter une entreprise rentable est plus malin que de tout créer de zéro',
        'Le marché francophone de la transmission est opaque — Axora apporte la transparence',
        'Annonces vérifiées, chiffres réels, process clair',
        'Building in public : on montre chaque feature, chaque stat, chaque deal',
      ],
      tone: 'Building in public — cash, transparent, chiffres réels, hype autour des features shippées',
      cta: 'Découvre Axora / parcours les entreprises à vendre',
    },
    {
      id: 'pulsa',
      name: 'Pulsa Creatives',
      status: 'Agence active — clients en cours',
      pitch: "Agence de création de sites web à Bruxelles. On livre des sites web propres, rapides, qui convertissent. Clients PME, startups, entrepreneurs.",
      audience: 'PME, startups, entrepreneurs qui veulent un site web professionnel qui convertit',
      key_messages: [
        'Des sites web livrés rapidement, design premium',
        'Focus conversion : chaque page a un objectif business',
        'Cas clients concrets : avant/après, résultats chiffrés',
        'Équipe Bruxelles, francophone',
      ],
      tone: 'Professionnel, axé résultats. Montre des cas clients, des sites livrés, des avant/après.',
      cta: 'Book un call / découvre les projets récents',
    },
    {
      id: 'personal',
      name: 'Marwane',
      status: 'Always on',
      pitch: "Marwane Moustapha — entrepreneur à Bruxelles. Fondateur d\'Axora (marketplace d\'entreprises) et Pulsa Creatives (agence de sites web). Partage son parcours, ses projets, et les sites web qu\'il crée.",
      audience: 'Entrepreneurs, founders, repreneurs d\'entreprises francophones',
      key_messages: [
        'Je construis deux projets en parallèle : une marketplace et une agence',
        'Je montre tout : les sites web que je livre avec Pulsa, les features que je ship sur Axora',
        'Leçons d\'entrepreneur qui gère plusieurs business en même temps',
        'Bruxelles comme hub tech émergent pour entrepreneurs francophones',
      ],
      tone: 'Direct, cash, authentique, mélange FR/EN naturel, vulnérable sur les galères',
      cta: 'Follow / DM ouvert',
    },
  ],

  channels: [
    {
      id: '69d7fead031bfa423ce86cda',       // Twitter mrwn_one
      name: 'mrwn_one',
      service: 'twitter',
      purpose: 'Twitter personnel de Marwane — contenu perso + building in public Axora',
      projects: ['axora', 'personal'],
      voice: 'Punchy, max 280 chars, zéro emoji, hook fort ligne 1, mélange FR/EN',
    },
    {
      id: '69d7fe5a031bfa423ce86b5f',       // LinkedIn Marwane Moustapha
      name: 'Marwane Moustapha',
      service: 'linkedin',
      purpose: 'LinkedIn personnel de Marwane — son contenu perso, ses sites web Pulsa, ses updates Axora',
      projects: ['personal', 'pulsa', 'axora'],
      voice: 'Professionnel mais humain, 800-1500 chars, hook fort, format aéré, storytelling. Zéro emoji.',
    },
    {
      id: '69d7fe5a031bfa423ce86b5e',       // LinkedIn axora-app
      name: 'axora-app',
      service: 'linkedin',
      purpose: 'Page LinkedIn Axora — UNIQUEMENT la marketplace d\'achat/vente d\'entreprises',
      projects: ['axora'],
      voice: 'Ton de la plateforme : institutionnel mais transparent. Parle UNIQUEMENT de la marketplace, des fonctionnalités, des success stories d\'acquéreurs/vendeurs. JAMAIS de contenu Pulsa, JAMAIS de perso.',
    },
  ],

  axes: [
    {
      id: 'axora_building',
      name: 'Axora — Building in public',
      description: 'Partager la construction de la marketplace : features shipped, premiers utilisateurs, stats de la plateforme, retours clients. Objectif : créer du momentum autour de la marketplace d\'achat/vente d\'entreprises.',
      projects: ['axora'],
      channels: ['69d7fead031bfa423ce86cda', '69d7fe5a031bfa423ce86b5f', '69d7fe5a031bfa423ce86b5e'],
      frequency: '3-5x/semaine',
    },
    {
      id: 'pulsa_showcase',
      name: 'Pulsa — Showcase sites web',
      description: 'Mettre en avant les sites web livrés par Pulsa Creatives. Avant/après visuels, cas clients, process de création, résultats obtenus (conversion, traffic). Objectif : capter de nouveaux clients pour l\'agence.',
      projects: ['pulsa'],
      channels: ['69d7fe5a031bfa423ce86b5f'],
      frequency: '2-3x/semaine',
    },
    {
      id: 'marwane_personal',
      name: 'Marwane — Contenu personnel',
      description: 'Marwane partage son parcours d\'entrepreneur, les sites web qu\'il crée avec Pulsa, les features Axora qu\'il ship. Mélange de perso et de pro. Humain, direct.',
      projects: ['personal'],
      channels: ['69d7fead031bfa423ce86cda', '69d7fe5a031bfa423ce86b5f'],
      frequency: '2-3x/semaine',
    },
  ],

  trends: [
    {
      id: 'default-1',
      title: 'Claude Design (Anthropic)',
      description: 'Nouvelle capacité de Claude à générer du design/Canva. Parler de l\'impact sur les agences créatives et les founders.',
      addedAt: new Date().toISOString(),
    },
    {
      id: 'default-2',
      title: 'M&A tech en 2026',
      description: 'Hausse des rachats d\'entreprises digitales. Le marché de l\'acquisition se démocratise (contexte pour Axora).',
      addedAt: new Date().toISOString(),
    },
  ],

  cadence: [
    {
      channelId: '69d7fe5a031bfa423ce86b5e',   // axora-app LinkedIn
      postsPerDay: 3,
      times: ['09:00', '13:00', '18:00'],
      angleRotation: ['build_in_public', 'insight_actualite', 'engagement_question'],
    },
    {
      channelId: '69d7fe5a031bfa423ce86b5f',   // Marwane LinkedIn perso
      postsPerDay: 3,
      times: ['08:30', '12:30', '17:30'],
      angleRotation: ['build_in_public_mix', 'personal_story', 'engagement_question'],
      projectMix: ['axora', 'pulsa', 'axora'], // rotation jour par jour : 2 posts Axora + 1 Pulsa
    },
    {
      channelId: '69d7fead031bfa423ce86cda',   // mrwn_one Twitter
      postsPerDay: 3,
      times: ['10:00', '14:00', '19:00'],
      angleRotation: ['hot_take', 'build_in_public', 'engagement_question'],
      projectMix: ['axora', 'pulsa', 'axora'],
    },
  ],

  lastUpdated: new Date().toISOString(),
}

/* === Storage === */
export function getBrain(): Brain {
  if (typeof window === 'undefined') return DEFAULT_BRAIN
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      // Auto-migrate : fill missing fields with defaults (for old saved brains)
      return {
        projects: saved.projects || DEFAULT_BRAIN.projects,
        channels: saved.channels || DEFAULT_BRAIN.channels,
        axes: saved.axes || DEFAULT_BRAIN.axes,
        trends: saved.trends || DEFAULT_BRAIN.trends,
        cadence: saved.cadence || DEFAULT_BRAIN.cadence,
        lastUpdated: saved.lastUpdated || DEFAULT_BRAIN.lastUpdated,
      }
    }
  } catch {}
  return DEFAULT_BRAIN
}

export function saveBrain(brain: Brain) {
  brain.lastUpdated = new Date().toISOString()
  localStorage.setItem(KEY, JSON.stringify(brain))
}

export function resetBrain(): Brain {
  localStorage.setItem(KEY, JSON.stringify(DEFAULT_BRAIN))
  return DEFAULT_BRAIN
}

/* === Helpers for routing === */
export function getChannelsForProject(brain: Brain, projectId: string): Channel[] {
  return brain.channels.filter(c => c.projects.includes(projectId))
}

export function getChannelsForAxis(brain: Brain, axisId: string): Channel[] {
  const axis = brain.axes.find(a => a.id === axisId)
  if (!axis) return []
  return brain.channels.filter(c => axis.channels.includes(c.id))
}

export function findProjectByKeyword(brain: Brain, text: string): Project | null {
  const lower = text.toLowerCase()
  for (const p of brain.projects) {
    if (lower.includes(p.id) || lower.includes(p.name.toLowerCase())) return p
  }
  return null
}

/* === Prompt injection === */
export function brainAsPromptBlock(brain: Brain): string {
  const projectsStr = brain.projects.map(p =>
    `  • ${p.name} (${p.id}) — ${p.status}\n    Pitch: ${p.pitch}\n    Audience: ${p.audience}\n    Ton: ${p.tone}`
  ).join('\n\n')

  const channelsStr = brain.channels.map(c =>
    `  • ${c.name} [${c.service}] (id: ${c.id}) — ${c.purpose}\n    Projets autorisés: ${c.projects.join(', ')}\n    Voix: ${c.voice}`
  ).join('\n\n')

  const axesStr = brain.axes.map(a =>
    `  • ${a.name} — ${a.description}\n    Fréquence: ${a.frequency}\n    Channels: ${a.channels.join(', ')}`
  ).join('\n\n')

  const trendsStr = (brain.trends || []).length > 0
    ? brain.trends.map(t => `  • ${t.title} — ${t.description}`).join('\n')
    : '  (aucune tendance configurée — à remplir dans /strategy)'

  const cadenceStr = (brain.cadence || []).map(c => {
    const channel = brain.channels.find(ch => ch.id === c.channelId)
    const name = channel?.name || c.channelId
    return `  • ${name} : ${c.postsPerDay} posts/jour à ${c.times.join(', ')} — angles : ${c.angleRotation.join(' > ')}${c.projectMix ? ` — rotation projets : ${c.projectMix.join(', ')}` : ''}`
  }).join('\n')

  return `═══ BRAIN — STRATÉGIE DE MARWANE ═══

## Projets actifs
${projectsStr}

## Channels (Buffer)
${channelsStr}

## Axes de contenu
${axesStr}

## Tendances actuelles à surfer (intègre-les dans les posts quand pertinent)
${trendsStr}

## Règles de cadence (3 posts/jour/compte par défaut)
${cadenceStr}

## Règles de routing (CRITIQUE)
- JAMAIS Pulsa sur axora-app (channel dédié à Axora uniquement)
- Sur Twitter (mrwn_one) : alterner Axora + Pulsa + perso (pas de Pulsa interdit)
- Sur Marwane LinkedIn perso : mix Axora + Pulsa (ratio typique 2 Axora pour 1 Pulsa, configurable)
- Axora peut aller sur les 3 channels

## Angle de chaque post
- "build_in_public" : feature shipped, chiffre, coulisse de construction
- "insight_actualite" : tendance tech intégrée à ton expérience (ex: Claude Design, GPT-5.5)
- "engagement_question" : question ouverte qui génère des commentaires
- "hot_take" : opinion tranchée qui fait réagir
- "personal_story" : anecdote perso qui résonne pro`
}
