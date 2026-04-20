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

// Default brain pré-rempli avec le contexte de Marwane (d'après ses projets)
export const DEFAULT_BRAIN: Brain = {
  projects: [
    {
      id: 'axora',
      name: 'Axora',
      status: 'Lancé avril 2026 — building in public',
      pitch: "Marketplace francophone d'acquisition de business digitaux (BE/FR). Équivalent d'Acquire.com avec IA, matching intelligent, escrow, due diligence automatisée.",
      audience: 'Entrepreneurs francophones (acheteurs + vendeurs de business digitaux)',
      key_messages: [
        'Le marché francophone de l\'acquisition de business digitaux est cassé (WhatsApp groups, pas de transparence)',
        "Axora = la transparence, les chiffres réels, l'IA pour matcher",
        "Axora c'est construit en public, personne ne cache rien",
        'Première plateforme locale qui tient tête à Acquire.com en FR',
      ],
      tone: 'Building in public — cash, transparent, chiffres réels, anecdotes de construction',
      cta: 'Rejoins la waitlist / checke la plateforme',
    },
    {
      id: 'pulsa',
      name: 'Pulsa Creatives',
      status: 'Agence active — clients en cours',
      pitch: "L'agence IA de Bruxelles. On livre en jours ce que les autres promettent en mois.",
      audience: 'PME, startups, entrepreneurs qui veulent automatiser/builder avec l\'IA vite',
      key_messages: [
        'Vitesse de livraison imbattable grâce à l\'IA',
        'Résultats concrets (sites, outils, automations)',
        'Équipe small + AI-first',
        'Brussels-based, francophone',
      ],
      tone: 'Professionnel mais cash. Montre les résultats (avant/après, chiffres, témoignages).',
      cta: 'Book une demo / DM moi',
    },
    {
      id: 'personal',
      name: 'Marwane personnel',
      status: 'Always on',
      pitch: "Marwane Moustapha — entrepreneur tech à Bruxelles. Build Axora + Pulsa. Reference IA francophone.",
      audience: 'Entrepreneurs, devs, founders francophones curieux d\'IA + business',
      key_messages: [
        'Je build en public, je montre tout',
        "L'IA n'est pas un outil, c'est un co-founder",
        'Francophone ≠ moins ambitieux que US',
        'Bruxelles comme hub tech émergent',
      ],
      tone: 'Direct, cash, mélange FR/EN tech, vulnérable quand il faut, confiant sans arrogance',
      cta: 'Follow pour plus / DM ouvert',
    },
  ],

  channels: [
    {
      id: '69d7fead031bfa423ce86cda',       // Twitter mrwn_one (from Buffer)
      name: 'mrwn_one',
      service: 'twitter',
      purpose: 'Twitter personnel de Marwane — building in public',
      projects: ['axora', 'personal'],       // Axora + perso (pas Pulsa sur X)
      voice: 'Punchy, max 280 chars, zéro emoji, hook fort ligne 1, mélange FR/EN',
    },
    {
      id: '69d7fe5a031bfa423ce86b5f',       // LinkedIn Marwane Moustapha
      name: 'Marwane Moustapha',
      service: 'linkedin',
      purpose: 'LinkedIn personnel de Marwane — multi-axes (Axora + Pulsa + perso)',
      projects: ['axora', 'pulsa', 'personal'],  // tout
      voice: 'Professionnel mais humain, 800-1500 chars, hook fort, format aéré, storytelling',
    },
    {
      id: '69d7fe5a031bfa423ce86b5e',       // LinkedIn axora-app
      name: 'axora-app',
      service: 'linkedin',
      purpose: 'Page LinkedIn Axora — building in public uniquement Axora',
      projects: ['axora'],                   // Axora uniquement
      voice: 'Ton plus institutionnel côté plateforme, mais toujours transparent. Jamais de personal/Pulsa ici.',
    },
  ],

  axes: [
    {
      id: 'axora_launch',
      name: 'Axora — Building in public',
      description: 'Partager le parcours post-lancement d\'Axora : premières users, features shipped, lessons learned, chiffres. Créer du momentum.',
      projects: ['axora'],
      channels: ['69d7fead031bfa423ce86cda', '69d7fe5a031bfa423ce86b5f', '69d7fe5a031bfa423ce86b5e'],
      frequency: '3-5x/semaine',
    },
    {
      id: 'pulsa_offer',
      name: 'Pulsa — Vente de l\'offre',
      description: 'Mettre en avant les livrables Pulsa (sites IA, outils, automations) pour capter des clients. Cas clients, avant/après, témoignages.',
      projects: ['pulsa'],
      channels: ['69d7fe5a031bfa423ce86b5f'],  // LinkedIn Marwane uniquement (pas de compte Pulsa)
      frequency: '2-3x/semaine',
    },
    {
      id: 'personal_thought_leadership',
      name: 'Marwane — Thought leadership IA',
      description: 'Positionner Marwane comme LA référence francophone IA + entrepreneuriat. Hot takes, frameworks, visions marché.',
      projects: ['personal'],
      channels: ['69d7fead031bfa423ce86cda', '69d7fe5a031bfa423ce86b5f'],
      frequency: '2-3x/semaine',
    },
    {
      id: 'cross_building_public',
      name: 'Transversal — Building in public',
      description: 'Storytelling personnel de la double vie Axora + Pulsa. Comment Marwane gère les deux. Les galères, les wins, les décisions.',
      projects: ['axora', 'pulsa', 'personal'],
      channels: ['69d7fead031bfa423ce86cda', '69d7fe5a031bfa423ce86b5f'],
      frequency: '1-2x/semaine',
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
