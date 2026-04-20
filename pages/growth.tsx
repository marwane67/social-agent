import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type Tab = 'comments' | 'hooks' | 'targets' | 'tracker'
type Comment = { type: string; text: string; strategy: string }
type Hook = { id: string; text: string; rating: number; network: Network; date: string }
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
  const [targetPost, setTargetPost] = useState(''); const [targetAuthor, setTargetAuthor] = useState(''); const [comments, setComments] = useState<Comment[]>([]); const [commentLoading, setCommentLoading] = useState(false); const [copiedC, setCopiedC] = useState<number | null>(null)
  const [hooks, setHooks] = useState<Hook[]>([]); const [newHook, setNewHook] = useState('')
  const [targets, setTargets] = useState<Target[]>([]); const [newTarget, setNewTarget] = useState({ handle: '', name: '', why: '' })
  const [tracked, setTracked] = useState<TrackedPost[]>([]); const [newTracked, setNewTracked] = useState({ text: '', likes: 0, replies: 0, reposts: 0, views: 0, notes: '' })

  useEffect(() => { try { const h=localStorage.getItem('sa-hooks'); if(h)setHooks(JSON.parse(h)); const t=localStorage.getItem('sa-targets'); if(t)setTargets(JSON.parse(t)); const tr=localStorage.getItem('sa-tracker'); if(tr)setTracked(JSON.parse(tr)) } catch{} }, [])
  const saveH = (h: Hook[]) => { setHooks(h); localStorage.setItem('sa-hooks', JSON.stringify(h)) }
  const saveT = (t: Target[]) => { setTargets(t); localStorage.setItem('sa-targets', JSON.stringify(t)) }
  const saveTr = (t: TrackedPost[]) => { setTracked(t); localStorage.setItem('sa-tracker', JSON.stringify(t)) }

  const genComments = async () => {
    if (!targetPost.trim()) return; setCommentLoading(true); setComments([])
    try { const r = await fetch('/api/comment', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ post:targetPost, author:targetAuthor, network }) }); const d = await r.json(); if(d.comments) setComments(d.comments) } catch(e) { console.error(e) } finally { setCommentLoading(false) }
  }

  const accent = network === 'linkedin' ? 'var(--li)' : 'var(--accent)'

  return (
    <>
      <Head><title>Growth — Marwane</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Growth Hub" subtitle="Stratégie de croissance">
        <div className="page-content">
          <div className="tabs">
            {TABS.map(t => <button key={t.id} className={`tab ${tab === t.id ? 'tab-on' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
          </div>

          {/* Comments */}
          {tab === 'comments' && (
            <div className="tab-body">
              <input className="input-sm" placeholder="@handle de l'auteur" value={targetAuthor} onChange={e => setTargetAuthor(e.target.value)} />
              <textarea className="input" placeholder="Colle le post que tu veux commenter..." value={targetPost} onChange={e => setTargetPost(e.target.value)} rows={4} />
              <button className={`primary-btn ${commentLoading ? 'btn-loading' : ''}`} onClick={genComments} disabled={commentLoading}>
                {commentLoading ? 'Analyse...' : 'Générer 3 commentaires'}
              </button>
              {comments.map((c, i) => (
                <div key={i} className="res-card">
                  <div className="res-top"><span className="res-badge">{c.type}</span><button className="copy-sm" onClick={() => { navigator.clipboard.writeText(c.text); setCopiedC(i); setTimeout(() => setCopiedC(null), 2000) }}>{copiedC === i ? 'Copié' : 'Copier'}</button></div>
                  <div className="res-text">{c.text}</div>
                  <div className="res-meta">{c.strategy}</div>
                </div>
              ))}
            </div>
          )}

          {/* Hooks */}
          {tab === 'hooks' && (
            <div className="tab-body">
              <div className="add-row"><input className="input-sm flex" placeholder="Sauvegarde un hook qui marche..." value={newHook} onChange={e => setNewHook(e.target.value)} /><button className="sm-btn" onClick={() => { if(newHook.trim()) { saveH([{ id:Date.now().toString(), text:newHook, rating:0, network, date:new Date().toLocaleDateString('fr-FR') }, ...hooks]); setNewHook('') } }}>+</button></div>
              {hooks.filter(h => h.network === network).sort((a,b) => b.rating - a.rating).map(h => (
                <div key={h.id} className="hook-card">
                  <div className="hook-text">{h.text}</div>
                  <div className="hook-bottom">
                    <div className="stars">{[1,2,3,4,5].map(n => <button key={n} className={`star ${h.rating >= n ? 'star-on' : ''}`} onClick={() => saveH(hooks.map(x => x.id === h.id ? {...x, rating:n} : x))}>*</button>)}</div>
                    <span className="hook-date">{h.date}</span>
                    <button className="del" onClick={() => saveH(hooks.filter(x => x.id !== h.id))}>x</button>
                  </div>
                </div>
              ))}
              {hooks.filter(h => h.network === network).length === 0 && <div className="empty">Sauvegarde tes meilleures premières lignes ici</div>}
            </div>
          )}

          {/* Targets */}
          {tab === 'targets' && (
            <div className="tab-body">
              <input className="input-sm" placeholder="@handle" value={newTarget.handle} onChange={e => setNewTarget({...newTarget, handle:e.target.value})} />
              <input className="input-sm" placeholder="Nom / Description" value={newTarget.name} onChange={e => setNewTarget({...newTarget, name:e.target.value})} />
              <input className="input-sm" placeholder="Pourquoi l'engager" value={newTarget.why} onChange={e => setNewTarget({...newTarget, why:e.target.value})} />
              <button className="secondary-btn" onClick={() => { if(newTarget.handle.trim()) { saveT([...targets, { id:Date.now().toString(), ...newTarget, network, engaged:false }]); setNewTarget({handle:'',name:'',why:''}) } }}>Ajouter</button>
              {targets.filter(t => t.network === network).map(t => (
                <div key={t.id} className={`target-card ${t.engaged ? 'target-done' : ''}`}>
                  <button className={`check ${t.engaged ? 'checked' : ''}`} onClick={() => saveT(targets.map(x => x.id === t.id ? {...x, engaged:!x.engaged} : x))}>{t.engaged ? 'V' : ''}</button>
                  <div className="target-info">
                    <span className="target-handle">{t.handle}</span>
                    <span className="target-name">{t.name}</span>
                    {t.why && <span className="target-why">{t.why}</span>}
                  </div>
                  <button className="del" onClick={() => saveT(targets.filter(x => x.id !== t.id))}>x</button>
                </div>
              ))}
              {targets.filter(t => t.network === network).length === 0 && <div className="empty">Ajoute les comptes à engager en priorité</div>}
            </div>
          )}

          {/* Tracker */}
          {tab === 'tracker' && (
            <div className="tab-body">
              <textarea className="input" placeholder="Le texte du post..." value={newTracked.text} onChange={e => setNewTracked({...newTracked, text:e.target.value})} rows={3} />
              <div className="metrics-row">
                {(['likes','replies','reposts','views'] as const).map(k => (
                  <div key={k} className="metric">
                    <label>{k}</label>
                    <input type="number" value={newTracked[k]} onChange={e => setNewTracked({...newTracked, [k]:+e.target.value})} />
                  </div>
                ))}
              </div>
              <input className="input-sm" placeholder="Notes (format, heure...)" value={newTracked.notes} onChange={e => setNewTracked({...newTracked, notes:e.target.value})} />
              <button className="secondary-btn" onClick={() => { if(newTracked.text.trim()) { saveTr([{ id:Date.now().toString(), network, date:new Date().toLocaleDateString('fr-FR'), ...newTracked }, ...tracked]); setNewTracked({text:'',likes:0,replies:0,reposts:0,views:0,notes:''}) } }}>Tracker</button>
              {tracked.filter(t => t.network === network).map(p => {
                const er = p.views > 0 ? ((p.likes+p.replies+p.reposts)/p.views*100) : 0
                return (
                  <div key={p.id} className="tracked-card">
                    <div className="tracked-text">{p.text.slice(0,100)}{p.text.length>100?'...':''}</div>
                    <div className="tracked-metrics"><span>{p.likes} likes</span><span>{p.replies} replies</span><span>{p.reposts} reposts</span><span>{p.views} views</span></div>
                    <div className="tracked-bottom"><span className="tracked-er">ER: {er.toFixed(2)}%</span><span className="tracked-date">{p.date} {p.notes && `· ${p.notes}`}</span><button className="del" onClick={() => saveTr(tracked.filter(x => x.id !== p.id))}>x</button></div>
                  </div>
                )
              })}
              {tracked.filter(t => t.network === network).length === 0 && <div className="empty">Commence à tracker tes posts</div>}
            </div>
          )}
        </div>

        <style jsx>{`
          .page-content { display:flex; flex-direction:column; gap:12px; }
          .tabs { display:flex; gap:4px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:4px; }
          .tab { flex:1; padding:8px; background:transparent; border:1px solid transparent; border-radius:var(--radius-sm); font-size:11px; font-weight:600; color:var(--muted); cursor:pointer; text-align:center; }
          .tab-on { background:${network==='linkedin'?'var(--li-dim)':'var(--accent-dim)'}; border-color:${network==='linkedin'?'var(--li-border)':'var(--accent-border)'}; color:${accent}; }
          .tab-body { display:flex; flex-direction:column; gap:8px; }

          .input { width:100%; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); color:var(--text); font-size:14px; padding:10px 12px; resize:none; outline:none; line-height:1.6; }
          .input-sm { width:100%; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); padding:8px 10px; font-size:12px; outline:none; }
          .input-sm.flex { flex:1; }
          .add-row { display:flex; gap:6px; }

          .primary-btn { width:100%; padding:10px; background:var(--text); color:var(--bg); border:none; border-radius:var(--radius); font-size:13px; font-weight:700; cursor:pointer; }
          .primary-btn:hover { background:${accent}; color:${network==='linkedin'?'#fff':'#000'}; }
          .btn-loading { opacity:.6; cursor:not-allowed; }
          .secondary-btn { width:100%; padding:8px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:12px; color:var(--text2); cursor:pointer; font-weight:600; }
          .secondary-btn:hover { border-color:${accent}; color:${accent}; }
          .sm-btn { background:${accent}; color:${network==='linkedin'?'#fff':'#000'}; border:none; border-radius:var(--radius-sm); padding:6px 12px; font-size:14px; font-weight:800; cursor:pointer; flex-shrink:0; }

          .res-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:12px; }
          .res-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
          .res-badge { font-size:9px; font-weight:700; color:${accent}; font-family:var(--mono); text-transform:uppercase; background:${network==='linkedin'?'var(--li-dim)':'var(--accent-dim)'}; padding:2px 8px; border-radius:20px; }
          .res-text { font-size:13px; color:var(--text); line-height:1.6; }
          .res-meta { font-size:10px; color:var(--muted); margin-top:4px; font-style:italic; }
          .copy-sm { background:var(--card2); border:1px solid var(--border); border-radius:4px; padding:2px 8px; font-size:9px; color:var(--muted); cursor:pointer; }
          .copy-sm:hover { border-color:${accent}; color:${accent}; }

          .hook-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:10px; }
          .hook-text { font-size:13px; color:var(--text); margin-bottom:6px; }
          .hook-bottom { display:flex; align-items:center; gap:8px; }
          .stars { display:flex; gap:1px; }
          .star { background:none; border:none; color:var(--border); font-size:16px; cursor:pointer; padding:0 1px; }
          .star-on { color:${accent}; }
          .hook-date { font-size:9px; color:var(--muted); font-family:var(--mono); }
          .del { background:none; border:none; color:var(--muted); font-size:12px; cursor:pointer; margin-left:auto; }
          .del:hover { color:var(--danger); }

          .target-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:10px; display:flex; align-items:flex-start; gap:8px; }
          .target-done { opacity:.4; }
          .check { width:18px; height:18px; background:var(--card2); border:1px solid var(--border); border-radius:4px; color:${accent}; font-size:10px; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
          .checked { background:${network==='linkedin'?'var(--li-dim)':'var(--accent-dim)'}; border-color:${accent}; }
          .target-info { flex:1; display:flex; flex-direction:column; gap:1px; }
          .target-handle { font-size:12px; font-weight:700; color:${accent}; font-family:var(--mono); }
          .target-name { font-size:12px; color:var(--text); }
          .target-why { font-size:10px; color:var(--muted); }

          .metrics-row { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
          .metric { display:flex; flex-direction:column; gap:2px; }
          .metric label { font-size:9px; color:var(--muted); font-family:var(--mono); text-transform:capitalize; }
          .metric input { background:var(--card); border:1px solid var(--border); border-radius:6px; color:var(--text); padding:6px; font-size:12px; outline:none; font-family:var(--mono); width:100%; }

          .tracked-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:10px; }
          .tracked-text { font-size:12px; color:var(--text); margin-bottom:4px; }
          .tracked-metrics { display:flex; gap:10px; font-size:10px; color:var(--text2); font-family:var(--mono); margin-bottom:4px; }
          .tracked-bottom { display:flex; align-items:center; gap:8px; }
          .tracked-er { font-size:11px; font-weight:700; color:${accent}; font-family:var(--mono); }
          .tracked-date { font-size:9px; color:var(--muted); font-family:var(--mono); }

          .empty { font-size:12px; color:var(--muted); text-align:center; padding:20px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); }

          @media (max-width:600px) { .tabs { flex-wrap:wrap; } .metrics-row { grid-template-columns:repeat(2,1fr); } }
        `}</style>
      </Layout>
    </>
  )
}
