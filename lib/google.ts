// Google Calendar OAuth + API helpers (raw fetch, zero deps)
// Tokens stored in httpOnly cookies (1h access, 30d refresh)

import type { NextApiRequest, NextApiResponse } from 'next'

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
export const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
export const GCAL_API = 'https://www.googleapis.com/calendar/v3'

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

const COOKIE_ACCESS = 'g_access_token'
const COOKIE_REFRESH = 'g_refresh_token'
const COOKIE_EMAIL = 'g_email'

export type GoogleTokens = {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

/* === Cookie helpers === */
export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {}
  const out: Record<string, string> = {}
  cookieHeader.split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=')
    if (k) out[k] = decodeURIComponent(v.join('='))
  })
  return out
}

export function setCookie(res: NextApiResponse, name: string, value: string, maxAgeSec: number) {
  const cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=/`,
    `Max-Age=${maxAgeSec}`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
  ].join('; ')
  const existing = res.getHeader('Set-Cookie')
  const cookies = Array.isArray(existing) ? existing : existing ? [existing as string] : []
  res.setHeader('Set-Cookie', [...cookies, cookie])
}

export function clearCookie(res: NextApiResponse, name: string) {
  setCookie(res, name, '', 0)
}

export function setTokenCookies(res: NextApiResponse, tokens: GoogleTokens, email?: string) {
  setCookie(res, COOKIE_ACCESS, tokens.access_token, tokens.expires_in)
  if (tokens.refresh_token) setCookie(res, COOKIE_REFRESH, tokens.refresh_token, 60 * 60 * 24 * 30)
  if (email) setCookie(res, COOKIE_EMAIL, email, 60 * 60 * 24 * 30)
}

export function clearTokenCookies(res: NextApiResponse) {
  clearCookie(res, COOKIE_ACCESS)
  clearCookie(res, COOKIE_REFRESH)
  clearCookie(res, COOKIE_EMAIL)
}

export function getTokensFromReq(req: NextApiRequest): { access?: string; refresh?: string; email?: string } {
  const c = parseCookies(req.headers.cookie)
  return { access: c[COOKIE_ACCESS], refresh: c[COOKIE_REFRESH], email: c[COOKIE_EMAIL] }
}

/* === OAuth flow === */
export function getRedirectUri(req: NextApiRequest): string {
  const host = req.headers.host
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  return `${proto}://${host}/api/google/callback`
}

export function buildAuthUrl(req: NextApiRequest, state?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: getRedirectUri(req),
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',  // Force refresh_token to be returned
    ...(state ? { state } : {}),
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCode(req: NextApiRequest, code: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: getRedirectUri(req),
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || data.error || 'Token exchange failed')
  return data
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || data.error || 'Refresh failed')
  return data
}

export async function getUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    return data.email || null
  } catch {
    return null
  }
}

/* === Calendar API helpers === */

export type GCalEvent = {
  id?: string
  summary: string
  description?: string
  start: { dateTime: string; timeZone?: string }
  end: { dateTime: string; timeZone?: string }
  reminders?: { useDefault: boolean }
  colorId?: string  // 1-11, optional Google Calendar color
}

// Fetch wrapper with auto-refresh
export async function gcalFetch(
  req: NextApiRequest,
  res: NextApiResponse,
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  let { access, refresh } = getTokensFromReq(req)
  if (!access && !refresh) return { ok: false, status: 401, data: { error: 'not_connected' } }

  const callApi = async (token: string) => {
    const r = await fetch(`${GCAL_API}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    const d = await r.json().catch(() => ({}))
    return { ok: r.ok, status: r.status, data: d }
  }

  if (access) {
    const result = await callApi(access)
    if (result.status !== 401) return result
  }

  // Refresh and retry
  if (refresh) {
    try {
      const tokens = await refreshAccessToken(refresh)
      setCookie(res, COOKIE_ACCESS, tokens.access_token, tokens.expires_in)
      return await callApi(tokens.access_token)
    } catch (e: any) {
      return { ok: false, status: 401, data: { error: 'refresh_failed', message: e.message } }
    }
  }

  return { ok: false, status: 401, data: { error: 'no_refresh_token' } }
}

/* === Convert Calendar entries to Google events === */

import type { CalendarEntry } from './calendar'

export function entryToGCalEvent(entry: CalendarEntry, durationMinutes = 30): GCalEvent {
  const start = new Date(entry.scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

  const networkLabel = entry.network === 'twitter' ? 'Twitter / X' : 'LinkedIn'
  const summary = `[${networkLabel}] ${entry.topic || entry.text.slice(0, 60)}`
  const description = `${entry.text}\n\n──────────\nFormat: ${entry.format}\nStatut: ${entry.status}\nGénéré par Social Agent`

  return {
    summary,
    description,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    reminders: { useDefault: true },
    // Twitter posts = blue (id 9), LinkedIn = navy (id 11 = tomato, sadly no navy)
    colorId: entry.network === 'twitter' ? '7' : '9',
  }
}

/* === Quick "Add to Google Calendar" URL (no OAuth needed) === */

export function quickAddUrl(entry: CalendarEntry, durationMinutes = 30): string {
  const start = new Date(entry.scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const networkLabel = entry.network === 'twitter' ? 'Twitter / X' : 'LinkedIn'

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `[${networkLabel}] ${entry.topic || entry.text.slice(0, 60)}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: entry.text,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
