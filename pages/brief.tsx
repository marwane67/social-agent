import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'

type Brief = {
  headline: string
  ideas: { hook: string; angle: string; network: Network; format: string }[]
  trends: { topic: string; angle: string }[]
  viral_angle: { topic: string; why: string; hook_suggestion: string }
  reminder: string
}

export default function BriefPage() {
  const router = useRouter()
  const [network, setNetwork] = useState<Network>('twitter')
  const [brief, setBrief] = useState<Brief | null>(null)
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState('')
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState<string | null>(null)

  useEffect(() => {
    // Check si on a déjà un brief du jour
    try {
      const cached = localStorage.getItem('daily-brief')
      if (cached) {
        const { brief: b, date } = JSON.parse(cached)
        const today = new Date().toDateString()
        if (date === today) {
          setBrief(b)
          setGenerated(date)
        }
      }
    } catch {}
  }, [])

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const body: any = { context }
      try {
        const vp = localStorage.getItem('voice-profile')
        if (vp) body.voiceProfile = JSON.parse(vp)
      } catch {}
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.headline) {
        setBrief(data)
        const today = new Date().toDateString()
        setGenerated(today)
        localStorage.setItem('daily-brief', JSON.stringify({ brief: data, date: today }))
      } else {
        setError(data.error || 'Échec')
      }
    } catch {
      setError('Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  const useIdea = (idea: Brief['ideas'][0]) => {
    // Stocke le hook et le format dans localStorage pour la page Posts
    localStorage.setItem('brief-idea', JSON.stringify(idea))
    router.push('/')
  }

  return (
    <>
      <Head><title>Daily Brief — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Daily Brief" subtitle="Ton plan de contenu du jour, prêt à exécuter">
        <div className="page">
          {/* Context input */}
          <div className="ctx-card">
            <label className="label">Contexte semaine (optionnel mais conseillé)</label>
            <textarea
              placeholder="Ex: cette semaine je finalise le MVP Axora, j'ai signé 2 nouveaux clients Pulsa, demo prévue jeudi..."
              value={context}
              onChange={e => setContext(e.target.value)}
              rows={2}
              className="textarea"
            />
            <button onClick={generate} disabled={loading} className="gen-btn">
              {loading ? 'Préparation...' : brief ? 'Re-générer le brief' : 'Générer le brief du jour'}
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          {brief && (
            <>
              {generated && (
                <div className="date-stamp">
                  Brief du {new Date(generated).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              )}

              {/* Headline */}
              <div className="headline">
                <div className="hl-icon"></div>
                <div className="hl-text">{brief.headline}</div>
              </div>

              {/* Viral angle */}
              <div className="viral">
                <div className="v-tag">VIRAL DU JOUR</div>
                <div className="v-topic">{brief.viral_angle.topic}</div>
                <div className="v-why">{brief.viral_angle.why}</div>
                <div className="v-hook">"{brief.viral_angle.hook_suggestion}"</div>
              </div>

              {/* Ideas */}
              <div>
                <h3 className="title">5 idées de posts du jour</h3>
                <div className="ideas">
                  {brief.ideas.map((idea, i) => (
                    <div key={i} className="idea">
                      <div className="i-num">#{i + 1}</div>
                      <div className="i-body">
                        <div className="i-hook">"{idea.hook}"</div>
                        <div className="i-angle">{idea.angle}</div>
                        <div className="i-meta">
                          <span className={`i-net i-net-${idea.network}`}>{idea.network === 'twitter' ? 'X' : 'LinkedIn'}</span>
                          <span className="i-fmt">{idea.format}</span>
                        </div>
                      </div>
                      <button onClick={() => useIdea(idea)} className="i-btn">Générer</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trends */}
              <div>
                <h3 className="title">3 tendances à surfer</h3>
                <div className="trends">
                  {brief.trends.map((t, i) => (
                    <div key={i} className="trend">
                      <div className="t-topic">{t.topic}</div>
                      <div className="t-angle">{t.angle}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminder */}
              <div className="reminder">
                <span className="r-label">RAPPEL</span> {brief.reminder}
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .page { display: flex; flex-direction: column; gap: 14px; }
          .ctx-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
          .label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; display: block; margin-bottom: 6px; font-family: var(--mono); }
          .textarea { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 13px; padding: 10px; resize: vertical; outline: none; font-family: var(--font); line-height: 1.5; }
          .gen-btn { width: 100%; background: var(--text); color: var(--bg); border: none; border-radius: var(--radius-sm); padding: 10px; font-size: 13px; font-weight: 700; cursor: pointer; margin-top: 8px; }
          .gen-btn:disabled { opacity: .5; cursor: wait; }

          .error { font-size: 12px; color: #f87171; padding: 8px 12px; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); border-radius: var(--radius-sm); }

          .date-stamp { font-size: 10px; color: var(--muted); font-family: var(--mono); text-transform: uppercase; letter-spacing: .05em; }

          .headline { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); border-left: 3px solid #fbbf24; }
          .hl-icon { font-size: 24px; }
          .hl-text { font-size: 15px; font-weight: 600; color: var(--text); line-height: 1.4; }

          .viral { background: linear-gradient(135deg, rgba(244,114,182,.08), rgba(168,85,247,.08)); border: 1px solid rgba(168,85,247,.3); border-radius: var(--radius); padding: 14px; }
          .v-tag { font-size: 9px; font-weight: 800; color: #a855f7; font-family: var(--mono); letter-spacing: .1em; }
          .v-topic { font-size: 16px; font-weight: 700; color: var(--text); margin-top: 4px; }
          .v-why { font-size: 12px; color: var(--text2); margin-top: 4px; line-height: 1.5; }
          .v-hook { font-size: 13px; color: #c084fc; margin-top: 8px; padding: 8px 10px; background: rgba(168,85,247,.08); border-radius: var(--radius-sm); font-style: italic; }

          .title { font-size: 13px; font-weight: 700; color: var(--text); margin: 0 0 8px; }

          .ideas { display: flex; flex-direction: column; gap: 6px; }
          .idea { display: flex; gap: 10px; padding: 12px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); align-items: flex-start; }
          .i-num { font-size: 12px; font-weight: 800; color: var(--accent); font-family: var(--mono); width: 24px; flex-shrink: 0; padding-top: 2px; }
          .i-body { flex: 1; min-width: 0; }
          .i-hook { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.5; }
          .i-angle { font-size: 11px; color: var(--text2); margin-top: 4px; }
          .i-meta { display: flex; gap: 6px; margin-top: 6px; }
          .i-net { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; font-family: var(--mono); }
          .i-net-twitter { background: rgba(29,161,242,.15); color: #1da1f2; }
          .i-net-linkedin { background: rgba(10,102,194,.15); color: #3b9eff; }
          .i-fmt { font-size: 9px; color: var(--muted); font-family: var(--mono); padding: 2px 6px; background: var(--bg); border-radius: 3px; }
          .i-btn { background: var(--text); color: var(--bg); border: none; border-radius: var(--radius-sm); padding: 6px 12px; font-size: 11px; font-weight: 700; cursor: pointer; flex-shrink: 0; }

          .trends { display: flex; flex-direction: column; gap: 6px; }
          .trend { padding: 10px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); border-left: 2px solid #34d399; }
          .t-topic { font-size: 12px; font-weight: 700; color: var(--text); }
          .t-angle { font-size: 11px; color: var(--text2); margin-top: 3px; line-height: 1.4; }

          .reminder { font-size: 12px; color: var(--text2); padding: 10px 14px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
          .r-label { font-size: 9px; font-weight: 800; color: var(--accent); font-family: var(--mono); margin-right: 8px; }
        `}</style>
      </Layout>
    </>
  )
}
