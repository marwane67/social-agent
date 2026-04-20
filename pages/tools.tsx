import { useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type ToolId = 'thread' | 'repurpose' | 'trend' | 'bio' | 'carousel' | 'poll' | 'cta' | 'recycle' | 'competitor' | 'dm'

const TOOLS: { id: ToolId; label: string; desc: string; placeholder: string }[] = [
  { id: 'thread', label: 'Story Thread', desc: '3 posts liés narratifs', placeholder: "L'histoire à raconter..." },
  { id: 'repurpose', label: 'Repurpose', desc: 'Adapter cross-platform', placeholder: 'Colle le post à adapter...' },
  { id: 'trend', label: 'Trend Reactor', desc: 'Surfer un trending topic', placeholder: 'Le sujet trending...' },
  { id: 'bio', label: 'Bio Optimizer', desc: 'Optimiser ta bio', placeholder: 'Ton focus actuel...' },
  { id: 'carousel', label: 'Carrousel', desc: '8 slides prêtes', placeholder: 'Le sujet du carrousel...' },
  { id: 'poll', label: 'Poll', desc: 'Sondages stratégiques', placeholder: 'Le sujet du sondage...' },
  { id: 'cta', label: 'CTA', desc: 'Appels à l\'action', placeholder: "L'objectif du CTA..." },
  { id: 'recycle', label: 'Recycler', desc: 'Réécrire un vieux post', placeholder: 'Colle ton ancien post qui a marché...' },
  { id: 'competitor', label: 'Competitor', desc: 'Analyser un concurrent', placeholder: "Colle un post d'un concurrent..." },
  { id: 'dm', label: 'DM Templates', desc: 'Messages de prospection', placeholder: 'Objectif du DM (networking, collab, vente)...' },
]

export default function ToolsPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [tool, setTool] = useState<ToolId>('thread')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const ct = TOOLS.find(t => t.id === tool)!
  const accent = network === 'linkedin' ? 'var(--li)' : 'var(--accent)'

  const generate = async () => {
    if (!input.trim()) return; setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input, tool, network }) })
      setResult(await res.json())
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const copy = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000) }

  const renderResult = () => {
    if (!result) return null

    // Generic card renderer
    const cards = (items: any[], getType: (x: any) => string, getText: (x: any) => string, getMeta?: (x: any) => string) => (
      <div className="res-list">
        {items.map((item, i) => (
          <div key={i} className="res-card">
            <div className="res-top">
              <span className="res-badge">{getType(item)}</span>
              <button className="copy-sm" onClick={() => copy(getText(item), `r${i}`)}>{copied === `r${i}` ? 'Copié' : 'Copier'}</button>
            </div>
            <div className="res-text">{getText(item)}</div>
            {getMeta && <div className="res-meta">{getMeta(item)}</div>}
          </div>
        ))}
      </div>
    )

    if (result.thread) return cards(result.thread, t => `Tweet ${t.position}`, t => t.text, t => t.transition)
    if (result.adapted_post) return (
      <div className="res-list">
        <div className="res-card">
          <div className="res-top">
            <span className="res-badge">{result.target_platform === 'twitter' ? 'VERSION TWITTER' : 'VERSION LINKEDIN'}</span>
            <button className="copy-sm" onClick={() => copy(result.adapted_post, 'rep')}>{copied === 'rep' ? 'Copié' : 'Copier'}</button>
          </div>
          <div className="res-text">{result.adapted_post}</div>
          {result.tips && <div className="res-meta">{result.tips}</div>}
        </div>
      </div>
    )
    if (result.posts) return cards(result.posts, p => p.type, p => p.text, p => p.angle || p.strategy)
    if (result.bios) return cards(result.bios, b => b.type, b => b.bio || b.headline, b => b.note || b.summary)
    if (result.carousel) return (
      <div className="res-list">
        <div className="slides">
          {result.carousel.slides.map((s: any) => (
            <div key={s.slide} className="slide">
              <div className="slide-num">{s.slide}</div>
              <div className="slide-title">{s.title}</div>
              {s.body && <div className="slide-body">{s.body}</div>}
              {s.cta && <div className="slide-cta">{s.cta}</div>}
            </div>
          ))}
        </div>
        {result.carousel.post_text && (
          <div className="res-card">
            <div className="res-top">
              <span className="res-badge">POST</span>
              <button className="copy-sm" onClick={() => copy(result.carousel.post_text, 'cp')}>{copied === 'cp' ? 'Copié' : 'Copier'}</button>
            </div>
            <div className="res-text">{result.carousel.post_text}</div>
          </div>
        )}
        {result.carousel.design_tips && <div className="res-meta">{result.carousel.design_tips}</div>}
      </div>
    )
    if (result.polls) return (
      <div className="res-list">
        {result.polls.map((p: any, i: number) => (
          <div key={i} className="res-card">
            <span className="res-badge">{p.type}</span>
            <div className="poll-q">{p.question}</div>
            <div className="poll-opts">{p.options.map((o: string, j: number) => <div key={j} className="poll-opt">{o}</div>)}</div>
            <div className="res-text" style={{ fontSize: 12, marginTop: 8 }}>{p.post_text}</div>
            <button className="copy-sm" style={{ marginTop: 6 }} onClick={() => copy(p.post_text, `p${i}`)}>{copied === `p${i}` ? 'Copié' : 'Copier'}</button>
          </div>
        ))}
      </div>
    )
    if (result.ctas) {
      const c = result.ctas
      const items = [
        { label: 'Bio', text: c.bio }, { label: 'Waitlist', text: c.waitlist },
        { label: 'DM Opener', text: c.dm_opener }, { label: 'Link Tease', text: c.link_tease },
        ...(c.post_end || []).map((t: string) => ({ label: 'Fin de post', text: t })),
        ...(c.engagement || []).map((t: string) => ({ label: 'Engagement', text: t })),
      ]
      return cards(items, x => x.label, x => x.text)
    }
    if (result.recycled) return cards(result.recycled, r => r.type, r => r.text, r => r.angle)
    if (result.analysis) {
      const a = result.analysis
      return (
        <div className="res-list">
          <div className="res-card"><span className="res-badge">STRATÉGIE</span><div className="res-text">{a.strategy}</div></div>
          <div className="res-card"><span className="res-badge">FORCES</span><div className="res-text">{a.strengths}</div></div>
          <div className="res-card"><span className="res-badge">FAIBLESSES</span><div className="res-text">{a.weaknesses}</div></div>
          <div className="res-card"><span className="res-badge">ANGLES MANQUÉS</span><div className="res-text">{a.missed_angles}</div></div>
        </div>
      )
    }
    if (result.dms) return cards(result.dms, d => d.type, d => d.text, d => d.strategy)

    return <pre className="res-raw">{JSON.stringify(result, null, 2)}</pre>
  }

  return (
    <>
      <Head><title>Tools — Marwane</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Tools" subtitle="Outils de contenu avancés">
        <div className="page-content">
          <div className="section">
            <label className="label">Outil</label>
            <div className="tool-grid">
              {TOOLS.map(t => (
                <button key={t.id} className={`tool-btn ${tool === t.id ? 'tool-on' : ''}`} onClick={() => { setTool(t.id); setResult(null) }}>
                  <span className="tool-name">{t.label}</span>
                  <span className="tool-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <textarea className="input" placeholder={ct.placeholder} value={input} onChange={e => setInput(e.target.value)} rows={4} onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate() }} />
          </div>

          <button className={`primary-btn ${loading ? 'btn-loading' : ''}`} onClick={generate} disabled={loading} style={{ '--accent': accent } as any}>
            {loading ? 'Génération...' : ct.label}
          </button>

          {renderResult()}
        </div>

        <style jsx>{`
          .page-content { display:flex; flex-direction:column; gap:14px; }
          .section { display:flex; flex-direction:column; gap:6px; }
          .label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
          .input { width:100%; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); color:var(--text); font-size:14px; padding:10px 12px; resize:none; outline:none; line-height:1.6; }

          .tool-grid { display:flex; flex-wrap:wrap; gap:4px; }
          .tool-btn { padding:6px 10px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; text-align:left; display:flex; flex-direction:column; gap:1px; transition:all .12s; }
          .tool-btn:hover { border-color:var(--border2); }
          .tool-on { border-color:${accent}; background:${network === 'linkedin' ? 'var(--li-dim)' : 'var(--accent-dim)'}; }
          .tool-name { font-size:11px; font-weight:600; color:var(--text2); }
          .tool-on .tool-name { color:var(--text); }
          .tool-desc { font-size:9px; color:var(--muted); }

          .primary-btn { width:100%; padding:12px; background:var(--text); color:var(--bg); border:none; border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer; }
          .primary-btn:hover { background:${accent}; color:${network === 'linkedin' ? '#fff' : '#000'}; }
          .btn-loading { opacity:.6; cursor:not-allowed; }

          .res-list { display:flex; flex-direction:column; gap:8px; }
          .res-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:12px; }
          .res-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
          .res-badge { font-size:9px; font-weight:700; color:${accent}; font-family:var(--mono); text-transform:uppercase; background:${network === 'linkedin' ? 'var(--li-dim)' : 'var(--accent-dim)'}; padding:2px 8px; border-radius:20px; }
          .res-text { font-size:13px; color:var(--text); line-height:1.6; white-space:pre-wrap; }
          .res-meta { font-size:10px; color:var(--muted); margin-top:4px; font-style:italic; }
          .res-raw { font-size:10px; color:var(--muted); background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:12px; overflow-x:auto; white-space:pre-wrap; font-family:var(--mono); }
          .copy-sm { background:var(--card2); border:1px solid var(--border); border-radius:4px; padding:2px 8px; font-size:9px; color:var(--muted); cursor:pointer; font-family:var(--mono); }
          .copy-sm:hover { border-color:${accent}; color:${accent}; }

          .slides { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
          .slide { background:var(--card2); border:1px solid var(--border); border-radius:8px; padding:8px; position:relative; }
          .slide-num { font-size:8px; color:var(--muted); font-family:var(--mono); position:absolute; top:4px; right:6px; }
          .slide-title { font-size:11px; font-weight:700; color:var(--text); margin-bottom:3px; }
          .slide-body { font-size:9px; color:var(--text2); line-height:1.3; }
          .slide-cta { font-size:10px; color:${accent}; font-weight:700; margin-top:3px; }

          .poll-q { font-size:14px; font-weight:700; color:var(--text); margin:8px 0; }
          .poll-opts { display:flex; flex-direction:column; gap:3px; }
          .poll-opt { background:var(--card2); border:1px solid var(--border); border-radius:6px; padding:5px 10px; font-size:12px; color:var(--text2); }

          @media (max-width:600px) {
            .slides { grid-template-columns:repeat(2,1fr); }
            .tool-btn { padding:5px 8px; }
            .tool-desc { display:none; }
          }
        `}</style>
      </Layout>
    </>
  )
}
