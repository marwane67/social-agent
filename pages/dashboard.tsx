import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type Network = 'twitter' | 'linkedin'
type TrackedPost = { id: string; text: string; network: Network; date: string; likes: number; replies: number; reposts: number; views: number; notes: string }

export default function DashboardPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [posts, setPosts] = useState<TrackedPost[]>([])
  const [analysis, setAnalysis] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    try {
      const tr = localStorage.getItem('sa-tracker')
      if (tr) setPosts(JSON.parse(tr))
    } catch {}
  }, [])

  const filtered = posts.filter(p => p.network === network)
  const totalLikes = filtered.reduce((s, p) => s + p.likes, 0)
  const totalReplies = filtered.reduce((s, p) => s + p.replies, 0)
  const totalReposts = filtered.reduce((s, p) => s + p.reposts, 0)
  const totalViews = filtered.reduce((s, p) => s + p.views, 0)
  const avgER = totalViews > 0 ? ((totalLikes + totalReplies + totalReposts) / totalViews * 100) : 0
  const bestPost = [...filtered].sort((a, b) => (b.likes + b.replies + b.reposts) - (a.likes + a.replies + a.reposts))[0]
  const historyCount = (() => { try { const h = localStorage.getItem('social-agent-history'); return h ? JSON.parse(h).length : 0 } catch { return 0 } })()
  const scheduleCount = (() => { try { const s = localStorage.getItem('social-agent-schedule'); return s ? JSON.parse(s).filter((p: any) => p.status === 'scheduled').length : 0 } catch { return 0 } })()
  const hookCount = (() => { try { const h = localStorage.getItem('sa-hooks'); return h ? JSON.parse(h).length : 0 } catch { return 0 } })()

  const runAnalysis = async () => {
    if (filtered.length < 2) return
    setAnalyzing(true)
    try {
      const dataStr = filtered.map(p =>
        `Post: "${p.text.slice(0, 100)}..." | Likes: ${p.likes} | Replies: ${p.replies} | Reposts: ${p.reposts} | Views: ${p.views} | ER: ${p.views > 0 ? ((p.likes + p.replies + p.reposts) / p.views * 100).toFixed(2) : '0'}% | Notes: ${p.notes} | Date: ${p.date}`
      ).join('\n')

      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: dataStr, tool: 'analyze', network }),
      })
      const data = await res.json()
      if (data.analysis) setAnalysis(data.analysis)
    } catch (e) { console.error(e) }
    finally { setAnalyzing(false) }
  }

  const accent = network === 'linkedin' ? '#0a66c2' : '#39ff14'
  const accentBg = network === 'linkedin' ? 'rgba(10,102,194,' : 'rgba(57,255,20,'

  return (
    <>
      <Head>
        <title>Dashboard — Ismaa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="page">
        <div className="wrapper">
          <header className="header">
            <div className="header-left">
              <div className="logo">D</div>
              <div>
                <div className="logo-title">Dashboard</div>
                <div className="logo-sub">Vue globale de ta performance</div>
              </div>
            </div>
            <div className="header-right">
              <Link href="/" className="nav-link">Posts</Link>
              <Link href="/tools" className="nav-link">Tools</Link>
              <Link href="/growth" className="nav-link">Growth</Link>
              <Link href="/schedule" className="nav-link">Sched</Link>
            </div>
          </header>

          <div className="network-switch">
            <button className={`net-btn ${network === 'twitter' ? 'net-active' : ''}`} onClick={() => { setNetwork('twitter'); setAnalysis(null) }}>X · Twitter</button>
            <button className={`net-btn ${network === 'linkedin' ? 'net-active net-li' : ''}`} onClick={() => { setNetwork('linkedin'); setAnalysis(null) }}>in · LinkedIn</button>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card main-stat">
              <div className="stat-value">{avgER.toFixed(2)}%</div>
              <div className="stat-label">Engagement Rate moyen</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{filtered.length}</div>
              <div className="stat-label">Posts trackés</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalLikes}</div>
              <div className="stat-label">Total likes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalReplies}</div>
              <div className="stat-label">Total replies</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalReposts}</div>
              <div className="stat-label">Total reposts</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalViews > 1000 ? (totalViews / 1000).toFixed(1) + 'K' : totalViews}</div>
              <div className="stat-label">Total vues</div>
            </div>
          </div>

          {/* Activity */}
          <div className="section-label">ACTIVITÉ</div>
          <div className="activity-grid">
            <div className="activity-card">
              <div className="activity-num">{historyCount}</div>
              <div className="activity-label">Posts générés</div>
            </div>
            <div className="activity-card">
              <div className="activity-num">{scheduleCount}</div>
              <div className="activity-label">Posts programmés</div>
            </div>
            <div className="activity-card">
              <div className="activity-num">{hookCount}</div>
              <div className="activity-label">Hooks sauvegardés</div>
            </div>
          </div>

          {/* Best Post */}
          {bestPost && (
            <>
              <div className="section-label">MEILLEUR POST</div>
              <div className="best-card">
                <div className="best-text">{bestPost.text.slice(0, 150)}{bestPost.text.length > 150 ? '...' : ''}</div>
                <div className="best-metrics">
                  <span>{bestPost.likes} likes</span>
                  <span>{bestPost.replies} replies</span>
                  <span>{bestPost.reposts} reposts</span>
                  <span>{bestPost.views} views</span>
                  <span className="best-er">
                    ER: {bestPost.views > 0 ? ((bestPost.likes + bestPost.replies + bestPost.reposts) / bestPost.views * 100).toFixed(2) : '0'}%
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Leaderboard */}
          {filtered.length > 0 && (
            <>
              <div className="section-label">CLASSEMENT PAR ENGAGEMENT</div>
              <div className="leaderboard">
                {[...filtered]
                  .sort((a, b) => {
                    const erA = a.views > 0 ? (a.likes + a.replies + a.reposts) / a.views : 0
                    const erB = b.views > 0 ? (b.likes + b.replies + b.reposts) / b.views : 0
                    return erB - erA
                  })
                  .slice(0, 10)
                  .map((post, i) => {
                    const er = post.views > 0 ? ((post.likes + post.replies + post.reposts) / post.views * 100) : 0
                    return (
                      <div key={post.id} className="lb-row">
                        <span className="lb-rank">#{i + 1}</span>
                        <span className="lb-text">{post.text.slice(0, 60)}...</span>
                        <span className="lb-er">{er.toFixed(2)}%</span>
                      </div>
                    )
                  })}
              </div>
            </>
          )}

          {/* AI Analysis */}
          <div className="section-label">ANALYSE IA</div>
          {filtered.length < 2 ? (
            <div className="empty">Tracke au moins 2 posts dans le Growth Hub pour débloquer l'analyse IA.</div>
          ) : (
            <button className={`gen-btn ${analyzing ? 'disabled' : ''}`} onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? 'Analyse en cours...' : 'Lancer l\'analyse de performance'}
            </button>
          )}

          {analysis && (
            <div className="analysis">
              <div className="analysis-grid">
                <div className="an-card">
                  <div className="an-label">MEILLEUR FORMAT</div>
                  <div className="an-value">{analysis.best_format}</div>
                </div>
                <div className="an-card">
                  <div className="an-label">MEILLEUR CRÉNEAU</div>
                  <div className="an-value">{analysis.best_time}</div>
                </div>
                <div className="an-card">
                  <div className="an-label">MEILLEUR STYLE DE HOOK</div>
                  <div className="an-value">{analysis.best_hook_style}</div>
                </div>
                <div className="an-card">
                  <div className="an-label">TENDANCE ENGAGEMENT</div>
                  <div className="an-value">{analysis.engagement_trend}</div>
                </div>
              </div>

              {analysis.top_post && (
                <div className="an-card full">
                  <div className="an-label">TOP POST</div>
                  <div className="an-value">{analysis.top_post}</div>
                </div>
              )}

              {analysis.weak_spot && (
                <div className="an-card full weak">
                  <div className="an-label">POINT FAIBLE</div>
                  <div className="an-value">{analysis.weak_spot}</div>
                </div>
              )}

              {analysis.recommendations && (
                <div className="an-card full">
                  <div className="an-label">RECOMMANDATIONS</div>
                  {analysis.recommendations.map((r: string, i: number) => (
                    <div key={i} className="an-rec">{i + 1}. {r}</div>
                  ))}
                </div>
              )}

              {analysis.next_week_plan && (
                <div className="an-card full plan">
                  <div className="an-label">PLAN SEMAINE PROCHAINE</div>
                  <div className="an-value">{analysis.next_week_plan}</div>
                </div>
              )}
            </div>
          )}

          <div className="footer">Built by Pixel Company · Ismaa · Brussels</div>
        </div>
      </div>

      <style jsx>{`
        .page { min-height:100vh; background:#080808; }
        .wrapper { max-width:720px; margin:0 auto; padding:24px 16px 60px; display:flex; flex-direction:column; gap:12px; }
        .header { display:flex; align-items:center; justify-content:space-between; }
        .header-left { display:flex; align-items:center; gap:10px; }
        .header-right { display:flex; gap:5px; }
        .logo { width:38px; height:38px; background:${accent}; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:${network==='linkedin'?'#fff':'#000'}; }
        .logo-title { font-size:16px; font-weight:800; color:#fff; }
        .logo-sub { font-size:10px; color:#555; font-family:'JetBrains Mono',monospace; }
        .nav-link { background:#161616; border:1px solid #2a2a2a; border-radius:8px; padding:4px 8px; font-size:10px; color:#888; text-decoration:none; font-weight:600; font-family:'Syne',sans-serif; }
        .nav-link:hover { border-color:${accent}; color:${accent}; }

        .network-switch { display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#0f0f0f; border:1px solid #1e1e1e; border-radius:12px; padding:5px; }
        .net-btn { background:transparent; border:1px solid transparent; border-radius:8px; padding:8px; color:#555; font-size:13px; font-weight:600; cursor:pointer; text-align:center; font-family:'Syne',sans-serif; }
        .net-active { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.15); color:#fff; }
        .net-li { background:rgba(10,102,194,.1); border-color:rgba(10,102,194,.3); color:#0a66c2; }

        .section-label { font-size:10px; color:#444; font-family:'JetBrains Mono',monospace; letter-spacing:.08em; margin-top:4px; }

        /* Stats */
        .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
        .stat-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:10px; padding:12px; text-align:center; }
        .main-stat { grid-column:span 3; border-color:${accentBg}0.2); }
        .stat-value { font-size:24px; font-weight:900; color:#fff; font-family:'JetBrains Mono',monospace; }
        .main-stat .stat-value { font-size:36px; color:${accent}; }
        .stat-label { font-size:10px; color:#555; font-family:'JetBrains Mono',monospace; margin-top:2px; }

        .activity-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
        .activity-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:10px; padding:10px; text-align:center; }
        .activity-num { font-size:20px; font-weight:900; color:${accent}; font-family:'JetBrains Mono',monospace; }
        .activity-label { font-size:9px; color:#555; font-family:'JetBrains Mono',monospace; }

        /* Best Post */
        .best-card { background:#0f0f0f; border:1px solid ${accentBg}0.2); border-radius:10px; padding:12px; }
        .best-text { font-size:13px; color:#ddd; line-height:1.5; margin-bottom:8px; }
        .best-metrics { display:flex; gap:10px; font-size:10px; color:#666; font-family:'JetBrains Mono',monospace; flex-wrap:wrap; }
        .best-er { color:${accent}; font-weight:700; }

        /* Leaderboard */
        .leaderboard { display:flex; flex-direction:column; gap:4px; }
        .lb-row { display:flex; align-items:center; gap:8px; background:#0f0f0f; border:1px solid #1e1e1e; border-radius:8px; padding:8px 10px; }
        .lb-rank { font-size:11px; font-weight:900; color:${accent}; font-family:'JetBrains Mono',monospace; width:28px; }
        .lb-text { font-size:11px; color:#aaa; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .lb-er { font-size:11px; font-weight:700; color:${accent}; font-family:'JetBrains Mono',monospace; }

        .gen-btn { background:${accent}; color:${network==='linkedin'?'#fff':'#000'}; border:none; border-radius:10px; padding:12px; font-size:14px; font-weight:800; cursor:pointer; font-family:'Syne',sans-serif; }
        .gen-btn.disabled { opacity:.5; cursor:not-allowed; }
        .empty { font-size:12px; color:#444; text-align:center; padding:16px; background:#0c0c0c; border:1px solid #1a1a1a; border-radius:8px; }

        /* Analysis */
        .analysis { display:flex; flex-direction:column; gap:8px; }
        .analysis-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .an-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:10px; padding:10px; }
        .an-card.full { grid-column:span 2; }
        .an-card.weak { border-color:rgba(239,68,68,.2); }
        .an-card.plan { border-color:${accentBg}0.3); }
        .an-label { font-size:9px; color:${accent}; font-weight:700; font-family:'JetBrains Mono',monospace; margin-bottom:4px; text-transform:uppercase; }
        .an-card.weak .an-label { color:#ef4444; }
        .an-value { font-size:12px; color:#ddd; line-height:1.5; }
        .an-rec { font-size:12px; color:#ddd; margin-bottom:4px; line-height:1.4; }

        .footer { text-align:center; font-size:10px; color:#222; font-family:'JetBrains Mono',monospace; margin-top:16px; }

        @media (max-width:600px) {
          .stats-grid { grid-template-columns:repeat(2,1fr); }
          .main-stat { grid-column:span 2; }
          .analysis-grid { grid-template-columns:1fr; }
          .an-card.full { grid-column:span 1; }
          .activity-grid { grid-template-columns:repeat(3,1fr); }
        }
      `}</style>
    </>
  )
}
