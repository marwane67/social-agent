import type { NextApiRequest, NextApiResponse } from 'next'
import { createUpdate, getProfiles, networkToService, entryToBufferUpdate } from '../../../lib/buffer'
import type { CalendarEntry } from '../../../lib/calendar'

export const config = { maxDuration: 60 }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { entries, profileIds: forcedProfileIds } = req.body
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries must be an array' })

  try {
    // If profileIds provided, use them. Otherwise auto-pick by network.
    let profilesByService: Record<string, string[]> = {}
    if (Array.isArray(forcedProfileIds) && forcedProfileIds.length > 0) {
      // user-forced mapping (we'll just use these for all entries)
      profilesByService.__all__ = forcedProfileIds
    } else {
      const profiles = await getProfiles()
      for (const p of profiles) {
        if (!profilesByService[p.service]) profilesByService[p.service] = []
        profilesByService[p.service].push(p.id)
      }
    }

    const created: { entryId: string; bufferIds: string[] }[] = []
    const failed: { entryId: string; error: string }[] = []

    for (const entry of entries as CalendarEntry[]) {
      let pids: string[] = []
      if (profilesByService.__all__) {
        pids = profilesByService.__all__
      } else {
        const service = networkToService(entry.network)
        pids = profilesByService[service] || []
      }
      if (pids.length === 0) {
        failed.push({ entryId: entry.id, error: `Aucun profil Buffer pour ${entry.network}` })
        continue
      }

      try {
        const update = entryToBufferUpdate(entry, pids)
        const result = await createUpdate(update)
        const ids = (result.updates || []).map((u: any) => u.id)
        created.push({ entryId: entry.id, bufferIds: ids })
      } catch (e: any) {
        failed.push({ entryId: entry.id, error: e.message || 'unknown' })
      }
    }

    res.status(200).json({
      success: true,
      total: entries.length,
      created: created.length,
      failed: failed.length,
      details: { created, failed },
    })
  } catch (e: any) {
    console.error('Buffer schedule error:', e)
    res.status(500).json({ error: e.message || 'Schedule failed' })
  }
}
