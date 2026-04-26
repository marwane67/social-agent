// Templates DM Pulsa Creatives — agence de sites web Bruxelles.
// Chaque template = un angle d'approche basé sur un signal détecté.
// Utilisé par /pages/outbound-pulsa.tsx pour pré-remplir /outreach.

export type PulsaTemplate = {
  id: string
  label: string                    // titre affiché
  desc: string                     // 1 ligne d'explication
  signal: string                   // signal qui déclenche cet angle
  goal: string                     // objectif pré-rempli dans /outreach
  messageType: 'connect' | 'first_dm' | 'follow_up' | 'pitch' | 'collab' | 'thank'
  emoji: string
}

export const PULSA_TEMPLATES: PulsaTemplate[] = [
  {
    id: 'new_role',
    label: 'Nouveau CEO/CMO',
    desc: 'Vient d\'être nommé → vendor evaluation 30-60j',
    signal: 'Changement de poste détecté (nouveau CEO, CMO, founder)',
    goal:
      "Cette personne vient d'être nommée à un poste de décision. Les 30-60 premiers jours sont la fenêtre où elle réévalue tous les vendors, dont l'agence web. Mentionner sa prise de poste, donner UN insight précis sur leur site actuel (ex: temps de chargement, CTA absent, mobile), proposer un audit gratuit 15 min. Pas vendre dans le 1er message.",
    messageType: 'first_dm',
    emoji: '👔',
  },
  {
    id: 'fundraise',
    label: 'Levée de fonds récente',
    desc: 'Cash frais → réinvestissent en branding/site',
    signal: 'Levée de fonds annoncée (seed, série A, etc.)',
    goal:
      "Cette personne / boîte vient de lever des fonds. Elle va réinvestir une partie en image de marque et site web pour soutenir la croissance. Féliciter brièvement (1 phrase MAX, sinon générique), mentionner UN axe de croissance que leur site actuel ne supporte pas (scaling SEO, multilingue, conversion produit, etc.), proposer un échange court.",
    messageType: 'first_dm',
    emoji: '💰',
  },
  {
    id: 'launch',
    label: 'Lancement produit/service',
    desc: 'Nouveau produit = besoin de landing page conversion',
    signal: 'Annonce de lancement produit, nouveau service, expansion',
    goal:
      "Cette personne lance un nouveau produit/service. Une landing page dédiée multiplie les conversions par 3-5x vs page générique. Mentionner le lancement spécifique, donner 1 exemple concret de landing page haute conversion (idéalement un cas Pulsa ou un benchmark connu), proposer une landing page rapide 2-3 semaines.",
    messageType: 'first_dm',
    emoji: '🚀',
  },
  {
    id: 'old_site',
    label: 'Refonte / site obsolète',
    desc: 'Site visiblement vieux, lent, ou pas mobile',
    signal: 'Site web actuel : design daté, lent, pas responsive, faible conversion',
    goal:
      "Le site actuel de cette personne est visiblement obsolète (design vieux, lent, mauvaise UX mobile, pas de CTA clair). Donner UN insight précis et chiffrable (ex: 'Votre formulaire en pied de page est invisible sur mobile, c'est ~80% du trafic perdu'). Pas de jugement sur le site existant, juste un fait + une solution. Proposer un audit gratuit ou un échange.",
    messageType: 'first_dm',
    emoji: '🔧',
  },
  {
    id: 'hiring',
    label: 'Recrutement actif',
    desc: 'Croissance = besoin de page carrière + branding',
    signal: 'L\'entreprise recrute activement (plusieurs postes ouverts)',
    goal:
      "Cette boîte recrute beaucoup en ce moment. Une page carrière convertit 2-4x mieux que LinkedIn pour attirer les top talents. Mentionner les recrutements visibles, proposer une refonte rapide de leur page carrière OU un mini-site employer branding. Bullshit-free, juste pratique.",
    messageType: 'first_dm',
    emoji: '📈',
  },
  {
    id: 'follow_post',
    label: 'A engagé un post pertinent',
    desc: 'Like/commentaire sur un post web/marketing',
    signal: 'A liké ou commenté un post sur le web design / marketing / conversion',
    goal:
      "Cette personne a engagé avec un post sur un sujet où Pulsa peut aider (web, conversion, branding, marketing). Référencer le post exact (ce qu'elle a aimé / commenté), rebondir avec UN angle de valeur lié au sujet du post, suggérer une discussion. Pas de pitch direct.",
    messageType: 'first_dm',
    emoji: '💬',
  },
]

// Comptes pré-séléctionnés pour Pulsa (à seeder dans tracked_accounts)
// L'utilisateur pourra ajuster les URLs après seed.
export type PulsaSeedAccount = {
  url: string
  kind: 'competitor' | 'influencer' | 'company' | 'ecosystem' | 'sector'
  label: string
  notes: string
}

export const PULSA_SEED_ACCOUNTS: PulsaSeedAccount[] = [
  // === ÉCOSYSTÈME BELGIQUE — pools de founders en lancement ===
  { url: 'https://www.linkedin.com/company/startup-be/', kind: 'ecosystem', label: 'Startup.be', notes: 'Pool founders BE — engagers = startups en lancement' },
  { url: 'https://www.linkedin.com/company/be-angels/', kind: 'ecosystem', label: 'BeAngels', notes: 'Réseau business angels BE — boîtes financées' },
  { url: 'https://www.linkedin.com/company/co-station/', kind: 'ecosystem', label: 'Co.Station', notes: 'Coworking / accélérateur Bruxelles' },
  { url: 'https://www.linkedin.com/company/the-egg-brussels/', kind: 'ecosystem', label: 'The Egg Brussels', notes: 'Hub startups BXL' },
  { url: 'https://www.linkedin.com/company/wallifornia/', kind: 'ecosystem', label: 'Wallifornia', notes: 'Tech wallon' },
  { url: 'https://www.linkedin.com/company/la-french-tech/', kind: 'ecosystem', label: 'La French Tech', notes: 'Pool founders FR' },

  // === CONCURRENTS — agences web BE/FR (leurs engagers = founders qui cherchent agence) ===
  { url: 'https://www.linkedin.com/company/emakina/', kind: 'competitor', label: 'Emakina (BE)', notes: 'Agence digitale Bruxelles' },
  { url: 'https://www.linkedin.com/company/eskimoz/', kind: 'competitor', label: 'Eskimoz (FR)', notes: 'Agence SEO Paris' },
  { url: 'https://www.linkedin.com/company/junto/', kind: 'competitor', label: 'Junto (FR)', notes: 'Agence growth Paris' },

  // === INFLUENCEURS — leaders d'opinion FR/BE web/marketing ===
  { url: 'https://www.linkedin.com/in/stanleloup/', kind: 'influencer', label: 'Stan Leloup', notes: 'Marketing Mania — gros pool marketers FR' },
  { url: 'https://www.linkedin.com/in/romainpittet/', kind: 'influencer', label: 'Romain Pittet', notes: 'Web/SaaS FR' },
  { url: 'https://www.linkedin.com/in/cedricdonck/', kind: 'influencer', label: 'Cédric Donck', notes: 'Virtuology — startups BE' },

  // === SECTEURS — pages où les engagers ont besoin de site ===
  { url: 'https://www.linkedin.com/showcase/restaurants-belgique/', kind: 'sector', label: 'Restaurants Belgique', notes: 'Restaurants ont besoin booking + menu en ligne' },
]
