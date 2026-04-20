import type { NextApiRequest, NextApiResponse } from 'next'
import { getProfiles, getPendingUpdates } from '../../../lib/buffer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const profiles = await getProfiles()
    const all: any[] = []
    for (const p of profiles) {
      try {
        const data = await getPendingUpdates(p.id)
        for (const u of (data.updates || [])) {
          all.push({
            id: u.id,
            text: u.text,
            scheduled_at: u.scheduled_at ? u.scheduled_at * 1000 : null,
            status: u.status,
            profile_service: p.service,
            profile_username: p.formatted_username || p.service_username,
          })
        }
      } catch {}
    }
    all.sort((a, b) => (a.scheduled_at || 0) - (b.scheduled_at || 0))
    res.status(200).json({ updates: all, total: all.length })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Pending fetch failed' })
  }
}
