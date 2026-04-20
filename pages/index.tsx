import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

type Post = { type: string; text: string }
type Network = 'twitter' | 'linkedin'
type Format = { id: string; label: string }
type GenImage = { url: string | null; prompt: string; provider: string; canvaUrl?: string; note?: string }

const TW_FORMATS: Format[] = [
  { id: 'raw_build', label: 'Raw Build' },
  { id: 'hot_take', label: 'Hot Take' },
  { id: 'storytelling', label: 'Story' },
  { id: 'one_liner', label: 'One-Liner' },
  { id: 'behind_scenes', label: 'BTS' },
  { id: 'ai_authority', label: 'AI Authority' },
  { id: 'engagement_bait', label: 'Reply Magnet' },
  { id: 'axora_hype', label: 'Axora' },
]
const LI_FORMATS: Format[] = [
  { id: 'transparency', label: 'Transparence' },
  { id: 'storytelling_li', label: 'Story' },
  { id: 'thought_leadership', label: 'Thought Leader' },
  { id: 'value_bomb', label: 'Value Bomb' },
  { id: 'personal_brand', label: 'Personal' },
  { id: 'debate_li', label: 'Débat' },
  { id: 'lead_magnet', label: 'Lead Magnet' },
  { id: 'axora_linkedin', label: 'Axora' },
]

export default function Home() {
  const router = useRouter()
  const [network, setNetwork] = useState<Network>('twitter')
  const [format, setFormat] = useState('raw_build')
  const [input, setInput] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [editTexts, setEditTexts] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState<number | null>(null)
  const [images, setImages] = useState<Record<number, GenImage>>({})
  const [imgLoading, setImgLoading] = useState<number | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [selectedHook, setSelectedHook] = useState<{ id: number; text: string } | null>(null)
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null)

  const formats = network === 'twitter' ? TW_FORMATS : LI_FORMATS
  const maxChars = network === 'twitter' ? 280 : 3000

  // Initial load — pick up selections from other pages
  useEffect(() => {
    try {
      const h = localStorage.getItem('selected-hook')
      if (h) { setSelectedHook(JSON.parse(h)); localStorage.removeItem('selected-hook') }
      const fw = localStorage.getItem('selected-framework')
      if (fw) { setSelectedFramework(fw); localStorage.removeItem('selected-framework') }
      const idea = localStorage.getItem('brief-idea')
      if (idea) {
        const parsed = JSON.parse(idea)
        if (parsed.network) setNetwork(parsed.network)
        if (parsed.format) setFormat(parsed.format)
        setInput((parsed.angle || '') + (parsed.hook ? `\n\nHook : ${parsed.hook}` : ''))
        localStorage.removeItem('brief-idea')
      }
    } catch {}
  }, [])

  // Reset format when network changes
  useEffect(() => {
    setFormat(network === 'twitter' ? 'raw_build' : 'transparency')
  }, [network])

  const generate = async () => {
    if (!input.trim()) {
      setError('Décris ce qui se passe : une décision, un chiffre, une victoire...')
      return
    }
    setError('')
    setLoading(true)
    setPosts([])
    setImages({})
    setEditTexts({})
    setEditing(null)

    try {
      const body: any = { input, format, network }
      if (selectedHook) body.hookId = selectedHook.id
      if (selectedFramework) body.framework = selectedFramework
      try {
        const vp = localStorage.getItem('voice-profile')
        if (vp) body.voiceProfile = JSON.parse(vp)
      } catch {}
      try {
        const { computeInsights, insightsAsPromptBlock, getPerformances } = await import('../lib/performance')
        const insights = computeInsights(getPerformances())
        if (insights.totalPosts >= 5) body.performanceInsights = insightsAsPromptBlock(insights)
      } catch {}

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.posts) {
        setPosts(data.posts)
        // Save to history
        try {
          const hist = JSON.parse(localStorage.getItem('social-agent-history') || '[]')
          hist.unshift({
            id: Date.now().toString(),
            network, format, input,
            posts: data.posts,
            date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          })
          localStorage.setItem('social-agent-history', JSON.stringify(hist.slice(0, 50)))
        } catch {}
      } else {
        setError(data.error || 'Erreur de génération. Réessaye.')
      }
    } catch {
      setError('Connexion impossible. Vérifie ta clé OpenRouter.')
    } finally {
      setLoading(false)
    }
  }

  const generateImage = async (i: number) => {
    const text = editTexts[i] ?? posts[i]?.text
    if (!text) return
    setImgLoading(i)
    try {
      const res = await fetch('/api/post-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postText: text, style: 'modern' }),
      })
      const data = await res.json()
      if (data.url || data.canvaUrl) {
        setImages(prev => ({ ...prev, [i]: data }))
      }
    } catch {} finally {
      setImgLoading(null)
    }
  }

  const copyPost = (i: number) => {
    const text = editTexts[i] ?? posts[i].text
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  const openInNetwork = (i: number) => {
    const text = encodeURIComponent(editTexts[i] ?? posts[i].text)
    window.open(
      network === 'twitter'
        ? `https://twitter.com/intent/tweet?text=${text}`
        : `https://www.linkedin.com/feed/?shareActive=true&text=${text}`,
      '_blank'
    )
  }

  const toggleEdit = (i: number) => {
    if (editing === i) setEditing(null)
    else {
      setEditing(i)
      if (!editTexts[i]) setEditTexts(prev => ({ ...prev, [i]: posts[i].text }))
    }
  }

  const charCount = (i: number) => (editTexts[i] ?? posts[i]?.text ?? '').length

  return (
    <>
      <Head>
        <title>Compose — Social Agent</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Layout
        network={network}
        onNetworkChange={setNetwork}
        title="Compose"
        subtitle={`${network === 'twitter' ? 'Twitter / X' : 'LinkedIn'}`}
      >
        {/* === COMPOSER === */}
        <div className="composer">
          <textarea
            className="prompt-input"
            placeholder="Décris ce qui se passe. Une décision. Un chiffre. Une galère. Une victoire."
            value={input}
            onChange={e => { setInput(e.target.value); if (error) setError('') }}
            rows={4}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate() }}
          />

          {/* Format pills (compact) */}
          <div className="format-row">
            {formats.slice(0, 4).map(f => (
              <button
                key={f.id}
                className={`fmt-chip ${format === f.id ? 'fmt-on' : ''}`}
                onClick={() => setFormat(f.id)}
              >
                {f.label}
              </button>
            ))}
            <button className="fmt-more" onClick={() => setShowOptions(!showOptions)}>
              {showOptions ? '−' : '+'}
            </button>
          </div>

          {/* Extra formats expanded */}
          {showOptions && (
            <div className="format-row format-extra">
              {formats.slice(4).map(f => (
                <button
                  key={f.id}
                  className={`fmt-chip ${format === f.id ? 'fmt-on' : ''}`}
                  onClick={() => setFormat(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Active hook / framework chips */}
          {(selectedHook || selectedFramework) && (
            <div className="active-chips">
              {selectedHook && (
                <span className="active-chip">
                  Hook · {selectedHook.text.slice(0, 40)}{selectedHook.text.length > 40 ? '...' : ''}
                  <button onClick={() => setSelectedHook(null)} aria-label="Remove">×</button>
                </span>
              )}
              {selectedFramework && (
                <span className="active-chip">
                  Framework · {selectedFramework}
                  <button onClick={() => setSelectedFramework(null)} aria-label="Remove">×</button>
                </span>
              )}
            </div>
          )}

          {error && <div className="err">{error}</div>}

          <button
            className={`btn-gen ${loading ? 'is-loading' : ''}`}
            onClick={generate}
            disabled={loading}
          >
            {loading ? (
              <><span className="spin" /> Génération...</>
            ) : (
              <>Générer 3 posts <span className="kbd">⌘ ↵</span></>
            )}
          </button>
        </div>

        {/* === RESULTS === */}
        {posts.length > 0 && (
          <div className="results">
            {posts.map((post, i) => {
              const text = editTexts[i] ?? post.text
              const count = charCount(i)
              const isOver = count > maxChars
              const img = images[i]
              return (
                <article key={i} className="post-card">
                  {/* Type badge */}
                  <div className="pc-meta">
                    <span className="pc-type">{post.type}</span>
                    <span className={`pc-chars ${isOver ? 'over' : ''}`}>
                      {count}/{maxChars}
                    </span>
                  </div>

                  {/* Text or editor */}
                  {editing === i ? (
                    <textarea
                      className="pc-edit"
                      value={text}
                      onChange={e => setEditTexts(prev => ({ ...prev, [i]: e.target.value }))}
                      rows={network === 'linkedin' ? 12 : 6}
                      autoFocus
                    />
                  ) : (
                    <div className="pc-text">
                      {text.split('\n').map((line, j, arr) => (
                        <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                      ))}
                    </div>
                  )}

                  {/* Inline image */}
                  {img && img.url && (
                    <div className="pc-image">
                      <img src={img.url} alt="post visual" />
                      <div className="pc-img-actions">
                        <a href={img.url} download={`post-${i + 1}.png`} className="pc-img-btn">
                          Télécharger
                        </a>
                        <button onClick={() => generateImage(i)} className="pc-img-btn">
                          Régénérer
                        </button>
                        <span className="pc-img-prov">via {img.provider}</span>
                      </div>
                    </div>
                  )}
                  {img && !img.url && img.canvaUrl && (
                    <div className="pc-canva">
                      <div className="pc-canva-note">{img.note}</div>
                      <a href={img.canvaUrl} target="_blank" rel="noreferrer" className="pc-canva-btn">
                        Ouvrir Canva
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pc-actions">
                    <button className="act" onClick={() => copyPost(i)}>
                      {copied === i ? '✓ Copié' : 'Copier'}
                    </button>
                    <button className={`act ${editing === i ? 'act-on' : ''}`} onClick={() => toggleEdit(i)}>
                      {editing === i ? 'OK' : 'Éditer'}
                    </button>
                    <button
                      className="act"
                      onClick={() => generateImage(i)}
                      disabled={imgLoading === i}
                    >
                      {imgLoading === i ? (
                        <><span className="spin spin-sm" /> Image...</>
                      ) : img ? 'Nouvelle image' : '+ Image'}
                    </button>
                    <div className="act-spacer" />
                    <button className="act-primary" onClick={() => openInNetwork(i)}>
                      Poster sur {network === 'twitter' ? 'X' : 'LinkedIn'} →
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Empty state hint */}
        {posts.length === 0 && !loading && (
          <div className="empty">
            <p>Astuce : utilise <button onClick={() => router.push('/brief')} className="link">/brief</button> pour des idées du jour, ou <button onClick={() => router.push('/library')} className="link">/library</button> pour piocher un hook.</p>
          </div>
        )}

        <style jsx>{`
          /* === Composer === */
          .composer {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-lg);
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .prompt-input {
            width: 100%;
            background: transparent;
            border: none;
            color: var(--text);
            font-size: 16px;
            line-height: 1.55;
            resize: none;
            font-family: var(--font);
            letter-spacing: -0.005em;
          }
          .prompt-input::placeholder {
            color: var(--text-muted);
          }

          .format-row {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
          }
          .format-extra {
            margin-top: -8px;
          }
          .fmt-chip {
            background: var(--card);
            border: 1px solid var(--border);
            color: var(--text-muted);
            font-size: 12px;
            font-weight: 500;
            padding: 5px 12px;
            border-radius: 100px;
          }
          .fmt-chip:hover {
            color: var(--text-secondary);
            border-color: var(--border-strong);
          }
          .fmt-on {
            color: var(--text);
            background: var(--surface);
            border-color: var(--border-strong);
          }
          .fmt-more {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-muted);
            font-size: 14px;
            font-weight: 700;
            width: 28px;
            height: 28px;
            border-radius: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }

          .active-chips {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }
          .active-chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--accent-bg);
            border: 1px solid var(--accent-border);
            color: var(--text);
            font-size: 11px;
            padding: 4px 4px 4px 10px;
            border-radius: 100px;
            font-family: var(--mono);
          }
          .active-chip button {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 16px;
            line-height: 1;
            padding: 0 6px;
          }
          .active-chip button:hover { color: var(--text); }

          .err {
            font-size: 12px;
            color: var(--danger);
            padding: 8px 12px;
            background: rgba(239, 68, 68, 0.06);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: var(--r-sm);
          }

          .btn-gen {
            background: var(--text);
            color: var(--bg);
            border: none;
            border-radius: var(--r-md);
            padding: 13px 16px;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            letter-spacing: -0.01em;
          }
          .btn-gen:hover:not(:disabled) {
            background: #fff;
          }
          .btn-gen.is-loading { background: var(--text-muted); color: var(--bg); }
          .kbd {
            font-family: var(--mono);
            font-size: 11px;
            font-weight: 500;
            opacity: 0.6;
            padding: 2px 6px;
            background: rgba(0, 0, 0, 0.15);
            border-radius: 4px;
          }

          .spin {
            width: 14px;
            height: 14px;
            border: 1.5px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            display: inline-block;
          }
          .spin-sm { width: 11px; height: 11px; border-width: 1px; }
          @keyframes spin { to { transform: rotate(360deg); } }

          /* === Results === */
          .results {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 24px;
          }

          .post-card {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-lg);
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            transition: border-color 0.15s;
          }
          .post-card:hover { border-color: var(--border-strong); }

          .pc-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .pc-type {
            font-size: 10px;
            font-weight: 700;
            color: var(--text-muted);
            font-family: var(--mono);
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .pc-chars {
            font-size: 11px;
            color: var(--text-faint);
            font-family: var(--mono);
          }
          .pc-chars.over { color: var(--danger); font-weight: 600; }

          .pc-text {
            font-size: 15px;
            line-height: 1.6;
            color: var(--text);
            white-space: pre-wrap;
            letter-spacing: -0.005em;
          }
          .pc-edit {
            width: 100%;
            background: var(--bg);
            border: 1px solid var(--border-strong);
            border-radius: var(--r-sm);
            color: var(--text);
            font-size: 15px;
            line-height: 1.6;
            padding: 12px;
            resize: vertical;
            font-family: var(--font);
          }

          .pc-image {
            border-radius: var(--r-md);
            overflow: hidden;
            background: var(--bg);
          }
          .pc-image img {
            width: 100%;
            display: block;
          }
          .pc-img-actions {
            display: flex;
            gap: 6px;
            align-items: center;
            padding: 10px 12px;
            background: var(--surface);
            border-top: 1px solid var(--border);
          }
          .pc-img-btn {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 11px;
            padding: 4px 10px;
            border-radius: var(--r-sm);
            font-family: var(--mono);
            text-decoration: none;
          }
          .pc-img-btn:hover { color: var(--text); border-color: var(--border-strong); }
          .pc-img-prov {
            font-size: 10px;
            color: var(--text-faint);
            font-family: var(--mono);
            margin-left: auto;
          }

          .pc-canva {
            background: var(--surface);
            border: 1px dashed var(--border-strong);
            border-radius: var(--r-md);
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .pc-canva-note {
            font-size: 11px;
            color: var(--text-muted);
          }
          .pc-canva-btn {
            background: var(--text);
            color: var(--bg);
            font-size: 12px;
            padding: 6px 12px;
            border-radius: var(--r-sm);
            text-align: center;
            font-weight: 600;
            align-self: flex-start;
          }

          .pc-actions {
            display: flex;
            gap: 4px;
            align-items: center;
            padding-top: 14px;
            border-top: 1px solid var(--border);
            flex-wrap: wrap;
          }
          .act {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
            padding: 5px 12px;
            border-radius: var(--r-sm);
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .act:hover:not(:disabled) {
            color: var(--text);
            border-color: var(--border-strong);
            background: var(--card);
          }
          .act-on {
            color: var(--text);
            background: var(--surface);
            border-color: var(--border-strong);
          }
          .act-spacer { flex: 1; }
          .act-primary {
            background: var(--text);
            color: var(--bg);
            border: none;
            font-size: 12px;
            padding: 6px 14px;
            border-radius: var(--r-sm);
            font-weight: 600;
            letter-spacing: -0.005em;
          }
          .act-primary:hover { background: #fff; }

          .empty {
            margin-top: 32px;
            text-align: center;
            color: var(--text-muted);
            font-size: 13px;
          }
          .empty p { margin: 0; }
          .link {
            background: transparent;
            border: none;
            color: var(--text);
            text-decoration: underline;
            text-decoration-color: var(--text-faint);
            text-underline-offset: 3px;
            font-size: inherit;
            padding: 0;
            font-family: var(--mono);
          }
          .link:hover { text-decoration-color: var(--text); }

          @media (max-width: 600px) {
            .composer { padding: 12px; }
            .prompt-input { font-size: 15px; }
            .post-card { padding: 14px; }
            .pc-text { font-size: 14px; }
          }
        `}</style>
      </Layout>
    </>
  )
}
