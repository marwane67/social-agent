// Buffer API v1 helpers — uses BUFFER_ACCESS_TOKEN
// Docs : https://buffer.com/developers/api

const BUFFER_API = 'https://api.bufferapp.com/1'

export type BufferProfile = {
  id: string
  service: string                  // 'twitter', 'linkedin', 'facebook', 'instagram', etc.
  service_username: string         // @handle
  service_id: string
  formatted_username: string
  avatar: string
  timezone: string
  default: boolean
  schedules?: { days: string[]; times: string[] }[]
}

export type BufferUpdate = {
  id?: string
  text: string
  profile_ids: string[]            // which Buffer profile(s) to post to
  scheduled_at?: number            // Unix timestamp (seconds)
  now?: boolean                    // post immediately
  shorten?: boolean
  media?: {
    link?: string
    description?: string
    title?: string
    picture?: string
    thumbnail?: string
  }
}

export type BufferUpdateResponse = {
  success: boolean
  message?: string
  updates?: any[]
  buffer_count?: number
  buffer_percentage?: number
}

/* === Helpers === */
function token(): string | null {
  return process.env.BUFFER_ACCESS_TOKEN || null
}

export function isConfigured(): boolean {
  return !!token()
}

async function get(path: string): Promise<any> {
  const t = token()
  if (!t) throw new Error('BUFFER_ACCESS_TOKEN non configuré')
  const url = `${BUFFER_API}${path}${path.includes('?') ? '&' : '?'}access_token=${t}`
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `Buffer API ${res.status}`)
  return data
}

async function post(path: string, body: Record<string, any>): Promise<any> {
  const t = token()
  if (!t) throw new Error('BUFFER_ACCESS_TOKEN non configuré')
  const url = `${BUFFER_API}${path}`
  const params = new URLSearchParams()
  params.append('access_token', t)
  for (const [k, v] of Object.entries(body)) {
    if (Array.isArray(v)) {
      v.forEach(item => params.append(`${k}[]`, String(item)))
    } else if (v !== undefined && v !== null) {
      params.append(k, String(v))
    }
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || data?.error || `Buffer API ${res.status}`)
  return data
}

/* === User & profiles === */
export async function getUser(): Promise<{ id: string; name: string; email?: string }> {
  return get('/user.json')
}

export async function getProfiles(): Promise<BufferProfile[]> {
  return get('/profiles.json')
}

/* === Updates (scheduled posts) === */
export async function getPendingUpdates(profileId: string): Promise<{ updates: any[]; total: number }> {
  return get(`/profiles/${profileId}/updates/pending.json`)
}

export async function createUpdate(update: BufferUpdate): Promise<BufferUpdateResponse> {
  const body: Record<string, any> = {
    text: update.text,
    profile_ids: update.profile_ids,
  }
  if (update.scheduled_at) body.scheduled_at = update.scheduled_at
  if (update.now) body.now = 'true'
  if (update.shorten === false) body.shorten = 'false'
  if (update.media?.link) {
    body['media[link]'] = update.media.link
    if (update.media.description) body['media[description]'] = update.media.description
    if (update.media.title) body['media[title]'] = update.media.title
    if (update.media.picture) body['media[picture]'] = update.media.picture
  }
  return post('/updates/create.json', body)
}

export async function deleteUpdate(updateId: string): Promise<{ success: boolean }> {
  return post(`/updates/${updateId}/destroy.json`, {})
}

/* === Map our network to Buffer service === */
export function networkToService(network: 'twitter' | 'linkedin'): string {
  return network === 'twitter' ? 'twitter' : 'linkedin'
}

/* === Convert calendar entry to Buffer update === */
import type { CalendarEntry } from './calendar'

export function entryToBufferUpdate(entry: CalendarEntry, profileIds: string[]): BufferUpdate {
  const scheduledTimestamp = Math.floor(new Date(entry.scheduledAt).getTime() / 1000)
  return {
    text: entry.text,
    profile_ids: profileIds,
    scheduled_at: scheduledTimestamp,
    shorten: false,
  }
}
