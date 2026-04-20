import type { NextApiRequest, NextApiResponse } from 'next'
import type { CalendarEntry } from '../../../lib/calendar'

function escapeICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function formatDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { entries, durationMinutes = 30 } = req.body
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries must be an array' })

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Social Agent//Marwane//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const e of entries as CalendarEntry[]) {
    const start = new Date(e.scheduledAt)
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
    const network = e.network === 'twitter' ? 'Twitter / X' : 'LinkedIn'
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@social-agent`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:[${network}] ${escapeICS(e.topic || e.text.slice(0, 60))}`,
      `DESCRIPTION:${escapeICS(e.text)}`,
      `STATUS:${e.status === 'published' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')

  const ics = lines.join('\r\n')
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="social-agent-calendar.ics"')
  res.status(200).send(ics)
}
