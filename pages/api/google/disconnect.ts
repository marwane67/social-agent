import type { NextApiRequest, NextApiResponse } from 'next'
import { clearTokenCookies } from '../../../lib/google'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  clearTokenCookies(res)
  res.status(200).json({ ok: true })
}
