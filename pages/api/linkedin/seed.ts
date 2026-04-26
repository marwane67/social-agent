import type { NextApiRequest, NextApiResponse } from 'next'
import { sbAdmin } from '../../../lib/supabase'
import { PULSA_SEED_ACCOUNTS } from '../../../lib/pulsa-templates'

/**
 * POST /api/linkedin/seed
 * Body: { project: 'pulsa' | 'axora', force?: boolean }
 *
 * Insère les comptes pré-séléctionnés (concurrents, influenceurs, écosystème,
 * secteurs) pour un projet donné. Skip ceux déjà présents (par URL).
 *
 * Avec force=true, ajoute même si l'URL existe déjà.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { project = 'pulsa', force = false } = req.body || {}
  const sb = sbAdmin()

  let seeds = []
  if (project === 'pulsa') {
    seeds = PULSA_SEED_ACCOUNTS
  } else {
    return res.status(400).json({ error: `Pas de seed pour projet "${project}" (uniquement 'pulsa' pour l'instant)` })
  }

  // Récupérer les URLs existantes pour éviter les doublons
  const { data: existing } = await sb.from('tracked_accounts').select('url')
  const existingUrls = new Set((existing || []).map((a: any) => normalizeUrl(a.url)))

  const toInsert = seeds
    .filter(s => force || !existingUrls.has(normalizeUrl(s.url)))
    .map(s => ({
      url: s.url,
      kind: s.kind,
      label: s.label,
      notes: s.notes,
      project,
      active: true,
    }))

  if (!toInsert.length) {
    return res.status(200).json({
      inserted: 0,
      skipped: seeds.length,
      note: 'Tous les comptes étaient déjà présents (utilise force:true pour réimporter)',
    })
  }

  const { data, error } = await sb.from('tracked_accounts').insert(toInsert).select()
  if (error) return res.status(500).json({ error: error.message })

  res.status(200).json({
    inserted: data?.length || 0,
    skipped: seeds.length - toInsert.length,
    accounts: data,
  })
}

function normalizeUrl(url: string): string {
  return url.toLowerCase().replace(/\/$/, '').replace(/^https?:\/\/(www\.)?/, '')
}
