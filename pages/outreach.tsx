import { useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type MsgType = 'connect' | 'first_dm' | 'follow_up' | 'pitch' | 'collab' | 'thank'
type Message = { type: string; text: string; why: string }

const MSG_TYPES: { id: MsgType; label: string; desc: string }[] = [
  { id: 'connect', label: 'Demande de connexion', desc: 'Max 300 chars — pour que la personne accepte' },
  { id: 'first_dm', label: 'Premier message', desc: 'Engager la conversation après connexion' },
  { id: 'follow_up', label: 'Relance', desc: 'Relancer sans être lourd' },
  { id: 'pitch', label: 'Proposition', desc: 'Proposer un call ou un service' },
  { id: 'collab', label: 'Collaboration', desc: 'Proposer un partenariat' },
  { id: 'thank', label: 'Remerciement', desc: 'Après un échange ou un call' },
]

export default function OutreachPage() {
  const [network, setNetwork] = useState<Network>('linkedin')
  const [messageType, setMessageType] = useState<MsgType>('connect')
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [context, setContext] = useState('')
  const [goal, setGoal] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  const generate = async () => {
    if (!goal.trim()) return
    setLoading(true); setMessages([])
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, title, company, context, goal, messageType }),
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

  const currentType = MSG_TYPES.find(t => t.id === messageType)!
  const maxChars = messageType === 'connect' ? 300 : 500

  return (
    <>
      <Head><title>Outreach — Ismaa</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="LinkedIn Outreach" subtitle="Messages personnalisés pour tes contacts">
        <div className="pc">
          {/* Type de message */}
          <div className="section">
            <label className="label">Type de message</label>
            <div className="type-grid">
              {MSG_TYPES.map(t => (
                <button key={t.id} className={`type-btn ${messageType === t.id ? 'type-on' : ''}`} onClick={() => setMessageType(t.id)}>
                  <span className="type-name">{t.label}</span>
                  <span className="type-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Infos sur la personne */}
          <div className="section">
            <label className="label">La personne (plus tu donnes d'infos, plus c'est personnalisé)</label>
            <div className="form-grid">
              <input className="input-sm" placeholder="Prénom / Nom" value={name} onChange={e => setName(e.target.value)} />
              <input className="input-sm" placeholder="Poste (ex: CEO, CTO, Head of Marketing)" value={title} onChange={e => setTitle(e.target.value)} />
              <input className="input-sm" placeholder="Entreprise" value={company} onChange={e => setCompany(e.target.value)} />
              <input className="input-sm" placeholder="Contexte (post récent, événement, point commun...)" value={context} onChange={e => setContext(e.target.value)} />
            </div>
          </div>

          {/* Objectif */}
          <div className="section">
            <label className="label">Ton objectif</label>
            <textarea className="input" placeholder="Ex: Lui proposer les services de Pulsa Creatives pour automatiser son marketing avec l'IA..." value={goal} onChange={e => setGoal(e.target.value)} rows={3} onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate() }} />
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
                        <div className="msg-from">Ismaa</div>
                        <div className="msg-to">{name ? `À : ${name}` : 'Message LinkedIn'}</div>
                      </div>
                    </div>
                    <div className="msg-text">{msg.text}</div>
                  </div>

                  <div className="msg-why">{msg.why}</div>

                  <div className="msg-actions">
                    <button className="act-btn" onClick={() => copy(i)}>
                      {copied === i ? 'Copié !' : 'Copier'}
                    </button>
                    <button className="act-btn open" onClick={() => {
                      if (name) window.open(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name + (company ? ' ' + company : ''))}`, '_blank')
                      else window.open('https://www.linkedin.com/messaging/', '_blank')
                    }}>
                      Ouvrir LinkedIn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <style jsx>{`
          .pc { display:flex; flex-direction:column; gap:14px; }
          .section { display:flex; flex-direction:column; gap:6px; }
          .label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }

          .type-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; }
          .type-btn { padding:8px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; text-align:left; display:flex; flex-direction:column; gap:2px; transition:all .12s; }
          .type-btn:hover { border-color:var(--border2); }
          .type-on { border-color:var(--li); background:var(--li-dim); }
          .type-name { font-size:12px; font-weight:600; color:var(--text2); }
          .type-on .type-name { color:var(--text); }
          .type-desc { font-size:9px; color:var(--muted); line-height:1.3; }

          .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
          .input-sm { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); padding:8px 10px; font-size:12px; outline:none; }
          .input-sm:focus { border-color:var(--li); }
          .input { width:100%; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); color:var(--text); font-size:13px; padding:10px 12px; resize:none; outline:none; line-height:1.6; }
          .input:focus { border-color:var(--li); }

          .primary-btn { width:100%; padding:12px; background:var(--li); color:#fff; border:none; border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer; transition:all .15s; }
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
