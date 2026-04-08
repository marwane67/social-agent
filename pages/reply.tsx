import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type Reply = { type: string; text: string }
type Network = 'twitter' | 'linkedin'
type Tone = 'smart' | 'friendly' | 'debate' | 'expert'

const TONES: { id: Tone; label: string; icon: string; desc: string }[] = [
  { id: 'smart', label: 'Smart', icon: '>', desc: 'Intelligent et concis, angle inattendu' },
  { id: 'friendly', label: 'Friendly', icon: '+', desc: 'Chaleureux, crée une connexion' },
  { id: 'debate', label: 'Debate', icon: '><', desc: 'Assertif, enrichit le débat' },
  { id: 'expert', label: 'Expert', icon: 'EX', desc: 'Autorité, faits et insights' },
]

export default function ReplyPage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [tone, setTone] = useState<Tone>('smart')
  const [post, setPost] = useState('')
  const [comment, setComment] = useState('')
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [replyCount, setReplyCount] = useState(0)

  const generate = async () => {
    if (!comment.trim()) return
    setLoading(true)
    setReplies([])
    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post, comment, tone, network }),
      })
      const data = await res.json()
      if (data.replies) {
        setReplies(data.replies)
        setReplyCount(prev => prev + data.replies.length)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copyReply = (i: number) => {
    navigator.clipboard.writeText(replies[i].text)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  const maxChars = network === 'twitter' ? 200 : 300
  const accent = network === 'linkedin' ? '#0a66c2' : '#39ff14'
  const accentDim = network === 'linkedin' ? 'rgba(10,102,194,' : 'rgba(57,255,20,'

  return (
    <>
      <Head>
        <title>Reply Agent — Ismaa</title>
        <meta name="description" content="Agent de réponse aux commentaires" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>R</text></svg>"
        />
      </Head>

      <div className="page">
        <div className="grid-bg" />
        <div className="wrapper">
          {/* Header */}
          <header className="header">
            <div className="header-left">
              <div className="logo">R</div>
              <div>
                <div className="logo-title">Reply Agent</div>
                <div className="logo-sub">Réponses stratégiques aux commentaires</div>
              </div>
            </div>
            <div className="header-right">
              <Link href="/" className="nav-link">
                Posts
              </Link>
              <div className="status-badge">
                <span className="dot" />
                {replyCount} replies
              </div>
            </div>
          </header>

          {/* Network Switch */}
          <div className="network-switch">
            <button
              className={`net-btn ${network === 'twitter' ? 'net-active' : ''}`}
              onClick={() => setNetwork('twitter')}
            >
              <span className="net-icon">X</span>
              Twitter / X
            </button>
            <button
              className={`net-btn ${network === 'linkedin' ? 'net-active net-li' : ''}`}
              onClick={() => setNetwork('linkedin')}
            >
              <span className="net-icon">in</span>
              LinkedIn
            </button>
          </div>

          {/* Tone Selector */}
          <div className="tone-section">
            <div className="section-label">TON DE LA RÉPONSE</div>
            <div className="tone-grid">
              {TONES.map(t => (
                <button
                  key={t.id}
                  className={`tone-btn ${tone === t.id ? 'active' : ''}`}
                  onClick={() => setTone(t.id)}
                >
                  <span className="tone-icon">{t.icon}</span>
                  <span className="tone-label">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="tone-desc">{TONES.find(t => t.id === tone)?.desc}</div>
          </div>

          {/* Post Original (optional) */}
          <div className="input-box">
            <div className="input-label">TON POST ORIGINAL (optionnel)</div>
            <textarea
              className="textarea"
              placeholder="Colle ton post ici pour que l'agent comprenne le contexte de la conversation..."
              value={post}
              onChange={e => setPost(e.target.value)}
              rows={3}
            />
          </div>

          {/* Comment */}
          <div className="input-box comment-box">
            <div className="input-label">LE COMMENTAIRE À RÉPONDRE</div>
            <textarea
              className="textarea"
              placeholder="Colle le commentaire auquel tu veux répondre..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.metaKey) generate()
              }}
            />
          </div>

          {/* Generate */}
          <button
            className={`gen-btn ${loading ? 'disabled' : ''}`}
            onClick={generate}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Analyse du commentaire...
              </>
            ) : (
              'Générer 3 réponses'
            )}
          </button>

          {/* Results */}
          {replies.length > 0 && (
            <div className="results">
              <div className="results-label">— 3 réponses générées —</div>
              {replies.map((reply, i) => (
                <div key={i} className="reply-card">
                  <div className="reply-header">
                    <span className="reply-type">{reply.type}</span>
                    <span className={`reply-chars ${reply.text.length > maxChars ? 'over' : ''}`}>
                      {reply.text.length}/{maxChars}
                    </span>
                  </div>

                  <div className="reply-context">
                    <div className="reply-comment-preview">
                      {comment.length > 80 ? comment.slice(0, 80) + '...' : comment}
                    </div>
                    <div className="reply-arrow">^</div>
                  </div>

                  <div className="reply-text">{reply.text}</div>

                  <div className="reply-actions">
                    <button className="action-btn" onClick={() => copyReply(i)}>
                      {copied === i ? 'Copié' : 'Copier'}
                    </button>
                    <button
                      className="post-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(reply.text)
                        setCopied(i)
                        setTimeout(() => setCopied(null), 2000)
                      }}
                    >
                      Copier et répondre
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="footer">Built by Pixel Company · Ismaa · Brussels</div>
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #080808;
          position: relative;
          overflow-x: hidden;
        }
        .grid-bg {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(${accentDim}0.03) 1px, transparent 1px),
            linear-gradient(90deg, ${accentDim}0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }
        .wrapper {
          position: relative;
          z-index: 1;
          max-width: 720px;
          margin: 0 auto;
          padding: 32px 20px 60px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo {
          width: 42px;
          height: 42px;
          background: ${accent};
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          color: ${network === 'linkedin' ? '#fff' : '#000'};
          flex-shrink: 0;
        }
        .logo-title {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .logo-sub {
          font-size: 11px;
          color: #555;
          font-family: 'JetBrains Mono', monospace;
          margin-top: 1px;
        }
        .nav-link {
          background: #161616;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 12px;
          color: #888;
          cursor: pointer;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          text-decoration: none;
          transition: all 0.15s;
        }
        .nav-link:hover {
          border-color: ${accent};
          color: ${accent};
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: ${accentDim}0.06);
          border: 1px solid ${accentDim}0.15);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 11px;
          color: ${accent};
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${accent};
          display: inline-block;
          box-shadow: 0 0 6px ${accent};
        }

        /* Network Switch */
        .network-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 6px;
        }
        .net-btn {
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 10px 16px;
          color: #555;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s;
          font-family: 'Syne', sans-serif;
        }
        .net-active {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
        }
        .net-li {
          background: rgba(10, 102, 194, 0.1);
          border: 1px solid rgba(10, 102, 194, 0.3);
          color: #0a66c2;
        }
        .net-icon {
          font-size: 16px;
          font-weight: 900;
        }

        /* Tone */
        .section-label {
          font-size: 10px;
          color: #444;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .tone-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .tone-btn {
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          border-radius: 10px;
          padding: 10px 6px;
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-family: 'Syne', sans-serif;
        }
        .tone-btn:hover {
          border-color: #333;
        }
        .tone-btn.active {
          border-color: ${accentDim}0.4);
          background: ${accentDim}0.04);
        }
        .tone-icon {
          font-size: 13px;
          font-weight: 900;
          color: #555;
          font-family: 'JetBrains Mono', monospace;
        }
        .tone-btn.active .tone-icon {
          color: ${accent};
        }
        .tone-label {
          font-size: 11px;
          font-weight: 600;
          color: #555;
        }
        .tone-btn.active .tone-label {
          color: #ccc;
        }
        .tone-desc {
          font-size: 12px;
          color: #555;
          margin-top: 8px;
          padding: 8px 12px;
          background: #0c0c0c;
          border: 1px solid #1a1a1a;
          border-radius: 8px;
        }

        /* Input */
        .input-box {
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          overflow: hidden;
        }
        .comment-box {
          border-color: ${accentDim}0.2);
        }
        .input-label {
          padding: 10px 14px 0;
          font-size: 10px;
          color: #444;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.08em;
        }
        .textarea {
          width: 100%;
          background: transparent;
          border: none;
          color: #e2e2e2;
          font-size: 14px;
          padding: 8px 14px 12px;
          resize: none;
          outline: none;
          line-height: 1.6;
          font-family: 'Syne', sans-serif;
        }

        /* Generate */
        .gen-btn {
          background: ${accent};
          color: ${network === 'linkedin' ? '#fff' : '#000'};
          border: none;
          border-radius: 12px;
          padding: 14px 20px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Syne', sans-serif;
          transition: all 0.15s;
        }
        .gen-btn:hover {
          opacity: 0.9;
        }
        .gen-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid ${network === 'linkedin' ? '#fff' : '#000'};
          border-top-color: transparent;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Results */
        .results {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .results-label {
          text-align: center;
          font-size: 11px;
          color: #333;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.1em;
          padding: 4px 0;
        }
        .reply-card {
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 16px;
          transition: border-color 0.15s;
        }
        .reply-card:hover {
          border-color: #2a2a2a;
        }
        .reply-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .reply-type {
          background: ${accentDim}0.08);
          color: ${accent};
          font-size: 9px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          font-family: 'JetBrains Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .reply-chars {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          color: #444;
        }
        .reply-chars.over {
          color: #ff4444;
        }
        .reply-context {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 10px;
        }
        .reply-comment-preview {
          font-size: 12px;
          color: #666;
          font-style: italic;
          line-height: 1.4;
        }
        .reply-arrow {
          color: ${accent};
          font-size: 12px;
          margin-top: 6px;
          font-family: 'JetBrains Mono', monospace;
          transform: rotate(180deg);
          display: inline-block;
        }
        .reply-text {
          font-size: 14px;
          line-height: 1.7;
          color: #ddd;
          padding: 4px 0;
        }
        .reply-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #1a1a1a;
        }
        .action-btn {
          background: #161616;
          border: 1px solid #222;
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 11px;
          color: #666;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          transition: all 0.15s;
        }
        .action-btn:hover {
          border-color: #444;
          color: #aaa;
        }
        .post-btn {
          background: ${accent};
          border: none;
          border-radius: 6px;
          padding: 5px 14px;
          font-size: 11px;
          color: ${network === 'linkedin' ? '#fff' : '#000'};
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          margin-left: auto;
          transition: all 0.15s;
        }
        .post-btn:hover {
          opacity: 0.85;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #222;
          font-family: 'JetBrains Mono', monospace;
          margin-top: 20px;
        }

        @media (max-width: 600px) {
          .tone-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  )
}
