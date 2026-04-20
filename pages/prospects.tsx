import { useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type Prospect = { name: string; title: string; company: string; website: string; linkedin: string; city: string; country: string; skills: string }

const PRESETS = [
  { label: 'PME sans site web (Belgique)', desc: 'Dirigeants de petites entreprises', query: 'Petites entreprises en Belgique (1-50 employés) dans les secteurs restaurant, retail, fitness, immobilier — dirigeants (CEO, fondateurs) avec email' },
  { label: 'PME sans site web (France)', desc: 'Dirigeants de petites entreprises', query: 'Petites entreprises en France (1-50 employés) dans les secteurs restaurant, retail, wellness, services — dirigeants (CEO, fondateurs) avec email' },
  { label: 'Investisseurs VC (FR/BE)', desc: 'Partners, CEO de fonds', query: 'Investisseurs et partners dans le venture capital et private equity en France et Belgique — C-suite avec email' },
  { label: 'Startups tech (Bruxelles)', desc: 'Fondateurs de startups', query: 'Fondateurs et CEO de startups tech et software à Bruxelles — avec email' },
  { label: 'Agences marketing (FR/BE)', desc: 'Pour partenariats Pulsa', query: 'Dirigeants d\'agences marketing et communication en France et Belgique (1-50 employés) — CEO, fondateurs avec email' },
  { label: 'E-commerce (France)', desc: 'Potentiels clients Pulsa', query: 'Dirigeants de e-commerces en France (1-50 employés) — CEO, CTO, CMO avec email' },
]

export default function ProspectsPage() {
  const [network, setNetwork] = useState<Network>('linkedin')
  const [query, setQuery] = useState('')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [msgLoading, setMsgLoading] = useState<number | null>(null)
  const [messages, setMessages] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState<number | null>(null)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true); setProspects([]); setSelected(new Set()); setMessages({})
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (data.prospects) setProspects(data.prospects)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const generateMsg = async (i: number) => {
    const p = prospects[i]
    setMsgLoading(i)
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: p.name, title: p.title, company: p.company,
          context: p.skills ? `Compétences: ${p.skills.slice(0, 100)}` : '',
          goal: 'Proposer les services de Pulsa Creatives ou discuter d\'Axora',
          messageType: 'connect',
        }),
      })
      const data = await res.json()
      if (data.messages?.[0]) setMessages(prev => ({ ...prev, [i]: data.messages[0].text }))
    } catch (e) { console.error(e) }
    finally { setMsgLoading(null) }
  }

  const toggleSelect = (i: number) => {
    const next = new Set(selected)
    if (next.has(i)) next.delete(i); else next.add(i)
    setSelected(next)
  }

  const copyAll = () => {
    const csv = ['Nom,Poste,Entreprise,Ville,Pays,LinkedIn']
    const indices = selected.size > 0 ? Array.from(selected) : prospects.map((_, i) => i)
    indices.forEach(i => {
      const p = prospects[i]
      csv.push(`"${p.name}","${p.title}","${p.company}","${p.city}","${p.country}","${p.linkedin}"`)
    })
    navigator.clipboard.writeText(csv.join('\n'))
  }

  return (
    <>
      <Head><title>Prospects — Marwane</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Prospects" subtitle="Trouve des clients et investisseurs">
        <div className="pc">
          {/* Presets */}
          <div className="section">
            <label className="label">Recherches rapides</label>
            <div className="preset-grid">
              {PRESETS.map((p, i) => (
                <button key={i} className="preset-btn" onClick={() => { setQuery(p.query); }}>
                  <span className="preset-name">{p.label}</span>
                  <span className="preset-desc">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="section">
            <label className="label">Décris ce que tu cherches</label>
            <textarea className="input" placeholder="Ex: Fondateurs de startups SaaS en France qui ont levé des fonds récemment, avec email..." value={query} onChange={e => setQuery(e.target.value)} rows={3} onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) search() }} />
          </div>

          <button className={`primary-btn ${loading ? 'btn-loading' : ''}`} onClick={search} disabled={loading}>
            {loading ? 'Recherche en cours...' : 'Trouver des prospects'}
          </button>

          {/* Results */}
          {prospects.length > 0 && (
            <>
              <div className="results-header">
                <span className="results-count">{prospects.length} prospects trouvés</span>
                <button className="ghost-btn" onClick={copyAll}>
                  {selected.size > 0 ? `Copier ${selected.size} sélectionnés (CSV)` : 'Copier tout (CSV)'}
                </button>
              </div>

              <div className="prospects-list">
                {prospects.map((p, i) => (
                  <div key={i} className={`prospect-card ${selected.has(i) ? 'selected' : ''}`}>
                    <div className="p-top">
                      <button className={`p-check ${selected.has(i) ? 'checked' : ''}`} onClick={() => toggleSelect(i)}>
                        {selected.has(i) ? 'V' : ''}
                      </button>
                      <div className="p-avatar">{p.name.charAt(0)}</div>
                      <div className="p-info">
                        <div className="p-name">{p.name}</div>
                        <div className="p-title">{p.title}</div>
                        <div className="p-company">{p.company}</div>
                      </div>
                      <div className="p-location">{p.city}{p.city && p.country ? ', ' : ''}{p.country}</div>
                    </div>

                    {/* Message section */}
                    <div className="p-actions">
                      <button className="p-msg-btn" onClick={() => generateMsg(i)} disabled={msgLoading === i}>
                        {msgLoading === i ? '...' : messages[i] ? 'Regénérer' : 'Générer un message'}
                      </button>
                      <a className="p-open" href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(p.name + ' ' + p.company)}`} target="_blank" rel="noopener noreferrer">
                        Chercher sur LinkedIn
                      </a>
                    </div>

                    {messages[i] && (
                      <div className="p-message">
                        <div className="p-msg-text">{messages[i]}</div>
                        <button className="p-copy" onClick={() => { navigator.clipboard.writeText(messages[i]); setCopied(i); setTimeout(() => setCopied(null), 2000) }}>
                          {copied === i ? 'Copié !' : 'Copier'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .pc { display:flex; flex-direction:column; gap:14px; }
          .section { display:flex; flex-direction:column; gap:6px; }
          .label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }

          .preset-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; }
          .preset-btn { padding:8px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; text-align:left; display:flex; flex-direction:column; gap:2px; transition:all .12s; }
          .preset-btn:hover { border-color:var(--li); background:var(--li-dim); }
          .preset-name { font-size:11px; font-weight:600; color:var(--text2); }
          .preset-desc { font-size:9px; color:var(--muted); }

          .input { width:100%; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); color:var(--text); font-size:13px; padding:10px 12px; resize:none; outline:none; line-height:1.6; }
          .primary-btn { width:100%; padding:12px; background:var(--li); color:#fff; border:none; border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer; }
          .primary-btn:hover { opacity:.9; }
          .btn-loading { opacity:.6; cursor:not-allowed; }

          .results-header { display:flex; justify-content:space-between; align-items:center; }
          .results-count { font-size:12px; font-weight:600; color:var(--text2); }
          .ghost-btn { background:none; border:1px solid var(--border); border-radius:var(--radius-sm); padding:5px 12px; font-size:11px; color:var(--muted); cursor:pointer; }
          .ghost-btn:hover { border-color:var(--li); color:var(--li); }

          .prospects-list { display:flex; flex-direction:column; gap:6px; }
          .prospect-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:12px; transition:all .12s; }
          .prospect-card:hover { border-color:var(--border2); }
          .prospect-card.selected { border-color:var(--li-border); background:var(--li-dim); }

          .p-top { display:flex; align-items:center; gap:8px; }
          .p-check { width:18px; height:18px; background:var(--card2); border:1px solid var(--border); border-radius:4px; color:var(--li); font-size:10px; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
          .p-check.checked { background:var(--li-dim); border-color:var(--li); }
          .p-avatar { width:32px; height:32px; background:var(--li); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:900; color:#fff; flex-shrink:0; }
          .p-info { flex:1; min-width:0; }
          .p-name { font-size:13px; font-weight:700; color:var(--text); }
          .p-title { font-size:11px; color:var(--text2); }
          .p-company { font-size:11px; color:var(--li); font-weight:600; }
          .p-location { font-size:10px; color:var(--muted); font-family:var(--mono); text-align:right; flex-shrink:0; }

          .p-linkedin { font-size:10px; color:var(--li); text-decoration:none; margin-top:4px; display:inline-block; }
          .p-linkedin:hover { text-decoration:underline; }

          .p-actions { display:flex; gap:6px; margin-top:8px; padding-top:8px; border-top:1px solid var(--border); }
          .p-msg-btn { background:var(--card2); border:1px solid var(--border); border-radius:6px; padding:4px 12px; font-size:11px; color:var(--text2); cursor:pointer; font-weight:500; }
          .p-msg-btn:hover { border-color:var(--li); color:var(--li); }
          .p-msg-btn:disabled { opacity:.5; }
          .p-open { margin-left:auto; background:var(--li-dim); border:1px solid var(--li-border); border-radius:6px; padding:4px 12px; font-size:11px; color:var(--li); text-decoration:none; font-weight:500; }
          .p-open:hover { background:var(--li); color:#fff; }

          .p-message { background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px; margin-top:8px; }
          .p-msg-text { font-size:12px; color:var(--text); line-height:1.6; white-space:pre-wrap; margin-bottom:6px; }
          .p-copy { background:var(--li); color:#fff; border:none; border-radius:4px; padding:3px 10px; font-size:10px; font-weight:600; cursor:pointer; }

          @media (max-width:600px) {
            .preset-grid { grid-template-columns:repeat(2,1fr); }
            .p-location { display:none; }
          }
        `}</style>
      </Layout>
    </>
  )
}
