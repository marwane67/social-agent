import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { getPerformances, computeInsights, viralityScore } from '../lib/performance'
import { getProfile } from '../lib/voice'
import { HOOKS } from '../lib/hooks'

type Network = 'twitter' | 'linkedin'

export default function DashboardPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [twitterUsername, setTwitterUsername] = useState('ismaa_pxl')
  const [twitterData, setTwitterData] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [perfs, setPerfs] = useState<ReturnType<typeof getPerformances>>([])

  useEffect(() => { setPerfs(getPerformances()) }, [])

  const insights = useMemo(() => computeInsights(perfs), [perfs])
  const filteredPerf = useMemo(() => perfs.filter(p => p.network === network), [perfs, network])
  const voiceProfile = typeof window !== 'undefined' ? getProfile() : null

  // Counters
  const historyCount = (() => { try { const h=localStorage.getItem('social-agent-history'); return h ? JSON.parse(h).length : 0 } catch { return 0 } })()
  const samplesCount = (() => { try { const h=localStorage.getItem('voice-samples'); return h ? JSON.parse(h).length : 0 } catch { return 0 } })()
  const abTestsCount = (() => { try { const h=localStorage.getItem('ab-tests'); return h ? JSON.parse(h).length : 0 } catch { return 0 } })()

  const syncTwitter = async () => {
    setSyncing(true); setSyncError('')
    try {
      const res = await fetch(`/api/analytics-sync?username=${encodeURIComponent(twitterUsername)}`)
      const data = await res.json()
      if (data.error) {
        setSyncError(`${data.error}${data.help ? '\n→ ' + data.help : ''}`)
      } else {
        setTwitterData(data)
      }
    } catch { setSyncError('Connexion impossible') }
    finally { setSyncing(false) }
  }

  const accent = network === 'linkedin' ? 'var(--li)' : 'var(--accent)'

  return (
    <>
      <Head><title>Dashboard — Ismaa</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Dashboard" subtitle="Vue globale, vraies stats, ce qui marche">
        <div className="page">
          {/* Top stats */}
          <div className="stats">
            <Stat label="Posts trackés" value={insights.totalPosts.toString()} accent={accent} />
            <Stat label="Impressions/post" value={insights.avgImpressions ? insights.avgImpressions.toLocaleString() : '0'} />
            <Stat label="Engagement" value={`${insights.avgEngagementRate}%`} />
            <Stat label="Tendance 7j" value={insights.trend === 'up' ? '↗' : insights.trend === 'down' ? '↘' : '→'} accent={insights.trend === 'up' ? '#4ade80' : insights.trend === 'down' ? '#f87171' : undefined} />
          </div>

          {/* Activity */}
          <div className="row">
            <ActItem label="Posts générés (total)" value={historyCount} />
            <ActItem label="Voice samples" value={samplesCount} />
            <ActItem label="A/B tests" value={abTestsCount} />
            <ActItem label="Voice profile" value={voiceProfile ? '✓' : '—'} />
          </div>

          {/* Twitter sync */}
          <div className="sync-card">
            <h3>Sync Twitter API (vraies stats live)</h3>
            <div className="sync-row">
              <input
                type="text"
                placeholder="username (sans @)"
                value={twitterUsername}
                onChange={e => setTwitterUsername(e.target.value)}
                className="input"
              />
              <button onClick={syncTwitter} disabled={syncing} className="sync-btn">
                {syncing ? 'Sync...' : 'Synchroniser'}
              </button>
            </div>
            {syncError && <div className="sync-err">{syncError}</div>}
            {twitterData && (
              <div className="sync-result">
                <div className="sr-row">
                  <Stat label="Followers" value={twitterData.profile.followers.toLocaleString()} accent="#1da1f2" />
                  <Stat label="Posts récents" value={twitterData.summary.count.toString()} />
                  <Stat label="Impressions (20)" value={twitterData.summary.totalImpressions.toLocaleString()} />
                  <Stat label="ER moyen" value={`${twitterData.summary.avgER}%`} />
                </div>
                <h4>20 derniers tweets (live)</h4>
                <div className="tweets">
                  {twitterData.tweets.slice(0, 10).map((t: any) => (
                    <div key={t.id} className="tweet">
                      <div className="tw-text">{t.text.slice(0, 120)}{t.text.length > 120 ? '...' : ''}</div>
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

          {/* What works */}
          {insights.totalPosts >= 5 && (
            <div className="works">
              <h3>Ce qui marche le mieux pour toi</h3>
              <div className="works-grid">
                {insights.topFormat && (
                  <Insight label="Top format" value={insights.topFormat.format} score={`Score ${insights.topFormat.score.toFixed(1)}`} />
                )}
                {insights.topHook && (
                  <Insight
                    label="Top hook"
                    value={`"${HOOKS.find(h => h.id === insights.topHook!.hookId)?.text || `#${insights.topHook.hookId}`}"`}
                    score={`Score ${insights.topHook.score.toFixed(1)}`}
                  />
                )}
                {insights.topFramework && (
                  <Insight label="Top framework" value={insights.topFramework.framework} score={`Score ${insights.topFramework.score.toFixed(1)}`} />
                )}
                {insights.topNetwork && (
                  <Insight label="Top réseau" value={insights.topNetwork === 'twitter' ? 'Twitter / X' : 'LinkedIn'} />
                )}
              </div>
            </div>
          )}

          {/* Top posts */}
          {insights.bestPosts.length > 0 && (
            <div>
              <h3 className="sec-title">Tes 5 meilleurs posts</h3>
              <div className="board">
                {insights.bestPosts.map((p, i) => (
                  <div key={p.id} className="board-row">
                    <span className="board-rank">#{i + 1}</span>
                    <span className="board-net">{p.network === 'twitter' ? 'X' : 'in'}</span>
                    <span className="board-text">{p.text.slice(0, 80)}...</span>
                    <span className="board-er">Score {viralityScore(p)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {insights.totalPosts === 0 && !twitterData && (
            <div className="empty">
              <p>Aucune donnée encore.</p>
              <p>→ Va sur <strong>/performance</strong> pour rentrer les stats de tes posts</p>
              <p>→ Ou configure <code>TWITTER_BEARER_TOKEN</code> pour sync auto</p>
            </div>
          )}
        </div>

        <style jsx>{`
          .page { display: flex; flex-direction: column; gap: 14px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
          @media (max-width: 600px) { .stats { grid-template-columns: repeat(2, 1fr); } }
          .row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
          @media (max-width: 600px) { .row { grid-template-columns: repeat(2, 1fr); } }

          .sync-card, .works { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
          .sync-card h3, .works h3 { margin: 0 0 10px; font-size: 13px; font-weight: 700; }
          .sync-row { display: flex; gap: 6px; }
          .input { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 12px; padding: 8px 10px; outline: none; font-family: var(--mono); }
          .sync-btn { background: var(--text); color: var(--bg); border: none; border-radius: var(--radius-sm); padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; }
          .sync-btn:disabled { opacity: .5; }
          .sync-err { font-size: 11px; color: #f87171; padding: 8px 10px; background: rgba(239,68,68,.08); border-radius: var(--radius-sm); margin-top: 8px; white-space: pre-wrap; }
          .sync-result { margin-top: 12px; }
          .sync-result h4 { font-size: 12px; font-weight: 700; margin: 12px 0 6px; }
          .sr-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px; }
          @media (max-width: 600px) { .sr-row { grid-template-columns: repeat(2, 1fr); } }

          .tweets { display: flex; flex-direction: column; gap: 4px; max-height: 320px; overflow-y: auto; }
          .tweet { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 10px; }
          .tw-text { font-size: 11px; color: var(--text); line-height: 1.5; }
          .tw-stats { display: flex; gap: 10px; font-size: 10px; color: var(--muted); font-family: var(--mono); margin-top: 4px; }

          .works-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
          @media (max-width: 600px) { .works-grid { grid-template-columns: 1fr; } }

          .sec-title { font-size: 13px; font-weight: 700; margin: 0 0 8px; }
          .board { display: flex; flex-direction: column; gap: 4px; }
          .board-row { display: flex; align-items: center; gap: 8px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 10px; }
          .board-rank { font-size: 12px; font-weight: 800; color: ${accent}; font-family: var(--mono); width: 28px; }
          .board-net { font-size: 9px; font-weight: 700; color: var(--muted); width: 18px; font-family: var(--mono); }
          .board-text { flex: 1; font-size: 11px; color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .board-er { font-size: 11px; font-weight: 700; color: #4ade80; font-family: var(--mono); }

          .empty { background: var(--card); border: 1px dashed var(--border); border-radius: var(--radius); padding: 24px; text-align: center; font-size: 12px; color: var(--text2); line-height: 1.8; }
          .empty p { margin: 0; }
          .empty code { background: var(--bg); padding: 2px 6px; border-radius: 3px; font-family: var(--mono); font-size: 11px; }
        `}</style>
      </Layout>
    </>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--mono)' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent || 'var(--text)', marginTop: 4, fontFamily: 'var(--mono)' }}>{value}</div>
    </div>
  )
}

function ActItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Insight({ label, value, score }: { label: string; value: string; score?: string }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--mono)' }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 4, lineHeight: 1.4 }}>{value}</div>
      {score && <div style={{ fontSize: 10, color: '#4ade80', marginTop: 4, fontFamily: 'var(--mono)' }}>{score}</div>}
    </div>
  )
}
