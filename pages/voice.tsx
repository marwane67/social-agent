import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { VoiceSample, VoiceProfile, getSamples, saveSample, deleteSample, getProfile, saveProfile, clearProfile } from '../lib/voice'

type Network = 'twitter' | 'linkedin'

export default function VoicePage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [samples, setSamples] = useState<VoiceSample[]>([])
  const [profile, setProfile] = useState<VoiceProfile | null>(null)
  const [newText, setNewText] = useState('')
  const [newNetwork, setNewNetwork] = useState<Network>('twitter')
  const [newPerf, setNewPerf] = useState<'low' | 'medium' | 'high' | 'viral'>('high')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSamples(getSamples())
    setProfile(getProfile())
  }, [])

  const addSample = () => {
    if (newText.trim().length < 30) {
      setError('Post trop court (min 30 caractères)')
      return
    }
    saveSample({ text: newText.trim(), network: newNetwork, performance: newPerf })
    setNewText('')
    setError('')
    setSamples(getSamples())
  }

  const removeSample = (id: string) => {
    deleteSample(id)
    setSamples(getSamples())
  }

  const analyze = async () => {
    if (samples.length < 3) {
      setError('Ajoute au moins 3 posts pour analyser ton style')
      return
    }
    setAnalyzing(true)
    setError('')
    try {
      const res = await fetch('/api/voice-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples }),
      })
      const data = await res.json()
      if (data.profile) {
        saveProfile(data.profile)
        setProfile(data.profile)
      } else {
        setError(data.error || 'Échec analyse')
      }
    } catch {
      setError('Connexion impossible')
    } finally {
      setAnalyzing(false)
    }
  }

  const reset = () => {
    if (!confirm('Supprimer ton profil de voix ? (les samples sont gardés)')) return
    clearProfile()
    setProfile(null)
  }

  return (
    <>
      <Head><title>Ma Voix — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Ma Voix" subtitle="Apprends ton style à l'IA pour qu'elle écrive comme toi">
        <div className="page">
          {/* Profil actuel */}
          {profile ? (
            <div className="profile-card">
              <div className="pc-head">
                <h2>Profil actif</h2>
                <button onClick={reset} className="reset-btn">Réinitialiser</button>
              </div>
              <div className="profile-grid">
                <Field label="Signature" value={profile.signature} highlight />
                <Field label="Ton" value={profile.toneOfVoice} />
                <Field label="Longueur moyenne" value={`${profile.averageLength} chars`} />
                <Field label="Structure" value={profile.sentenceStyle} />
                <Field label="Tics de vocabulaire" value={profile.vocabularyTics?.join(' · ') || '—'} />
                <Field label="Thèmes récurrents" value={profile.topicsRecurring?.join(' · ') || '—'} />
                <Field label="Emojis" value={profile.emojiUsage} />
                <Field label="Style de hooks" value={profile.hookStyle} />
                <Field label="Ponctuation" value={profile.punctuationHabits} />
              </div>
              <div className="profile-foot">
                Profil utilisé automatiquement à chaque génération de post.
                Ré-analyse quand tu ajoutes des nouveaux posts.
              </div>
            </div>
          ) : (
            <div className="empty-profile">
              <div className="ep-icon">🎙️</div>
              <h2>Aucun profil de voix</h2>
              <p>Ajoute tes meilleurs posts ci-dessous, puis clique "Analyser mon style".<br/>L'IA extraira ton ton, ton vocabulaire, ta structure, tes tics — et écrira comme toi à partir de là.</p>
            </div>
          )}

          {/* Bouton analyser */}
          <button
            onClick={analyze}
            disabled={analyzing || samples.length < 3}
            className="analyze-btn"
          >
            {analyzing ? 'Analyse en cours...' : profile ? `Ré-analyser (${samples.length} posts)` : `Analyser mon style (${samples.length}/3 min)`}
          </button>

          {error && <div className="error">{error}</div>}

          {/* Ajouter un sample */}
          <div className="section">
            <h3>Ajouter un de tes posts</h3>
            <div className="add-form">
              <textarea
                placeholder="Colle un de tes meilleurs posts ici (un qui a bien performé idéalement)..."
                value={newText}
                onChange={e => setNewText(e.target.value)}
                rows={4}
                className="textarea"
              />
              <div className="add-controls">
                <select value={newNetwork} onChange={e => setNewNetwork(e.target.value as Network)} className="select">
                  <option value="twitter">Twitter / X</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
                <select value={newPerf} onChange={e => setNewPerf(e.target.value as any)} className="select">
                  <option value="low">Performance : faible</option>
                  <option value="medium">Performance : moyenne</option>
                  <option value="high">Performance : élevée</option>
                  <option value="viral">Performance : viral</option>
                </select>
                <button onClick={addSample} className="add-btn">Ajouter</button>
              </div>
              <div className="char-count">{newText.length} chars</div>
            </div>
          </div>

          {/* Liste des samples */}
          {samples.length > 0 && (
            <div className="section">
              <h3>Tes posts de référence ({samples.length})</h3>
              <div className="samples">
                {samples.map(s => (
                  <div key={s.id} className="sample">
                    <div className="sample-meta">
                      <span className={`badge badge-${s.network}`}>{s.network === 'twitter' ? 'X' : 'in'}</span>
                      {s.performance && <span className={`perf perf-${s.performance}`}>{s.performance}</span>}
                      <button onClick={() => removeSample(s.id)} className="del">×</button>
                    </div>
                    <div className="sample-text">{s.text.slice(0, 220)}{s.text.length > 220 ? '...' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .page { display: flex; flex-direction: column; gap: 16px; }

          .profile-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; }
          .pc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
          .pc-head h2 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); }
          .reset-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); font-size: 11px; padding: 4px 10px; border-radius: var(--radius-sm); cursor: pointer; font-family: var(--mono); }
          .reset-btn:hover { color: #f87171; border-color: #f87171; }
          .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .profile-foot { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); }

          .empty-profile { text-align: center; padding: 36px 20px; background: var(--card); border: 1px dashed var(--border); border-radius: var(--radius); }
          .ep-icon { font-size: 36px; margin-bottom: 12px; }
          .empty-profile h2 { margin: 0 0 6px; font-size: 16px; color: var(--text); }
          .empty-profile p { font-size: 12px; color: var(--muted); line-height: 1.6; margin: 0; }

          .analyze-btn { padding: 12px; background: var(--text); color: var(--bg); border: none; border-radius: var(--radius); font-size: 14px; font-weight: 700; cursor: pointer; }
          .analyze-btn:hover { opacity: .9; }
          .analyze-btn:disabled { opacity: .4; cursor: not-allowed; }

          .error { font-size: 12px; color: #f87171; padding: 8px 12px; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); border-radius: var(--radius-sm); }

          .section h3 { font-size: 13px; font-weight: 700; color: var(--text); margin: 0 0 10px; }

          .add-form { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; }
          .textarea { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 13px; padding: 10px; resize: vertical; outline: none; font-family: var(--font); line-height: 1.6; }
          .add-controls { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
          .select { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 11px; padding: 6px 10px; outline: none; font-family: var(--mono); }
          .add-btn { background: var(--text); color: var(--bg); border: none; border-radius: var(--radius-sm); padding: 6px 16px; font-size: 12px; font-weight: 700; cursor: pointer; }
          .char-count { font-size: 10px; color: var(--muted); font-family: var(--mono); margin-top: 6px; text-align: right; }

          .samples { display: flex; flex-direction: column; gap: 6px; }
          .sample { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; }
          .sample-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
          .badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; font-family: var(--mono); text-transform: uppercase; }
          .badge-twitter { background: rgba(29,161,242,.15); color: #1da1f2; }
          .badge-linkedin { background: rgba(10,102,194,.15); color: #0a66c2; }
          .perf { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 20px; font-family: var(--mono); text-transform: uppercase; }
          .perf-low { background: rgba(113,113,122,.2); color: #71717a; }
          .perf-medium { background: rgba(251,191,36,.15); color: #fbbf24; }
          .perf-high { background: rgba(74,222,128,.15); color: #4ade80; }
          .perf-viral { background: rgba(244,114,182,.15); color: #f472b6; }
          .del { margin-left: auto; background: transparent; border: none; color: var(--muted); font-size: 18px; cursor: pointer; line-height: 1; padding: 0 4px; }
          .del:hover { color: #f87171; }
          .sample-text { font-size: 12px; color: var(--text2); line-height: 1.5; white-space: pre-wrap; }

          @media (max-width: 600px) { .profile-grid { grid-template-columns: 1fr; } }
        `}</style>
      </Layout>
    </>
  )
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? 'rgba(57,255,20,.08)' : 'var(--bg)',
      border: '1px solid ' + (highlight ? 'rgba(57,255,20,.3)' : 'var(--border)'),
      borderRadius: 'var(--radius-sm)',
      padding: '8px 10px',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3, fontFamily: 'var(--mono)' }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{value}</div>
    </div>
  )
}
