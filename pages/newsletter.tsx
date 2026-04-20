import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { getPerformances, viralityScore } from '../lib/performance'

type Network = 'twitter' | 'linkedin'
type Newsletter = {
  subject: string
  preheader: string
  intro: string
  sections: { title: string; content: string }[]
  highlight_post: string
  weekly_lesson: string
  cta: string
  ps: string
}

export default function NewsletterPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [topPosts, setTopPosts] = useState<{ text: string; score: number }[]>([])
  const [weekContext, setWeekContext] = useState('')
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [manualPosts, setManualPosts] = useState('')
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')

  useEffect(() => {
    // Récupère les top posts de la semaine depuis le tracking de perf
    const perfs = getPerformances()
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const lastWeek = perfs.filter(p => new Date(p.postedAt).getTime() > weekAgo)
    const sorted = lastWeek.sort((a, b) => viralityScore(b) - viralityScore(a)).slice(0, 5)
    setTopPosts(sorted.map(p => ({ text: p.text, score: viralityScore(p) })))
  }, [])

  const generate = async () => {
    setLoading(true); setError(''); setNewsletter(null)
    let posts: { text: string }[] = []
    if (mode === 'auto') {
      if (topPosts.length === 0) {
        setError('Aucun post tracké cette semaine. Va sur /performance ou utilise le mode manuel.')
        setLoading(false); return
      }
      posts = topPosts.map(p => ({ text: p.text }))
    } else {
      posts = manualPosts.split('\n\n').filter(p => p.trim()).map(text => ({ text: text.trim() }))
      if (posts.length === 0) {
        setError('Colle au moins 1 post (sépare-les par une ligne vide)')
        setLoading(false); return
      }
    }
    try {
      const body: any = { posts, weekContext }
      try {
        const vp = localStorage.getItem('voice-profile')
        if (vp) body.voiceProfile = JSON.parse(vp)
      } catch {}
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.subject) setNewsletter(data)
      else setError(data.error || 'Échec')
    } catch { setError('Connexion impossible') }
    finally { setLoading(false) }
  }

  const copyAll = () => {
    if (!newsletter) return
    const text = `Subject: ${newsletter.subject}
Preheader: ${newsletter.preheader}

${newsletter.intro}

${newsletter.sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n')}

## Le post de la semaine

${newsletter.highlight_post}

## La leçon

${newsletter.weekly_lesson}

---

${newsletter.cta}

${newsletter.ps}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <Head><title>Newsletter — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Newsletter Hebdo" subtitle="Transforme tes meilleurs posts en newsletter">
        <div className="page">
          {/* Mode toggle */}
          <div className="modes">
            <button className={`mode ${mode === 'auto' ? 'mode-on' : ''}`} onClick={() => setMode('auto')}>
              Auto (depuis Performance)
            </button>
            <button className={`mode ${mode === 'manual' ? 'mode-on' : ''}`} onClick={() => setMode('manual')}>
              Manuel (coller les posts)
            </button>
          </div>

          {mode === 'auto' && topPosts.length > 0 && (
            <div className="auto-card">
              <h3>Top 5 posts de la semaine</h3>
              {topPosts.map((p, i) => (
                <div key={i} className="auto-post">
                  <span className="ap-rank">#{i + 1}</span>
                  <span className="ap-text">{p.text.slice(0, 100)}...</span>
                  <span className="ap-score">Score {p.score}</span>
                </div>
              ))}
            </div>
          )}

          {mode === 'auto' && topPosts.length === 0 && (
            <div className="empty">Aucun post tracké cette semaine. Va sur /performance pour ajouter tes posts.</div>
          )}

          {mode === 'manual' && (
            <div className="manual-card">
              <label className="label">Colle tes meilleurs posts (sépare-les par une ligne vide)</label>
              <textarea
                placeholder="Post 1...

Post 2...

Post 3..."
                value={manualPosts}
                onChange={e => setManualPosts(e.target.value)}
                rows={8}
                className="textarea"
              />
            </div>
          )}

          <div className="ctx-card">
            <label className="label">Contexte de la semaine (optionnel)</label>
            <textarea
              placeholder="Cette semaine j'ai signé 3 nouveaux clients, terminé le matching IA d'Axora, eu 2 calls importants..."
              value={weekContext}
              onChange={e => setWeekContext(e.target.value)}
              rows={2}
              className="textarea"
            />
          </div>

          <button onClick={generate} disabled={loading} className="gen-btn">
            {loading ? 'Génération en cours...' : 'Générer la newsletter'}
          </button>

          {error && <div className="error">{error}</div>}

          {/* Newsletter result */}
          {newsletter && (
            <div className="news">
              <div className="news-head">
                <button onClick={copyAll} className="copy-all">
                  {copied ? 'Copié !' : 'Copier tout'}
                </button>
              </div>

              <div className="email">
                <div className="subject"><span>Subject :</span> {newsletter.subject}</div>
                <div className="preheader"><span>Preview :</span> {newsletter.preheader}</div>

                <div className="body">
                  <div className="section-text">{newsletter.intro}</div>

                  {newsletter.sections.map((s, i) => (
                    <div key={i} className="section">
                      <h2>{s.title}</h2>
                      <div className="section-text">{s.content}</div>
                    </div>
                  ))}

                  <div className="section highlight">
                    <h2>Le post de la semaine</h2>
                    <div className="section-text">{newsletter.highlight_post}</div>
                  </div>

                  <div className="lesson">
                    <span className="l-label">LEÇON</span>
                    <div className="l-text">{newsletter.weekly_lesson}</div>
                  </div>

                  <div className="cta-box">{newsletter.cta}</div>

                  <div className="ps"><strong>P.S.</strong> {newsletter.ps}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .page { display: flex; flex-direction: column; gap: 14px; }
          .modes { display: flex; gap: 4px; }
          .mode { flex: 1; padding: 8px 14px; font-size: 12px; font-weight: 600; color: var(--muted); background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; }
          .mode-on { border-color: var(--text); color: var(--text); }

          .auto-card, .manual-card, .ctx-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
          .auto-card h3 { margin: 0 0 10px; font-size: 13px; font-weight: 700; }
          .auto-post { display: flex; gap: 8px; align-items: center; padding: 6px 8px; border-bottom: 1px solid var(--border); font-size: 11px; }
          .auto-post:last-child { border-bottom: none; }
          .ap-rank { font-weight: 800; color: var(--accent); font-family: var(--mono); width: 24px; }
          .ap-text { flex: 1; color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .ap-score { color: #4ade80; font-family: var(--mono); font-size: 10px; }

          .empty { font-size: 12px; color: var(--muted); padding: 16px; text-align: center; background: var(--card); border: 1px dashed var(--border); border-radius: var(--radius); }

          .label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; display: block; margin-bottom: 6px; font-family: var(--mono); }
          .textarea { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 12px; padding: 10px; resize: vertical; outline: none; font-family: var(--font); line-height: 1.5; }

          .gen-btn { background: var(--text); color: var(--bg); border: none; border-radius: var(--radius); padding: 12px; font-size: 13px; font-weight: 700; cursor: pointer; }
          .gen-btn:disabled { opacity: .5; }

          .error { font-size: 12px; color: #f87171; padding: 8px 12px; background: rgba(239,68,68,.08); border-radius: var(--radius-sm); }

          .news { display: flex; flex-direction: column; gap: 8px; }
          .news-head { display: flex; justify-content: flex-end; }
          .copy-all { background: var(--text); color: var(--bg); border: none; border-radius: var(--radius-sm); padding: 6px 14px; font-size: 11px; font-weight: 700; cursor: pointer; }

          .email { background: #fff; color: #18181b; border-radius: var(--radius); padding: 24px; font-family: Georgia, serif; }
          .subject, .preheader { font-size: 11px; font-family: var(--mono); color: #71717a; padding-bottom: 4px; }
          .subject span, .preheader span { color: #18181b; font-weight: 700; }
          .subject { font-size: 16px; color: #18181b; font-family: var(--font); padding-top: 4px; padding-bottom: 12px; border-bottom: 1px solid #e4e4e7; }
          .preheader { padding-top: 12px; padding-bottom: 0; }

          .body { padding-top: 20px; }
          .body h2 { font-size: 18px; font-weight: 800; color: #18181b; margin: 24px 0 8px; }
          .section-text { font-size: 14px; line-height: 1.7; color: #27272a; white-space: pre-wrap; }
          .section.highlight { background: #fafafa; padding: 16px; border-radius: 8px; border-left: 3px solid #18181b; margin-top: 16px; }
          .lesson { margin-top: 24px; padding: 16px; background: #fef3c7; border-radius: 8px; }
          .l-label { font-size: 10px; font-weight: 800; color: #92400e; font-family: 'JetBrains Mono', monospace; }
          .l-text { font-size: 15px; color: #18181b; font-weight: 600; margin-top: 6px; }
          .cta-box { margin-top: 24px; padding: 14px; background: #18181b; color: #fafafa; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center; }
          .ps { margin-top: 20px; font-size: 13px; color: #52525b; font-style: italic; padding-top: 16px; border-top: 1px solid #e4e4e7; }
        `}</style>
      </Layout>
    </>
  )
}
