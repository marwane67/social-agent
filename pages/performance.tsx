import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { PostPerformance, getPerformances, savePerformance, updatePerformance, deletePerformance, computeInsights, viralityScore } from '../lib/performance'
import { HOOKS } from '../lib/hooks'

type Network = 'twitter' | 'linkedin'

export default function PerformancePage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [perfs, setPerfs] = useState<PostPerformance[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [text, setText] = useState('')
  const [fNetwork, setFNetwork] = useState<Network>('twitter')
  const [format, setFormat] = useState('raw_build')
  const [hookId, setHookId] = useState<string>('')
  const [framework, setFramework] = useState('')
  const [postedAt, setPostedAt] = useState(new Date().toISOString().split('T')[0])
  const [impressions, setImpressions] = useState('')
  const [likes, setLikes] = useState('')
  const [replies, setReplies] = useState('')
  const [reposts, setReposts] = useState('')
  const [saves, setSaves] = useState('')
  const [followersGained, setFollowersGained] = useState('')

  useEffect(() => { setPerfs(getPerformances()) }, [])

  const insights = useMemo(() => computeInsights(perfs), [perfs])

  const resetForm = () => {
    setText(''); setHookId(''); setFramework(''); setImpressions(''); setLikes(''); setReplies('')
    setReposts(''); setSaves(''); setFollowersGained(''); setEditingId(null); setShowForm(false)
  }

  const submit = () => {
    if (!text.trim() || !impressions) return
    const data = {
      text: text.trim(), network: fNetwork, format,
      hookId: hookId ? Number(hookId) : undefined,
      framework: framework || undefined,
      postedAt: new Date(postedAt).toISOString(),
      impressions: Number(impressions) || 0,
      likes: Number(likes) || 0,
      replies: Number(replies) || 0,
      reposts: Number(reposts) || 0,
      saves: saves ? Number(saves) : undefined,
      followers_gained: followersGained ? Number(followersGained) : undefined,
    }
    if (editingId) updatePerformance(editingId, data)
    else savePerformance(data)
    setPerfs(getPerformances())
    resetForm()
  }

  const startEdit = (p: PostPerformance) => {
    setEditingId(p.id); setText(p.text); setFNetwork(p.network); setFormat(p.format)
    setHookId(p.hookId?.toString() || ''); setFramework(p.framework || '')
    setPostedAt(p.postedAt.split('T')[0])
    setImpressions(p.impressions.toString()); setLikes(p.likes.toString())
    setReplies(p.replies.toString()); setReposts(p.reposts.toString())
    setSaves(p.saves?.toString() || ''); setFollowersGained(p.followers_gained?.toString() || '')
    setShowForm(true)
  }

  const remove = (id: string) => {
    if (!confirm('Supprimer ?')) return
    deletePerformance(id)
    setPerfs(getPerformances())
  }

  const trendEmoji = insights.trend === 'up' ? '📈' : insights.trend === 'down' ? '📉' : '→'

  return (
    <>
      <Head><title>Performance — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Performance" subtitle="L'IA apprend ce qui marche pour toi">
        <div className="page">
          {/* Insights cards */}
          <div className="insights-grid">
            <Stat label="Posts trackés" value={insights.totalPosts.toString()} />
            <Stat label="Impressions/post" value={insights.avgImpressions.toLocaleString()} />
            <Stat label="Engagement moyen" value={`${insights.avgEngagementRate}%`} />
            <Stat label="Tendance 7j" value={trendEmoji} />
          </div>

          {/* What works */}
          {insights.totalPosts >= 5 && (
            <div className="works-card">
              <h3>Ce qui marche pour toi (basé sur la data)</h3>
              <div className="works-grid">
                {insights.topFormat && (
                  <div className="works-item">
                    <div className="wi-label">Meilleur format</div>
                    <div className="wi-value">{insights.topFormat.format}</div>
                    <div className="wi-score">Score {insights.topFormat.score.toFixed(1)}</div>
                  </div>
                )}
                {insights.topHook && (
                  <div className="works-item">
                    <div className="wi-label">Meilleur hook</div>
                    <div className="wi-value">"{HOOKS.find(h => h.id === insights.topHook!.hookId)?.text || `#${insights.topHook.hookId}`}"</div>
                    <div className="wi-score">Score {insights.topHook.score.toFixed(1)}</div>
                  </div>
                )}
                {insights.topFramework && (
                  <div className="works-item">
                    <div className="wi-label">Meilleur framework</div>
                    <div className="wi-value">{insights.topFramework.framework}</div>
                    <div className="wi-score">Score {insights.topFramework.score.toFixed(1)}</div>
                  </div>
                )}
                {insights.topNetwork && (
                  <div className="works-item">
                    <div className="wi-label">Meilleur réseau</div>
                    <div className="wi-value">{insights.topNetwork === 'twitter' ? 'Twitter / X' : 'LinkedIn'}</div>
                  </div>
                )}
              </div>
              <p className="works-note">L'IA utilise ces patterns à chaque génération.</p>
            </div>
          )}

          {/* Top posts */}
          {insights.bestPosts.length > 0 && (
            <div>
              <h3 className="section-title">Tes 5 meilleurs posts</h3>
              <div className="top-posts">
                {insights.bestPosts.map((p, i) => (
                  <div key={p.id} className="top-post">
                    <div className="tp-rank">#{i + 1}</div>
                    <div className="tp-body">
                      <div className="tp-text">{p.text.slice(0, 180)}{p.text.length > 180 ? '...' : ''}</div>
                      <div className="tp-stats">
                        <span>{p.impressions.toLocaleString()} vues</span>
                        <span>{p.likes} likes</span>
                        <span>{p.replies} replies</span>
                        <span className="tp-score">Score {viralityScore(p)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add button */}
          {!showForm && (
            <button className="primary-btn" onClick={() => setShowForm(true)}>
              + Tracker un nouveau post
            </button>
          )}

          {/* Form */}
          {showForm && (
            <div className="form-card">
              <div className="form-head">
                <h3>{editingId ? 'Modifier' : 'Nouveau post'}</h3>
                <button onClick={resetForm} className="close">×</button>
              </div>
              <textarea
                placeholder="Texte du post..."
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                className="textarea"
              />
              <div className="form-row">
                <select value={fNetwork} onChange={e => setFNetwork(e.target.value as Network)} className="select">
                  <option value="twitter">Twitter / X</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
                <input type="text" placeholder="Format (ex: raw_build)" value={format} onChange={e => setFormat(e.target.value)} className="input" />
                <input type="date" value={postedAt} onChange={e => setPostedAt(e.target.value)} className="input" />
              </div>
              <div className="form-row">
                <input type="number" placeholder="Hook ID (optionnel)" value={hookId} onChange={e => setHookId(e.target.value)} className="input" />
                <select value={framework} onChange={e => setFramework(e.target.value)} className="select">
                  <option value="">Pas de framework</option>
                  <option value="hero_journey">Voyage du héros</option>
                  <option value="golden_circle">Cercle d'Or</option>
                  <option value="freytag">Pyramide Freytag</option>
                  <option value="before_after_bridge">Before/After/Bridge</option>
                  <option value="pas">PAS</option>
                </select>
              </div>
              <div className="form-row">
                <input type="number" placeholder="Impressions *" value={impressions} onChange={e => setImpressions(e.target.value)} className="input" />
                <input type="number" placeholder="Likes" value={likes} onChange={e => setLikes(e.target.value)} className="input" />
                <input type="number" placeholder="Replies" value={replies} onChange={e => setReplies(e.target.value)} className="input" />
              </div>
              <div className="form-row">
                <input type="number" placeholder="Reposts" value={reposts} onChange={e => setReposts(e.target.value)} className="input" />
                <input type="number" placeholder="Saves" value={saves} onChange={e => setSaves(e.target.value)} className="input" />
                <input type="number" placeholder="Followers gagnés" value={followersGained} onChange={e => setFollowersGained(e.target.value)} className="input" />
              </div>
              <button onClick={submit} className="submit-btn">
                {editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          )}

          {/* All posts list */}
          {perfs.length > 0 && !showForm && (
            <div>
              <h3 className="section-title">Tous tes posts trackés ({perfs.length})</h3>
              <div className="all-posts">
                {perfs.map(p => (
                  <div key={p.id} className="row">
                    <div className="row-net">{p.network === 'twitter' ? 'X' : 'in'}</div>
                    <div className="row-text">{p.text.slice(0, 120)}...</div>
                    <div className="row-stats">
                      <span>{p.impressions.toLocaleString()}</span>
                      <span>· {p.likes} ❤</span>
                      <span>· score {viralityScore(p)}</span>
                    </div>
                    <button onClick={() => startEdit(p)} className="row-btn">Edit</button>
                    <button onClick={() => remove(p.id)} className="row-btn">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .page { display: flex; flex-direction: column; gap: 16px; }
          .insights-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          @media (max-width: 600px) { .insights-grid { grid-template-columns: repeat(2, 1fr); } }

          .works-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
          .works-card h3 { margin: 0 0 12px; font-size: 14px; font-weight: 700; }
          .works-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          @media (max-width: 600px) { .works-grid { grid-template-columns: 1fr; } }
          .works-item { background: var(--bg); border-radius: var(--radius-sm); padding: 10px; border: 1px solid var(--border); }
          .wi-label { font-size: 9px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; font-family: var(--mono); }
          .wi-value { font-size: 13px; color: var(--text); margin-top: 4px; font-weight: 600; }
          .wi-score { font-size: 10px; color: #4ade80; margin-top: 4px; font-family: var(--mono); }
          .works-note { font-size: 11px; color: var(--muted); margin: 12px 0 0; }

          .section-title { font-size: 13px; font-weight: 700; color: var(--text); margin: 0 0 8px; }

          .top-posts { display: flex; flex-direction: column; gap: 6px; }
          .top-post { display: flex; gap: 10px; padding: 10px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
          .tp-rank { font-size: 14px; font-weight: 800; color: var(--accent); font-family: var(--mono); width: 32px; flex-shrink: 0; }
          .tp-body { flex: 1; min-width: 0; }
          .tp-text { font-size: 12px; color: var(--text); line-height: 1.5; }
          .tp-stats { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px; font-size: 10px; color: var(--muted); font-family: var(--mono); }
          .tp-score { color: #4ade80; font-weight: 700; }

          .primary-btn { padding: 12px; background: var(--text); color: var(--bg); border: none; border-radius: var(--radius); font-size: 13px; font-weight: 700; cursor: pointer; }
          .primary-btn:hover { opacity: .9; }

          .form-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; display: flex; flex-direction: column; gap: 8px; }
          .form-head { display: flex; justify-content: space-between; align-items: center; }
          .form-head h3 { margin: 0; font-size: 14px; }
          .close { background: transparent; border: none; color: var(--muted); font-size: 22px; cursor: pointer; line-height: 1; }
          .form-row { display: flex; gap: 6px; }
          .textarea, .input, .select { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 12px; padding: 8px 10px; outline: none; font-family: var(--font); flex: 1; min-width: 0; }
          .textarea { resize: vertical; line-height: 1.5; }
          .submit-btn { background: var(--text); color: var(--bg); border: none; border-radius: var(--radius-sm); padding: 10px; font-size: 12px; font-weight: 700; cursor: pointer; margin-top: 4px; }

          .all-posts { display: flex; flex-direction: column; gap: 4px; }
          .row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
          .row-net { font-size: 9px; font-weight: 700; font-family: var(--mono); width: 20px; color: var(--muted); }
          .row-text { flex: 1; font-size: 11px; color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .row-stats { font-size: 10px; color: var(--muted); font-family: var(--mono); display: flex; gap: 4px; flex-shrink: 0; }
          .row-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); font-size: 10px; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-family: var(--mono); }
          .row-btn:hover { color: var(--text); border-color: var(--border2); }
        `}</style>
      </Layout>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--mono)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>{value}</div>
    </div>
  )
}
