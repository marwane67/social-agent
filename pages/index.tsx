import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Post = { type: string; text: string }
type Network = 'twitter' | 'linkedin'
type ScoreData = { viral: number; engagement: number; authority: number; overall: number }
type Enhancement = {
  score?: { score: ScoreData; strengths: string[]; weaknesses: string[]; suggestion: string }
  translation?: { translation: string; note: string }
  visual?: { visual: { type: string; description: string; text_on_image: string; colors: string; tool: string; impact: string } }
}
type HistoryEntry = { id: string; network: Network; format: string; input: string; posts: Post[]; date: string }
type Format = { id: string; label: string; desc: string }

const TW_FORMATS: Format[] = [
  { id: 'raw_build', label: 'Raw Build', desc: "Ce que tu as build aujourd'hui" },
  { id: 'hot_take', label: 'Hot Take', desc: 'Opinion tranchée' },
  { id: 'behind_scenes', label: 'BTS', desc: 'Coulisses' },
  { id: 'ai_authority', label: 'AI Authority', desc: 'Référence IA' },
  { id: 'storytelling', label: 'Micro Story', desc: 'Mini histoire' },
  { id: 'engagement_bait', label: 'Reply Magnet', desc: 'Max replies' },
  { id: 'one_liner', label: 'One-Liner', desc: 'Une phrase' },
  { id: 'axora_hype', label: 'Axora Hype', desc: 'FOMO Axora' },
]
const LI_FORMATS: Format[] = [
  { id: 'transparency', label: 'Transparence', desc: 'Chiffres et coulisses' },
  { id: 'thought_leadership', label: 'Thought Leader', desc: 'Expert IA + business' },
  { id: 'storytelling_li', label: 'Storytelling', desc: 'Histoires perso' },
  { id: 'value_bomb', label: 'Value Bomb', desc: '100% valeur' },
  { id: 'axora_linkedin', label: 'Axora Vision', desc: 'Positionner Axora' },
  { id: 'debate_li', label: 'Debate', desc: 'Commentaires' },
  { id: 'personal_brand', label: 'Personal', desc: 'Qui est Ismaa' },
  { id: 'ai_expert_li', label: 'AI Expert', desc: 'IA LinkedIn' },
  { id: 'lead_magnet', label: 'Lead Magnet', desc: 'Capter des emails' },
]

const STARTERS: Record<string, string[]> = {
  raw_build: ["Aujourd'hui j'ai build...", "Décision prise :", "Feature shipped :"],
  hot_take: ["L'IA ne va pas...", "Le marché francophone...", "Unpopular opinion :"],
  behind_scenes: ["Notre stack :", "Process interne :"],
  ai_authority: ["J'utilise Claude pour...", "Le prompt qui a tout changé :"],
  storytelling: ["Il y a 3 mois...", "Le moment où j'ai failli..."],
  engagement_bait: ["Question sincère :", "Vous en pensez quoi ?"],
  one_liner: ["Le business c'est...", "L'IA c'est juste..."],
  axora_hype: ["Nouvelle feature :", "Sneak peek :"],
  transparency: ["Ce mois-ci en chiffres :", "J'ai fait une erreur :"],
  thought_leadership: ["Ce que je vois venir :", "Dans 12 mois..."],
  storytelling_li: ["Il y a 6 mois...", "Ma plus grosse erreur :"],
  value_bomb: ["Mon process exact pour...", "Ce hack m'a fait gagner..."],
  axora_linkedin: ["Pourquoi j'ai créé Axora :", "Le problème avec..."],
  debate_li: ["Opinion impopulaire :", "Le mythe de..."],
  personal_brand: ["Ce que j'ai appris :", "Pourquoi j'ai choisi..."],
  ai_expert_li: ["Avant l'IA vs maintenant :", "Comment on utilise Claude :"],
  lead_magnet: ["Mon framework pour...", "5 prompts IA pour..."],
}

export default function Home() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [format, setFormat] = useState('raw_build')
  const [input, setInput] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [editTexts, setEditTexts] = useState<Record<number, string>>({})
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [enhancements, setEnhancements] = useState<Record<number, Enhancement>>({})
  const [enhLoading, setEnhLoading] = useState<Record<number, string>>({})
  const [activePanel, setActivePanel] = useState<Record<number, string>>({})

  useEffect(() => { try { const h = localStorage.getItem('social-agent-history'); if (h) setHistory(JSON.parse(h)) } catch {} }, [])

  const saveHistory = useCallback((newPosts: Post[], fmt: string, inp: string, net: Network) => {
    const entry: HistoryEntry = { id: Date.now().toString(), network: net, format: fmt, input: inp, posts: newPosts, date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
    const updated = [entry, ...history].slice(0, 50)
    setHistory(updated)
    localStorage.setItem('social-agent-history', JSON.stringify(updated))
  }, [history])

  const formats = network === 'twitter' ? TW_FORMATS : LI_FORMATS
  const maxChars = network === 'twitter' ? 280 : 3000
  const currentFormat = formats.find(f => f.id === format) || formats[0]
  const accent = network === 'linkedin' ? 'var(--li)' : 'var(--accent)'

  const switchNetwork = (n: Network) => {
    setNetwork(n); setFormat(n === 'twitter' ? 'raw_build' : 'transparency')
    setPosts([]); setEditTexts({}); setEditing(null); setEnhancements({}); setActivePanel({})
  }

  const generate = async () => {
    if (!input.trim()) return
    setLoading(true); setPosts([]); setEnhancements({}); setActivePanel({})
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input, format, network }) })
      const data = await res.json()
      if (data.posts) { setPosts(data.posts); setEditTexts({}); setEditing(null); saveHistory(data.posts, format, input, network) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const enhance = async (i: number, action: string) => {
    const text = editTexts[i] ?? posts[i]?.text; if (!text) return
    if (activePanel[i] === action && enhancements[i]?.[action as keyof Enhancement]) { setActivePanel(prev => { const n = { ...prev }; delete n[i]; return n }); return }
    setActivePanel(prev => ({ ...prev, [i]: action }))
    if (enhancements[i]?.[action as keyof Enhancement]) return
    setEnhLoading(prev => ({ ...prev, [i]: action }))
    try {
      const res = await fetch('/api/enhance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: text, action, network }) })
      const data = await res.json()
      setEnhancements(prev => ({ ...prev, [i]: { ...prev[i], [action]: data } }))
    } catch (e) { console.error(e) } finally { setEnhLoading(prev => { const n = { ...prev }; delete n[i]; return n }) }
  }

  const copyPost = (i: number) => { navigator.clipboard.writeText(editTexts[i] ?? posts[i].text); setCopied(i); setTimeout(() => setCopied(null), 2000) }
  const openPost = (i: number) => {
    const text = encodeURIComponent(editTexts[i] ?? posts[i].text)
    window.open(network === 'twitter' ? `https://twitter.com/intent/tweet?text=${text}` : `https://www.linkedin.com/feed/?shareActive=true&text=${text}`, '_blank')
  }
  const toggleEdit = (i: number) => { if (editing === i) setEditing(null); else { setEditing(i); if (!editTexts[i]) setEditTexts(prev => ({ ...prev, [i]: posts[i].text })) } }
  const charCount = (i: number) => (editTexts[i] ?? posts[i]?.text ?? '').length
  const loadFromHistory = (entry: HistoryEntry) => { setNetwork(entry.network); setFormat(entry.format); setInput(entry.input); setPosts(entry.posts); setEditTexts({}); setEditing(null); setEnhancements({}); setActivePanel({}); setShowHistory(false) }

  return (
    <>
      <Head><title>Social Agent — Ismaa</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout network={network} onNetworkChange={switchNetwork} title="Créer un post" subtitle={`${network === 'twitter' ? 'Twitter/X' : 'LinkedIn'} · ${currentFormat.label}`}>
        <div className="page-content">
          {/* Top actions */}
          <div className="top-actions">
            <button className="ghost-btn" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? 'Fermer' : `Historique (${history.length})`}
            </button>
          </div>

          {/* History */}
          {showHistory && (
            <div className="history-panel">
              {history.length === 0 && <div className="empty">Aucun post généré</div>}
              {history.slice(0, 15).map(e => (
                <button key={e.id} className="history-item" onClick={() => loadFromHistory(e)}>
                  <span className="hi-net">{e.network === 'twitter' ? 'X' : 'LI'}</span>
                  <span className="hi-text">{e.posts[0]?.text.slice(0, 70)}...</span>
                  <span className="hi-date">{e.date}</span>
                </button>
              ))}
            </div>
          )}

          {/* Format */}
          <div className="section">
            <label className="label">Format</label>
            <div className="format-grid">
              {formats.map(f => (
                <button key={f.id} className={`fmt-btn ${format === f.id ? 'fmt-active' : ''}`} onClick={() => setFormat(f.id)}>
                  <span className="fmt-name">{f.label}</span>
                  <span className="fmt-desc">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="section">
            <label className="label">Contexte</label>
            <div className="input-wrap">
              <textarea className="input" placeholder="Décris ce qui se passe : une décision, un chiffre, une galère, une victoire..." value={input} onChange={e => setInput(e.target.value)} rows={4} onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate() }} />
              <div className="starters">
                {(STARTERS[format] || []).map(s => (
                  <button key={s} className="starter" onClick={() => setInput(p => p ? p + ' ' + s : s)}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate */}
          <button className={`primary-btn ${loading ? 'btn-loading' : ''}`} onClick={generate} disabled={loading} style={{ '--accent': accent } as any}>
            {loading ? 'Génération en cours...' : `Générer 3 posts · ${currentFormat.label}`}
          </button>

          {/* Results */}
          {posts.length > 0 && (
            <div className="results">
              {posts.map((post, i) => (
                <div key={i} className="post-card">
                  {/* Header */}
                  <div className="pc-header">
                    <div className="pc-avatar" style={{ background: network === 'linkedin' ? 'var(--li)' : '#fff', color: network === 'linkedin' ? '#fff' : '#000' }}>I</div>
                    <div className="pc-info">
                      <span className="pc-name">Ismaa</span>
                      <span className="pc-handle">{network === 'twitter' ? '@ismaa_pxl' : 'Fondateur · Axora & Pulsa'}</span>
                    </div>
                    <span className="pc-badge">{post.type}</span>
                  </div>

                  {/* Text */}
                  {editing === i ? (
                    <textarea className="pc-edit" value={editTexts[i] ?? post.text} onChange={e => setEditTexts(prev => ({ ...prev, [i]: e.target.value }))} rows={network === 'linkedin' ? 10 : 5} autoFocus />
                  ) : (
                    <div className="pc-text">{(editTexts[i] ?? post.text).split('\n').map((l, j, a) => <span key={j}>{l}{j < a.length - 1 && <br />}</span>)}</div>
                  )}

                  {/* Enhance buttons */}
                  <div className="pc-enhance">
                    {['score', 'translate', 'visual'].map(action => (
                      <button key={action} className={`enh-btn ${activePanel[i] === action ? 'enh-on' : ''}`} onClick={() => enhance(i, action)} disabled={!!enhLoading[i]}>
                        {enhLoading[i] === action ? '...' : action === 'score' ? 'Score' : action === 'translate' ? 'EN' : 'Visuel'}
                      </button>
                    ))}
                  </div>

                  {/* Enhancement panels */}
                  {activePanel[i] === 'score' && enhancements[i]?.score && (() => {
                    const s = enhancements[i].score!
                    return (
                      <div className="enh-panel">
                        <div className="score-big">{s.score.overall}<span>/10</span></div>
                        {(['viral', 'engagement', 'authority'] as const).map(k => (
                          <div key={k} className="score-row">
                            <span className="score-label">{k}</span>
                            <div className="score-bar"><div className="score-fill" style={{ width: `${s.score[k] * 10}%` }} /></div>
                            <span className="score-val">{s.score[k]}</span>
                          </div>
                        ))}
                        <div className="enh-feedback">
                          {s.strengths.map((x, j) => <div key={j} className="fb-good">+ {x}</div>)}
                          {s.weaknesses.map((x, j) => <div key={j} className="fb-bad">- {x}</div>)}
                          <div className="fb-tip">{s.suggestion}</div>
                        </div>
                      </div>
                    )
                  })()}

                  {activePanel[i] === 'translate' && enhancements[i]?.translation && (
                    <div className="enh-panel">
                      <div className="enh-label">ENGLISH</div>
                      <div className="enh-text">{enhancements[i].translation!.translation}</div>
                      <div className="enh-note">{enhancements[i].translation!.note}</div>
                      <button className="copy-sm" onClick={() => navigator.clipboard.writeText(enhancements[i].translation!.translation)}>Copy EN</button>
                    </div>
                  )}

                  {activePanel[i] === 'visual' && enhancements[i]?.visual && (() => {
                    const v = enhancements[i].visual!.visual
                    return (
                      <div className="enh-panel">
                        <div className="enh-label">{v.type.toUpperCase()}</div>
                        <div className="enh-text">{v.description}</div>
                        {v.text_on_image && <div className="enh-note">Texte: "{v.text_on_image}"</div>}
                        <div className="enh-meta">{v.colors} · {v.tool}</div>
                        <div className="enh-note">{v.impact}</div>
                      </div>
                    )
                  })()}

                  {/* Actions */}
                  <div className="pc-actions">
                    <button className="act-btn" onClick={() => copyPost(i)}>{copied === i ? 'Copié !' : 'Copier'}</button>
                    <button className={`act-btn ${editing === i ? 'act-on' : ''}`} onClick={() => toggleEdit(i)}>{editing === i ? 'OK' : 'Éditer'}</button>
                    <span className={`pc-chars ${charCount(i) > maxChars ? 'chars-over' : ''}`}>{charCount(i)}/{maxChars}</span>
                    <button className="post-btn" onClick={() => openPost(i)} style={{ '--accent': accent } as any}>
                      Poster sur {network === 'twitter' ? 'X' : 'LinkedIn'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <style jsx>{`
          .page-content { display:flex; flex-direction:column; gap:16px; }
          .top-actions { display:flex; justify-content:flex-end; }
          .ghost-btn { background:none; border:1px solid var(--border); border-radius:var(--radius-sm); padding:5px 12px; font-size:12px; color:var(--muted); cursor:pointer; font-weight:500; }
          .ghost-btn:hover { border-color:var(--border2); color:var(--text2); }

          /* History */
          .history-panel { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:8px; display:flex; flex-direction:column; gap:4px; max-height:280px; overflow-y:auto; }
          .history-item { display:flex; align-items:center; gap:8px; padding:6px 8px; background:transparent; border:1px solid transparent; border-radius:6px; cursor:pointer; text-align:left; width:100%; font-family:var(--font); }
          .history-item:hover { background:var(--card2); border-color:var(--border); }
          .hi-net { font-size:9px; font-weight:700; color:var(--accent); font-family:var(--mono); background:var(--accent-dim); padding:1px 5px; border-radius:3px; flex-shrink:0; }
          .hi-text { font-size:11px; color:var(--text2); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .hi-date { font-size:9px; color:var(--muted); font-family:var(--mono); flex-shrink:0; }
          .empty { font-size:12px; color:var(--muted); text-align:center; padding:16px; }

          /* Format */
          .section { display:flex; flex-direction:column; gap:6px; }
          .label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
          .format-grid { display:flex; flex-wrap:wrap; gap:4px; }
          .fmt-btn { padding:6px 12px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; text-align:left; display:flex; flex-direction:column; gap:1px; transition:all .12s; }
          .fmt-btn:hover { border-color:var(--border2); }
          .fmt-active { border-color:${accent}; background:${network === 'linkedin' ? 'var(--li-dim)' : 'var(--accent-dim)'}; }
          .fmt-name { font-size:12px; font-weight:600; color:var(--text2); }
          .fmt-active .fmt-name { color:var(--text); }
          .fmt-desc { font-size:10px; color:var(--muted); }

          /* Input */
          .input-wrap { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; }
          .input { width:100%; background:transparent; border:none; color:var(--text); font-size:14px; padding:12px; resize:none; outline:none; line-height:1.6; }
          .starters { display:flex; gap:4px; flex-wrap:wrap; padding:0 12px 10px; border-top:1px solid var(--border); padding-top:8px; }
          .starter { background:var(--card2); border:1px solid var(--border); border-radius:20px; padding:2px 8px; font-size:10px; color:var(--muted); cursor:pointer; font-family:var(--mono); }
          .starter:hover { border-color:${accent}; color:${accent}; }

          /* Generate */
          .primary-btn { width:100%; padding:12px; background:var(--text); color:var(--bg); border:none; border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer; transition:all .15s; }
          .primary-btn:hover { background:${accent}; color:${network === 'linkedin' ? '#fff' : '#000'}; }
          .btn-loading { opacity:.6; cursor:not-allowed; }

          /* Results */
          .results { display:flex; flex-direction:column; gap:10px; }
          .post-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:16px; }
          .post-card:hover { border-color:var(--border2); }

          .pc-header { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
          .pc-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:900; flex-shrink:0; }
          .pc-info { flex:1; min-width:0; }
          .pc-name { font-size:13px; font-weight:700; display:block; }
          .pc-handle { font-size:10px; color:var(--muted); font-family:var(--mono); }
          .pc-badge { font-size:9px; font-weight:600; color:var(--muted); background:var(--card2); padding:2px 8px; border-radius:20px; font-family:var(--mono); text-transform:uppercase; white-space:nowrap; }

          .pc-text { font-size:14px; line-height:1.7; color:var(--text); white-space:pre-wrap; }
          .pc-edit { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-size:14px; padding:10px; resize:vertical; outline:none; line-height:1.7; }

          /* Enhance */
          .pc-enhance { display:flex; gap:4px; margin-top:12px; padding-top:10px; border-top:1px solid var(--border); }
          .enh-btn { background:var(--card2); border:1px solid var(--border); border-radius:6px; padding:4px 10px; font-size:10px; color:var(--muted); cursor:pointer; font-family:var(--mono); font-weight:600; transition:all .12s; }
          .enh-btn:hover { border-color:var(--border2); color:var(--text2); }
          .enh-btn:disabled { opacity:.5; }
          .enh-on { border-color:${accent}; color:${accent}; }

          .enh-panel { background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px; margin-top:8px; }
          .enh-label { font-size:9px; font-weight:700; color:${accent}; font-family:var(--mono); letter-spacing:.1em; margin-bottom:6px; }
          .enh-text { font-size:13px; color:var(--text); line-height:1.6; white-space:pre-wrap; }
          .enh-note { font-size:10px; color:var(--muted); margin-top:4px; }
          .enh-meta { font-size:10px; color:var(--text2); font-family:var(--mono); margin-top:4px; }
          .enh-feedback { margin-top:8px; padding-top:8px; border-top:1px solid var(--border); }

          .score-big { font-size:32px; font-weight:900; color:${accent}; text-align:center; font-family:var(--mono); }
          .score-big span { font-size:14px; color:var(--muted); }
          .score-row { display:flex; align-items:center; gap:8px; margin-top:4px; }
          .score-label { font-size:10px; color:var(--text2); width:70px; font-family:var(--mono); text-transform:capitalize; }
          .score-bar { flex:1; height:5px; background:var(--border); border-radius:3px; overflow:hidden; }
          .score-fill { height:100%; background:${accent}; border-radius:3px; }
          .score-val { font-size:10px; color:var(--muted); font-family:var(--mono); width:20px; text-align:right; }
          .fb-good { font-size:11px; color:#4ade80; margin-bottom:2px; }
          .fb-bad { font-size:11px; color:#f87171; margin-bottom:2px; }
          .fb-tip { font-size:11px; color:var(--text2); margin-top:4px; font-style:italic; }
          .copy-sm { background:${accent}; color:${network === 'linkedin' ? '#fff' : '#000'}; border:none; border-radius:4px; padding:3px 8px; font-size:10px; font-weight:600; cursor:pointer; margin-top:6px; }

          /* Actions */
          .pc-actions { display:flex; align-items:center; gap:6px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border); flex-wrap:wrap; }
          .act-btn { background:var(--card2); border:1px solid var(--border); border-radius:6px; padding:4px 10px; font-size:11px; color:var(--text2); cursor:pointer; font-weight:500; }
          .act-btn:hover { border-color:var(--border2); }
          .act-on { border-color:${accent}; color:${accent}; }
          .pc-chars { font-size:10px; font-family:var(--mono); color:var(--muted); margin-left:auto; }
          .chars-over { color:var(--danger); }
          .post-btn { background:var(--text); color:var(--bg); border:none; border-radius:6px; padding:5px 14px; font-size:11px; font-weight:700; cursor:pointer; }
          .post-btn:hover { background:${accent}; color:${network === 'linkedin' ? '#fff' : '#000'}; }

          @media (max-width:600px) {
            .format-grid { gap:3px; }
            .fmt-btn { padding:5px 8px; }
            .fmt-desc { display:none; }
          }
        `}</style>
      </Layout>
    </>
  )
}
