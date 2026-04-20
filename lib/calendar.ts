// Stockage du calendrier de contenu (localStorage)
// Chaque entrée = un post planifié avec date/heure + texte + statut

export type CalendarStatus = 'draft' | 'scheduled' | 'published' | 'idea'

export type CalendarEntry = {
  id: string
  network: 'twitter' | 'linkedin'
  format: string                    // ex: 'raw_build', 'storytelling_li'
  topic?: string                    // résumé court du sujet
  text: string                      // contenu complet du post
  scheduledAt: string              // ISO datetime
  status: CalendarStatus
  imageUrl?: string                 // si une image est attachée
  notes?: string                    // notes perso
  hookId?: number
  framework?: string
  createdAt: string
  updatedAt: string
}

const KEY = 'sa-calendar'

export function getEntries(): CalendarEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveEntry(entry: Omit<CalendarEntry, 'id' | 'createdAt' | 'updatedAt'>): CalendarEntry {
  const now = new Date().toISOString()
  const newEntry: CalendarEntry = {
    ...entry,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    createdAt: now,
    updatedAt: now,
  }
  const all = getEntries()
  all.push(newEntry)
  // sort by scheduledAt asc
  all.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  localStorage.setItem(KEY, JSON.stringify(all))
  return newEntry
}

export function saveBatch(entries: Omit<CalendarEntry, 'id' | 'createdAt' | 'updatedAt'>[]): CalendarEntry[] {
  const created: CalendarEntry[] = []
  for (const e of entries) {
    created.push(saveEntry(e))
  }
  return created
}

export function updateEntry(id: string, updates: Partial<CalendarEntry>) {
  const all = getEntries()
  const idx = all.findIndex(e => e.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() }
  all.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function deleteEntry(id: string) {
  const all = getEntries().filter(e => e.id !== id)
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function getEntriesForDay(date: Date): CalendarEntry[] {
  const day = date.toISOString().split('T')[0]
  return getEntries().filter(e => e.scheduledAt.split('T')[0] === day)
}

export function getEntriesInRange(from: Date, to: Date): CalendarEntry[] {
  const fromMs = from.getTime()
  const toMs = to.getTime()
  return getEntries().filter(e => {
    const t = new Date(e.scheduledAt).getTime()
    return t >= fromMs && t <= toMs
  })
}

export function getUpcoming(days = 14): CalendarEntry[] {
  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)
  return getEntriesInRange(now, future)
}
