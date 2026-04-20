// Système de tracking de performance : enregistre les vrais résultats des posts
// pour apprendre ce qui marche pour Marwane.

export type PostPerformance = {
  id: string
  text: string
  network: 'twitter' | 'linkedin'
  format: string                // ex: 'raw_build', 'storytelling_li'
  hookId?: number               // si un hook spécifique a été utilisé
  framework?: string            // si un framework a été utilisé
  postedAt: string
  // Métriques
  impressions: number
  likes: number
  replies: number
  reposts: number
  saves?: number                // LinkedIn surtout
  clicks?: number
  followers_gained?: number
  // Tags qualitatifs
  tags?: string[]               // ex: ["vendredi", "10h", "annonce produit"]
  notes?: string
}

const KEY = 'post-performance'

export function getPerformances(): PostPerformance[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function savePerformance(p: Omit<PostPerformance, 'id'>): PostPerformance {
  const newP: PostPerformance = { ...p, id: Date.now().toString() }
  const all = getPerformances()
  all.unshift(newP)
  localStorage.setItem(KEY, JSON.stringify(all))
  return newP
}

export function updatePerformance(id: string, updates: Partial<PostPerformance>) {
  const all = getPerformances()
  const idx = all.findIndex(p => p.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], ...updates }
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function deletePerformance(id: string) {
  const all = getPerformances().filter(p => p.id !== id)
  localStorage.setItem(KEY, JSON.stringify(all))
}

// Calcule un "score de viralité" simple (engagement rate × volume)
export function viralityScore(p: PostPerformance): number {
  if (!p.impressions) return 0
  const engagement = p.likes + p.replies * 3 + p.reposts * 5 + (p.saves || 0) * 2
  const rate = (engagement / p.impressions) * 100  // % d'engagement
  // On pondère par log(impressions) pour valoriser le volume
  return Math.round(rate * Math.log10(Math.max(10, p.impressions)) * 10) / 10
}

// Stats agrégées par dimension
export type Insights = {
  totalPosts: number
  avgImpressions: number
  avgEngagementRate: number
  topFormat: { format: string; score: number } | null
  topHook: { hookId: number; score: number } | null
  topFramework: { framework: string; score: number } | null
  topNetwork: 'twitter' | 'linkedin' | null
  bestPosts: PostPerformance[]
  trend: 'up' | 'down' | 'stable'
}

export function computeInsights(performances: PostPerformance[]): Insights {
  if (performances.length === 0) {
    return {
      totalPosts: 0, avgImpressions: 0, avgEngagementRate: 0,
      topFormat: null, topHook: null, topFramework: null, topNetwork: null,
      bestPosts: [], trend: 'stable',
    }
  }

  const totalImpr = performances.reduce((s, p) => s + p.impressions, 0)
  const totalEng = performances.reduce((s, p) => s + p.likes + p.replies + p.reposts, 0)

  // Best format
  const byFormat: Record<string, number[]> = {}
  performances.forEach(p => {
    if (!byFormat[p.format]) byFormat[p.format] = []
    byFormat[p.format].push(viralityScore(p))
  })
  const topFormat = Object.entries(byFormat)
    .map(([format, scores]) => ({ format, score: (scores as number[]).reduce((a: number, b: number) => a + b, 0) / scores.length }))
    .sort((a, b) => b.score - a.score)[0] || null

  // Best hook
  const byHook: Record<number, number[]> = {}
  performances.forEach(p => {
    if (p.hookId) {
      if (!byHook[p.hookId]) byHook[p.hookId] = []
      byHook[p.hookId].push(viralityScore(p))
    }
  })
  const topHook = Object.entries(byHook)
    .map(([hookId, scores]) => ({ hookId: Number(hookId), score: (scores as number[]).reduce((a: number, b: number) => a + b, 0) / scores.length }))
    .sort((a, b) => b.score - a.score)[0] || null

  // Best framework
  const byFw: Record<string, number[]> = {}
  performances.forEach(p => {
    if (p.framework) {
      if (!byFw[p.framework]) byFw[p.framework] = []
      byFw[p.framework].push(viralityScore(p))
    }
  })
  const topFramework = Object.entries(byFw)
    .map(([framework, scores]) => ({ framework, score: (scores as number[]).reduce((a: number, b: number) => a + b, 0) / scores.length }))
    .sort((a, b) => b.score - a.score)[0] || null

  // Best network
  const byNet: Record<string, number[]> = {}
  performances.forEach(p => {
    if (!byNet[p.network]) byNet[p.network] = []
    byNet[p.network].push(viralityScore(p))
  })
  const topNetwork = (Object.entries(byNet)
    .map(([net, scores]) => ({ net: net as 'twitter' | 'linkedin', score: (scores as number[]).reduce((a: number, b: number) => a + b, 0) / scores.length }))
    .sort((a, b) => b.score - a.score)[0]?.net) || null

  // Best posts (top 5 by virality)
  const bestPosts = [...performances].sort((a, b) => viralityScore(b) - viralityScore(a)).slice(0, 5)

  // Trend : compare 7 derniers vs 7 précédents
  const sorted = [...performances].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
  const last7 = sorted.slice(0, 7)
  const prev7 = sorted.slice(7, 14)
  const avgLast = last7.length ? last7.reduce((s, p) => s + viralityScore(p), 0) / last7.length : 0
  const avgPrev = prev7.length ? prev7.reduce((s, p) => s + viralityScore(p), 0) / prev7.length : 0
  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (avgLast > avgPrev * 1.15) trend = 'up'
  else if (avgLast < avgPrev * 0.85) trend = 'down'

  return {
    totalPosts: performances.length,
    avgImpressions: Math.round(totalImpr / performances.length),
    avgEngagementRate: totalImpr ? Math.round((totalEng / totalImpr) * 1000) / 10 : 0,
    topFormat, topHook, topFramework, topNetwork,
    bestPosts, trend,
  }
}

// Génère un bloc à injecter dans les prompts pour orienter la génération
// vers ce qui marche le mieux pour cet utilisateur.
export function insightsAsPromptBlock(insights: Insights): string {
  if (insights.totalPosts < 5) return ''  // pas assez de data
  let block = `\n\n═══ DATA PERFORMANCE — CE QUI MARCHE POUR MARWANE ═══\nBasé sur ${insights.totalPosts} posts trackés :\n`
  if (insights.topFormat) block += `- Meilleur format : ${insights.topFormat.format} (score moyen ${insights.topFormat.score.toFixed(1)})\n`
  if (insights.topHook) block += `- Meilleur hook : #${insights.topHook.hookId} (score moyen ${insights.topHook.score.toFixed(1)})\n`
  if (insights.topFramework) block += `- Meilleur framework : ${insights.topFramework.framework}\n`
  if (insights.topNetwork) block += `- Réseau le plus performant : ${insights.topNetwork}\n`
  block += `- Engagement moyen : ${insights.avgEngagementRate}%\n`
  if (insights.bestPosts.length > 0) {
    block += `\nExemples de TOP posts à imiter en style :\n`
    insights.bestPosts.slice(0, 3).forEach((p, i) => {
      block += `\n[TOP ${i + 1}] ${p.text.slice(0, 200)}${p.text.length > 200 ? '...' : ''}\n`
    })
  }
  block += `\nPriorise ce qui a déjà fonctionné. Reproduis l'énergie des TOP posts.`
  return block
}
