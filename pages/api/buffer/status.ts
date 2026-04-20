import type { NextApiRequest, NextApiResponse } from 'next'
import { isConfigured, getProfiles, getUser } from '../../../lib/buffer'

// Simple in-memory cache (per Vercel function instance) — évite de spam Buffer à chaque page load
type CacheEntry = { data: any; expires: number }
let cache: CacheEntry | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isConfigured()) {
    return res.status(200).json({ configured: false, connected: false })
  }

  // Serve from cache if fresh
  if (cache && cache.expires > Date.now() && !req.query.refresh) {
    return res.status(200).json({ ...cache.data, cached: true })
  }

  try {
    // getUser already contains the organizationId we need for getProfiles
    const user = await getUser()
    const profiles = await getProfiles(user.organizationId)
    const data = {
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
    }
    cache = { data, expires: Date.now() + CACHE_TTL_MS }
    res.status(200).json(data)
  } catch (e: any) {
    // Even errors are cached briefly to avoid re-hitting Buffer while rate-limited
    const errData = {
      configured: true,
      connected: false,
      error: e.message || 'Buffer connection failed',
    }
    cache = { data: errData, expires: Date.now() + 60 * 1000 } // 1 min cache on error
    res.status(200).json(errData)
  }
}
