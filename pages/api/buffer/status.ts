import type { NextApiRequest, NextApiResponse } from 'next'
import { isConfigured, getProfiles, getUser } from '../../../lib/buffer'
import { applyUserToken } from '../../../lib/buffer-auth'

// Cache keyed by token (so different users / different tokens get different caches)
type CacheEntry = { data: any; expires: number }
const cacheByToken: Map<string, CacheEntry> = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyUserToken(req)

  if (!isConfigured()) {
    return res.status(200).json({ configured: false, connected: false })
  }

  // Use the user token (if passed) as cache key, else env token
  const headerToken = (req.headers['x-buffer-token'] as string) || 'env'
  const cache = cacheByToken.get(headerToken)

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
    cacheByToken.set(headerToken, { data, expires: Date.now() + CACHE_TTL_MS })
    res.status(200).json(data)
  } catch (e: any) {
    const errData = {
      configured: true,
      connected: false,
      error: e.message || 'Buffer connection failed',
    }
    cacheByToken.set(headerToken, { data: errData, expires: Date.now() + 60 * 1000 })
    res.status(200).json(errData)
  }
}
