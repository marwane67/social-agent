import type { NextApiRequest, NextApiResponse } from 'next'
import { sbAdmin } from '../../../lib/supabase'

// Store brain as a JSON file in Supabase Storage — no SQL table needed.
// Bucket: 'app-state' (auto-created if missing), file: 'marwane_brain.json'
const BUCKET = 'app-state'
const FILE = 'marwane_brain.json'

async function ensureBucket(sb: ReturnType<typeof sbAdmin>) {
  const { data: buckets } = await sb.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    const { error } = await sb.storage.createBucket(BUCKET, {
      public: false,
    })
    if (error && !error.message.includes('already')) {
      throw new Error('Bucket creation failed: ' + error.message)
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sb = sbAdmin()
    await ensureBucket(sb)

    if (req.method === 'GET') {
      const { data, error } = await sb.storage.from(BUCKET).download(FILE)
      if (error) {
        // File doesn't exist yet — not an error, just empty
        if (error.message.includes('not found') || (error as any).statusCode === '404' || error.message.includes('Object not found')) {
          return res.status(200).json({ brain: null, updatedAt: null })
        }
        return res.status(500).json({ error: error.message })
      }
      if (!data) return res.status(200).json({ brain: null, updatedAt: null })

      const text = await data.text()
      const brain = JSON.parse(text)
      return res.status(200).json({ brain, updatedAt: brain.lastUpdated || null })
    }

    if (req.method === 'POST') {
      const { brain } = req.body
      if (!brain || typeof brain !== 'object') {
        return res.status(400).json({ error: 'Missing or invalid brain' })
      }

      const json = JSON.stringify(brain, null, 2)
      const { error } = await sb.storage.from(BUCKET).upload(FILE, json, {
        contentType: 'application/json',
        upsert: true,
      })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ ok: true, updatedAt: brain.lastUpdated || new Date().toISOString() })
    }

    return res.status(405).end()
  } catch (e: any) {
    console.error('Brain sync error:', e)
    return res.status(500).json({ error: e.message || 'Sync failed' })
  }
}
