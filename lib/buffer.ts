// Buffer GraphQL API — uses Bearer token (BUFFER_ACCESS_TOKEN)
// Endpoint : api.buffer.com/graphql
// Schema validated by introspection on 2026-04-20

const BUFFER_GRAPHQL = 'https://api.buffer.com/graphql'

export type BufferProfile = {
  id: string
  service: string
  service_username: string
  formatted_username: string
  avatar?: string
  timezone?: string
  default?: boolean
  organizationId?: string
}

export type BufferUpdate = {
  id?: string
  text: string
  profile_ids: string[]
  scheduled_at?: number  // Unix seconds
  now?: boolean
}

export type BufferAccount = {
  id: string
  name: string
  email: string
  organizationId: string
}

/* === Token === */
function token(): string | null {
  return process.env.BUFFER_ACCESS_TOKEN || null
}

export function isConfigured(): boolean {
  return !!token()
}

/* === GraphQL call === */
async function gql(query: string, variables?: Record<string, any>): Promise<any> {
  const t = token()
  if (!t) throw new Error('BUFFER_ACCESS_TOKEN non configuré')
  const res = await fetch(BUFFER_GRAPHQL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${t}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  const data = await res.json()
  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0]?.message || 'GraphQL error')
  }
  if (!res.ok) {
    throw new Error(`Buffer API ${res.status}`)
  }
  return data.data
}

/* === User + organization === */
export async function getUser(): Promise<BufferAccount> {
  const data = await gql(`
    query Me {
      account {
        id
        name
        email
        organizations { id name }
      }
    }
  `)
  const acc = data?.account
  if (!acc) throw new Error('Pas de compte trouvé')
  const org = acc.organizations?.[0]
  return {
    id: acc.id,
    name: acc.name || acc.email,
    email: acc.email,
    organizationId: org?.id || '',
  }
}

/* === Channels (Buffer's term for connected social accounts) === */
export async function getProfiles(organizationId?: string): Promise<BufferProfile[]> {
  let orgId = organizationId
  if (!orgId) {
    const me = await getUser()
    orgId = me.organizationId
  }
  if (!orgId) return []

  const data = await gql(`
    query Channels($input: ChannelsInput!) {
      channels(input: $input) {
        id
        service
        name
        displayName
        avatar
        timezone
        organizationId
      }
    }
  `, { input: { organizationId: orgId } })

  const channels = data?.channels || []
  return channels.map((c: any) => ({
    id: c.id,
    service: (c.service || '').toLowerCase(),
    service_username: c.name || c.displayName || '',
    formatted_username: c.displayName || c.name || '',
    avatar: c.avatar,
    timezone: c.timezone,
    default: false,
    organizationId: c.organizationId,
  }))
}

/* === Create post (one per channel — Buffer schema requires single channelId) === */
async function createSinglePost(
  channelId: string,
  text: string,
  scheduledAt?: number,
  shareNow = false
): Promise<{ id: string; status?: string }> {
  const dueAt = scheduledAt ? new Date(scheduledAt * 1000).toISOString() : undefined
  const mode = shareNow ? 'shareNow' : 'customScheduled'

  // createPost returns PostActionPayload union :
  // PostActionSuccess | NotFoundError | UnauthorizedError | UnexpectedError |
  // RestProxyError | LimitReachedError | InvalidInputError
  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        __typename
        ... on PostActionSuccess {
          post { id status }
        }
        ... on NotFoundError { message }
        ... on UnauthorizedError { message }
        ... on UnexpectedError { message }
        ... on RestProxyError { message }
        ... on LimitReachedError { message }
        ... on InvalidInputError { message }
      }
    }
  `

  const input: Record<string, any> = {
    channelId,
    text,
    schedulingType: 'automatic',
    mode,
  }
  if (dueAt && !shareNow) input.dueAt = dueAt

  const data = await gql(mutation, { input })
  const result = data?.createPost
  if (result?.__typename === 'PostActionSuccess' && result.post?.id) {
    return { id: result.post.id, status: result.post.status }
  }
  // Any other type = error with a message field
  throw new Error(`${result?.__typename || 'Erreur'} : ${result?.message || 'Buffer createPost échoué'}`)
}

export async function createUpdate(update: BufferUpdate): Promise<{ success: boolean; updates: { id: string }[] }> {
  const created: { id: string }[] = []
  const errors: string[] = []
  // One post per channel (Buffer schema requires single channelId)
  for (const cid of update.profile_ids) {
    try {
      const r = await createSinglePost(cid, update.text, update.scheduled_at, update.now)
      created.push(r)
    } catch (e: any) {
      errors.push(`${cid}: ${e.message || 'unknown'}`)
    }
  }
  if (created.length === 0 && errors.length > 0) {
    throw new Error(errors.join(' | '))
  }
  return { success: true, updates: created }
}

export async function deleteUpdate(updateId: string): Promise<{ success: boolean }> {
  // deletePost returns DeletePostPayload union: DeletePostSuccess | VoidMutationError
  const mutation = `
    mutation DeletePost($input: DeletePostInput!) {
      deletePost(input: $input) {
        __typename
        ... on DeletePostSuccess { id }
        ... on VoidMutationError { message }
      }
    }
  `
  const data = await gql(mutation, { input: { id: updateId } })
  const result = data?.deletePost
  if (result?.__typename === 'DeletePostSuccess') return { success: true }
  throw new Error(result?.message || 'Delete échoué')
}

/* === Stub : pending updates not strictly needed for sync === */
export async function getPendingUpdates(_profileId: string): Promise<{ updates: any[]; total: number }> {
  return { updates: [], total: 0 }
}

/* === Helpers === */
export function networkToService(network: 'twitter' | 'linkedin'): string {
  return network === 'twitter' ? 'twitter' : 'linkedin'
}

import type { CalendarEntry } from './calendar'

export function entryToBufferUpdate(entry: CalendarEntry, profileIds: string[]): BufferUpdate {
  const scheduledTimestamp = Math.floor(new Date(entry.scheduledAt).getTime() / 1000)
  return {
    text: entry.text,
    profile_ids: profileIds,
    scheduled_at: scheduledTimestamp,
  }
}
