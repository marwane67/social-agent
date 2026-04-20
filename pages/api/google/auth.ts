import type { NextApiRequest, NextApiResponse } from 'next'
import { buildAuthUrl } from '../../../lib/google'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      error: 'Google OAuth pas configuré',
      help: 'Ajoute GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans Vercel env vars. Voir doc setup.',
    })
  }
  const url = buildAuthUrl(req)
  res.redirect(url)
}
