import type { NextApiRequest, NextApiResponse } from 'next'
import { sbAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sb = sbAdmin()

  if (req.method === 'GET') {
    const project = (req.query.project as string) || ''
    let q = sb.from('tracked_accounts').select('*').order('created_at', { ascending: false })
    if (project) q = q.eq('project', project)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ accounts: data || [] })
  }

  if (req.method === 'POST') {
    const { url, kind, label, notes, project } = req.body || {}
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Missing url' })
    const { data, error } = await sb
      .from('tracked_accounts')
      .insert({
        url: url.trim(),
        kind: kind || 'competitor',
        label: (label || '').trim(),
        notes: (notes || '').trim(),
        project: project || null,
        active: true,
      })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ account: data })
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const allowed = ['kind', 'label', 'notes', 'active', 'last_checked_at', 'project']
    const patch: Record<string, any> = {}
    for (const k of allowed) if (k in updates) patch[k] = updates[k]
    const { data, error } = await sb
      .from('tracked_accounts')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ account: data })
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const { error } = await sb.from('tracked_accounts').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
