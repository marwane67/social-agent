import type { NextApiRequest, NextApiResponse } from 'next'
import { sbAdmin } from '../../../lib/supabase'

export const config = { maxDuration: 60 }

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

type RawEngager = {
  name?: string
  headline?: string
  company?: string
  url?: string
  comment?: string
  signal_type?: string
}

type Scored = RawEngager & {
  icp_score: number
  icp_reason: string
}

/**
 * POST body :
 *   {
 *     mode: 'paste' | 'phantombuster',
 *     // mode=paste :
 *     raw: "texte ou JSON brut (export Sales Navigator, screenshot OCR, JSON, CSV...)",
 *     // mode=phantombuster :
 *     containerId: "...",
 *     // commun :
 *     source_url: "https://www.linkedin.com/posts/...",
 *     source_account: "@hubspot",
 *     source_excerpt: "premier paragraphe du post",
 *     signal_type: "like" | "comment" | "share",
 *     tracked_account_id?: uuid,
 *     icp: "1-2 phrases qui décrivent ton ICP (override le brain par défaut)",
 *   }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const {
    mode = 'paste',
    raw = '',
    containerId,
    source_url = '',
    source_account = '',
    source_excerpt = '',
    signal_type = 'like',
    tracked_account_id,
    icp,
  } = req.body || {}

  // 1. Récupérer la liste brute des engagers
  let engagers: RawEngager[] = []
  try {
    if (mode === 'phantombuster') {
      engagers = await fetchPhantomBuster(containerId)
    } else {
      engagers = await parsePastedRaw(raw, signal_type)
    }
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Parse failed' })
  }

  if (!engagers.length) {
    return res.status(200).json({ imported: 0, signals: [], note: 'Aucun engager détecté' })
  }

  // 2. Scorer chaque engager contre l'ICP via Claude
  const scored = await scoreEngagers(engagers, icp || DEFAULT_ICP)

  // 3. Insérer dans Supabase (deduplication par engager_url + source_url)
  const sb = sbAdmin()
  const rows = scored.map(e => ({
    engager_name: e.name || '',
    engager_headline: e.headline || '',
    engager_company: e.company || '',
    engager_url: e.url || null,
    source_url: source_url || null,
    source_account: source_account || '',
    source_excerpt: source_excerpt || '',
    signal_type: e.signal_type || signal_type,
    comment_text: e.comment || '',
    icp_score: e.icp_score,
    icp_reason: e.icp_reason,
    status: e.icp_score >= 60 ? 'qualified' : 'new',
    tracked_account_id: tracked_account_id || null,
  }))

  // Soft dedup : on évite les doublons (même engager_url + même source_url)
  const filtered: typeof rows = []
  for (const r of rows) {
    if (r.engager_url && r.source_url) {
      const { data: dup } = await sb
        .from('linkedin_signals')
        .select('id')
        .eq('engager_url', r.engager_url)
        .eq('source_url', r.source_url)
        .maybeSingle()
      if (dup) continue
    }
    filtered.push(r)
  }

  if (!filtered.length) {
    return res.status(200).json({ imported: 0, signals: [], note: 'Tous déjà importés' })
  }

  const { data, error } = await sb.from('linkedin_signals').insert(filtered).select()
  if (error) return res.status(500).json({ error: error.message })

  // Toucher last_checked_at
  if (tracked_account_id) {
    await sb
      .from('tracked_accounts')
      .update({ last_checked_at: new Date().toISOString() })
      .eq('id', tracked_account_id)
  }

  res.status(200).json({ imported: data?.length || 0, signals: data, totalParsed: engagers.length })
}

// =============================================================
// Mode "paste" — utilise Claude pour extraire les engagers d'un
// dump texte brut (copier/coller depuis LinkedIn, export CSV, etc.)
// =============================================================
async function parsePastedRaw(raw: string, defaultType: string): Promise<RawEngager[]> {
  if (!raw || raw.trim().length < 5) return []

  // Si c'est du JSON valide, on essaie de le parser direct
  const trimmed = raw.trim()
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      const arr = Array.isArray(parsed) ? parsed : (parsed.results || parsed.engagers || parsed.data || [])
      if (Array.isArray(arr) && arr.length) {
        return arr.map((x: any) => ({
          name: x.name || x.fullName || x.firstName ? `${x.firstName || ''} ${x.lastName || ''}`.trim() : '',
          headline: x.headline || x.title || x.position || '',
          company: x.company || x.companyName || x.currentCompany || '',
          url: x.url || x.profileUrl || x.linkedinUrl || x.profile_url || '',
          comment: x.comment || x.commentText || '',
          signal_type: x.type || x.action || defaultType,
        })).filter(e => e.name || e.url)
      }
    } catch {}
  }

  // Sinon : Claude extrait depuis le texte brut
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Extrais TOUS les profils LinkedIn de ce dump texte (copier/coller depuis une liste d'engagers d'un post LinkedIn, export Sales Nav, ou similaire) :

---
${raw.slice(0, 12000)}
---

Pour chaque personne, extrais : nom, headline (titre/poste), entreprise, URL profil LinkedIn si présente, commentaire si c'est un commenter (sinon vide).

JSON strict uniquement :
{"engagers":[
  {"name":"Jean Dupont","headline":"CMO @ Acme","company":"Acme","url":"linkedin.com/in/jean-dupont","comment":""}
]}

- N'INVENTE rien : si une info manque, mets ""
- Si tu vois des commentaires, mets le texte du commentaire dans "comment"
- Ignore les lignes qui ne sont pas des profils (boutons, navigation, etc.)
- Type de signal par défaut : "${defaultType}"`
      }],
    }),
  })

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''
  const clean = text.replace(/```json|```/g, '').trim()
  try {
    const parsed = JSON.parse(clean)
    return (parsed.engagers || []).map((e: RawEngager) => ({ ...e, signal_type: e.signal_type || defaultType }))
  } catch {
    return []
  }
}

// =============================================================
// Mode "phantombuster" — récupère le résultat d'un agent
// PhantomBuster (LinkedIn Post Likers Export, Post Commenters...)
// Nécessite PHANTOMBUSTER_API_KEY dans l'env.
// =============================================================
async function fetchPhantomBuster(containerId: string): Promise<RawEngager[]> {
  const apiKey = process.env.PHANTOMBUSTER_API_KEY
  if (!apiKey) throw new Error('PHANTOMBUSTER_API_KEY manquante dans .env')
  if (!containerId) throw new Error('containerId requis')

  const r = await fetch(
    `https://api.phantombuster.com/api/v2/containers/fetch-result-object?id=${containerId}`,
    { headers: { 'X-Phantombuster-Key': apiKey } }
  )
  if (!r.ok) throw new Error(`PhantomBuster ${r.status}`)
  const json = await r.json()
  const result = typeof json.resultObject === 'string' ? JSON.parse(json.resultObject) : json.resultObject
  const arr = Array.isArray(result) ? result : (result?.results || result?.profiles || [])
  return arr.map((x: any) => ({
    name: x.name || x.fullName || `${x.firstName || ''} ${x.lastName || ''}`.trim(),
    headline: x.headline || x.title || x.jobTitle || '',
    company: x.company || x.companyName || '',
    url: x.profileUrl || x.url || '',
    comment: x.comment || x.commentText || '',
    signal_type: x.type || x.action || 'like',
  }))
}

// =============================================================
// Scoring ICP — Claude note 0-100 chaque engager
// =============================================================
const DEFAULT_ICP = `Mon ICP (Ideal Customer Profile) :

AXORA (marketplace acquisition d'entreprises) :
- Entrepreneurs, repreneurs, business owners en France/Belgique
- C-suite, founders, fonds d'investissement, M&A advisors
- Secteurs : SaaS, e-commerce, agence, retail, services
- Objectif : ils veulent acheter ou vendre une entreprise

PULSA CREATIVES (agence sites web Bruxelles) :
- Founders, CEOs, CMOs de PME/startups francophones
- Besoin d'un site web qui convertit (refonte, lancement)
- Budget 3k-30k€

RED FLAGS (pas mon ICP) :
- Étudiants, recruteurs, candidats en recherche d'emploi
- Multi-level marketing, dropshipping débutants
- Très grosses corp (>500 employés) sauf si décideur
- Géographie hors EU/francophone`

async function scoreEngagers(engagers: RawEngager[], icp: string): Promise<Scored[]> {
  if (!engagers.length) return []

  // Batch en chunks de 20 pour rester sous max_tokens
  const chunks: RawEngager[][] = []
  for (let i = 0; i < engagers.length; i += 20) chunks.push(engagers.slice(i, i + 20))

  const allScored: Scored[] = []
  for (const chunk of chunks) {
    const numbered = chunk.map((e, i) => `${i}: ${e.name || '?'} — ${e.headline || ''} ${e.company ? `(${e.company})` : ''}`).join('\n')

    try {
      const r = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4-6',
          max_tokens: 2500,
          messages: [{
            role: 'user',
            content: `${icp}

---
LEADS À SCORER (chaque ligne = 1 personne qui a engagé avec un post LinkedIn pertinent pour mon business) :
${numbered}

Pour chaque lead, donne :
- score (0-100) : à quel point cette personne matche mon ICP
  * 80-100 : match parfait (décideur exact, secteur exact)
  * 60-79 : bon match (proche, mérite outreach)
  * 40-59 : possible (à creuser)
  * 0-39 : pas pertinent (ignorer)
- reason (1 phrase) : pourquoi ce score

JSON strict :
{"scores":[
  {"i":0,"score":85,"reason":"Founder SaaS FR — cible parfaite Axora"},
  {"i":1,"score":15,"reason":"Étudiant — pas mon ICP"}
]}

JSON uniquement.`
          }],
        }),
      })
      const data = await r.json()
      const text = data.choices?.[0]?.message?.content || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      const scoreMap = new Map<number, { score: number; reason: string }>()
      for (const s of parsed.scores || []) {
        scoreMap.set(s.i, { score: Math.max(0, Math.min(100, s.score || 0)), reason: s.reason || '' })
      }
      chunk.forEach((e, idx) => {
        const s = scoreMap.get(idx)
        allScored.push({ ...e, icp_score: s?.score ?? 0, icp_reason: s?.reason ?? '' })
      })
    } catch {
      // En cas d'erreur, on insère quand même avec score 0 (l'utilisateur peut éditer)
      chunk.forEach(e => allScored.push({ ...e, icp_score: 0, icp_reason: 'Scoring échoué' }))
    }
  }

  return allScored
}
