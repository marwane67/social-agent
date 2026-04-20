import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type Variant = { label: string; bio: string; chars: number; strategy: string; best_for: string }
type Result = { current_audit: string; variants: Variant[]; recommended: string }

type BioHistory = {
  id: string
  network: Network
  bio: string
  date: string
  followers_before?: number
  followers_after?: number
  notes?: string
}

export default function BioPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [currentBio, setCurrentBio] = useState('')
  const [goal, setGoal] = useState('')
  const [stats, setStats] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [history, setHistory] = useState<BioHistory[]>([])

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem('bio-history') || '[]')) } catch {}
  }, [])

  const generate = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const body: any = { network, currentBio, goal, stats }
      try {
        const vp = localStorage.getItem('voice-profile')
        if (vp) body.voiceProfile = JSON.parse(vp)
      } catch {}
      const res = await fetch('/api/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.variants) setResult(data)
      else setError(data.error || 'Échec')
    } catch { setError('Connexion impossible') }
    finally { setLoading(false) }
  }

  const saveBio = (variant: Variant) => {
    const item: BioHistory = {
      id: Date.now().toString(),
      network,
      bio: variant.bio,
      date: new Date().toISOString(),
      notes: variant.strategy,
    }
    const updated = [item, ...history]
    setHistory(updated)
    localStorage.setItem('bio-history', JSON.stringify(updated))
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const removeFromHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    localStorage.setItem('bio-history', JSON.stringify(updated))
  }

  const filteredHist = history.filter(h => h.network === network)

  return (
    <>
      <Head><title>Bio Optimizer — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Bio Optimizer" subtitle="5 variantes optimisées + tracking continu">
        <div className="page">
          <div className="card">
            <label className="label">Bio actuelle (optionnel)</label>
            <textarea
              placeholder="Colle ta bio Twitter/LinkedIn actuelle ici..."
              value={currentBio}
              onChange={e => setCurrentBio(e.target.value)}
              rows={2}
              className="textarea"
            />
            <div className="row">
              <div className="field">
                <label className="label">Objectif</label>
                <input
                  type="text"
                  placeholder="Ex: attirer entrepreneurs FR/BE intéressés par IA"
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  className="input"
                />
              </div>
              <div className="field">
                <label className="label">Stats récentes</label>
                <input
                  type="text"
                  placeholder="Ex: 2k followers, 50k vues/mois"
                  value={stats}
                  onChange={e => setStats(e.target.value)}
                  className="input"
                />
              </div>
            </div>
            <button onClick={generate} disabled={loading} className="gen-btn">
              {loading ? 'Génération...' : 'Générer 5 variantes optimisées'}
            </button>
            {error && <div className="error">{error}</div>}
          </div>

          {result && (
            <>
              <div className="audit">
                <div className="a-label">AUDIT BIO ACTUELLE</div>
                <div className="a-text">{result.current_audit}</div>
              </div>

              <div className="variants">
                {result.variants.map((v, i) => {
                  const limit = network === 'twitter' ? 160 : 220
                  const isOver = v.chars > limit
                  return (
                    <div key={i} className="variant">
                      <div className="v-head">
                        <div className="v-label">{v.label}</div>
                        <div className={`v-chars ${isOver ? 'over' : ''}`}>{v.chars}/{limit}</div>
                      </div>
                      <div className="v-bio">{v.bio}</div>
                      <div className="v-strategy">💡 {v.strategy}</div>
                      <div className="v-best">→ {v.best_for}</div>
                      <div className="v-actions">
                        <button onClick={() => copy(`v-${i}`, v.bio)} className="va-btn">
                          {copied === `v-${i}` ? 'Copié !' : 'Copier'}
                        </button>
                        <button onClick={() => saveBio(v)} className="va-btn">Sauver</button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {result.recommended && (
                <div className="reco">
                  <span className="r-label">🏆 RECOMMANDÉE</span> {result.recommended}
                </div>
              )}
            </>
          )}

          {filteredHist.length > 0 && (
            <div>
              <h3 className="title">Historique de tes bios ({filteredHist.length})</h3>
              <div className="history">
                {filteredHist.map(h => (
                  <div key={h.id} className="hist-row">
                    <div className="hr-bio">{h.bio}</div>
                    <div className="hr-meta">
                      <span>{new Date(h.date).toLocaleDateString('fr-FR')}</span>
                      {h.notes && <span>· {h.notes.slice(0, 60)}</span>}
                    </div>
                    <button onClick={() => removeFromHistory(h.id)} className="del">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .page { display: flex; flex-direction: column; gap: 14px; }
          .card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; display: flex; flex-direction: column; gap: 10px; }
          .label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; display: block; margin-bottom: 6px; font-family: var(--mono); }
          .textarea, .input { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 12px; padding: 8px 10px; outline: none; font-family: var(--font); width: 100%; }
          .textarea { line-height: 1.5; resize: vertical; }
          .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          @media (max-width: 600px) { .row { grid-template-columns: 1fr; } }
          .field { display: flex; flex-direction: column; }
          .gen-btn { background: var(--text); color: var(--bg); border: none; border-radius: var(--radius-sm); padding: 12px; font-size: 13px; font-weight: 700; cursor: pointer; }
          .gen-btn:disabled { opacity: .5; }
          .error { font-size: 11px; color: #f87171; padding: 6px 10px; background: rgba(239,68,68,.08); border-radius: var(--radius-sm); }

          .audit { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; border-left: 3px solid #fbbf24; }
          .a-label { font-size: 9px; font-weight: 800; color: #fbbf24; font-family: var(--mono); letter-spacing: .1em; }
          .a-text { font-size: 12px; color: var(--text2); margin-top: 4px; line-height: 1.5; }

          .variants { display: flex; flex-direction: column; gap: 8px; }
          .variant { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; }
          .v-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .v-label { font-size: 11px; font-weight: 800; color: var(--accent); font-family: var(--mono); }
          .v-chars { font-size: 10px; color: var(--muted); font-family: var(--mono); }
          .v-chars.over { color: #f87171; font-weight: 700; }
          .v-bio { font-size: 13px; color: var(--text); line-height: 1.6; padding: 10px; background: var(--bg); border-radius: var(--radius-sm); white-space: pre-wrap; }
          .v-strategy { font-size: 11px; color: var(--text2); margin-top: 6px; }
          .v-best { font-size: 11px; color: var(--muted); margin-top: 2px; font-style: italic; }
          .v-actions { display: flex; gap: 4px; margin-top: 8px; }
          .va-btn { background: var(--card2); border: 1px solid var(--border); color: var(--text2); font-size: 10px; padding: 4px 10px; border-radius: var(--radius-sm); cursor: pointer; font-family: var(--mono); }

          .reco { font-size: 12px; color: var(--text); padding: 12px 14px; background: rgba(74,222,128,.08); border: 1px solid rgba(74,222,128,.3); border-radius: var(--radius); }
          .r-label { font-weight: 800; margin-right: 8px; color: #4ade80; }

          .title { font-size: 13px; font-weight: 700; color: var(--text); margin: 0 0 8px; }
          .history { display: flex; flex-direction: column; gap: 4px; }
          .hist-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
          .hr-bio { flex: 1; font-size: 11px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .hr-meta { font-size: 10px; color: var(--muted); font-family: var(--mono); display: flex; gap: 4px; flex-shrink: 0; }
          .del { background: transparent; border: none; color: var(--muted); font-size: 18px; cursor: pointer; padding: 0 4px; }
          .del:hover { color: #f87171; }
        `}</style>
      </Layout>
    </>
  )
}
