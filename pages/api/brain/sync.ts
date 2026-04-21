import type { NextApiRequest, NextApiResponse } from 'next'
import { sbAdmin } from '../../../lib/supabase'

// Singleton brain for this personal app (1 user : Marwane)
const BRAIN_KEY = 'marwane_brain'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sb = sbAdmin()

    if (req.method === 'GET') {
      const { data, error } = await sb
        .from('app_state')
        .select('value, updated_at')
        .eq('key', BRAIN_KEY)
        .maybeSingle()

      if (error) {
        // Table might not exist yet
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          return res.status(200).json({ brain: null, error: 'table_missing', message: 'Exécute le SQL fourni dans ton Supabase pour créer la table app_state.' })
        }
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({
        brain: data?.value || null,
        updatedAt: data?.updated_at || null,
      })
    }

    if (req.method === 'POST') {
      const { brain } = req.body
      if (!brain || typeof brain !== 'object') {
        return res.status(400).json({ error: 'Missing or invalid brain' })
      }

      const { error } = await sb
        .from('app_state')
        .upsert({
          key: BRAIN_KEY,
          value: brain,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })

      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          return res.status(500).json({
            error: 'table_missing',
            message: 'La table app_state n\'existe pas. Crée-la dans Supabase SQL Editor avec le SQL fourni.',
          })
        }
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ ok: true, updatedAt: new Date().toISOString() })
    }

    return res.status(405).end()
  } catch (e: any) {
    console.error('Brain sync error:', e)
    return res.status(500).json({ error: e.message || 'Sync failed' })
  }
}
