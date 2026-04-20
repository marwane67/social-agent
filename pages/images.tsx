import { useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type Style = 'modern' | 'handdrawn' | 'bold' | 'corporate' | 'dark'
type Size = '1024x1024' | '1792x1024' | '1024x1792'

const STYLES: { id: Style; label: string; desc: string }[] = [
  { id: 'modern', label: 'Modern', desc: 'Minimaliste, premium' },
  { id: 'handdrawn', label: 'Hand-drawn', desc: 'Notebook, sketch' },
  { id: 'bold', label: 'Bold', desc: 'Pop art, contrasté' },
  { id: 'corporate', label: 'Corporate', desc: 'LinkedIn pro' },
  { id: 'dark', label: 'Dark', desc: 'Tech futuriste' },
]

const TEMPLATES = [
  { name: 'Quote card', prompt: 'A clean square graphic with a powerful quote about entrepreneurship in the center, large bold typography' },
  { name: 'Stat card', prompt: 'A square data visualization showing a striking statistic with a big number, minimal background' },
  { name: 'Comparaison', prompt: 'A split-screen image showing "Avant" on left and "Après" on right, contrasting visual' },
  { name: 'Carousel slide', prompt: 'A clean Instagram carousel slide with a title, subtitle, and one icon, professional aesthetic' },
  { name: 'Process diagram', prompt: 'A clean diagram showing a 3-step process with arrows, modern flat design' },
  { name: 'Hero / cover', prompt: 'A bold hero image for a social media post, centered subject, premium look' },
]

export default function ImagesPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<Style>('modern')
  const [size, setSize] = useState<Size>('1024x1024')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ url?: string; prompt: string; provider: string; note?: string } | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<any[]>([])

  const generate = async () => {
    if (!prompt.trim()) { setError('Décris ce que tu veux'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, size }),
      })
      const data = await res.json()
      if (data.url || data.prompt) {
        setResult(data)
        if (data.url) {
          const h = [{ url: data.url, prompt: data.prompt, date: new Date().toLocaleString('fr-FR') }, ...history].slice(0, 12)
          setHistory(h)
          try { localStorage.setItem('image-history', JSON.stringify(h)) } catch {}
        }
      } else {
        setError(data.error || 'Échec')
      }
    } catch { setError('Connexion impossible') }
    finally { setLoading(false) }
  }

  return (
    <>
      <Head><title>Images — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Images" subtitle="Génération d'images pour tes posts et carrousels">
        <div className="page">
          <div className="gen-card">
            <label className="label">Décris l'image à générer</label>
            <textarea
              placeholder="Ex: Une infographie style notebook montrant les 5 étapes de building in public..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
              className="textarea"
            />

            <div className="templates">
              <div className="t-label">Templates rapides :</div>
              <div className="t-grid">
                {TEMPLATES.map(t => (
                  <button key={t.name} onClick={() => setPrompt(t.prompt)} className="t-btn">
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="opts">
              <div className="opt">
                <label className="label">Style</label>
                <div className="styles">
                  {STYLES.map(s => (
                    <button key={s.id} onClick={() => setStyle(s.id)} className={`style ${style === s.id ? 'on' : ''}`}>
                      <div className="s-name">{s.label}</div>
                      <div className="s-desc">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="opt">
                <label className="label">Format</label>
                <select value={size} onChange={e => setSize(e.target.value as Size)} className="select">
                  <option value="1024x1024">Carré (1024×1024)</option>
                  <option value="1792x1024">Paysage (1792×1024)</option>
                  <option value="1024x1792">Portrait (1024×1792)</option>
                </select>
              </div>
            </div>

            <button onClick={generate} disabled={loading} className="gen-btn">
              {loading ? 'Génération en cours (peut prendre 20s)...' : 'Générer l\'image'}
            </button>

            {error && <div className="error">{error}</div>}
          </div>

          {result && (
            <div className="result">
              {result.url && (
                <>
                  <img src={result.url} alt="generated" className="img" />
                  <div className="r-actions">
                    <a href={result.url} target="_blank" rel="noreferrer" className="r-btn">Ouvrir</a>
                    <a href={result.url} download="generated.png" className="r-btn">Télécharger</a>
                    <span className="r-prov">via {result.provider}</span>
                  </div>
                </>
              )}
              {!result.url && (
                <div className="manual">
                  <div className="m-note">{result.note}</div>
                  <div className="m-prompt">{result.prompt}</div>
                  <button onClick={() => navigator.clipboard.writeText(result.prompt)} className="r-btn">
                    Copier le prompt
                  </button>
                </div>
              )}
            </div>
          )}

          {history.length > 0 && (
            <div className="history">
              <h3>Historique</h3>
              <div className="h-grid">
                {history.map((h, i) => (
                  <a key={i} href={h.url} target="_blank" rel="noreferrer" className="h-item">
                    <img src={h.url} alt="" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .page { display: flex; flex-direction: column; gap: 14px; }
          .gen-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; display: flex; flex-direction: column; gap: 12px; }
          .label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; display: block; margin-bottom: 6px; font-family: var(--mono); }
          .textarea, .select { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 12px; padding: 10px; outline: none; font-family: var(--font); width: 100%; }
          .textarea { line-height: 1.5; resize: vertical; }

          .templates { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px; }
          .t-label { font-size: 10px; font-weight: 700; color: var(--muted); margin-bottom: 6px; font-family: var(--mono); }
          .t-grid { display: flex; gap: 4px; flex-wrap: wrap; }
          .t-btn { background: var(--card2); border: 1px solid var(--border); color: var(--text2); font-size: 10px; padding: 4px 10px; border-radius: 20px; cursor: pointer; font-family: var(--mono); }
          .t-btn:hover { border-color: var(--border2); color: var(--text); }

          .opts { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
          @media (max-width: 600px) { .opts { grid-template-columns: 1fr; } }
          .opt { display: flex; flex-direction: column; gap: 6px; }
          .styles { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 4px; }
          .style { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 8px; cursor: pointer; text-align: left; }
          .style:hover { border-color: var(--border2); }
          .style.on { border-color: var(--accent); background: var(--accent-dim); }
          .s-name { font-size: 11px; font-weight: 700; color: var(--text); }
          .s-desc { font-size: 9px; color: var(--muted); margin-top: 2px; }

          .gen-btn { background: var(--text); color: var(--bg); border: none; border-radius: var(--radius-sm); padding: 12px; font-size: 13px; font-weight: 700; cursor: pointer; }
          .gen-btn:disabled { opacity: .5; cursor: wait; }
          .error { font-size: 12px; color: #f87171; padding: 8px 12px; background: rgba(239,68,68,.08); border-radius: var(--radius-sm); }

          .result { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; }
          .img { width: 100%; max-width: 600px; display: block; margin: 0 auto; border-radius: var(--radius-sm); }
          .r-actions { display: flex; gap: 6px; margin-top: 10px; align-items: center; }
          .r-btn { background: var(--card2); border: 1px solid var(--border); color: var(--text2); font-size: 11px; padding: 6px 12px; border-radius: var(--radius-sm); cursor: pointer; text-decoration: none; font-family: var(--mono); }
          .r-prov { font-size: 10px; color: var(--muted); margin-left: auto; font-family: var(--mono); }

          .manual { display: flex; flex-direction: column; gap: 8px; }
          .m-note { font-size: 12px; color: var(--text2); padding: 10px; background: var(--bg); border-radius: var(--radius-sm); border-left: 3px solid #fbbf24; }
          .m-prompt { font-size: 12px; color: var(--text); padding: 10px; background: var(--bg); border-radius: var(--radius-sm); font-family: var(--mono); line-height: 1.5; }

          .history h3 { font-size: 13px; font-weight: 700; margin: 0 0 8px; }
          .h-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; }
          .h-item { display: block; border-radius: var(--radius-sm); overflow: hidden; }
          .h-item img { width: 100%; display: block; }
        `}</style>
      </Layout>
    </>
  )
}
