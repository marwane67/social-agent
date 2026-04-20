import type { NextApiRequest, NextApiResponse } from 'next'

// Récupère les vraies stats Twitter via l'API officielle si TWITTER_BEARER_TOKEN est configuré.
// Pour LinkedIn : trop complexe (OAuth + Marketing API), on reste sur saisie manuelle ou CSV.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username = 'ismaa_pxl' } = req.query

  if (!process.env.TWITTER_BEARER_TOKEN) {
    return res.status(400).json({
      error: 'TWITTER_BEARER_TOKEN non configuré',
      help: 'Crée un projet sur developer.twitter.com (gratuit, niveau Basic), récupère le Bearer Token, ajoute-le dans Vercel env vars.',
    })
  }

  try {
    // 1. Get user ID
    const userRes = await fetch(`https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics`, {
      headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` },
    })
    const userData = await userRes.json()
    if (!userRes.ok) {
      return res.status(500).json({ error: 'Twitter API failed', details: userData })
    }
    const userId = userData.data.id
    const userMetrics = userData.data.public_metrics

    // 2. Get last 20 tweets with metrics
    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=20&tweet.fields=public_metrics,created_at&exclude=retweets,replies`,
      { headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` } }
    )
    const tweetsData = await tweetsRes.json()
    if (!tweetsRes.ok) {
      return res.status(500).json({ error: 'Tweets fetch failed', details: tweetsData })
    }

    const tweets = (tweetsData.data || []).map((t: any) => ({
      id: t.id,
      text: t.text,
      createdAt: t.created_at,
      impressions: t.public_metrics.impression_count || 0,
      likes: t.public_metrics.like_count || 0,
      replies: t.public_metrics.reply_count || 0,
      reposts: t.public_metrics.retweet_count || 0,
      quotes: t.public_metrics.quote_count || 0,
    }))

    // Aggregations
    const totalImpressions = tweets.reduce((s: number, t: any) => s + t.impressions, 0)
    const totalLikes = tweets.reduce((s: number, t: any) => s + t.likes, 0)
    const totalReplies = tweets.reduce((s: number, t: any) => s + t.replies, 0)
    const totalReposts = tweets.reduce((s: number, t: any) => s + t.reposts, 0)
    const avgER = totalImpressions ? ((totalLikes + totalReplies + totalReposts) / totalImpressions) * 100 : 0

    res.status(200).json({
      profile: {
        username,
        followers: userMetrics.followers_count,
        following: userMetrics.following_count,
        tweets: userMetrics.tweet_count,
      },
      tweets,
      summary: {
        count: tweets.length,
        totalImpressions,
        totalLikes,
        totalReplies,
        totalReposts,
        avgER: Math.round(avgER * 100) / 100,
      },
    })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: e.message || 'Sync failed' })
  }
}
