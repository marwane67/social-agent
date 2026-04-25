import type { NextApiRequest, NextApiResponse } from 'next'
import { sbAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sb = sbAdmin()

  if (req.method === 'GET') {
    const status = (req.query.status as string) || ''
    const minScore = parseInt((req.query.minScore as string) || '0', 10)
    const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 500)

    let q = sb
      .from('linkedin_signals')
      .select('*')
      .order('icp_score', { ascending: false })
      .order('detected_at', { ascending: false })
      .limit(limit)

    if (status) q = q.eq('status', status)
    if (minScore > 0) q = q.gte('icp_score', minScore)

    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ signals: data || [] })
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const allowed = ['status', 'icp_score', 'icp_reason', 'engager_company', 'engager_headline']
    const patch: Record<string, any> = {}
    for (const k of allowed) if (k in updates) patch[k] = updates[k]
    const { data, error } = await sb
      .from('linkedin_signals')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ signal: data })
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const { error } = await sb.from('linkedin_signals').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
