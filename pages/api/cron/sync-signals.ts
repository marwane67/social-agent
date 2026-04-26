import type { NextApiRequest, NextApiResponse } from 'next'
import { sbAdmin } from '../../../lib/supabase'

export const config = { maxDuration: 300 } // 5 min max sur Vercel

/**
 * GET /api/cron/sync-signals
 *
 * Endpoint déclenché par Vercel Cron (configuré dans vercel.json).
 * Pour chaque tracked_account actif, récupère les nouveaux engagers via :
 *   - BeReach API si BEREACH_API_KEY est défini (préféré)
 *   - PhantomBuster si PHANTOMBUSTER_API_KEY est défini (fallback)
 *   - Skip silencieux sinon (mode "infra prête, pas encore branchée")
 *
 * Sécurité : protégé par CRON_SECRET (Vercel Cron envoie un Bearer token
 * configurable). En local, accessible direct.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth Vercel Cron : Vercel envoie Authorization: Bearer ${CRON_SECRET}
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.authorization || ''
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const bereachKey = process.env.BEREACH_API_KEY
  const phantomKey = process.env.PHANTOMBUSTER_API_KEY

  if (!bereachKey && !phantomKey) {
    return res.status(200).json({
      status: 'no_provider',
      message: 'Aucune clé API LinkedIn configurée. Ajoute BEREACH_API_KEY ou PHANTOMBUSTER_API_KEY dans Vercel env vars.',
      hint: 'BeReach Pro : €49/mois — https://bereach.ai',
    })
  }

  const provider = bereachKey ? 'bereach' : 'phantombuster'
  const sb = sbAdmin()

  // Récupérer les tracked_accounts actifs, prioriser ceux jamais checked ou checked il y a longtemps
  const { data: accounts, error } = await sb
    .from('tracked_accounts')
    .select('*')
    .eq('active', true)
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(20) // max 20 par run pour ne pas exploser le timeout

  if (error) return res.status(500).json({ error: error.message })
  if (!accounts?.length) return res.status(200).json({ status: 'no_accounts', checked: 0 })

  const results: Array<{ account: string; engagers: number; error?: string }> = []
  let totalInserted = 0

  for (const account of accounts) {
    try {
      const engagers = provider === 'bereach'
        ? await fetchBereachEngagers(account.url, bereachKey!)
        : await fetchPhantomBusterEngagers(account.url, phantomKey!)

      if (!engagers.length) {
        results.push({ account: account.label, engagers: 0 })
        continue
      }

      // Forwarder vers /api/linkedin/import qui fait le scoring + insert
      const importRes = await fetch(`${getBaseUrl(req)}/api/linkedin/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'paste',
          // On formatte les engagers comme du JSON pour /import
          raw: JSON.stringify({ engagers }),
          source_account: account.label,
          source_url: account.url,
          signal_type: 'like',
          tracked_account_id: account.id,
          project: account.project,
        }),
      })
      const importJson = await importRes.json()
      totalInserted += importJson.imported || 0
      results.push({ account: account.label, engagers: importJson.imported || 0 })

      // Marquer comme checked
      await sb.from('tracked_accounts').update({ last_checked_at: new Date().toISOString() }).eq('id', account.id)
    } catch (e: any) {
      results.push({ account: account.label, engagers: 0, error: e?.message || 'unknown' })
    }
  }

  res.status(200).json({
    status: 'ok',
    provider,
    accounts_checked: accounts.length,
    signals_inserted: totalInserted,
    details: results,
  })
}

// =============================================================
// BeReach API — placeholder, à ajuster avec leur vraie doc
// quand tu as ton compte. Pattern probable basé sur leur "70+ endpoints".
// =============================================================
async function fetchBereachEngagers(postUrl: string, apiKey: string): Promise<any[]> {
  // STUB : structure probable de leur API
  // Ajuster avec leur doc réelle (POST /api/v1/engagement/post-engagers ou similaire)
  try {
    const r = await fetch('https://api.bereach.ai/v1/engagement/post-engagers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post_url: postUrl, types: ['like', 'comment', 'share'] }),
    })
    if (!r.ok) throw new Error(`BeReach ${r.status}`)
    const data = await r.json()
    return data.engagers || data.results || []
  } catch (e) {
    return []
  }
}

// =============================================================
// PhantomBuster fallback — déclenche l'agent "LinkedIn Post Likers"
// puis poll le résultat.
// =============================================================
async function fetchPhantomBusterEngagers(postUrl: string, apiKey: string): Promise<any[]> {
  const agentId = process.env.PHANTOMBUSTER_AGENT_ID
  if (!agentId) return []

  try {
    // Lance l'agent
    const launch = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: agentId, argument: { spreadsheetUrl: postUrl } }),
    })
    if (!launch.ok) return []
    const { containerId } = await launch.json()

    // Poll (max 60s) — pour un MVP c'est OK, sinon webhook
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 5000))
      const status = await fetch(
        `https://api.phantombuster.com/api/v2/containers/fetch?id=${containerId}`,
        { headers: { 'X-Phantombuster-Key': apiKey } }
      ).then(r => r.json())
      if (status.status === 'finished') {
        const result = await fetch(
          `https://api.phantombuster.com/api/v2/containers/fetch-result-object?id=${containerId}`,
          { headers: { 'X-Phantombuster-Key': apiKey } }
        ).then(r => r.json())
        const arr = typeof result.resultObject === 'string'
          ? JSON.parse(result.resultObject)
          : result.resultObject
        return Array.isArray(arr) ? arr : (arr?.results || [])
      }
    }
    return []
  } catch {
    return []
  }
}

function getBaseUrl(req: NextApiRequest): string {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  const host = req.headers.host || 'localhost:3034'
  return `${proto}://${host}`
}
