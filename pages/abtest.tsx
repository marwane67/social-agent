import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type Variant = { label: string; approach: string; text: string; hypothesis: string }
type ABResult = { variants: Variant[]; test_protocol: string }

type SavedTest = {
  id: string
  input: string
  network: Network
  variants: (Variant & { impressions?: number; likes?: number; replies?: number })[]
  protocol: string
  createdAt: string
  winner?: 'A' | 'B' | null
}

export default function ABTestPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ABResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tests, setTests] = useState<SavedTest[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    try { setTests(JSON.parse(localStorage.getItem('ab-tests') || '[]')) } catch {}
  }, [])

  const generate = async () => {
    if (!input.trim()) { setError('Décris l\'idée à tester'); return }
    setLoading(true); setError('')
    try {
      const body: any = { input, network }
      try {
        const vp = localStorage.getItem('voice-profile')
        if (vp) body.voiceProfile = JSON.parse(vp)
      } catch {}
      const res = await fetch('/api/abtest', {
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

  const saveTest = () => {
    if (!result) return
    const test: SavedTest = {
      id: Date.now().toString(),
      input, network,
      variants: result.variants,
      protocol: result.test_protocol,
      createdAt: new Date().toISOString(),
      winner: null,
    }
    const all = [test, ...tests]
    setTests(all)
    localStorage.setItem('ab-tests', JSON.stringify(all))
    setResult(null)
    setInput('')
  }

  const updateStat = (testId: string, vIdx: number, field: 'impressions' | 'likes' | 'replies', value: string) => {
    const updated = tests.map(t => {
      if (t.id !== testId) return t
      const variants = [...t.variants]
      variants[vIdx] = { ...variants[vIdx], [field]: Number(value) || 0 }
      return { ...t, variants }
    })
    setTests(updated)
    localStorage.setItem('ab-tests', JSON.stringify(updated))
  }

  const declareWinner = (testId: string) => {
    const updated = tests.map(t => {
      if (t.id !== testId) return t
      const a = t.variants[0]
      const b = t.variants[1]
      const aScore = (a.impressions || 0) > 0 ? ((a.likes || 0) + (a.replies || 0) * 3) / (a.impressions || 1) : 0
      const bScore = (b.impressions || 0) > 0 ? ((b.likes || 0) + (b.replies || 0) * 3) / (b.impressions || 1) : 0
      return { ...t, winner: aScore > bScore ? 'A' : 'B' as 'A' | 'B' }
    })
    setTests(updated)
    localStorage.setItem('ab-tests', JSON.stringify(updated))
  }

  const removeTest = (id: string) => {
    if (!confirm('Supprimer ce test ?')) return
    const updated = tests.filter(t => t.id !== id)
    setTests(updated)
    localStorage.setItem('ab-tests', JSON.stringify(updated))
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <>
      <Head><title>A/B Test — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="A/B Test" subtitle="Teste 2 angles, garde celui qui marche">
        <div className="page">
          {/* Generator */}
          <div className="gen-card">
            <label className="label">Idée à tester</label>
            <textarea
              placeholder="Ex: J'annonce que Pulsa a livré son 50e site IA en 6 mois"
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={3}
              className="textarea"
            />
            <div className="row">
              <select value={network} onChange={e => setNetwork(e.target.value as Network)} className="select">
                <option value="twitter">Twitter / X</option>
                <option value="linkedin">LinkedIn</option>
              </select>
              <button onClick={generate} disabled={loading} className="gen-btn">
                {loading ? 'Génération...' : 'Générer 2 variantes'}
              </button>
            </div>
            {error && <div className="error">{error}</div>}
          </div>

          {/* Result */}
          {result && (
            <>
              <div className="protocol">
                <strong>Protocole :</strong> {result.test_protocol}
              </div>
              <div className="variants">
                {result.variants.map((v, i) => (
                  <div key={i} className="variant">
                    <div className="v-head">
                      <div className="v-label v-label-{v.label}">Variante {v.label}</div>
                      <div className="v-approach">{v.approach}</div>
                    </div>
                    <div className="v-text">{v.text}</div>
                    <div className="v-hypothesis">💡 {v.hypothesis}</div>
                    <button onClick={() => copy(`r-${i}`, v.text)} className="cp-btn">
                      {copied === `r-${i}` ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={saveTest} className="save-btn">Sauvegarder ce test</button>
            </>
          )}

          {/* Saved tests */}
          {tests.length > 0 && (
            <div>
              <h3 className="title">Tests en cours / passés ({tests.length})</h3>
              <div className="tests">
                {tests.map(t => (
                  <div key={t.id} className="test">
                    <div className="t-head">
                      <div className="t-input">{t.input.slice(0, 60)}{t.input.length > 60 ? '...' : ''}</div>
                      <div className="t-date">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</div>
                      <button onClick={() => removeTest(t.id)} className="del">×</button>
                    </div>
                    {t.winner && (
                      <div className="winner">🏆 Gagnant : Variante {t.winner}</div>
                    )}
                    <div className="t-variants">
                      {t.variants.map((v, i) => (
                        <div key={i} className={`t-variant ${t.winner === v.label ? 't-win' : ''}`}>
                          <div className="tv-label">Variante {v.label}</div>
                          <div className="tv-text">{v.text.slice(0, 120)}...</div>
                          <div className="tv-stats">
                            <input type="number" placeholder="vues" value={v.impressions || ''} onChange={e => updateStat(t.id, i, 'impressions', e.target.value)} className="stat-in" />
                            <input type="number" placeholder="likes" value={v.likes || ''} onChange={e => updateStat(t.id, i, 'likes', e.target.value)} className="stat-in" />
                            <input type="number" placeholder="replies" value={v.replies || ''} onChange={e => updateStat(t.id, i, 'replies', e.target.value)} className="stat-in" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {!t.winner && t.variants.every(v => v.impressions) && (
                      <button onClick={() => declareWinner(t.id)} className="dw-btn">
                        Déclarer un gagnant (calcul auto)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .page { display: flex; flex-direction: column; gap: 14px; }
          .gen-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; display: flex; flex-direction: column; gap: 8px; }
          .label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; font-family: var(--mono); }
          .textarea, .select, .stat-in { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 12px; padding: 8px 10px; outline: none; font-family: var(--font); }
          .textarea { line-height: 1.5; resize: vertical; width: 100%; }
          .row { display: flex; gap: 6px; }
          .select { flex: 1; }
          .gen-btn, .save-btn, .dw-btn { background: var(--text); color: var(--bg); border: none; border-radius: var(--radius-sm); padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; }
          .save-btn { width: 100%; padding: 10px; }
          .dw-btn { width: 100%; margin-top: 8px; padding: 8px; }
          .gen-btn:disabled { opacity: .5; }
          .error { font-size: 11px; color: #f87171; padding: 6px 10px; background: rgba(239,68,68,.08); border-radius: var(--radius-sm); }

          .protocol { font-size: 12px; color: var(--text2); padding: 10px 12px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); border-left: 3px solid var(--accent); }
          .variants { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          @media (max-width: 700px) { .variants { grid-template-columns: 1fr; } }
          .variant { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; }
          .v-head { margin-bottom: 8px; }
          .v-label { font-size: 14px; font-weight: 800; color: var(--accent); font-family: var(--mono); }
          .v-approach { font-size: 11px; color: var(--muted); margin-top: 2px; }
          .v-text { font-size: 13px; color: var(--text); line-height: 1.6; white-space: pre-wrap; padding: 10px; background: var(--bg); border-radius: var(--radius-sm); }
          .v-hypothesis { font-size: 11px; color: var(--text2); margin-top: 6px; padding: 6px 10px; background: rgba(251,191,36,.08); border-radius: var(--radius-sm); border-left: 2px solid #fbbf24; }
          .cp-btn { background: var(--card2); border: 1px solid var(--border); color: var(--text2); font-size: 10px; padding: 4px 10px; border-radius: var(--radius-sm); cursor: pointer; margin-top: 8px; font-family: var(--mono); }

          .title { font-size: 13px; font-weight: 700; color: var(--text); margin: 0 0 8px; }
          .tests { display: flex; flex-direction: column; gap: 8px; }
          .test { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; }
          .t-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
          .t-input { flex: 1; font-size: 12px; color: var(--text); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .t-date { font-size: 10px; color: var(--muted); font-family: var(--mono); }
          .del { background: transparent; border: none; color: var(--muted); font-size: 18px; cursor: pointer; padding: 0 4px; }
          .winner { font-size: 12px; color: #4ade80; font-weight: 700; margin-bottom: 8px; padding: 6px 10px; background: rgba(74,222,128,.08); border-radius: var(--radius-sm); }
          .t-variants { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
          @media (max-width: 600px) { .t-variants { grid-template-columns: 1fr; } }
          .t-variant { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px; }
          .t-win { border-color: #4ade80; }
          .tv-label { font-size: 10px; font-weight: 700; color: var(--accent); font-family: var(--mono); }
          .tv-text { font-size: 11px; color: var(--text2); margin: 4px 0; line-height: 1.4; }
          .tv-stats { display: flex; gap: 4px; margin-top: 6px; }
          .stat-in { flex: 1; min-width: 0; padding: 4px 6px; font-size: 11px; }
        `}</style>
      </Layout>
    </>
  )
}
