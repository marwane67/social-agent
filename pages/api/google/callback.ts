import type { NextApiRequest, NextApiResponse } from 'next'
import { exchangeCode, getUserEmail, setTokenCookies } from '../../../lib/google'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, error } = req.query
  if (error) {
    return res.redirect(`/calendar?google_error=${encodeURIComponent(String(error))}`)
  }
  if (!code || typeof code !== 'string') {
    return res.redirect('/calendar?google_error=no_code')
  }
  try {
    const tokens = await exchangeCode(req, code)
    const email = await getUserEmail(tokens.access_token)
    setTokenCookies(res, tokens, email || undefined)
    res.redirect('/calendar?google_connected=1')
  } catch (e: any) {
    console.error('Google callback error:', e)
    res.redirect(`/calendar?google_error=${encodeURIComponent(e.message || 'unknown')}`)
  }
}
