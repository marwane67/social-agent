import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type Series = {
  title: string
  phases: { name: string; days: string; goal: string }[]
  posts: { day: number; phase: string; type: string; hook: string; text: string; goal: string; cta?: string }[]
}

export default function SeriesPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [duration, setDuration] = useState(30)
  const [launchDate, setLaunchDate] = useState('')
  const [productPitch, setProductPitch] = useState('')
  const [series, setSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activePhase, setActivePhase] = useState<string | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('axora-series')
      if (saved) setSeries(JSON.parse(saved))
    } catch {}
  }, [])

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const body: any = { duration, network, launchDate, productPitch }
      try {
        const vp = localStorage.getItem('voice-profile')
        if (vp) body.voiceProfile = JSON.parse(vp)
      } catch {}
      const res = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.posts) {
        setSeries(data)
        localStorage.setItem('axora-series', JSON.stringify(data))
      } else {
        setError(data.error || 'Échec génération')
      }
    } catch {
      setError('Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  const copyPost = (i: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  const exportAll = () => {
    if (!series) return
    const md = `# ${series.title}\n\n${series.posts.map(p => `## Jour ${p.day} — ${p.phase}\n**Type :** ${p.type}\n**Goal :** ${p.goal}\n\n${p.text}\n`).join('\n---\n')}`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `axora-launch-series.md`
    a.click()
  }

  const filteredPosts = series && activePhase
    ? series.posts.filter(p => p.phase === activePhase)
    : series?.posts || []

  return (
    <>
      <Head><title>Launch Series — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Launch Series" subtitle="Arc narratif complet pour le lancement Axora">
        <div className="page">
          {/* Setup */}
          <div className="setup">
            <h3>Configurer la série</h3>
            <div className="setup-row">
              <div className="field">
                <label>Durée (jours)</label>
                <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="input" />
              </div>
              <div className="field">
                <label>Date de lancement</label>
                <input type="date" value={launchDate} onChange={e => setLaunchDate(e.target.value)} className="input" />
              </div>
              <div className="field">
                <label>Réseau</label>
                <select value={network} onChange={e => setNetwork(e.target.value as Network)} className="input">
                  <option value="twitter">Twitter / X</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Pitch du produit (optionnel)</label>
              <textarea
                placeholder="Marketplace francophone d'acquisition de business digitaux..."
                value={productPitch}
                onChange={e => setProductPitch(e.target.value)}
                rows={2}
                className="input"
              />
            </div>
            <button onClick={generate} disabled={loading} className="gen-btn">
              {loading ? `Génération en cours (peut prendre ${duration > 20 ? '60-90' : '30'} sec)...` : `Générer la série de ${duration} jours`}
            </button>
            {error && <div className="error">{error}</div>}
          </div>

          {series && (
            <>
              {/* Header */}
              <div className="series-head">
                <h2>{series.title}</h2>
                <button onClick={exportAll} className="export">Export Markdown</button>
              </div>

              {/* Phases */}
              <div className="phases">
                <button className={`phase-pill ${!activePhase ? 'active' : ''}`} onClick={() => setActivePhase(null)}>
                  Toutes ({series.posts.length})
                </button>
                {series.phases.map(p => {
                  const count = series.posts.filter(post => post.phase === p.name.split(':')[1]?.trim() || post.phase === p.name).length
                  return (
                    <button key={p.name} className={`phase-pill ${activePhase === p.name ? 'active' : ''}`} onClick={() => setActivePhase(p.name)}>
                      {p.name} · {p.days}
                    </button>
                  )
                })}
              </div>

              {activePhase && (
                <div className="phase-info">
                  <strong>{activePhase}</strong> — {series.phases.find(p => p.name === activePhase)?.goal}
                </div>
              )}

              {/* Posts list */}
              <div className="posts">
                {filteredPosts.map((post, i) => (
                  <div key={i} className="post">
                    <div className="post-head">
                      <div className="day">J{post.day === 0 ? '-DAY' : (post.day < 0 ? '' : '+') + post.day}</div>
                      <div>
                        <div className="phase-tag">{post.phase}</div>
                        <div className="type-tag">{post.type}</div>
                      </div>
                    </div>
                    <div className="post-text">{post.text}</div>
                    <div className="goal">🎯 {post.goal}</div>
                    {post.cta && <div className="cta">CTA : {post.cta}</div>}
                    <button onClick={() => copyPost(i, post.text)} className="copy-btn">
                      {copied === i ? 'Copié !' : 'Copier le post'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .page { display: flex; flex-direction: column; gap: 14px; }
          .setup { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 10px; }
          .setup h3 { margin: 0; font-size: 14px; font-weight: 700; }
          .setup-row { display: flex; gap: 8px; }
          .field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
          .field label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; font-family: var(--mono); }
          .input { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 12px; padding: 8px 10px; outline: none; font-family: var(--font); }
          .gen-btn { background: var(--text); color: var(--bg); border: none; border-radius: var(--radius-sm); padding: 12px; font-size: 13px; font-weight: 700; cursor: pointer; }
          .gen-btn:disabled { opacity: .5; cursor: wait; }

          .error { font-size: 12px; color: #f87171; padding: 8px 12px; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); border-radius: var(--radius-sm); }

          .series-head { display: flex; justify-content: space-between; align-items: center; }
          .series-head h2 { margin: 0; font-size: 18px; font-weight: 800; color: var(--text); }
          .export { background: transparent; border: 1px solid var(--border); color: var(--muted); font-size: 11px; padding: 6px 12px; border-radius: var(--radius-sm); cursor: pointer; font-family: var(--mono); }
          .export:hover { color: var(--text); border-color: var(--border2); }

          .phases { display: flex; gap: 4px; flex-wrap: wrap; }
          .phase-pill { background: var(--card); border: 1px solid var(--border); color: var(--muted); font-size: 10px; padding: 4px 10px; border-radius: 20px; cursor: pointer; font-family: var(--mono); }
          .phase-pill.active { background: var(--text); color: var(--bg); border-color: var(--text); }

          .phase-info { font-size: 12px; color: var(--text2); padding: 8px 12px; background: var(--card); border-left: 3px solid var(--accent); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }

          .posts { display: flex; flex-direction: column; gap: 8px; }
          .post { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
          .post-head { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
          .day { font-size: 14px; font-weight: 800; color: var(--accent); font-family: var(--mono); width: 60px; flex-shrink: 0; padding: 4px 0; }
          .phase-tag { font-size: 10px; font-weight: 700; color: var(--text); }
          .type-tag { font-size: 9px; color: var(--muted); font-family: var(--mono); margin-top: 2px; }
          .post-text { font-size: 13px; color: var(--text); line-height: 1.6; white-space: pre-wrap; }
          .goal { font-size: 11px; color: var(--text2); margin-top: 8px; padding: 6px 10px; background: var(--bg); border-radius: var(--radius-sm); }
          .cta { font-size: 10px; color: var(--accent); margin-top: 4px; font-family: var(--mono); }
          .copy-btn { background: var(--card2); border: 1px solid var(--border); color: var(--text2); font-size: 11px; padding: 6px 12px; border-radius: var(--radius-sm); cursor: pointer; margin-top: 8px; }
          .copy-btn:hover { border-color: var(--border2); }

          @media (max-width: 600px) { .setup-row { flex-direction: column; } }
        `}</style>
      </Layout>
    </>
  )
}
