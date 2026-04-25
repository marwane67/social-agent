import { useEffect, useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type MsgType = 'connect' | 'first_dm' | 'follow_up' | 'pitch' | 'collab' | 'thank'
type Message = { type: string; text: string; why: string }
type SignalContext = {
  source_url?: string | null
  source_account?: string
  source_excerpt?: string
  signal_type?: string
  comment_text?: string
}

const MSG_TYPES: { id: MsgType; label: string; desc: string }[] = [
  { id: 'connect', label: 'Demande de connexion', desc: 'Max 300 chars' },
  { id: 'first_dm', label: 'Premier message', desc: 'Engager la conversation' },
  { id: 'follow_up', label: 'Relance', desc: 'Relancer sans être lourd' },
  { id: 'pitch', label: 'Proposition', desc: 'Proposer un call/service' },
  { id: 'collab', label: 'Collaboration', desc: 'Proposer un partenariat' },
  { id: 'thank', label: 'Remerciement', desc: 'Après un échange' },
]

export default function OutreachPage() {
  const [network, setNetwork] = useState<Network>('linkedin')
  const [messageType, setMessageType] = useState<MsgType>('connect')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [context, setContext] = useState('')
  const [goal, setGoal] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [scraped, setScraped] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [signal, setSignal] = useState<SignalContext | null>(null)

  // Pré-remplissage depuis /signals → "Générer DM"
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem('signal-prefill')
    if (!raw) return
    try {
      const p = JSON.parse(raw)
      if (p.name) setName(p.name)
      if (p.title) setTitle(p.title)
      if (p.company) setCompany(p.company)
      if (p.context) setContext(p.context)
      if (p.linkedinUrl) { setLinkedinUrl(p.linkedinUrl); setScraped(true) }
      if (p.signal) {
        setSignal(p.signal)
        // Suggérer "first_dm" + objectif basé sur le signal
        setMessageType('first_dm')
        const verb = p.signal.signal_type === 'comment' ? 'commenté' : p.signal.signal_type === 'share' ? 'partagé' : 'liké'
        const acct = p.signal.source_account || 'un post pertinent'
        setGoal(`Engager la conversation après que cette personne a ${verb} ${acct}. Référencer le sujet du post pour montrer que je suis pertinent.`)
      }
      sessionStorage.removeItem('signal-prefill')
    } catch {}
  }, [])

  const scrapeProfile = async () => {
    if (!linkedinUrl.trim()) return
    setScraping(true)
    try {
      const res = await fetch('/api/scrape-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkedinUrl }),
      })
      const data = await res.json()
      if (data.name) setName(data.name)
      if (data.title) setTitle(data.title)
      if (data.company) setCompany(data.company)
      if (data.context) setContext(data.context)
      setScraped(true)
    } catch (e) { console.error(e) }
    finally { setScraping(false) }
  }

  const generate = async () => {
    if (!goal.trim()) return
    setLoading(true); setMessages([])
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, title, company, context, goal, messageType, signal }),
      })
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const copy = (i: number) => {
    navigator.clipboard.writeText(messages[i].text)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  const reset = () => {
    setLinkedinUrl(''); setName(''); setTitle(''); setCompany(''); setContext(''); setGoal('')
    setMessages([]); setScraped(false); setSignal(null)
  }

  const currentType = MSG_TYPES.find(t => t.id === messageType)!
  const maxChars = messageType === 'connect' ? 300 : 500

  return (
    <>
      <Head><title>Outreach — Marwane</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="LinkedIn Outreach" subtitle="Colle un profil, choisis le type, c'est envoyé">
        <div className="pc">
          {/* Signal banner — affiché quand on vient depuis /signals */}
          {signal && (signal.source_excerpt || signal.source_account) && (
            <div className="signal-banner">
              <div className="signal-banner-tag">SIGNAL DÉTECTÉ</div>
              <div className="signal-banner-text">
                <strong>{name || 'Cette personne'}</strong> a {signal.signal_type === 'comment' ? 'commenté' : signal.signal_type === 'share' ? 'partagé' : 'liké'}
                {signal.source_account && <> un post de <strong>{signal.source_account}</strong></>}
              </div>
              {signal.source_excerpt && <div className="signal-banner-excerpt">"{signal.source_excerpt.slice(0, 180)}{signal.source_excerpt.length > 180 ? '…' : ''}"</div>}
              {signal.comment_text && <div className="signal-banner-comment">Son commentaire : "{signal.comment_text.slice(0, 180)}"</div>}
              <div className="signal-banner-hint">Le DM va référencer ce post automatiquement.</div>
            </div>
          )}

          {/* Step 1: LinkedIn URL */}
          <div className="section">
            <label className="label">1. Colle le lien LinkedIn</label>
            <div className="url-row">
              <input
                className="url-input"
                placeholder="https://www.linkedin.com/in/..."
                value={linkedinUrl}
                onChange={e => { setLinkedinUrl(e.target.value); setScraped(false) }}
                onKeyDown={e => { if (e.key === 'Enter') scrapeProfile() }}
              />
              <button className={`scan-btn ${scraping ? 'scanning' : ''} ${scraped ? 'scanned' : ''}`} onClick={scrapeProfile} disabled={scraping}>
                {scraping ? 'Scan...' : scraped ? 'OK' : 'Scanner'}
              </button>
            </div>
            {scraped && name && (
              <div className="profile-card">
                <div className="profile-avatar">{name.charAt(0).toUpperCase()}</div>
                <div className="profile-info">
                  <div className="profile-name">{name}</div>
                  {title && <div className="profile-title">{title}</div>}
                  {company && <div className="profile-company">{company}</div>}
                  {context && <div className="profile-context">{context}</div>}
                </div>
                <button className="reset-btn" onClick={reset}>X</button>
              </div>
            )}
          </div>

          {/* Manual edit (collapsible if scraped) */}
          {scraped && (
            <details className="manual-edit">
              <summary className="manual-toggle">Modifier les infos manuellement</summary>
              <div className="form-grid">
                <input className="input-sm" placeholder="Nom" value={name} onChange={e => setName(e.target.value)} />
                <input className="input-sm" placeholder="Poste" value={title} onChange={e => setTitle(e.target.value)} />
                <input className="input-sm" placeholder="Entreprise" value={company} onChange={e => setCompany(e.target.value)} />
                <input className="input-sm" placeholder="Contexte" value={context} onChange={e => setContext(e.target.value)} />
              </div>
            </details>
          )}

          {/* If not scraped, show manual form */}
          {!scraped && !linkedinUrl && (
            <div className="section">
              <label className="label">Ou remplis manuellement</label>
              <div className="form-grid">
                <input className="input-sm" placeholder="Nom" value={name} onChange={e => setName(e.target.value)} />
                <input className="input-sm" placeholder="Poste" value={title} onChange={e => setTitle(e.target.value)} />
                <input className="input-sm" placeholder="Entreprise" value={company} onChange={e => setCompany(e.target.value)} />
                <input className="input-sm" placeholder="Contexte" value={context} onChange={e => setContext(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2: Message type */}
          <div className="section">
            <label className="label">2. Type de message</label>
            <div className="type-grid">
              {MSG_TYPES.map(t => (
                <button key={t.id} className={`type-btn ${messageType === t.id ? 'type-on' : ''}`} onClick={() => setMessageType(t.id)}>
                  <span className="type-name">{t.label}</span>
                  <span className="type-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Goal */}
          <div className="section">
            <label className="label">3. Ton objectif</label>
            <textarea className="input" placeholder="Ex: Proposer les services IA de Pulsa Creatives, discuter d'un partenariat pour Axora..." value={goal} onChange={e => setGoal(e.target.value)} rows={2} onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate() }} />
          </div>

          {/* Generate */}
          <button className={`primary-btn ${loading ? 'btn-loading' : ''}`} onClick={generate} disabled={loading}>
            {loading ? 'Génération...' : `Générer 3 messages · ${currentType.label}`}
          </button>

          {/* Results */}
          {messages.length > 0 && (
            <div className="results">
              {messages.map((msg, i) => (
                <div key={i} className="msg-card">
                  <div className="msg-header">
                    <span className="msg-badge">{msg.type}</span>
                    <span className={`msg-chars ${msg.text.length > maxChars ? 'chars-over' : ''}`}>{msg.text.length}/{maxChars}</span>
                  </div>
                  <div className="msg-preview">
                    <div className="msg-preview-header">
                      <div className="msg-avatar">I</div>
                      <div>
                        <div className="msg-from">Marwane</div>
                        <div className="msg-to">{name ? `→ ${name}` : 'Message LinkedIn'}</div>
                      </div>
                    </div>
                    <div className="msg-text">{msg.text}</div>
                  </div>
                  <div className="msg-why">{msg.why}</div>
                  <div className="msg-actions">
                    <button className="act-btn" onClick={() => copy(i)}>{copied === i ? 'Copié !' : 'Copier'}</button>
                    <button className="act-btn open" onClick={() => window.open(linkedinUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name + (company ? ' ' + company : ''))}`, '_blank')}>
                      Ouvrir le profil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <style jsx>{`
          .pc { display:flex; flex-direction:column; gap:14px; }

          .signal-banner { background:var(--li-dim); border:1px solid var(--li-border); border-left:3px solid var(--li); border-radius:var(--radius); padding:12px 14px; }
          .signal-banner-tag { font-size:9px; font-weight:700; color:var(--li); letter-spacing:.08em; font-family:var(--mono); margin-bottom:4px; }
          .signal-banner-text { font-size:13px; color:var(--text); }
          .signal-banner-text strong { font-weight:600; }
          .signal-banner-excerpt { font-size:12px; color:var(--text-secondary); font-style:italic; margin-top:6px; padding:6px 10px; background:var(--bg); border-radius:6px; line-height:1.5; }
          .signal-banner-comment { font-size:12px; color:var(--text); margin-top:6px; padding:6px 10px; background:var(--bg-card); border-left:2px solid var(--li); border-radius:0 6px 6px 0; line-height:1.5; }
          .signal-banner-hint { font-size:10px; color:var(--text-muted); margin-top:8px; font-family:var(--mono); }

          .section { display:flex; flex-direction:column; gap:6px; }
          .label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }

          /* URL input */
          .url-row { display:flex; gap:6px; }
          .url-input { flex:1; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); padding:10px 12px; font-size:13px; outline:none; font-family:var(--mono); }
          .url-input:focus { border-color:var(--li); }
          .scan-btn { background:var(--li); color:#fff; border:none; border-radius:var(--radius-sm); padding:10px 20px; font-size:13px; font-weight:700; cursor:pointer; flex-shrink:0; transition:all .15s; }
          .scan-btn:hover { opacity:.9; }
          .scanning { opacity:.6; cursor:not-allowed; }
          .scanned { background:#22c55e; }

          /* Profile card */
          .profile-card { display:flex; align-items:center; gap:10px; background:var(--card); border:1px solid var(--li-border); border-radius:var(--radius); padding:12px; margin-top:6px; }
          .profile-avatar { width:36px; height:36px; background:var(--li); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:900; color:#fff; flex-shrink:0; }
          .profile-info { flex:1; min-width:0; }
          .profile-name { font-size:14px; font-weight:700; color:var(--text); }
          .profile-title { font-size:12px; color:var(--text2); }
          .profile-company { font-size:11px; color:var(--li); font-weight:600; }
          .profile-context { font-size:10px; color:var(--muted); margin-top:2px; }
          .reset-btn { background:none; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:4px; }
          .reset-btn:hover { color:var(--danger); }

          /* Manual edit */
          .manual-edit { margin-top:-8px; }
          .manual-toggle { font-size:11px; color:var(--muted); cursor:pointer; padding:4px 0; }
          .manual-toggle:hover { color:var(--text2); }
          .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:6px; }
          .input-sm { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); padding:8px 10px; font-size:12px; outline:none; }
          .input-sm:focus { border-color:var(--li); }

          /* Type grid */
          .type-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; }
          .type-btn { padding:8px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; text-align:left; display:flex; flex-direction:column; gap:2px; transition:all .12s; }
          .type-btn:hover { border-color:var(--border2); }
          .type-on { border-color:var(--li); background:var(--li-dim); }
          .type-name { font-size:12px; font-weight:600; color:var(--text2); }
          .type-on .type-name { color:var(--text); }
          .type-desc { font-size:9px; color:var(--muted); }

          .input { width:100%; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); color:var(--text); font-size:13px; padding:10px 12px; resize:none; outline:none; line-height:1.6; }
          .input:focus { border-color:var(--li); }

          .primary-btn { width:100%; padding:12px; background:var(--li); color:#fff; border:none; border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer; }
          .primary-btn:hover { opacity:.9; }
          .btn-loading { opacity:.6; cursor:not-allowed; }

          .results { display:flex; flex-direction:column; gap:10px; }
          .msg-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:14px; }
          .msg-card:hover { border-color:var(--border2); }
          .msg-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
          .msg-badge { font-size:9px; font-weight:700; color:var(--li); font-family:var(--mono); text-transform:uppercase; background:var(--li-dim); padding:2px 8px; border-radius:20px; }
          .msg-chars { font-size:10px; color:var(--muted); font-family:var(--mono); }
          .chars-over { color:var(--danger); }

          .msg-preview { background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px; }
          .msg-preview-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid var(--border); }
          .msg-avatar { width:28px; height:28px; background:var(--li); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:900; color:#fff; flex-shrink:0; }
          .msg-from { font-size:12px; font-weight:700; color:var(--text); }
          .msg-to { font-size:10px; color:var(--muted); }
          .msg-text { font-size:13px; color:var(--text); line-height:1.7; white-space:pre-wrap; }
          .msg-why { font-size:10px; color:var(--muted); font-style:italic; margin-top:8px; padding-top:8px; border-top:1px solid var(--border); }
          .msg-actions { display:flex; gap:6px; margin-top:8px; }
          .act-btn { background:var(--card2); border:1px solid var(--border); border-radius:6px; padding:5px 12px; font-size:11px; color:var(--text2); cursor:pointer; font-weight:500; }
          .act-btn:hover { border-color:var(--border2); }
          .act-btn.open { margin-left:auto; background:var(--li-dim); border-color:var(--li-border); color:var(--li); }
          .act-btn.open:hover { background:var(--li); color:#fff; }

          @media (max-width:600px) {
            .type-grid { grid-template-columns:repeat(2,1fr); }
            .form-grid { grid-template-columns:1fr; }
          }
        `}</style>
      </Layout>
    </>
  )
}
