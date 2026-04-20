// Bibliothèque de 60 hooks viraux FR — source: @shift.hq
// Utilisée par l'agent pour ouvrir chaque post avec un hook qui scroll-stop.

export type HookCategory =
  | 'curiosite'      // crée du mystère / appel à découvrir
  | 'autorite'       // chiffres, résultats, preuves
  | 'controverse'    // opinions tranchées, mythes
  | 'empathie'       // "si tu galères avec...", connexion
  | 'storytelling'   // ouvre une histoire
  | 'urgence'        // arrête de / fais ça maintenant
  | 'question'       // question directe au lecteur

export type Hook = {
  id: number
  text: string
  category: HookCategory
  // Variables à remplir : ex. ["___"] = champ vide à compléter
  template: boolean
}

export const HOOKS: Hook[] = [
  // 1-15
  { id: 1, text: "Dis-moi si j'ai tort…", category: 'controverse', template: false },
  { id: 2, text: "Je viens de gagner ___€ avec ça", category: 'autorite', template: true },
  { id: 3, text: "Je ne m'attendais pas à ça", category: 'curiosite', template: false },
  { id: 4, text: "Mes 5 meilleurs conseils pour ___", category: 'autorite', template: true },
  { id: 5, text: "La vérité sur ___", category: 'controverse', template: true },
  { id: 6, text: "Si tu galères encore avec ___", category: 'empathie', template: true },
  { id: 7, text: "Regarde jusqu'à la fin", category: 'curiosite', template: false },
  { id: 8, text: "On voit ça partout en ce moment", category: 'curiosite', template: false },
  { id: 9, text: "Arrête de perdre du temps avec ___", category: 'urgence', template: true },
  { id: 10, text: "Comment j'ai réglé ça en 3 jours", category: 'autorite', template: false },
  { id: 11, text: "Arrête de scroller si tu veux ___", category: 'urgence', template: true },
  { id: 12, text: "Ça a cassé Internet", category: 'curiosite', template: false },
  { id: 13, text: "Sois honnête :", category: 'question', template: false },
  { id: 14, text: "Ça devrait être illégal de savoir ça", category: 'curiosite', template: false },
  { id: 15, text: "On t'a menti sur ___", category: 'controverse', template: true },

  // 16-30
  { id: 16, text: "J'avais tort…", category: 'storytelling', template: false },
  { id: 17, text: "Comment t'améliorer instantanément…", category: 'autorite', template: false },
  { id: 18, text: "Voilà pourquoi tu ne progresses pas…", category: 'controverse', template: false },
  { id: 19, text: "Ne passe pas à côté", category: 'urgence', template: false },
  { id: 20, text: "Remplace ça par ça", category: 'autorite', template: false },
  { id: 21, text: "Si tu as déjà ressenti ça, écoute", category: 'empathie', template: false },
  { id: 22, text: "Tout le monde fait ça", category: 'controverse', template: false },
  { id: 23, text: "Je peux te dire un secret ?", category: 'curiosite', template: false },
  { id: 24, text: "Le secret dont personne ne parle…", category: 'curiosite', template: false },
  { id: 25, text: "Ça a doublé mes résultats", category: 'autorite', template: false },
  { id: 26, text: "Est-ce que tu fais cette erreur ?", category: 'question', template: false },
  { id: 27, text: "Ça a tout changé pour moi", category: 'storytelling', template: false },
  { id: 28, text: "Tu fais ça mal", category: 'controverse', template: false },
  { id: 29, text: "Voilà comment j'ai fait", category: 'autorite', template: false },
  { id: 30, text: "J'ai fini par céder…", category: 'storytelling', template: false },

  // 31-45
  { id: 31, text: "Là, ça devient fou", category: 'curiosite', template: false },
  { id: 32, text: "Fini ___, voilà comment", category: 'urgence', template: true },
  { id: 33, text: "Et si je te disais que…", category: 'curiosite', template: false },
  { id: 34, text: "Tout le monde se trompe sur…", category: 'controverse', template: false },
  { id: 35, text: "Ça m'a fait gagner des mois", category: 'autorite', template: false },
  { id: 36, text: "Si tu détestes ce problème…", category: 'empathie', template: false },
  { id: 37, text: "Ça va te choquer", category: 'curiosite', template: false },
  { id: 38, text: "Ma plus grosse erreur a été…", category: 'storytelling', template: false },
  { id: 39, text: "Prends mon ___", category: 'autorite', template: true },
  { id: 40, text: "C'est un piège", category: 'controverse', template: false },
  { id: 41, text: "J'aurais aimé savoir ça plus tôt", category: 'storytelling', template: false },
  { id: 42, text: "Lève la main si…", category: 'question', template: false },
  { id: 43, text: "Là, ça devient abusé", category: 'curiosite', template: false },
  { id: 44, text: "Voilà la vraie solution", category: 'autorite', template: false },
  { id: 45, text: "J'ai un secret", category: 'curiosite', template: false },

  // 46-60
  { id: 46, text: "Cette erreur te coûte cher…", category: 'urgence', template: false },
  { id: 47, text: "De fauché à ___", category: 'storytelling', template: true },
  { id: 48, text: "Si c'est toi…", category: 'empathie', template: false },
  { id: 49, text: "On règle ça une bonne fois pour toutes", category: 'urgence', template: false },
  { id: 50, text: "C'est là que ça devient intéressant", category: 'curiosite', template: false },
  { id: 51, text: "Si tu fais encore ça, arrête maintenant", category: 'urgence', template: false },
  { id: 52, text: "Ça a marché instantanément", category: 'autorite', template: false },
  { id: 53, text: "Le jour où tout a changé…", category: 'storytelling', template: false },
  { id: 54, text: "Voilà ce qu'ils ne veulent pas que tu saches…", category: 'controverse', template: false },
  { id: 55, text: "Arrête de faire cette erreur", category: 'urgence', template: false },
  { id: 56, text: "J'ai testé ça pendant 30 jours", category: 'autorite', template: false },
  { id: 57, text: "Si tu fais ça, arrête", category: 'urgence', template: false },
  { id: 58, text: "Je garde ça secret depuis longtemps…", category: 'curiosite', template: false },
  { id: 59, text: "7 façons de ___", category: 'autorite', template: true },
  { id: 60, text: "Je regrette d'avoir fait ça", category: 'storytelling', template: false },
]

export const CATEGORIES: Record<HookCategory, { label: string; desc: string; color: string }> = {
  curiosite:    { label: 'Curiosité',    desc: 'Crée du mystère, donne envie de cliquer',     color: '#fbbf24' },
  autorite:     { label: 'Autorité',     desc: 'Chiffres, résultats, preuve sociale',          color: '#34d399' },
  controverse:  { label: 'Controverse',  desc: 'Opinion tranchée, mythe à détruire',           color: '#f87171' },
  empathie:     { label: 'Empathie',     desc: 'Connexion, "si tu galères avec…"',             color: '#c084fc' },
  storytelling: { label: 'Storytelling', desc: 'Ouvre une histoire perso',                     color: '#60a5fa' },
  urgence:      { label: 'Urgence',      desc: 'Arrête de / fais ça maintenant',               color: '#fb923c' },
  question:     { label: 'Question',     desc: 'Question directe qui force la réponse',        color: '#f9a8d4' },
}

// Renvoie un échantillon de hooks aléatoires (pour injecter dans les prompts)
export function sampleHooks(n = 8): Hook[] {
  const shuffled = [...HOOKS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// Renvoie n hooks d'une catégorie spécifique
export function sampleByCategory(cat: HookCategory, n = 5): Hook[] {
  const filtered = HOOKS.filter(h => h.category === cat)
  const shuffled = [...filtered].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// Format pour injection dans un prompt système
export function hooksAsPromptBlock(hooks: Hook[]): string {
  return hooks.map(h => `- "${h.text}"`).join('\n')
}
