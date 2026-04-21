import type { NextApiRequest, NextApiResponse } from 'next'

export const config = { maxDuration: 30 }

type Trend = {
  source: 'hackernews' | 'producthunt' | 'reddit'
  title: string
  url?: string
  score?: number
  comments?: number
  summary?: string
}

// In-memory cache (per Vercel function instance, 30 min TTL)
let cache: { data: Trend[]; expires: number } | null = null
const CACHE_TTL_MS = 30 * 60 * 1000

async function fetchHackerNews(): Promise<Trend[]> {
  try {
    const ids: number[] = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      signal: AbortSignal.timeout(8000),
    }).then(r => r.json())

    const top = ids.slice(0, 15)
    const items = await Promise.all(
      top.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          signal: AbortSignal.timeout(5000),
        }).then(r => r.json()).catch(() => null)
      )
    )
    return items
      .filter(i => i && i.title && i.score >= 50)
      .map((i: any): Trend => ({
        source: 'hackernews',
        title: i.title,
        url: i.url || `https://news.ycombinator.com/item?id=${i.id}`,
        score: i.score,
        comments: i.descendants || 0,
      }))
      .slice(0, 10)
  } catch {
    return []
  }
}

async function fetchProductHunt(): Promise<Trend[]> {
  try {
    const rss = await fetch('https://www.producthunt.com/feed', {
      signal: AbortSignal.timeout(8000),
    }).then(r => r.text())

    // Minimalist RSS parsing (no xml lib needed)
    const items: Trend[] = []
    const itemRegex = /<item>[\s\S]*?<\/item>/g
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/
    const linkRegex = /<link>(.*?)<\/link>/
    const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/

    let match
    while ((match = itemRegex.exec(rss)) !== null && items.length < 10) {
      const block = match[0]
      const title = block.match(titleRegex)?.[1]
      const url = block.match(linkRegex)?.[1]
      const desc = block.match(descRegex)?.[1]
      if (title) {
        items.push({
          source: 'producthunt',
          title,
          url,
          summary: desc ? desc.replace(/<[^>]+>/g, '').slice(0, 120) : undefined,
        })
      }
    }
    return items
  } catch {
    return []
  }
}

async function fetchReddit(subreddits: string[] = ['startups', 'SaaS', 'smallbusiness']): Promise<Trend[]> {
  try {
    const all: Trend[] = []
    await Promise.all(subreddits.map(async sub => {
      try {
        const data = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=5`, {
          headers: { 'User-Agent': 'SocialAgent/1.0' },
          signal: AbortSignal.timeout(8000),
        }).then(r => r.json())
        const posts = data?.data?.children || []
        for (const p of posts) {
          const d = p.data
          if (d.stickied) continue
          all.push({
            source: 'reddit',
            title: `[r/${sub}] ${d.title}`,
            url: `https://reddit.com${d.permalink}`,
            score: d.score,
            comments: d.num_comments,
          })
        }
      } catch {}
    }))
    // Top 10 by score
    return all.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10)
  } catch {
    return []
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Serve cache if fresh
  if (cache && cache.expires > Date.now() && !req.query.refresh) {
    return res.status(200).json({ trends: cache.data, cached: true, expiresIn: cache.expires - Date.now() })
  }

  try {
    const [hn, ph, rd] = await Promise.all([
      fetchHackerNews(),
      fetchProductHunt(),
      fetchReddit(),
    ])

    const all = [...hn, ...ph, ...rd]
    cache = { data: all, expires: Date.now() + CACHE_TTL_MS }

    res.status(200).json({
      trends: all,
      sources: {
        hackernews: hn.length,
        producthunt: ph.length,
        reddit: rd.length,
      },
      cached: false,
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Trends fetch failed' })
  }
}
