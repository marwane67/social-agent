import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type TrackedPost = { id: string; text: string; network: Network; date: string; likes: number; replies: number; reposts: number; views: number; notes: string }

export default function DashboardPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [posts, setPosts] = useState<TrackedPost[]>([])
  const [analysis, setAnalysis] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => { try { const tr = localStorage.getItem('sa-tracker'); if(tr) setPosts(JSON.parse(tr)) } catch {} }, [])

  const filtered = posts.filter(p => p.network === network)
  const totalLikes = filtered.reduce((s,p) => s+p.likes, 0)
  const totalReplies = filtered.reduce((s,p) => s+p.replies, 0)
  const totalReposts = filtered.reduce((s,p) => s+p.reposts, 0)
  const totalViews = filtered.reduce((s,p) => s+p.views, 0)
  const avgER = totalViews > 0 ? ((totalLikes+totalReplies+totalReposts)/totalViews*100) : 0
  const best = [...filtered].sort((a,b) => (b.likes+b.replies+b.reposts)-(a.likes+a.replies+a.reposts))[0]
  const historyCount = (() => { try { const h=localStorage.getItem('social-agent-history'); return h ? JSON.parse(h).length : 0 } catch { return 0 } })()
  const hookCount = (() => { try { const h=localStorage.getItem('sa-hooks'); return h ? JSON.parse(h).length : 0 } catch { return 0 } })()

  const runAnalysis = async () => {
    if (filtered.length < 2) return; setAnalyzing(true)
    try {
      const dataStr = filtered.map(p => `"${p.text.slice(0,100)}..." | L:${p.likes} R:${p.replies} RP:${p.reposts} V:${p.views} ER:${p.views>0?((p.likes+p.replies+p.reposts)/p.views*100).toFixed(2):'0'}% | ${p.notes} | ${p.date}`).join('\n')
      const res = await fetch('/api/tools', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ input:dataStr, tool:'analyze', network }) })
      const data = await res.json(); if(data.analysis) setAnalysis(data.analysis)
    } catch(e) { console.error(e) } finally { setAnalyzing(false) }
  }

  const accent = network === 'linkedin' ? 'var(--li)' : 'var(--accent)'

  return (
    <>
      <Head><title>Dashboard — Ismaa</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout network={network} onNetworkChange={n => { setNetwork(n); setAnalysis(null) }} title="Dashboard" subtitle="Vue globale de ta performance">
        <div className="page-content">
          {/* Stats */}
          <div className="stats">
            <div className="stat main"><div className="stat-val big">{avgER.toFixed(2)}%</div><div className="stat-lbl">Engagement Rate</div></div>
            <div className="stat"><div className="stat-val">{filtered.length}</div><div className="stat-lbl">Posts trackés</div></div>
            <div className="stat"><div className="stat-val">{totalLikes}</div><div className="stat-lbl">Likes</div></div>
            <div className="stat"><div className="stat-val">{totalReplies}</div><div className="stat-lbl">Replies</div></div>
            <div className="stat"><div className="stat-val">{totalReposts}</div><div className="stat-lbl">Reposts</div></div>
            <div className="stat"><div className="stat-val">{totalViews > 1000 ? (totalViews/1000).toFixed(1)+'K' : totalViews}</div><div className="stat-lbl">Vues</div></div>
          </div>

          {/* Activity */}
          <div className="label">Activité</div>
          <div className="activity">
            <div className="act-item"><span className="act-num">{historyCount}</span><span className="act-lbl">posts générés</span></div>
            <div className="act-item"><span className="act-num">{hookCount}</span><span className="act-lbl">hooks sauvés</span></div>
          </div>

          {/* Best */}
          {best && (
            <>
              <div className="label">Meilleur post</div>
              <div className="best">
                <div className="best-text">{best.text.slice(0,150)}{best.text.length>150?'...':''}</div>
                <div className="best-metrics">
                  <span>{best.likes} likes</span><span>{best.replies} replies</span><span>{best.reposts} reposts</span>
                  <span className="best-er">ER: {best.views>0?((best.likes+best.replies+best.reposts)/best.views*100).toFixed(2):'0'}%</span>
                </div>
              </div>
            </>
          )}

          {/* Leaderboard */}
          {filtered.length > 0 && (
            <>
              <div className="label">Classement par ER</div>
              <div className="board">
                {[...filtered].sort((a,b) => { const ea=a.views>0?(a.likes+a.replies+a.reposts)/a.views:0; const eb=b.views>0?(b.likes+b.replies+b.reposts)/b.views:0; return eb-ea }).slice(0,8).map((p,i) => (
                  <div key={p.id} className="board-row">
                    <span className="board-rank">#{i+1}</span>
                    <span className="board-text">{p.text.slice(0,50)}...</span>
                    <span className="board-er">{p.views>0?((p.likes+p.replies+p.reposts)/p.views*100).toFixed(2):'0'}%</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Analysis */}
          <div className="label">Analyse IA</div>
          {filtered.length < 2 ? (
            <div className="empty">Tracke au moins 2 posts dans Growth &gt; A/B Tracker</div>
          ) : (
            <button className={`primary-btn ${analyzing ? 'btn-loading' : ''}`} onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? 'Analyse...' : 'Lancer l\'analyse'}
            </button>
          )}

          {analysis && (
            <div className="an-grid">
              {[
                { l: 'Meilleur format', v: analysis.best_format },
                { l: 'Meilleur créneau', v: analysis.best_time },
                { l: 'Style de hook', v: analysis.best_hook_style },
                { l: 'Tendance', v: analysis.engagement_trend },
              ].map((x,i) => <div key={i} className="an-card"><div className="an-label">{x.l}</div><div className="an-val">{x.v}</div></div>)}
              {analysis.weak_spot && <div className="an-card full weak"><div className="an-label">Point faible</div><div className="an-val">{analysis.weak_spot}</div></div>}
              {analysis.recommendations && <div className="an-card full"><div className="an-label">Recommandations</div>{analysis.recommendations.map((r: string, i: number) => <div key={i} className="an-rec">{i+1}. {r}</div>)}</div>}
              {analysis.next_week_plan && <div className="an-card full plan"><div className="an-label">Plan semaine prochaine</div><div className="an-val">{analysis.next_week_plan}</div></div>}
            </div>
          )}
        </div>

        <style jsx>{`
          .page-content { display:flex; flex-direction:column; gap:14px; }
          .label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
          .empty { font-size:12px; color:var(--muted); text-align:center; padding:20px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); }

          .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
          .stat { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:12px; text-align:center; }
          .stat.main { grid-column:span 3; border-color:${network==='linkedin'?'var(--li-border)':'var(--accent-border)'}; }
          .stat-val { font-size:20px; font-weight:900; color:var(--text); font-family:var(--mono); }
          .stat-val.big { font-size:36px; color:${accent}; }
          .stat-lbl { font-size:10px; color:var(--muted); font-family:var(--mono); margin-top:2px; }

          .activity { display:flex; gap:6px; }
          .act-item { flex:1; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:10px; text-align:center; }
          .act-num { font-size:18px; font-weight:900; color:${accent}; font-family:var(--mono); display:block; }
          .act-lbl { font-size:9px; color:var(--muted); font-family:var(--mono); }

          .best { background:var(--card); border:1px solid ${network==='linkedin'?'var(--li-border)':'var(--accent-border)'}; border-radius:var(--radius); padding:12px; }
          .best-text { font-size:13px; color:var(--text); line-height:1.5; margin-bottom:6px; }
          .best-metrics { display:flex; gap:10px; font-size:10px; color:var(--text2); font-family:var(--mono); flex-wrap:wrap; }
          .best-er { color:${accent}; font-weight:700; }

          .board { display:flex; flex-direction:column; gap:3px; }
          .board-row { display:flex; align-items:center; gap:8px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:7px 10px; }
          .board-rank { font-size:11px; font-weight:900; color:${accent}; font-family:var(--mono); width:24px; }
          .board-text { font-size:11px; color:var(--text2); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .board-er { font-size:11px; font-weight:700; color:${accent}; font-family:var(--mono); }

          .primary-btn { width:100%; padding:12px; background:var(--text); color:var(--bg); border:none; border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer; }
          .primary-btn:hover { background:${accent}; color:${network==='linkedin'?'#fff':'#000'}; }
          .btn-loading { opacity:.6; cursor:not-allowed; }

          .an-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
          .an-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:10px; }
          .an-card.full { grid-column:span 2; }
          .an-card.weak { border-color:rgba(239,68,68,.2); }
          .an-card.plan { border-color:${network==='linkedin'?'var(--li-border)':'var(--accent-border)'}; }
          .an-label { font-size:9px; font-weight:700; color:${accent}; font-family:var(--mono); text-transform:uppercase; margin-bottom:4px; }
          .an-card.weak .an-label { color:var(--danger); }
          .an-val { font-size:12px; color:var(--text); line-height:1.5; }
          .an-rec { font-size:12px; color:var(--text); margin-bottom:3px; }

          @media (max-width:600px) { .stats { grid-template-columns:repeat(2,1fr); } .stat.main { grid-column:span 2; } .an-grid { grid-template-columns:1fr; } .an-card.full { grid-column:span 1; } }
        `}</style>
      </Layout>
    </>
  )
}
