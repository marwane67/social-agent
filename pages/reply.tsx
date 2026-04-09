import { useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Reply = { type: string; text: string }
type Network = 'twitter' | 'linkedin'
type Tone = 'smart' | 'friendly' | 'debate' | 'expert'
type PersonaData = { persona: { type: string; confidence: number; intent: string; recommended_tone: Tone; strategy: string } }

const TONES: { id: Tone; label: string; desc: string }[] = [
  { id: 'smart', label: 'Smart', desc: 'Intelligent, angle inattendu' },
  { id: 'friendly', label: 'Friendly', desc: 'Chaleureux, connexion' },
  { id: 'debate', label: 'Debate', desc: 'Assertif, enrichir le débat' },
  { id: 'expert', label: 'Expert', desc: 'Autorité, faits concrets' },
]

const PERSONA_COLORS: Record<string, string> = { fan:'#39ff14', prospect:'#1d9bf0', influenceur:'#ff6b00', expert:'#a855f7', curieux:'#eab308', hater:'#ef4444', troll:'#666' }

export default function ReplyPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [tone, setTone] = useState<Tone>('smart')
  const [post, setPost] = useState('')
  const [comment, setComment] = useState('')
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [persona, setPersona] = useState<PersonaData | null>(null)
  const [personaLoading, setPersonaLoading] = useState(false)

  const detectPersona = async () => {
    if (!comment.trim()) return; setPersonaLoading(true); setPersona(null)
    try {
      const res = await fetch('/api/enhance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: comment, action: 'persona', network }) })
      const data = await res.json()
      if (data.persona) { setPersona(data); setTone(data.persona.recommended_tone) }
    } catch (e) { console.error(e) } finally { setPersonaLoading(false) }
  }

  const generate = async () => {
    if (!comment.trim()) return; setLoading(true); setReplies([])
    try {
      const res = await fetch('/api/reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post, comment, tone, network }) })
      const data = await res.json()
      if (data.replies) setReplies(data.replies)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const accent = network === 'linkedin' ? 'var(--li)' : 'var(--accent)'

  return (
    <>
      <Head><title>Reply Agent — Ismaa</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Reply Agent" subtitle="Réponses stratégiques aux commentaires">
        <div className="page-content">
          <div className="section">
            <label className="label">Ton post original (optionnel)</label>
            <textarea className="input" placeholder="Colle ton post pour le contexte..." value={post} onChange={e => setPost(e.target.value)} rows={3} />
          </div>

          <div className="section">
            <label className="label">Le commentaire</label>
            <textarea className="input highlight" placeholder="Colle le commentaire auquel tu veux répondre..." value={comment} onChange={e => { setComment(e.target.value); setPersona(null) }} rows={3} onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate() }} />
          </div>

          <button className="secondary-btn" onClick={detectPersona} disabled={personaLoading || !comment.trim()}>
            {personaLoading ? 'Analyse...' : 'Analyser le commentateur'}
          </button>

          {persona && (
            <div className="persona-card">
              <div className="persona-top">
                <span className="persona-type" style={{ background: PERSONA_COLORS[persona.persona.type] || '#666' }}>{persona.persona.type.toUpperCase()}</span>
                <span className="persona-conf">{persona.persona.confidence}/10</span>
              </div>
              <div className="persona-intent">{persona.persona.intent}</div>
              <div className="persona-strat">{persona.persona.strategy}</div>
              <div className="persona-tone">Ton recommandé : <b style={{ color: accent }}>{persona.persona.recommended_tone}</b></div>
            </div>
          )}

          <div className="section">
            <label className="label">Ton {persona && '(auto-détecté)'}</label>
            <div className="tone-row">
              {TONES.map(t => (
                <button key={t.id} className={`tone-btn ${tone === t.id ? 'tone-on' : ''}`} onClick={() => setTone(t.id)}>
                  <span className="tone-name">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button className={`primary-btn ${loading ? 'btn-loading' : ''}`} onClick={generate} disabled={loading} style={{ '--accent': accent } as any}>
            {loading ? 'Analyse...' : 'Générer 3 réponses'}
          </button>

          {replies.length > 0 && (
            <div className="results">
              {replies.map((r, i) => (
                <div key={i} className="reply-card">
                  <div className="rc-header">
                    <span className="rc-badge">{r.type}</span>
                    <span className="rc-chars">{r.text.length}/{network === 'twitter' ? 200 : 300}</span>
                  </div>
                  <div className="rc-context">{comment.length > 60 ? comment.slice(0, 60) + '...' : comment}</div>
                  <div className="rc-text">{r.text}</div>
                  <div className="rc-actions">
                    <button className="act-btn" onClick={() => { navigator.clipboard.writeText(r.text); setCopied(i); setTimeout(() => setCopied(null), 2000) }}>
                      {copied === i ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <style jsx>{`
          .page-content { display:flex; flex-direction:column; gap:12px; }
          .section { display:flex; flex-direction:column; gap:6px; }
          .label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
          .input { width:100%; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); color:var(--text); font-size:14px; padding:10px 12px; resize:none; outline:none; line-height:1.6; }
          .highlight { border-color:${network === 'linkedin' ? 'var(--li-border)' : 'var(--accent-border)'}; }

          .secondary-btn { width:100%; padding:8px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:12px; color:var(--text2); cursor:pointer; font-weight:600; }
          .secondary-btn:hover { border-color:var(--border2); color:var(--text); }
          .secondary-btn:disabled { opacity:.5; cursor:not-allowed; }

          .persona-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:12px; }
          .persona-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
          .persona-type { color:#000; font-size:10px; font-weight:800; padding:2px 10px; border-radius:20px; font-family:var(--mono); }
          .persona-conf { font-size:10px; color:var(--muted); font-family:var(--mono); }
          .persona-intent { font-size:12px; color:var(--text); margin-bottom:4px; }
          .persona-strat { font-size:11px; color:var(--text2); font-style:italic; margin-bottom:4px; }
          .persona-tone { font-size:10px; color:var(--muted); font-family:var(--mono); }

          .tone-row { display:flex; gap:4px; }
          .tone-btn { padding:6px 14px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; }
          .tone-btn:hover { border-color:var(--border2); }
          .tone-on { border-color:${accent}; background:${network === 'linkedin' ? 'var(--li-dim)' : 'var(--accent-dim)'}; }
          .tone-name { font-size:12px; font-weight:600; color:var(--text2); }
          .tone-on .tone-name { color:var(--text); }

          .primary-btn { width:100%; padding:12px; background:var(--text); color:var(--bg); border:none; border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer; }
          .primary-btn:hover { background:${accent}; color:${network === 'linkedin' ? '#fff' : '#000'}; }
          .btn-loading { opacity:.6; cursor:not-allowed; }

          .results { display:flex; flex-direction:column; gap:8px; }
          .reply-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:14px; }
          .rc-header { display:flex; justify-content:space-between; margin-bottom:6px; }
          .rc-badge { font-size:9px; font-weight:700; color:${accent}; font-family:var(--mono); text-transform:uppercase; background:${network === 'linkedin' ? 'var(--li-dim)' : 'var(--accent-dim)'}; padding:2px 8px; border-radius:20px; }
          .rc-chars { font-size:10px; color:var(--muted); font-family:var(--mono); }
          .rc-context { font-size:11px; color:var(--muted); font-style:italic; background:var(--bg); border:1px solid var(--border); border-radius:6px; padding:6px 8px; margin-bottom:8px; }
          .rc-text { font-size:14px; line-height:1.7; color:var(--text); }
          .rc-actions { margin-top:8px; padding-top:8px; border-top:1px solid var(--border); }
          .act-btn { background:var(--card2); border:1px solid var(--border); border-radius:6px; padding:4px 12px; font-size:11px; color:var(--text2); cursor:pointer; font-weight:500; }
          .act-btn:hover { border-color:var(--border2); }
        `}</style>
      </Layout>
    </>
  )
}
