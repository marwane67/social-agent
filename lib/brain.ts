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

export type Brain = {
  projects: Project[]
  channels: Channel[]
  axes: Axis[]
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
      pitch: "Marketplace pour acheter et vendre des entreprises. Francophone (BE/FR). Pour entrepreneurs qui veulent reprendre un business existant ou revendre le leur.",
      audience: 'Entrepreneurs, repreneurs, vendeurs d\'entreprises en Belgique et France',
      key_messages: [
        'Acheter une entreprise est plus simple que de la créer — Axora le prouve',
        'Le marché de la transmission d\'entreprises francophone est opaque — Axora apporte la transparence',
        'Chaque annonce est vérifiée, les chiffres sont réels',
        'Building in public : on montre la construction de la plateforme',
      ],
      tone: 'Building in public — cash, transparent, chiffres réels, storytelling de construction de la plateforme',
      cta: 'Découvre Axora / rejoins la plateforme',
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

  lastUpdated: new Date().toISOString(),
}

/* === Storage === */
export function getBrain(): Brain {
  if (typeof window === 'undefined') return DEFAULT_BRAIN
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
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

  return `═══ BRAIN — STRATÉGIE DE MARWANE ═══

## Projets actifs
${projectsStr}

## Channels (Buffer)
${channelsStr}

## Axes de contenu
${axesStr}

## Règles de routing (CRITIQUE)
- Quand tu planifies ou envoies un post, choisis le(s) bon(s) channel(s) selon le projet/axe
- JAMAIS Pulsa sur axora-app (channel dédié à Axora uniquement)
- JAMAIS Pulsa sur Twitter personnel (mrwn_one = Axora + perso uniquement)
- Axora peut aller sur les 3 channels
- Personal/thought leadership sur Twitter + LinkedIn Marwane (pas axora-app)`
}
