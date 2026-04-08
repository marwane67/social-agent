import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type Network = 'twitter' | 'linkedin'
type Tab = 'comments' | 'hooks' | 'targets' | 'tracker'
type Comment = { type: string; text: string; strategy: string }
type Hook = { id: string; text: string; rating: number; network: Network; format: string; date: string }
type Target = { id: string; handle: string; name: string; why: string; network: Network; engaged: boolean }
type TrackedPost = { id: string; text: string; network: Network; date: string; likes: number; replies: number; reposts: number; views: number; notes: string }

const TABS: { id: Tab; label: string }[] = [
  { id: 'comments', label: 'Comment Strategy' },
  { id: 'hooks', label: 'Hook Bank' },
  { id: 'targets', label: 'Target List' },
  { id: 'tracker', label: 'A/B Tracker' },
]

export default function GrowthPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [tab, setTab] = useState<Tab>('comments')

  // Comment Strategy
  const [targetPost, setTargetPost] = useState('')
  const [targetAuthor, setTargetAuthor] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [commentLoading, setCommentLoading] = useState(false)
  const [copiedComment, setCopiedComment] = useState<number | null>(null)

  // Hook Bank
  const [hooks, setHooks] = useState<Hook[]>([])
  const [newHook, setNewHook] = useState('')
  const [newHookFormat, setNewHookFormat] = useState('')

  // Target List
  const [targets, setTargets] = useState<Target[]>([])
  const [newTarget, setNewTarget] = useState({ handle: '', name: '', why: '' })

  // A/B Tracker
  const [trackedPosts, setTrackedPosts] = useState<TrackedPost[]>([])
  const [newTracked, setNewTracked] = useState({ text: '', likes: 0, replies: 0, reposts: 0, views: 0, notes: '' })

  useEffect(() => {
    try {
      const h = localStorage.getItem('sa-hooks'); if (h) setHooks(JSON.parse(h))
      const t = localStorage.getItem('sa-targets'); if (t) setTargets(JSON.parse(t))
      const tr = localStorage.getItem('sa-tracker'); if (tr) setTrackedPosts(JSON.parse(tr))
    } catch {}
  }, [])

  const saveHooks = (h: Hook[]) => { setHooks(h); localStorage.setItem('sa-hooks', JSON.stringify(h)) }
  const saveTargets = (t: Target[]) => { setTargets(t); localStorage.setItem('sa-targets', JSON.stringify(t)) }
  const saveTracked = (t: TrackedPost[]) => { setTrackedPosts(t); localStorage.setItem('sa-tracker', JSON.stringify(t)) }

  const generateComments = async () => {
    if (!targetPost.trim()) return
    setCommentLoading(true)
    setComments([])
    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: targetPost, author: targetAuthor, network }),
      })
      const data = await res.json()
      if (data.comments) setComments(data.comments)
    } catch (e) { console.error(e) }
    finally { setCommentLoading(false) }
  }

  const addHook = () => {
    if (!newHook.trim()) return
    saveHooks([{ id: Date.now().toString(), text: newHook, rating: 0, network, format: newHookFormat, date: new Date().toLocaleDateString('fr-FR') }, ...hooks])
    setNewHook('')
    setNewHookFormat('')
  }

  const rateHook = (id: string, rating: number) => saveHooks(hooks.map(h => h.id === id ? { ...h, rating } : h))
  const deleteHook = (id: string) => saveHooks(hooks.filter(h => h.id !== id))

  const addTarget = () => {
    if (!newTarget.handle.trim()) return
    saveTargets([...targets, { id: Date.now().toString(), ...newTarget, network, engaged: false }])
    setNewTarget({ handle: '', name: '', why: '' })
  }

  const toggleEngaged = (id: string) => saveTargets(targets.map(t => t.id === id ? { ...t, engaged: !t.engaged } : t))
  const deleteTarget = (id: string) => saveTargets(targets.filter(t => t.id !== id))

  const addTracked = () => {
    if (!newTracked.text.trim()) return
    saveTracked([{ id: Date.now().toString(), network, date: new Date().toLocaleDateString('fr-FR'), ...newTracked }, ...trackedPosts])
    setNewTracked({ text: '', likes: 0, replies: 0, reposts: 0, views: 0, notes: '' })
  }

  const deleteTracked = (id: string) => saveTracked(trackedPosts.filter(t => t.id !== id))

  const accent = network === 'linkedin' ? '#0a66c2' : '#39ff14'
  const accentBg = network === 'linkedin' ? 'rgba(10,102,194,' : 'rgba(57,255,20,'

  return (
    <>
      <Head>
        <title>Growth — Ismaa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="page">
        <div className="wrapper">
          <header className="header">
            <div className="header-left">
              <div className="logo">G</div>
              <div>
                <div className="logo-title">Growth Hub</div>
                <div className="logo-sub">Stratégie de croissance</div>
              </div>
            </div>
            <div className="header-right">
              <Link href="/" className="nav-link">Posts</Link>
              <Link href="/reply" className="nav-link">Reply</Link>
              <Link href="/schedule" className="nav-link">Schedule</Link>
            </div>
          </header>

          <div className="network-switch">
            <button className={`net-btn ${network === 'twitter' ? 'net-active' : ''}`} onClick={() => setNetwork('twitter')}>X · Twitter</button>
            <button className={`net-btn ${network === 'linkedin' ? 'net-active net-li' : ''}`} onClick={() => setNetwork('linkedin')}>in · LinkedIn</button>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {TABS.map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? 'tab-active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>

          {/* Comment Strategy */}
          {tab === 'comments' && (
            <div className="tab-content">
              <div className="section-label">COLLE LE POST À COMMENTER</div>
              <input className="text-input" placeholder="@handle ou nom de l'auteur" value={targetAuthor} onChange={e => setTargetAuthor(e.target.value)} />
              <textarea className="text-area" placeholder="Colle le post que tu veux commenter stratégiquement..." value={targetPost} onChange={e => setTargetPost(e.target.value)} rows={4} />
              <button className={`gen-btn ${commentLoading ? 'disabled' : ''}`} onClick={generateComments} disabled={commentLoading}>
                {commentLoading ? 'Analyse...' : 'Générer 3 commentaires stratégiques'}
              </button>
              {comments.map((c, i) => (
                <div key={i} className="comment-card">
                  <div className="comment-type">{c.type}</div>
                  <div className="comment-text">{c.text}</div>
                  <div className="comment-strategy">{c.strategy}</div>
                  <button className="copy-btn" onClick={() => { navigator.clipboard.writeText(c.text); setCopiedComment(i); setTimeout(() => setCopiedComment(null), 2000) }}>
                    {copiedComment === i ? 'Copié' : 'Copier'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hook Bank */}
          {tab === 'hooks' && (
            <div className="tab-content">
              <div className="section-label">AJOUTER UN HOOK</div>
              <div className="add-row">
                <input className="text-input flex-1" placeholder="Le hook qui a marché..." value={newHook} onChange={e => setNewHook(e.target.value)} />
                <input className="text-input small" placeholder="Format" value={newHookFormat} onChange={e => setNewHookFormat(e.target.value)} />
                <button className="small-btn" onClick={addHook}>+</button>
              </div>

              <div className="section-label">MES HOOKS ({hooks.filter(h => h.network === network).length})</div>
              {hooks.filter(h => h.network === network).sort((a, b) => b.rating - a.rating).map(hook => (
                <div key={hook.id} className="hook-card">
                  <div className="hook-text">{hook.text}</div>
                  <div className="hook-meta">
                    <div className="hook-rating">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} className={`star ${hook.rating >= n ? 'star-active' : ''}`} onClick={() => rateHook(hook.id, n)}>*</button>
                      ))}
                    </div>
                    {hook.format && <span className="hook-format">{hook.format}</span>}
                    <span className="hook-date">{hook.date}</span>
                    <button className="del-btn" onClick={() => deleteHook(hook.id)}>x</button>
                  </div>
                </div>
              ))}
              {hooks.filter(h => h.network === network).length === 0 && <div className="empty">Pas encore de hooks. Sauvegarde tes meilleures premières lignes ici.</div>}
            </div>
          )}

          {/* Target List */}
          {tab === 'targets' && (
            <div className="tab-content">
              <div className="section-label">AJOUTER UN COMPTE À ENGAGER</div>
              <div className="target-form">
                <input className="text-input" placeholder="@handle" value={newTarget.handle} onChange={e => setNewTarget({ ...newTarget, handle: e.target.value })} />
                <input className="text-input" placeholder="Nom / Description" value={newTarget.name} onChange={e => setNewTarget({ ...newTarget, name: e.target.value })} />
                <input className="text-input" placeholder="Pourquoi l'engager (audience, expertise...)" value={newTarget.why} onChange={e => setNewTarget({ ...newTarget, why: e.target.value })} />
                <button className="small-btn wide" onClick={addTarget}>Ajouter à la liste</button>
              </div>

              <div className="section-label">COMPTES À ENGAGER ({targets.filter(t => t.network === network).length})</div>
              {targets.filter(t => t.network === network).map(target => (
                <div key={target.id} className={`target-card ${target.engaged ? 'engaged' : ''}`}>
                  <button className={`check-btn ${target.engaged ? 'checked' : ''}`} onClick={() => toggleEngaged(target.id)}>
                    {target.engaged ? 'V' : ''}
                  </button>
                  <div className="target-info">
                    <div className="target-handle">{target.handle}</div>
                    <div className="target-name">{target.name}</div>
                    <div className="target-why">{target.why}</div>
                  </div>
                  <button className="del-btn" onClick={() => deleteTarget(target.id)}>x</button>
                </div>
              ))}
              {targets.filter(t => t.network === network).length === 0 && <div className="empty">Liste vide. Ajoute les comptes que tu veux engager en priorité.</div>}
            </div>
          )}

          {/* A/B Tracker */}
          {tab === 'tracker' && (
            <div className="tab-content">
              <div className="section-label">TRACKER UN POST</div>
              <textarea className="text-area" placeholder="Le texte du post..." value={newTracked.text} onChange={e => setNewTracked({ ...newTracked, text: e.target.value })} rows={3} />
              <div className="metrics-row">
                <div className="metric-input">
                  <label>Likes</label>
                  <input type="number" value={newTracked.likes} onChange={e => setNewTracked({ ...newTracked, likes: +e.target.value })} />
                </div>
                <div className="metric-input">
                  <label>Replies</label>
                  <input type="number" value={newTracked.replies} onChange={e => setNewTracked({ ...newTracked, replies: +e.target.value })} />
                </div>
                <div className="metric-input">
                  <label>Reposts</label>
                  <input type="number" value={newTracked.reposts} onChange={e => setNewTracked({ ...newTracked, reposts: +e.target.value })} />
                </div>
                <div className="metric-input">
                  <label>Views</label>
                  <input type="number" value={newTracked.views} onChange={e => setNewTracked({ ...newTracked, views: +e.target.value })} />
                </div>
              </div>
              <input className="text-input" placeholder="Notes (quel format, quelle heure, etc.)" value={newTracked.notes} onChange={e => setNewTracked({ ...newTracked, notes: e.target.value })} />
              <button className="gen-btn" onClick={addTracked}>Tracker ce post</button>

              <div className="section-label">POSTS TRACKÉS ({trackedPosts.filter(t => t.network === network).length})</div>
              {trackedPosts.filter(t => t.network === network).map(post => (
                <div key={post.id} className="tracked-card">
                  <div className="tracked-text">{post.text.slice(0, 100)}{post.text.length > 100 ? '...' : ''}</div>
                  <div className="tracked-metrics">
                    <span>{post.likes} likes</span>
                    <span>{post.replies} replies</span>
                    <span>{post.reposts} reposts</span>
                    <span>{post.views} views</span>
                  </div>
                  <div className="tracked-meta">
                    <span>{post.date}</span>
                    {post.notes && <span>· {post.notes}</span>}
                  </div>
                  <div className="tracked-er">
                    ER: {post.views > 0 ? ((post.likes + post.replies + post.reposts) / post.views * 100).toFixed(2) : '0'}%
                  </div>
                  <button className="del-btn" onClick={() => deleteTracked(post.id)}>x</button>
                </div>
              ))}
              {trackedPosts.filter(t => t.network === network).length === 0 && <div className="empty">Commence à tracker tes posts pour identifier ce qui marche le mieux.</div>}
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
        .header-right { display:flex; gap:6px; }
        .logo { width:38px; height:38px; background:${accent}; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:${network==='linkedin'?'#fff':'#000'}; }
        .logo-title { font-size:16px; font-weight:800; color:#fff; }
        .logo-sub { font-size:10px; color:#555; font-family:'JetBrains Mono',monospace; }
        .nav-link { background:#161616; border:1px solid #2a2a2a; border-radius:8px; padding:5px 10px; font-size:10px; color:#888; text-decoration:none; font-weight:600; font-family:'Syne',sans-serif; }
        .nav-link:hover { border-color:${accent}; color:${accent}; }

        .network-switch { display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#0f0f0f; border:1px solid #1e1e1e; border-radius:12px; padding:5px; }
        .net-btn { background:transparent; border:1px solid transparent; border-radius:8px; padding:8px; color:#555; font-size:13px; font-weight:600; cursor:pointer; text-align:center; font-family:'Syne',sans-serif; }
        .net-active { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.15); color:#fff; }
        .net-li { background:rgba(10,102,194,.1); border-color:rgba(10,102,194,.3); color:#0a66c2; }

        .tabs { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; background:#0c0c0c; border:1px solid #1a1a1a; border-radius:10px; padding:4px; }
        .tab { background:transparent; border:1px solid transparent; border-radius:8px; padding:8px 4px; color:#555; font-size:10px; font-weight:700; cursor:pointer; font-family:'Syne',sans-serif; text-align:center; }
        .tab-active { background:${accentBg}0.06); border-color:${accentBg}0.2); color:${accent}; }

        .tab-content { display:flex; flex-direction:column; gap:10px; }
        .section-label { font-size:10px; color:#444; font-family:'JetBrains Mono',monospace; letter-spacing:.08em; }

        .text-input { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:8px; color:#ddd; padding:8px 10px; font-size:12px; outline:none; font-family:'Syne',sans-serif; width:100%; }
        .text-input.small { max-width:100px; }
        .text-input.flex-1 { flex:1; }
        .text-area { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:8px; color:#ddd; padding:10px; font-size:13px; outline:none; resize:none; line-height:1.6; font-family:'Syne',sans-serif; width:100%; }

        .add-row { display:flex; gap:6px; align-items:center; }
        .target-form { display:flex; flex-direction:column; gap:6px; }

        .gen-btn { background:${accent}; color:${network==='linkedin'?'#fff':'#000'}; border:none; border-radius:10px; padding:10px; font-size:13px; font-weight:800; cursor:pointer; font-family:'Syne',sans-serif; width:100%; }
        .gen-btn.disabled { opacity:.5; cursor:not-allowed; }
        .small-btn { background:${accent}; color:${network==='linkedin'?'#fff':'#000'}; border:none; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:800; cursor:pointer; font-family:'Syne',sans-serif; flex-shrink:0; }
        .small-btn.wide { width:100%; }

        /* Comments */
        .comment-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:10px; padding:12px; }
        .comment-type { font-size:9px; font-weight:700; color:${accent}; font-family:'JetBrains Mono',monospace; text-transform:uppercase; margin-bottom:6px; }
        .comment-text { font-size:13px; color:#ddd; line-height:1.6; margin-bottom:6px; }
        .comment-strategy { font-size:10px; color:#555; font-style:italic; margin-bottom:6px; }
        .copy-btn { background:#161616; border:1px solid #2a2a2a; border-radius:6px; padding:4px 10px; font-size:10px; color:#888; cursor:pointer; font-family:'Syne',sans-serif; }
        .copy-btn:hover { border-color:${accent}; color:${accent}; }

        /* Hooks */
        .hook-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:10px; padding:10px; }
        .hook-text { font-size:13px; color:#ddd; line-height:1.5; margin-bottom:6px; }
        .hook-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .hook-rating { display:flex; gap:2px; }
        .star { background:none; border:none; color:#333; font-size:16px; cursor:pointer; padding:0 2px; }
        .star-active { color:${accent}; }
        .hook-format { font-size:9px; color:#666; font-family:'JetBrains Mono',monospace; background:#161616; padding:2px 6px; border-radius:4px; }
        .hook-date { font-size:9px; color:#444; font-family:'JetBrains Mono',monospace; }
        .del-btn { background:none; border:none; color:#444; font-size:12px; cursor:pointer; margin-left:auto; }
        .del-btn:hover { color:#ef4444; }

        /* Targets */
        .target-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:10px; padding:10px; display:flex; align-items:flex-start; gap:8px; }
        .target-card.engaged { opacity:.5; }
        .check-btn { width:20px; height:20px; background:#161616; border:1px solid #2a2a2a; border-radius:4px; color:${accent}; font-size:10px; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .check-btn.checked { background:${accentBg}0.15); border-color:${accent}; }
        .target-info { flex:1; }
        .target-handle { font-size:12px; font-weight:700; color:${accent}; font-family:'JetBrains Mono',monospace; }
        .target-name { font-size:12px; color:#ddd; }
        .target-why { font-size:10px; color:#555; }

        /* Tracker */
        .metrics-row { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
        .metric-input { display:flex; flex-direction:column; gap:2px; }
        .metric-input label { font-size:9px; color:#555; font-family:'JetBrains Mono',monospace; }
        .metric-input input { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:6px; color:#ddd; padding:6px; font-size:12px; outline:none; font-family:'JetBrains Mono',monospace; width:100%; }

        .tracked-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:10px; padding:10px; position:relative; }
        .tracked-text { font-size:12px; color:#ddd; line-height:1.4; margin-bottom:6px; }
        .tracked-metrics { display:flex; gap:10px; font-size:10px; color:#888; font-family:'JetBrains Mono',monospace; margin-bottom:4px; }
        .tracked-meta { font-size:9px; color:#555; font-family:'JetBrains Mono',monospace; }
        .tracked-er { font-size:11px; font-weight:700; color:${accent}; font-family:'JetBrains Mono',monospace; margin-top:4px; }
        .tracked-card .del-btn { position:absolute; top:8px; right:8px; }

        .empty { font-size:12px; color:#444; text-align:center; padding:16px; }
        .footer { text-align:center; font-size:10px; color:#222; font-family:'JetBrains Mono',monospace; margin-top:16px; }

        @media (max-width:600px) {
          .tabs { grid-template-columns:repeat(2,1fr); }
          .metrics-row { grid-template-columns:repeat(2,1fr); }
          .header-right { gap:4px; }
          .nav-link { padding:4px 7px; font-size:9px; }
        }
      `}</style>
    </>
  )
}
