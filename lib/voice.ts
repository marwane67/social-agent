// Système de Voice Cloning : analyse les meilleurs posts de l'utilisateur
// pour extraire son style et l'injecter dans toutes les générations.

export type VoiceSample = {
  id: string
  text: string
  network: 'twitter' | 'linkedin'
  performance?: 'low' | 'medium' | 'high' | 'viral'  // si l'utilisateur le tag
  addedAt: string
}

export type VoiceProfile = {
  // Style extrait par analyse IA des samples
  toneOfVoice: string           // ex: "direct, vulnérable, mélange FR/EN"
  averageLength: number          // chars moyens
  sentenceStyle: string          // ex: "phrases courtes, beaucoup de retours à la ligne"
  vocabularyTics: string[]       // mots/expressions récurrents
  topicsRecurring: string[]      // thèmes qui reviennent
  emojiUsage: string             // ex: "0-1 emoji par post, jamais en début"
  hookStyle: string              // type de hooks utilisés
  punctuationHabits: string      // ex: "points en fin de phrase courte, trois points pour suspense"
  signature: string              // la "marque" du style en 1 phrase
  lastAnalyzed: string
}

// localStorage keys
const SAMPLES_KEY = 'voice-samples'
const PROFILE_KEY = 'voice-profile'

export function getSamples(): VoiceSample[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(SAMPLES_KEY) || '[]') } catch { return [] }
}

export function saveSample(sample: Omit<VoiceSample, 'id' | 'addedAt'>): VoiceSample {
  const newSample: VoiceSample = {
    ...sample,
    id: Date.now().toString(),
    addedAt: new Date().toISOString(),
  }
  const all = getSamples()
  all.unshift(newSample)
  localStorage.setItem(SAMPLES_KEY, JSON.stringify(all))
  return newSample
}

export function deleteSample(id: string) {
  const all = getSamples().filter(s => s.id !== id)
  localStorage.setItem(SAMPLES_KEY, JSON.stringify(all))
}

export function getProfile(): VoiceProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveProfile(profile: VoiceProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY)
}

// Génère le bloc à injecter dans le system prompt
export function profileAsPromptBlock(profile: VoiceProfile): string {
  return `═══ STYLE ISMAA — VOICE PROFILE ═══
Tu DOIS imiter le style exact d'Ismaa, extrait de ses meilleurs posts :

- TON : ${profile.toneOfVoice}
- LONGUEUR MOYENNE : ${profile.averageLength} caractères par post
- STRUCTURE DE PHRASE : ${profile.sentenceStyle}
- TICS DE VOCABULAIRE (à réutiliser naturellement) : ${profile.vocabularyTics.join(', ')}
- THÈMES RÉCURRENTS : ${profile.topicsRecurring.join(', ')}
- EMOJIS : ${profile.emojiUsage}
- HOOKS PRÉFÉRÉS : ${profile.hookStyle}
- PONCTUATION : ${profile.punctuationHabits}
- SIGNATURE : ${profile.signature}

Règle absolue : le post doit ressembler à du Ismaa pur. Si quelqu'un qui le connaît lit le post, il doit dire "c'est lui qui l'a écrit". Pas de tournures IA. Pas de phrases trop polished.`
}
