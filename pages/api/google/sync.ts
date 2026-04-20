import type { NextApiRequest, NextApiResponse } from 'next'
import { gcalFetch, entryToGCalEvent } from '../../../lib/google'
import type { CalendarEntry } from '../../../lib/calendar'

export const config = {
  maxDuration: 60,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { entries, calendarId = 'primary', durationMinutes = 30 } = req.body
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries must be an array' })

  const created: { entryId: string; gcalId: string }[] = []
  const failed: { entryId: string; error: string }[] = []

  for (const entry of entries as CalendarEntry[]) {
    const event = entryToGCalEvent(entry, durationMinutes)
    const result = await gcalFetch(req, res, `/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    })

    if (!result.ok) {
      // Si pas connecté, on s'arrête net
      if (result.status === 401) {
        return res.status(401).json({ error: 'not_connected', message: 'Reconnecte Google Calendar' })
      }
      failed.push({ entryId: entry.id, error: result.data?.error?.message || 'unknown' })
    } else {
      created.push({ entryId: entry.id, gcalId: result.data.id })
    }
  }

  res.status(200).json({
    success: true,
    total: entries.length,
    created: created.length,
    failed: failed.length,
    details: { created, failed },
  })
}
