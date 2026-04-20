import type { NextApiRequest, NextApiResponse } from 'next'
import { isConfigured, getProfiles, getUser } from '../../../lib/buffer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isConfigured()) {
    return res.status(200).json({ configured: false, connected: false })
  }
  try {
    const [user, profiles] = await Promise.all([getUser(), getProfiles()])
    res.status(200).json({
      configured: true,
      connected: true,
      user: { id: user.id, name: user.name, email: user.email },
      profiles: profiles.map(p => ({
        id: p.id,
        service: p.service,
        username: p.formatted_username || p.service_username,
        avatar: p.avatar,
        timezone: p.timezone,
        default: p.default,
      })),
    })
  } catch (e: any) {
    res.status(200).json({
      configured: true,
      connected: false,
      error: e.message || 'Buffer connection failed',
    })
  }
}
