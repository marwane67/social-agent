import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type Network = 'twitter' | 'linkedin'
type ToolId = 'thread' | 'repurpose' | 'trend' | 'bio' | 'carousel' | 'poll' | 'cta'

const TOOL_LIST: { id: ToolId; label: string; icon: string; desc: string; placeholder: string }[] = [
  { id: 'thread', label: 'Story Thread', icon: '|||', desc: '3 posts liés qui racontent une progression', placeholder: 'Le sujet/histoire que tu veux raconter...' },
  { id: 'repurpose', label: 'Repurpose', icon: '<>', desc: 'Transformer un post Twitter en LinkedIn (ou inverse)', placeholder: 'Colle le post à adapter pour l\'autre plateforme...' },
  { id: 'trend', label: 'Trend Reactor', icon: 'TR', desc: 'Surfer sur un sujet trending avec ton angle', placeholder: 'Le sujet trending du moment (ex: nouvelle feature Claude, levée de fonds...)...' },
  { id: 'bio', label: 'Bio Optimizer', icon: 'BIO', desc: 'Optimiser ta bio Twitter ou LinkedIn', placeholder: 'Ton focus actuel ou ce que tu veux mettre en avant...' },
  { id: 'carousel', label: 'Carrousel', icon: 'CAR', desc: 'Contenu complet de carrousel slide par slide', placeholder: 'Le sujet du carrousel (ex: 7 outils IA pour entrepreneurs)...' },
  { id: 'poll', label: 'Poll Generator', icon: '?!', desc: 'Sondages stratégiques qui boostent l\'engagement', placeholder: 'Le sujet autour duquel créer un sondage...' },
  { id: 'cta', label: 'CTA Generator', icon: 'GO', desc: 'CTAs pour bio, posts, DMs, waitlist', placeholder: 'L\'objectif du CTA (ex: inscrire à la waitlist Axora, commenter...)...' },
]

export default function ToolsPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [tool, setTool] = useState<ToolId>('thread')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const currentTool = TOOL_LIST.find(t => t.id === tool)!

  const generate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, tool, network }),
      })
      const data = await res.json()
      setResult(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const accent = network === 'linkedin' ? '#0a66c2' : '#39ff14'
  const accentBg = network === 'linkedin' ? 'rgba(10,102,194,' : 'rgba(57,255,20,'

  const renderResult = () => {
    if (!result) return null

    // Thread
    if (tool === 'thread' && result.thread) {
      return (
        <div className="res-section">
          <div className="res-label">STORY THREAD</div>
          {result.thread.map((t: any, i: number) => (
            <div key={i} className="res-card">
              <div className="res-card-header">
                <span className="res-badge">Tweet {t.position}</span>
                <button className="copy-sm" onClick={() => copy(t.text, `t${i}`)}>{copied === `t${i}` ? 'Copié' : 'Copier'}</button>
              </div>
              <div className="res-hook">{t.hook}</div>
              <div className="res-text">{t.text}</div>
              {t.transition && <div className="res-meta">Transition : {t.transition}</div>}
            </div>
          ))}
          {result.strategy && <div className="res-strategy">{result.strategy}</div>}
        </div>
      )
    }

    // Repurpose
    if (tool === 'repurpose' && result.adapted_post) {
      return (
        <div className="res-section">
          <div className="res-label">{result.target_platform === 'twitter' ? 'VERSION TWITTER' : 'VERSION LINKEDIN'}</div>
          <div className="res-card">
            <div className="res-text">{result.adapted_post}</div>
            <button className="copy-btn" onClick={() => copy(result.adapted_post, 'rep')}>{copied === 'rep' ? 'Copié' : 'Copier'}</button>
          </div>
          {result.changes && (
            <div className="res-changes">
              {result.changes.map((c: string, i: number) => <div key={i} className="res-change">- {c}</div>)}
            </div>
          )}
          {result.tips && <div className="res-strategy">{result.tips}</div>}
        </div>
      )
    }

    // Trend
    if (tool === 'trend' && result.posts) {
      return (
        <div className="res-section">
          <div className="res-label">POSTS TREND</div>
          {result.posts.map((p: any, i: number) => (
            <div key={i} className="res-card">
              <div className="res-card-header">
                <span className="res-badge">{p.type}</span>
                <button className="copy-sm" onClick={() => copy(p.text, `tr${i}`)}>{copied === `tr${i}` ? 'Copié' : 'Copier'}</button>
              </div>
              <div className="res-text">{p.text}</div>
              <div className="res-meta">{p.angle}</div>
            </div>
          ))}
        </div>
      )
    }

    // Bio
    if (tool === 'bio' && result.bios) {
      return (
        <div className="res-section">
          <div className="res-label">BIOS OPTIMISÉES</div>
          {result.bios.map((b: any, i: number) => (
            <div key={i} className="res-card">
              <span className="res-badge">{b.type}</span>
              <div className="res-bio-main">{b.bio || b.headline}</div>
              {(b.note || b.summary) && <div className="res-meta">{b.note || b.summary}</div>}
              <button className="copy-sm" onClick={() => copy(b.bio || b.headline, `bio${i}`)}>{copied === `bio${i}` ? 'Copié' : 'Copier'}</button>
            </div>
          ))}
          {result.tips && <div className="res-tips">{result.tips.map((t: string, i: number) => <div key={i}>- {t}</div>)}</div>}
        </div>
      )
    }

    // Carousel
    if (tool === 'carousel' && result.carousel) {
      const c = result.carousel
      return (
        <div className="res-section">
          <div className="res-label">CARROUSEL : {c.title}</div>
          <div className="slides-grid">
            {c.slides.map((s: any) => (
              <div key={s.slide} className={`slide-card ${s.type}`}>
                <div className="slide-num">{s.slide}/8</div>
                <div className="slide-title">{s.title}</div>
                {s.body && <div className="slide-body">{s.body}</div>}
                {s.subtitle && <div className="slide-sub">{s.subtitle}</div>}
                {s.cta && <div className="slide-cta">{s.cta}</div>}
              </div>
            ))}
          </div>
          {c.post_text && (
            <div className="res-card">
              <div className="res-card-header">
                <span className="res-badge">POST D'ACCOMPAGNEMENT</span>
                <button className="copy-sm" onClick={() => copy(c.post_text, 'cpost')}>{copied === 'cpost' ? 'Copié' : 'Copier'}</button>
              </div>
              <div className="res-text">{c.post_text}</div>
            </div>
          )}
          {c.design_tips && <div className="res-strategy">{c.design_tips}</div>}
        </div>
      )
    }

    // Poll
    if (tool === 'poll' && result.polls) {
      return (
        <div className="res-section">
          <div className="res-label">SONDAGES</div>
          {result.polls.map((p: any, i: number) => (
            <div key={i} className="res-card">
              <span className="res-badge">{p.type}</span>
              <div className="poll-question">{p.question}</div>
              <div className="poll-options">
                {p.options.map((o: string, j: number) => (
                  <div key={j} className="poll-option">{o}</div>
                ))}
              </div>
              <div className="res-card-header" style={{ marginTop: 8 }}>
                <span className="res-badge" style={{ fontSize: 8 }}>POST</span>
                <button className="copy-sm" onClick={() => copy(p.post_text, `poll${i}`)}>{copied === `poll${i}` ? 'Copié' : 'Copier'}</button>
              </div>
              <div className="res-text" style={{ fontSize: 12 }}>{p.post_text}</div>
              <div className="res-meta">{p.strategy}</div>
            </div>
          ))}
        </div>
      )
    }

    // CTA
    if (tool === 'cta' && result.ctas) {
      const c = result.ctas
      return (
        <div className="res-section">
          <div className="res-label">CTAs GÉNÉRÉS</div>
          <div className="cta-grid">
            <div className="cta-card">
              <div className="cta-type">BIO</div>
              <div className="cta-text">{c.bio}</div>
              <button className="copy-sm" onClick={() => copy(c.bio, 'cbio')}>{copied === 'cbio' ? 'Copié' : 'Copier'}</button>
            </div>
            <div className="cta-card">
              <div className="cta-type">WAITLIST AXORA</div>
              <div className="cta-text">{c.waitlist}</div>
              <button className="copy-sm" onClick={() => copy(c.waitlist, 'cwait')}>{copied === 'cwait' ? 'Copié' : 'Copier'}</button>
            </div>
            <div className="cta-card">
              <div className="cta-type">DM OPENER</div>
              <div className="cta-text">{c.dm_opener}</div>
              <button className="copy-sm" onClick={() => copy(c.dm_opener, 'cdm')}>{copied === 'cdm' ? 'Copié' : 'Copier'}</button>
            </div>
            <div className="cta-card">
              <div className="cta-type">LINK TEASE</div>
              <div className="cta-text">{c.link_tease}</div>
              <button className="copy-sm" onClick={() => copy(c.link_tease, 'clink')}>{copied === 'clink' ? 'Copié' : 'Copier'}</button>
            </div>
          </div>
          <div className="res-label" style={{ marginTop: 8 }}>FINS DE POSTS</div>
          {c.post_end?.map((p: string, i: number) => (
            <div key={i} className="cta-inline">
              <span>{p}</span>
              <button className="copy-sm" onClick={() => copy(p, `cpe${i}`)}>{copied === `cpe${i}` ? 'Copié' : 'Copier'}</button>
            </div>
          ))}
          <div className="res-label" style={{ marginTop: 8 }}>ENGAGEMENT</div>
          {c.engagement?.map((e: string, i: number) => (
            <div key={i} className="cta-inline">
              <span>{e}</span>
              <button className="copy-sm" onClick={() => copy(e, `cen${i}`)}>{copied === `cen${i}` ? 'Copié' : 'Copier'}</button>
            </div>
          ))}
        </div>
      )
    }

    // Fallback
    return <pre className="res-raw">{JSON.stringify(result, null, 2)}</pre>
  }

  return (
    <>
      <Head>
        <title>Tools — Ismaa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="page">
        <div className="wrapper">
          <header className="header">
            <div className="header-left">
              <div className="logo">T</div>
              <div>
                <div className="logo-title">Tools</div>
                <div className="logo-sub">Outils de contenu avancés</div>
              </div>
            </div>
            <div className="header-right">
              <Link href="/" className="nav-link">Posts</Link>
              <Link href="/reply" className="nav-link">Reply</Link>
              <Link href="/schedule" className="nav-link">Sched</Link>
              <Link href="/growth" className="nav-link">Growth</Link>
              <Link href="/dashboard" className="nav-link">Dash</Link>
            </div>
          </header>

          <div className="network-switch">
            <button className={`net-btn ${network === 'twitter' ? 'net-active' : ''}`} onClick={() => setNetwork('twitter')}>X · Twitter</button>
            <button className={`net-btn ${network === 'linkedin' ? 'net-active net-li' : ''}`} onClick={() => setNetwork('linkedin')}>in · LinkedIn</button>
          </div>

          <div className="section-label">OUTIL</div>
          <div className="tool-grid">
            {TOOL_LIST.map(t => (
              <button key={t.id} className={`tool-btn ${tool === t.id ? 'active' : ''}`} onClick={() => { setTool(t.id); setResult(null) }}>
                <span className="tool-icon">{t.icon}</span>
                <span className="tool-label">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="tool-desc">{currentTool.desc}</div>

          <div className="input-box">
            <textarea className="textarea" placeholder={currentTool.placeholder} value={input} onChange={e => setInput(e.target.value)} rows={4}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate() }} />
          </div>

          <button className={`gen-btn ${loading ? 'disabled' : ''}`} onClick={generate} disabled={loading}>
            {loading ? 'Génération...' : `Lancer ${currentTool.label}`}
          </button>

          {renderResult()}

          <div className="footer">Built by Pixel Company · Ismaa · Brussels</div>
        </div>
      </div>

      <style jsx>{`
        .page { min-height:100vh; background:#080808; }
        .wrapper { max-width:720px; margin:0 auto; padding:24px 16px 60px; display:flex; flex-direction:column; gap:12px; }
        .header { display:flex; align-items:center; justify-content:space-between; }
        .header-left { display:flex; align-items:center; gap:10px; }
        .header-right { display:flex; gap:5px; flex-wrap:wrap; }
        .logo { width:38px; height:38px; background:${accent}; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:${network==='linkedin'?'#fff':'#000'}; }
        .logo-title { font-size:16px; font-weight:800; color:#fff; }
        .logo-sub { font-size:10px; color:#555; font-family:'JetBrains Mono',monospace; }
        .nav-link { background:#161616; border:1px solid #2a2a2a; border-radius:8px; padding:4px 8px; font-size:10px; color:#888; text-decoration:none; font-weight:600; font-family:'Syne',sans-serif; }
        .nav-link:hover { border-color:${accent}; color:${accent}; }

        .network-switch { display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#0f0f0f; border:1px solid #1e1e1e; border-radius:12px; padding:5px; }
        .net-btn { background:transparent; border:1px solid transparent; border-radius:8px; padding:8px; color:#555; font-size:13px; font-weight:600; cursor:pointer; text-align:center; font-family:'Syne',sans-serif; }
        .net-active { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.15); color:#fff; }
        .net-li { background:rgba(10,102,194,.1); border-color:rgba(10,102,194,.3); color:#0a66c2; }

        .section-label { font-size:10px; color:#444; font-family:'JetBrains Mono',monospace; letter-spacing:.08em; }
        .tool-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; }
        .tool-btn { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:10px; padding:8px 4px; cursor:pointer; text-align:center; display:flex; flex-direction:column; align-items:center; gap:3px; font-family:'Syne',sans-serif; transition:all .15s; }
        .tool-btn:hover { border-color:#333; }
        .tool-btn.active { border-color:${accentBg}0.4); background:${accentBg}0.04); }
        .tool-icon { font-size:11px; font-weight:900; color:#555; font-family:'JetBrains Mono',monospace; }
        .tool-btn.active .tool-icon { color:${accent}; }
        .tool-label { font-size:9px; font-weight:600; color:#555; }
        .tool-btn.active .tool-label { color:#ccc; }
        .tool-desc { font-size:11px; color:#555; padding:6px 10px; background:#0c0c0c; border:1px solid #1a1a1a; border-radius:8px; }

        .input-box { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:12px; overflow:hidden; }
        .textarea { width:100%; background:transparent; border:none; color:#e2e2e2; font-size:14px; padding:10px 12px; resize:none; outline:none; line-height:1.6; font-family:'Syne',sans-serif; }

        .gen-btn { background:${accent}; color:${network==='linkedin'?'#fff':'#000'}; border:none; border-radius:10px; padding:12px; font-size:14px; font-weight:800; cursor:pointer; font-family:'Syne',sans-serif; }
        .gen-btn.disabled { opacity:.5; cursor:not-allowed; }

        /* Results */
        .res-section { display:flex; flex-direction:column; gap:8px; }
        .res-label { font-size:10px; color:#444; font-family:'JetBrains Mono',monospace; letter-spacing:.08em; margin-top:4px; }
        .res-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:10px; padding:12px; }
        .res-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
        .res-badge { background:${accentBg}0.08); color:${accent}; font-size:9px; font-weight:700; padding:2px 8px; border-radius:20px; font-family:'JetBrains Mono',monospace; text-transform:uppercase; }
        .res-hook { font-size:13px; font-weight:700; color:#fff; margin-bottom:4px; }
        .res-text { font-size:13px; color:#ddd; line-height:1.6; white-space:pre-wrap; }
        .res-meta { font-size:10px; color:#555; font-style:italic; margin-top:4px; }
        .res-strategy { font-size:11px; color:#666; background:#0c0c0c; border:1px solid #1a1a1a; border-radius:8px; padding:8px; font-style:italic; }
        .res-changes { font-size:10px; color:#888; }
        .res-change { margin-bottom:2px; }
        .res-bio-main { font-size:14px; font-weight:600; color:#fff; margin:6px 0; }
        .res-tips { font-size:11px; color:#666; }
        .res-raw { font-size:10px; color:#666; background:#0c0c0c; border:1px solid #1a1a1a; border-radius:8px; padding:12px; overflow-x:auto; white-space:pre-wrap; font-family:'JetBrains Mono',monospace; }

        .copy-sm { background:#161616; border:1px solid #222; border-radius:4px; padding:2px 8px; font-size:9px; color:#666; cursor:pointer; font-family:'Syne',sans-serif; }
        .copy-sm:hover { border-color:${accent}; color:${accent}; }
        .copy-btn { background:${accent}; color:${network==='linkedin'?'#fff':'#000'}; border:none; border-radius:6px; padding:4px 12px; font-size:10px; font-weight:700; cursor:pointer; font-family:'Syne',sans-serif; margin-top:8px; }

        /* Slides */
        .slides-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
        .slide-card { background:#111; border:1px solid #1e1e1e; border-radius:8px; padding:10px; position:relative; }
        .slide-card.cover { border-color:${accentBg}0.3); }
        .slide-card.cta { border-color:${accentBg}0.3); }
        .slide-num { font-size:8px; color:#444; font-family:'JetBrains Mono',monospace; position:absolute; top:4px; right:6px; }
        .slide-title { font-size:11px; font-weight:700; color:#fff; margin-bottom:4px; }
        .slide-body { font-size:9px; color:#aaa; line-height:1.4; }
        .slide-sub { font-size:9px; color:#666; }
        .slide-cta { font-size:10px; color:${accent}; font-weight:700; margin-top:4px; }

        /* Poll */
        .poll-question { font-size:14px; font-weight:700; color:#fff; margin:8px 0; }
        .poll-options { display:flex; flex-direction:column; gap:4px; }
        .poll-option { background:#161616; border:1px solid #2a2a2a; border-radius:6px; padding:6px 10px; font-size:12px; color:#ddd; }

        /* CTA */
        .cta-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .cta-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:8px; padding:10px; }
        .cta-type { font-size:9px; color:${accent}; font-weight:700; font-family:'JetBrains Mono',monospace; margin-bottom:4px; }
        .cta-text { font-size:12px; color:#ddd; line-height:1.4; margin-bottom:6px; }
        .cta-inline { display:flex; justify-content:space-between; align-items:center; background:#0f0f0f; border:1px solid #1e1e1e; border-radius:6px; padding:6px 10px; font-size:11px; color:#ddd; }

        .footer { text-align:center; font-size:10px; color:#222; font-family:'JetBrains Mono',monospace; margin-top:16px; }

        @media (max-width:600px) {
          .tool-grid { grid-template-columns:repeat(2,1fr); }
          .slides-grid { grid-template-columns:repeat(2,1fr); }
          .cta-grid { grid-template-columns:1fr; }
          .header-right { gap:3px; }
          .nav-link { padding:3px 6px; font-size:9px; }
        }
      `}</style>
    </>
  )
}
