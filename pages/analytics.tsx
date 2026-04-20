import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { getPerformances, computeInsights, viralityScore, savePerformance, deletePerformance, PostPerformance } from '../lib/performance'
import { HOOKS } from '../lib/hooks'

type Network = 'twitter' | 'linkedin'
type Tab = 'overview' | 'track' | 'sync'

export default function AnalyticsPage() {
  const router = useRouter()
  const [network, setNetwork] = useState<Network>('twitter')
  const [tab, setTab] = useState<Tab>('overview')
  const [perfs, setPerfs] = useState<PostPerformance[]>([])
  const [twitterUser, setTwitterUser] = useState('ismaa_pxl')
  const [twitterData, setTwitterData] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncErr, setSyncErr] = useState('')

  // Quick add form
  const [showAdd, setShowAdd] = useState(false)
  const [text, setText] = useState('')
  const [impressions, setImpressions] = useState('')
  const [likes, setLikes] = useState('')
  const [replies, setReplies] = useState('')
  const [reposts, setReposts] = useState('')

  useEffect(() => { setPerfs(getPerformances()) }, [])
  const insights = useMemo(() => computeInsights(perfs), [perfs])

  const submit = () => {
    if (!text.trim() || !impressions) return
    savePerformance({
      text: text.trim(),
      network,
      format: 'manual',
      postedAt: new Date().toISOString(),
      impressions: Number(impressions) || 0,
      likes: Number(likes) || 0,
      replies: Number(replies) || 0,
      reposts: Number(reposts) || 0,
    })
    setPerfs(getPerformances())
    setText(''); setImpressions(''); setLikes(''); setReplies(''); setReposts('')
    setShowAdd(false)
  }

  const remove = (id: string) => {
    if (!confirm('Supprimer ?')) return
    deletePerformance(id)
    setPerfs(getPerformances())
  }

  const sync = async () => {
    setSyncing(true); setSyncErr('')
    try {
      const res = await fetch(`/api/analytics-sync?username=${encodeURIComponent(twitterUser)}`)
      const data = await res.json()
      if (data.error) setSyncErr(`${data.error}${data.help ? '\n→ ' + data.help : ''}`)
      else setTwitterData(data)
    } catch { setSyncErr('Connexion impossible') } finally { setSyncing(false) }
  }

  return (
    <>
      <Head><title>Analytics — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Analytics" subtitle="Performance, ce qui marche, sync API">
        <div className="tabs">
          <button className={`tab ${tab === 'overview' ? 'on' : ''}`} onClick={() => setTab('overview')}>Vue d'ensemble</button>
          <button className={`tab ${tab === 'track' ? 'on' : ''}`} onClick={() => setTab('track')}>Tracker un post</button>
          <button className={`tab ${tab === 'sync' ? 'on' : ''}`} onClick={() => setTab('sync')}>Sync API</button>
        </div>

        {tab === 'overview' && (
          <>
            <div className="stats">
              <Stat label="Posts trackés" value={insights.totalPosts.toString()} />
              <Stat label="Impressions/post" value={insights.avgImpressions ? insights.avgImpressions.toLocaleString() : '0'} />
              <Stat label="Engagement" value={`${insights.avgEngagementRate}%`} />
              <Stat label="Tendance 7j" value={insights.trend === 'up' ? '↗' : insights.trend === 'down' ? '↘' : '→'} />
            </div>

            {insights.totalPosts >= 5 && (
              <div className="works">
                <h3>Ce qui marche pour toi</h3>
                <div className="works-grid">
                  {insights.topFormat && <Insight label="Top format" value={insights.topFormat.format} score={`${insights.topFormat.score.toFixed(1)}`} />}
                  {insights.topHook && <Insight label="Top hook" value={`"${HOOKS.find(h => h.id === insights.topHook!.hookId)?.text || `#${insights.topHook.hookId}`}"`} score={`${insights.topHook.score.toFixed(1)}`} />}
                  {insights.topFramework && <Insight label="Top framework" value={insights.topFramework.framework} score={`${insights.topFramework.score.toFixed(1)}`} />}
                  {insights.topNetwork && <Insight label="Top réseau" value={insights.topNetwork === 'twitter' ? 'Twitter' : 'LinkedIn'} />}
                </div>
              </div>
            )}

            {insights.bestPosts.length > 0 && (
              <>
                <h3 className="sec-title">5 meilleurs posts</h3>
                <div className="board">
                  {insights.bestPosts.map((p, i) => (
                    <div key={p.id} className="board-row">
                      <span className="b-rank">#{i + 1}</span>
                      <span className="b-net">{p.network === 'twitter' ? 'X' : 'in'}</span>
                      <span className="b-text">{p.text.slice(0, 90)}...</span>
                      <span className="b-score">{viralityScore(p)}</span>
                      <button onClick={() => remove(p.id)} className="b-del">×</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {insights.totalPosts === 0 && (
              <div className="empty">
                <p>Aucun post tracké. Va dans <button onClick={() => setTab('track')} className="lnk">Tracker un post</button> ou utilise <button onClick={() => setTab('sync')} className="lnk">Sync API</button>.</p>
              </div>
            )}
          </>
        )}

        {tab === 'track' && (
          <>
            <div className="form">
              <h3>Ajouter un post</h3>
              <textarea placeholder="Texte du post..." value={text} onChange={e => setText(e.target.value)} rows={3} className="ta" />
              <div className="grid">
                <input type="number" placeholder="Impressions *" value={impressions} onChange={e => setImpressions(e.target.value)} className="inp" />
                <input type="number" placeholder="Likes" value={likes} onChange={e => setLikes(e.target.value)} className="inp" />
                <input type="number" placeholder="Replies" value={replies} onChange={e => setReplies(e.target.value)} className="inp" />
                <input type="number" placeholder="Reposts" value={reposts} onChange={e => setReposts(e.target.value)} className="inp" />
              </div>
              <button onClick={submit} className="btn-add">Enregistrer</button>
            </div>

            {perfs.length > 0 && (
              <>
                <h3 className="sec-title">Tous les posts ({perfs.length})</h3>
                <div className="all">
                  {perfs.map(p => (
                    <div key={p.id} className="all-row">
                      <span className="b-net">{p.network === 'twitter' ? 'X' : 'in'}</span>
                      <span className="all-text">{p.text.slice(0, 100)}...</span>
                      <span className="all-stat">{p.impressions.toLocaleString()} vues</span>
                      <span className="all-stat">·</span>
                      <span className="all-stat score">Score {viralityScore(p)}</span>
                      <button onClick={() => remove(p.id)} className="b-del">×</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'sync' && (
          <div className="sync">
            <h3>Sync Twitter live</h3>
            <p className="muted">Récupère tes vraies stats via l'API Twitter (nécessite TWITTER_BEARER_TOKEN dans Vercel).</p>
            <div className="sync-row">
              <input type="text" placeholder="username (sans @)" value={twitterUser} onChange={e => setTwitterUser(e.target.value)} className="inp" />
              <button onClick={sync} disabled={syncing} className="btn-add">{syncing ? 'Sync...' : 'Synchroniser'}</button>
            </div>
            {syncErr && <div className="err">{syncErr}</div>}
            {twitterData && (
              <div className="sync-result">
                <div className="stats">
                  <Stat label="Followers" value={twitterData.profile.followers.toLocaleString()} />
                  <Stat label="20 derniers posts" value={twitterData.summary.count.toString()} />
                  <Stat label="Impressions totales" value={twitterData.summary.totalImpressions.toLocaleString()} />
                  <Stat label="ER moyen" value={`${twitterData.summary.avgER}%`} />
                </div>
                <h4>Tweets récents</h4>
                <div className="tweets">
                  {twitterData.tweets.slice(0, 10).map((t: any) => (
                    <div key={t.id} className="tweet">
                      <div className="tw-text">{t.text.slice(0, 140)}{t.text.length > 140 ? '...' : ''}</div>
                      <div className="tw-stats">
                        <span>{t.impressions.toLocaleString()} vues</span>
                        <span>{t.likes} ❤</span>
                        <span>{t.replies} 💬</span>
                        <span>{t.reposts} ↻</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <style jsx>{`
          .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--border); }
          .tab { background: transparent; border: none; border-bottom: 2px solid transparent; padding: 10px 14px; font-size: 13px; color: var(--text-muted); font-weight: 500; margin-bottom: -1px; }
          .tab:hover { color: var(--text-secondary); }
          .tab.on { color: var(--text); border-bottom-color: var(--text); font-weight: 600; }

          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 16px; }
          @media (max-width: 600px) { .stats { grid-template-columns: repeat(2, 1fr); } }

          .works { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 16px; margin-bottom: 16px; }
          .works h3 { font-size: 13px; margin: 0 0 10px; color: var(--text); }
          .works-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
          @media (max-width: 600px) { .works-grid { grid-template-columns: 1fr; } }

          .sec-title { font-size: 13px; font-weight: 600; color: var(--text); margin: 16px 0 8px; }
          .board, .all { display: flex; flex-direction: column; gap: 4px; }
          .board-row, .all-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--r-md); font-size: 12px; }
          .b-rank { color: var(--text); font-weight: 700; font-family: var(--mono); width: 28px; }
          .b-net { font-size: 9px; color: var(--text-muted); font-family: var(--mono); width: 18px; }
          .b-text, .all-text { flex: 1; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .b-score, .all-stat { font-family: var(--mono); font-size: 10px; color: var(--text-muted); }
          .all-stat.score { color: var(--success); font-weight: 600; }
          .b-del { background: transparent; border: none; color: var(--text-faint); font-size: 16px; padding: 0 6px; }
          .b-del:hover { color: var(--danger); }

          .form { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 16px; display: flex; flex-direction: column; gap: 10px; }
          .form h3 { font-size: 13px; margin: 0; color: var(--text); }
          .ta, .inp { background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-sm); color: var(--text); font-size: 12px; padding: 8px 10px; font-family: var(--font); }
          .ta { resize: vertical; line-height: 1.5; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
          @media (max-width: 600px) { .grid { grid-template-columns: repeat(2, 1fr); } }
          .btn-add { background: var(--text); color: var(--bg); border: none; border-radius: var(--r-md); padding: 10px; font-size: 12px; font-weight: 600; }

          .sync { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 16px; }
          .sync h3 { font-size: 13px; margin: 0 0 4px; color: var(--text); }
          .muted { font-size: 12px; color: var(--text-muted); margin: 0 0 12px; }
          .sync-row { display: flex; gap: 6px; margin-bottom: 12px; }
          .sync-row .inp { flex: 1; }
          .err { font-size: 11px; color: var(--danger); padding: 8px 10px; background: rgba(239,68,68,0.06); border-radius: var(--r-sm); white-space: pre-wrap; }
          .sync-result h4 { font-size: 12px; margin: 16px 0 8px; color: var(--text); }
          .tweets { display: flex; flex-direction: column; gap: 4px; max-height: 320px; overflow-y: auto; }
          .tweet { background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px 10px; }
          .tw-text { font-size: 11px; color: var(--text); line-height: 1.5; }
          .tw-stats { display: flex; gap: 10px; font-size: 10px; color: var(--text-muted); font-family: var(--mono); margin-top: 4px; }

          .empty { padding: 40px 20px; text-align: center; color: var(--text-muted); font-size: 13px; background: var(--bg-elevated); border: 1px dashed var(--border); border-radius: var(--r-lg); }
          .lnk { background: transparent; border: none; color: var(--text); text-decoration: underline; padding: 0; font-family: var(--mono); font-size: inherit; }
        `}</style>
      </Layout>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 14px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--mono)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginTop: 4, fontFamily: 'var(--mono)' }}>{value}</div>
    </div>
  )
}

function Insight({ label, value, score }: { label: string; value: string; score?: string }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--mono)' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 4, lineHeight: 1.4 }}>{value}</div>
      {score && <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 4, fontFamily: 'var(--mono)' }}>Score {score}</div>}
    </div>
  )
}
