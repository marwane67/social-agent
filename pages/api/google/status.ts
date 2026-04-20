import type { NextApiRequest, NextApiResponse } from 'next'
import { getTokensFromReq } from '../../../lib/google'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { access, refresh, email } = getTokensFromReq(req)
  const connected = !!(access || refresh)
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  res.status(200).json({
    connected,
    configured,
    email: email || null,
  })
}
