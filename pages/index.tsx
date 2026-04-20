import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useNetwork } from '../lib/network-context'

type Post = { type: string; text: string }
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

const PLACEHOLDERS = {
  twitter: "Une décision. Un chiffre. Une galère. Une victoire. Vas-y direct.",
  linkedin: "Une histoire à raconter. Un insight. Une coulisse. Prends le temps de poser le contexte.",
}

export default function Compose() {
  const router = useRouter()
  const { network, isLi } = useNetwork()
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
  const [showAllFormats, setShowAllFormats] = useState(false)
  const [selectedHook, setSelectedHook] = useState<{ id: number; text: string } | null>(null)
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null)

  const formats = useMemo(() => (isLi ? LI_FORMATS : TW_FORMATS), [isLi])
  const maxChars = isLi ? 3000 : 280
  const placeholder = isLi ? PLACEHOLDERS.linkedin : PLACEHOLDERS.twitter

  // Reset format on network switch
  useEffect(() => {
    setFormat(isLi ? 'transparency' : 'raw_build')
    setPosts([])
    setImages({})
  }, [isLi])

  // Pick up selections from Library / Brief
  useEffect(() => {
    try {
      const h = localStorage.getItem('selected-hook')
      if (h) { setSelectedHook(JSON.parse(h)); localStorage.removeItem('selected-hook') }
      const fw = localStorage.getItem('selected-framework')
      if (fw) { setSelectedFramework(fw); localStorage.removeItem('selected-framework') }
      const idea = localStorage.getItem('brief-idea')
      if (idea) {
        const parsed = JSON.parse(idea)
        if (parsed.format) setFormat(parsed.format)
        setInput((parsed.angle || '') + (parsed.hook ? `\n\nHook : ${parsed.hook}` : ''))
        localStorage.removeItem('brief-idea')
      }
    } catch {}
  }, [])

  const generate = async () => {
    if (!input.trim()) {
      setError('Décris ce qui se passe')
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
      isLi
        ? `https://www.linkedin.com/feed/?shareActive=true&text=${text}`
        : `https://twitter.com/intent/tweet?text=${text}`,
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
      <Layout title="Compose" subtitle={isLi ? 'LinkedIn · ton professionnel, format aéré' : 'Twitter / X · punchy, max 280 chars'}>
        {/* === COMPOSER === */}
        <section className="composer">
          <div className="composer-inner">
            <textarea
              className="prompt"
              placeholder={placeholder}
              value={input}
              onChange={e => { setInput(e.target.value); if (error) setError('') }}
              rows={isLi ? 5 : 4}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate() }}
            />

            {/* Format pills */}
            <div className="formats">
              {(showAllFormats ? formats : formats.slice(0, 4)).map(f => (
                <button
                  key={f.id}
                  className={`pill ${format === f.id ? 'pill-on' : ''}`}
                  onClick={() => setFormat(f.id)}
                >
                  {f.label}
                </button>
              ))}
              {formats.length > 4 && (
                <button className="pill pill-more" onClick={() => setShowAllFormats(!showAllFormats)}>
                  {showAllFormats ? '−' : `+${formats.length - 4}`}
                </button>
              )}
            </div>

            {/* Active chips */}
            {(selectedHook || selectedFramework) && (
              <div className="active-row">
                {selectedHook && (
                  <span className="active">
                    <span className="active-label">Hook</span>
                    <span className="active-val">{selectedHook.text.slice(0, 40)}{selectedHook.text.length > 40 ? '…' : ''}</span>
                    <button onClick={() => setSelectedHook(null)} aria-label="Remove">×</button>
                  </span>
                )}
                {selectedFramework && (
                  <span className="active">
                    <span className="active-label">Framework</span>
                    <span className="active-val">{selectedFramework}</span>
                    <button onClick={() => setSelectedFramework(null)} aria-label="Remove">×</button>
                  </span>
                )}
              </div>
            )}

            {error && <div className="err">{error}</div>}
          </div>

          {/* Generate button — sticky at bottom of composer */}
          <button
            className={`btn-primary ${loading ? 'loading' : ''}`}
            onClick={generate}
            disabled={loading}
          >
            <span className="btn-content">
              {loading ? (
                <><span className="spin" /> Génération…</>
              ) : (
                <>
                  <span>Générer 3 posts</span>
                  <span className="kbd">⌘ ↵</span>
                </>
              )}
            </span>
          </button>
        </section>

        {/* === RESULTS === */}
        {posts.length > 0 && (
          <section className="results">
            {posts.map((post, i) => {
              const text = editTexts[i] ?? post.text
              const count = charCount(i)
              const isOver = count > maxChars
              const img = images[i]
              return (
                <article key={i} className="post-card post-card-anim">
                  <header className="card-head">
                    <span className="card-type">{post.type}</span>
                    <span className={`card-chars ${isOver ? 'over' : ''}`}>
                      {count}<span className="card-chars-sep">/</span>{maxChars}
                    </span>
                  </header>

                  {editing === i ? (
                    <textarea
                      className="card-edit"
                      value={text}
                      onChange={e => setEditTexts(prev => ({ ...prev, [i]: e.target.value }))}
                      rows={isLi ? 14 : 6}
                      autoFocus
                    />
                  ) : (
                    <div className="card-text">
                      {text.split('\n').map((line, j, arr) => (
                        <span key={j}>{line || '\u00A0'}{j < arr.length - 1 && <br />}</span>
                      ))}
                    </div>
                  )}

                  {img && img.url && (
                    <div className="card-img">
                      <img src={img.url} alt="post visual" />
                      <div className="card-img-bar">
                        <a href={img.url} download={`post-${i + 1}.png`} className="card-img-act">↓ Télécharger</a>
                        <button onClick={() => generateImage(i)} className="card-img-act">↻ Régénérer</button>
                        <span className="card-img-prov">{img.provider}</span>
                      </div>
                    </div>
                  )}
                  {img && !img.url && img.canvaUrl && (
                    <div className="card-canva">
                      <p>{img.note}</p>
                      <a href={img.canvaUrl} target="_blank" rel="noreferrer" className="card-canva-btn">
                        Ouvrir Canva →
                      </a>
                    </div>
                  )}

                  <footer className="card-foot">
                    <button className="card-act" onClick={() => copyPost(i)}>
                      {copied === i ? '✓ Copié' : 'Copier'}
                    </button>
                    <button className={`card-act ${editing === i ? 'card-act-on' : ''}`} onClick={() => toggleEdit(i)}>
                      {editing === i ? 'OK' : 'Éditer'}
                    </button>
                    <button
                      className="card-act"
                      onClick={() => generateImage(i)}
                      disabled={imgLoading === i}
                    >
                      {imgLoading === i ? <><span className="spin spin-xs" /> Image…</> : img ? '↻ Image' : '+ Image'}
                    </button>
                    <span className="card-foot-spacer" />
                    <button className="card-publish" onClick={() => openInNetwork(i)}>
                      Poster sur {isLi ? 'LinkedIn' : 'X'} <span className="card-publish-arrow">→</span>
                    </button>
                  </footer>
                </article>
              )
            })}
          </section>
        )}

        {posts.length === 0 && !loading && (
          <div className="hint">
            <p>
              Astuce : utilise{' '}
              <button onClick={() => router.push('/brief')} className="hint-link">/brief</button>
              {' '}pour des idées du jour, ou{' '}
              <button onClick={() => router.push('/library')} className="hint-link">/library</button>
              {' '}pour piocher un hook.
            </p>
          </div>
        )}

        <style jsx>{`
          /* === COMPOSER === */
          .composer {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-xl);
            overflow: hidden;
            transition: border-color var(--t-fast) var(--ease);
          }
          .composer:focus-within {
            border-color: var(--border-focus);
          }
          .composer-inner {
            padding: ${isLi ? '20px 22px 16px' : '18px 20px 14px'};
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .prompt {
            width: 100%;
            background: transparent;
            border: none;
            color: var(--text);
            font-size: ${isLi ? '17px' : '16px'};
            line-height: 1.55;
            resize: none;
            font-family: var(--font);
            letter-spacing: -0.01em;
          }
          .prompt::placeholder {
            color: var(--text-muted);
          }
          .prompt:focus { box-shadow: none; }

          .formats { display: flex; gap: 5px; flex-wrap: wrap; }

          .pill {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
            font-weight: 500;
            padding: 5px 13px;
            border-radius: 100px;
            letter-spacing: -0.005em;
          }
          .pill:hover {
            color: var(--text);
            border-color: var(--border-strong);
          }
          .pill-on {
            color: var(--accent-text-on);
            background: var(--accent);
            border-color: var(--accent);
            font-weight: 600;
          }
          .pill-more {
            color: var(--text-muted);
            font-family: var(--mono);
            min-width: 38px;
            padding: 5px 10px;
          }

          .active-row { display: flex; gap: 6px; flex-wrap: wrap; }
          .active {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--accent-soft);
            border: 1px solid var(--accent-border);
            color: var(--text);
            font-size: 11px;
            padding: 4px 4px 4px 4px;
            border-radius: 100px;
            font-family: var(--mono);
          }
          .active-label {
            background: var(--accent);
            color: var(--accent-text-on);
            padding: 2px 8px;
            border-radius: 100px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .active-val { padding: 0 4px 0 0; }
          .active button {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 16px;
            line-height: 1;
            padding: 0 8px 0 4px;
          }
          .active button:hover { color: var(--text); }

          .err {
            font-size: 12px;
            color: var(--danger);
            padding: 10px 12px;
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.22);
            border-radius: var(--r-md);
          }

          /* === Generate button === */
          .btn-primary {
            width: 100%;
            background: var(--accent);
            color: var(--accent-text-on);
            border: none;
            padding: ${isLi ? '15px 18px' : '14px 16px'};
            font-size: 14px;
            font-weight: 600;
            letter-spacing: -0.01em;
            border-top: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .btn-primary:hover:not(:disabled) {
            background: ${isLi ? '#5cb0ff' : '#fff'};
          }
          .btn-primary.loading {
            background: var(--bg-surface);
            color: var(--text-secondary);
          }
          .btn-content {
            display: inline-flex;
            align-items: center;
            gap: 12px;
          }
          .kbd {
            font-family: var(--mono);
            font-size: 10px;
            font-weight: 500;
            opacity: 0.5;
            padding: 2px 7px;
            background: rgba(0, 0, 0, 0.18);
            border-radius: 5px;
          }
          html[data-network="linkedin"] .kbd {
            background: rgba(255, 255, 255, 0.15);
          }

          .spin {
            width: 13px;
            height: 13px;
            border: 1.5px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            display: inline-block;
          }
          .spin-xs { width: 10px; height: 10px; border-width: 1.2px; }

          /* === RESULTS === */
          .results {
            display: flex;
            flex-direction: column;
            gap: ${isLi ? '14px' : '10px'};
            margin-top: 28px;
          }

          .post-card {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-xl);
            padding: ${isLi ? '24px' : '18px'};
            display: flex;
            flex-direction: column;
            gap: ${isLi ? '18px' : '14px'};
            transition: border-color var(--t-fast) var(--ease), background var(--t-fast) var(--ease);
          }
          .post-card:hover {
            border-color: var(--border-strong);
          }

          .card-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .card-type {
            font-size: 10px;
            font-weight: 700;
            color: var(--net);
            font-family: var(--mono);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding: 4px 9px;
            background: var(--net-soft);
            border-radius: 100px;
          }
          .card-chars {
            font-size: 11px;
            color: var(--text-faint);
            font-family: var(--mono);
            letter-spacing: 0.02em;
          }
          .card-chars.over { color: var(--danger); font-weight: 600; }
          .card-chars-sep { opacity: 0.4; margin: 0 1px; }

          .card-text {
            font-size: ${isLi ? '16px' : '15px'};
            line-height: ${isLi ? '1.7' : '1.55'};
            color: var(--text);
            white-space: pre-wrap;
            letter-spacing: -0.005em;
            font-family: var(--font);
          }

          .card-edit {
            width: 100%;
            background: var(--bg);
            border: 1px solid var(--border-strong);
            border-radius: var(--r-md);
            color: var(--text);
            font-size: ${isLi ? '16px' : '15px'};
            line-height: ${isLi ? '1.7' : '1.55'};
            padding: 14px;
            resize: vertical;
            font-family: var(--font);
          }

          /* === Inline image === */
          .card-img {
            border-radius: var(--r-md);
            overflow: hidden;
            background: var(--bg);
            border: 1px solid var(--border);
          }
          .card-img img {
            width: 100%;
            display: block;
            background: var(--bg);
          }
          .card-img-bar {
            display: flex;
            gap: 6px;
            align-items: center;
            padding: 10px 12px;
            background: var(--bg-card);
            border-top: 1px solid var(--border);
          }
          .card-img-act {
            background: transparent;
            border: 1px solid var(--border-strong);
            color: var(--text-secondary);
            font-size: 11px;
            padding: 5px 11px;
            border-radius: var(--r-sm);
            font-family: var(--mono);
            text-decoration: none;
          }
          .card-img-act:hover { color: var(--text); border-color: var(--text-faint); }
          .card-img-prov {
            font-size: 9px;
            color: var(--text-faint);
            font-family: var(--mono);
            margin-left: auto;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          .card-canva {
            background: var(--bg-card);
            border: 1px dashed var(--border-strong);
            border-radius: var(--r-md);
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .card-canva p {
            font-size: 12px;
            color: var(--text-secondary);
            margin: 0;
            line-height: 1.5;
          }
          .card-canva-btn {
            background: var(--accent);
            color: var(--accent-text-on);
            font-size: 12px;
            padding: 8px 14px;
            border-radius: var(--r-sm);
            text-align: center;
            font-weight: 600;
            align-self: flex-start;
          }

          .card-foot {
            display: flex;
            gap: 6px;
            align-items: center;
            padding-top: ${isLi ? '18px' : '14px'};
            border-top: 1px solid var(--border);
            flex-wrap: wrap;
          }
          .card-act {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
            padding: 6px 13px;
            border-radius: var(--r-sm);
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            letter-spacing: -0.005em;
          }
          .card-act:hover:not(:disabled) {
            color: var(--text);
            border-color: var(--border-strong);
            background: var(--bg-card);
          }
          .card-act-on {
            color: var(--text);
            background: var(--bg-card);
            border-color: var(--border-strong);
          }
          .card-foot-spacer { flex: 1; }
          .card-publish {
            background: var(--accent);
            color: var(--accent-text-on);
            border: none;
            font-size: 12px;
            padding: 7px 14px;
            border-radius: var(--r-sm);
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            letter-spacing: -0.005em;
          }
          .card-publish:hover {
            background: ${isLi ? '#5cb0ff' : '#fff'};
          }
          .card-publish-arrow {
            transition: transform var(--t-fast) var(--ease);
          }
          .card-publish:hover .card-publish-arrow {
            transform: translateX(2px);
          }

          .hint {
            margin-top: 36px;
            text-align: center;
            color: var(--text-muted);
            font-size: 13px;
          }
          .hint p { margin: 0; }
          .hint-link {
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
          .hint-link:hover { text-decoration-color: var(--accent); color: var(--accent); }

          @media (max-width: 600px) {
            .composer-inner { padding: 16px; }
            .prompt { font-size: 15px; }
            .post-card { padding: 16px; }
            .card-text { font-size: 14px; }
          }
        `}</style>
      </Layout>
    </>
  )
}
