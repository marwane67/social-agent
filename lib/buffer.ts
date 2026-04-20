// Buffer API v2 (GraphQL) — uses Bearer token (BUFFER_ACCESS_TOKEN)
// Old v1 (api.bufferapp.com) is deprecated for OAuth/OIDC tokens.
// Docs : https://buffer.com/developers/api

const BUFFER_GRAPHQL = 'https://graphql.buffer.com/'

export type BufferProfile = {
  id: string
  service: string                  // 'twitter', 'linkedin', etc.
  service_username: string
  service_id?: string
  formatted_username: string
  avatar?: string
  timezone?: string
  default?: boolean
}

export type BufferUpdate = {
  id?: string
  text: string
  profile_ids: string[]
  scheduled_at?: number            // Unix seconds
  now?: boolean
}

/* === Token === */
function token(): string | null {
  return process.env.BUFFER_ACCESS_TOKEN || null
}

export function isConfigured(): boolean {
  return !!token()
}

/* === Low-level GraphQL call === */
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

/* === User === */
export async function getUser(): Promise<{ id: string; name: string; email?: string }> {
  const data = await gql(`
    query Me {
      account {
        id
        name: displayName
        email
      }
    }
  `)
  return data.account || { id: 'unknown', name: 'Buffer user' }
}

/* === Channels (previously "profiles") === */
export async function getProfiles(): Promise<BufferProfile[]> {
  const data = await gql(`
    query Channels {
      channels {
        id
        service
        name
        avatar
        timezone
        serverUrl
      }
    }
  `)
  const channels = data?.channels || []
  return channels.map((c: any) => ({
    id: c.id,
    service: (c.service || '').toLowerCase(),
    service_username: c.name || '',
    formatted_username: c.name || '',
    avatar: c.avatar,
    timezone: c.timezone,
    default: false,
  }))
}

/* === Create post/draft === */
export async function createUpdate(update: BufferUpdate): Promise<{ success: boolean; updates: any[] }> {
  // Buffer's new API uses "createPost" or "createDraft" mutations
  const scheduledAt = update.scheduled_at ? new Date(update.scheduled_at * 1000).toISOString() : undefined

  const mutation = `
    mutation CreatePost($organizationId: String, $channels: [ChannelInput!]!, $text: String!, $scheduledAt: DateTime) {
      createPost(
        input: {
          channels: $channels
          text: $text
          scheduledAt: $scheduledAt
          shareNow: ${!!update.now}
        }
      ) {
        ... on PostActionSuccess {
          post {
            id
            status
            scheduledAt
          }
        }
        ... on PostActionError {
          userFriendlyMessage
          message
        }
      }
    }
  `

  const channels = update.profile_ids.map(id => ({ channel: id }))

  try {
    const data = await gql(mutation, {
      channels,
      text: update.text,
      scheduledAt,
    })
    const result = data?.createPost
    if (result?.post) {
      return { success: true, updates: [{ id: result.post.id }] }
    }
    if (result?.userFriendlyMessage || result?.message) {
      throw new Error(result.userFriendlyMessage || result.message)
    }
  } catch (e) {
    throw e
  }
  throw new Error('Unknown Buffer response')
}

export async function deleteUpdate(updateId: string): Promise<{ success: boolean }> {
  const mutation = `
    mutation DeletePost($postId: PostId!) {
      deletePost(input: { id: $postId }) {
        ... on PostActionSuccess { post { id } }
        ... on PostActionError { message }
      }
    }
  `
  await gql(mutation, { postId: updateId })
  return { success: true }
}

export async function getPendingUpdates(profileId: string): Promise<{ updates: any[]; total: number }> {
  const data = await gql(`
    query Pending($channelId: ChannelId!) {
      posts(input: { channelIds: [$channelId], status: SCHEDULED, first: 50 }) {
        edges { node { id text scheduledAt status } }
      }
    }
  `, { channelId: profileId })
  const edges = data?.posts?.edges || []
  const updates = edges.map((e: any) => ({
    id: e.node.id,
    text: e.node.text,
    scheduled_at: e.node.scheduledAt ? Math.floor(new Date(e.node.scheduledAt).getTime() / 1000) : null,
    status: e.node.status,
  }))
  return { updates, total: updates.length }
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
