import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type Post = { type: string; text: string }
type Network = 'twitter' | 'linkedin'

type Format = {
  id: string
  label: string
  icon: string
  desc: string
}

const TWITTER_FORMATS: Format[] = [
  { id: 'raw_build', label: 'Raw Build Update', icon: '///', desc: "Ce que tu as build aujourd'hui, brut, réel" },
  { id: 'hot_take', label: 'Hot Take', icon: '!!!', desc: 'Opinion tranchée qui génère du débat' },
  { id: 'behind_scenes', label: 'Behind The Scenes', icon: 'BTS', desc: "Coulisses de la construction d'Axora/Pulsa" },
  { id: 'ai_authority', label: 'AI Authority', icon: 'AI', desc: 'Se positionner comme référence IA francophone' },
  { id: 'storytelling', label: 'Micro Story', icon: '...', desc: 'Mini histoire qui marque les esprits' },
  { id: 'engagement_bait', label: 'Reply Magnet', icon: '???', desc: 'Posts qui génèrent un max de replies' },
  { id: 'one_liner', label: 'One-Liner', icon: '—', desc: 'Une phrase. Un impact. Point.' },
  { id: 'axora_hype', label: 'Axora Hype', icon: 'AX', desc: "Créer l'engouement autour d'Axora" },
]

const LINKEDIN_FORMATS: Format[] = [
  { id: 'transparency', label: 'Transparence Radicale', icon: '%', desc: 'Chiffres réels, coulisses, décisions — tout montrer' },
  { id: 'thought_leadership', label: 'Thought Leader', icon: 'TL', desc: 'Se positionner comme expert IA + business' },
  { id: 'storytelling_li', label: 'Storytelling', icon: '...', desc: 'Histoires personnelles qui résonnent' },
  { id: 'value_bomb', label: 'Value Bomb', icon: 'VB', desc: 'Contenu ultra-actionnable, 100% valeur' },
  { id: 'axora_linkedin', label: 'Axora Vision', icon: 'AX', desc: 'Positionner Axora comme incontournable' },
  { id: 'debate_li', label: 'Debate Starter', icon: '><', desc: 'Opinions qui génèrent des commentaires' },
  { id: 'personal_brand', label: 'Personal Brand', icon: 'ME', desc: "Montrer qui est Ismaa au-delà du business" },
  { id: 'ai_expert_li', label: 'AI Expert', icon: 'AI', desc: 'Référence IA francophone sur LinkedIn' },
  { id: 'lead_magnet', label: 'Lead Magnet', icon: 'LM', desc: 'Générer des lead magnets qui captent des emails' },
]

const STARTERS: Record<string, string[]> = {
  // Twitter
  raw_build: ["Aujourd'hui j'ai build...", "Décision prise :", "Bug fix à 2h du mat...", "Feature shipped :"],
  hot_take: ["L'IA ne va pas...", "Le marché francophone...", "Les agences en 2026...", "Unpopular opinion :"],
  behind_scenes: ["Notre stack :", "Conversation avec un user...", "Process interne :", "Voilà comment on décide..."],
  ai_authority: ["J'utilise Claude pour...", "Ce que l'IA fait vraiment...", "En 6 mois avec l'IA...", "Le prompt qui a tout changé :"],
  storytelling: ["Il y a 3 mois...", "On m'a dit que...", "Le moment où j'ai failli...", "Un client m'a dit :"],
  engagement_bait: ["Question sincère :", "Dilemme du jour :", "Vous en pensez quoi ?", "Ça vous est déjà arrivé ?"],
  one_liner: ["Le business c'est...", "L'IA c'est juste...", "Builder seul c'est...", "Le marché francophone..."],
  axora_hype: ["Nouvelle feature Axora :", "Le problème que personne résout :", "Sneak peek :", "On vient de finir..."],
  // LinkedIn
  transparency: ["Ce mois-ci en chiffres :", "La décision qui m'a coûté...", "J'ai fait une erreur :", "Voilà nos vrais chiffres :"],
  thought_leadership: ["Ce que je vois venir :", "Mon framework pour...", "Le marché ne réalise pas que...", "Dans 12 mois..."],
  storytelling_li: ["Il y a 6 mois...", "Le jour où j'ai décidé...", "Personne ne m'a dit que...", "Ma plus grosse erreur :"],
  value_bomb: ["Mon process exact pour...", "L'outil que personne connaît :", "Ce hack m'a fait gagner...", "En 3 étapes :"],
  axora_linkedin: ["Le marché de l'acquisition...", "Pourquoi j'ai créé Axora :", "Ce que les entrepreneurs veulent...", "Le problème avec..."],
  debate_li: ["Opinion impopulaire :", "On doit arrêter de...", "Personne n'ose dire que...", "Le mythe de..."],
  personal_brand: ["Ce que j'ai appris cette semaine :", "Ma routine du matin :", "Ce en quoi je crois :", "Pourquoi j'ai choisi..."],
  ai_expert_li: ["J'ai remplacé X par l'IA :", "Avant l'IA vs maintenant :", "La tendance IA que personne ne voit :", "Comment on utilise Claude :"],
  lead_magnet: ["Mon framework pour...", "La checklist que j'utilise pour...", "Le template qui m'a fait gagner...", "5 prompts IA pour..."],
}

const STRATEGY_TIPS_TWITTER = [
  { time: 'Matin (8h-9h)', type: 'Raw Build / AI Authority', why: 'Les gens scrollent en se réveillant. Contenu inspirant.' },
  { time: 'Midi (12h-13h)', type: 'Hot Take / Reply Magnet', why: 'Pause déj = temps de débattre. Max engagement.' },
  { time: 'Soir (18h-20h)', type: 'Micro Story / BTS', why: 'Fin de journée = storytelling. Les gens veulent du vrai.' },
  { time: 'Weekend', type: 'One-Liner / Axora Hype', why: 'Contenu léger mais mémorable.' },
]

const STRATEGY_TIPS_LINKEDIN = [
  { time: 'Mardi 8h-9h', type: 'Thought Leader / AI Expert', why: 'Meilleur jour LinkedIn. Les pros sont focus.' },
  { time: 'Mercredi 12h', type: 'Storytelling / Personal Brand', why: 'Milieu de semaine = réceptivité max.' },
  { time: 'Jeudi 8h-9h', type: 'Transparence / Value Bomb', why: 'Avant le weekend, les gens sauvegardent.' },
  { time: 'Dimanche 18h', type: 'Axora Vision / Debate', why: 'Préparation de semaine, engagement surprise.' },
]

export default function Home() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [format, setFormat] = useState('raw_build')
  const [input, setInput] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [editTexts, setEditTexts] = useState<Record<number, string>>({})
  const [showStrategy, setShowStrategy] = useState(false)
  const [postCount, setPostCount] = useState(0)

  const formats = network === 'twitter' ? TWITTER_FORMATS : LINKEDIN_FORMATS
  const strategyTips = network === 'twitter' ? STRATEGY_TIPS_TWITTER : STRATEGY_TIPS_LINKEDIN
  const maxChars = network === 'twitter' ? 280 : 3000
  const currentFormat = formats.find(f => f.id === format) || formats[0]

  const switchNetwork = (n: Network) => {
    setNetwork(n)
    setFormat(n === 'twitter' ? 'raw_build' : 'transparency')
    setPosts([])
    setEditTexts({})
    setEditing(null)
  }

  const generate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setPosts([])
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, format, network }),
      })
      const data = await res.json()
      if (data.posts) {
        setPosts(data.posts)
        setPostCount(prev => prev + data.posts.length)
        setEditTexts({})
        setEditing(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copyPost = (i: number) => {
    const text = editTexts[i] ?? posts[i].text
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  const openPost = (i: number) => {
    const text = encodeURIComponent(editTexts[i] ?? posts[i].text)
    if (network === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
    } else {
      window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${text}`, '_blank')
    }
  }

  const toggleEdit = (i: number) => {
    if (editing === i) {
      setEditing(null)
    } else {
      setEditing(i)
      if (!editTexts[i]) setEditTexts(prev => ({ ...prev, [i]: posts[i].text }))
    }
  }

  const charCount = (i: number) => (editTexts[i] ?? posts[i]?.text ?? '').length

  return (
    <>
      <Head>
        <title>{network === 'twitter' ? 'X' : 'LinkedIn'} Agent — Ismaa</title>
        <meta name="description" content="Agent social media pour dominer le game" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>X</text></svg>"
        />
      </Head>

      <div className="page">
        <div className="grid-bg" />

        <div className="wrapper">
          {/* Header */}
          <header className="header">
            <div className="header-left">
              <div className={`logo ${network === 'linkedin' ? 'logo-li' : ''}`}>
                {network === 'twitter' ? 'X' : 'in'}
              </div>
              <div>
                <div className="logo-title">Social Agent</div>
                <div className="logo-sub">
                  {network === 'twitter' ? '@ismaa_pxl' : 'Ismaa · Pixel Company'} · Bruxelles
                </div>
              </div>
            </div>
            <div className="header-right">
              <Link href="/reply" className="strategy-btn" style={{ textDecoration: 'none' }}>
                Reply Agent
              </Link>
              <button className="strategy-btn" onClick={() => setShowStrategy(!showStrategy)}>
                {showStrategy ? 'Fermer' : 'Stratégie'}
              </button>
              <div className={`status-badge ${network === 'linkedin' ? 'status-li' : ''}`}>
                <span className="dot" />
                {postCount} posts
              </div>
            </div>
          </header>

          {/* Network Switch */}
          <div className="network-switch">
            <button
              className={`net-btn ${network === 'twitter' ? 'net-active' : ''}`}
              onClick={() => switchNetwork('twitter')}
            >
              <span className="net-icon">X</span>
              Twitter / X
            </button>
            <button
              className={`net-btn ${network === 'linkedin' ? 'net-active net-li' : ''}`}
              onClick={() => switchNetwork('linkedin')}
            >
              <span className="net-icon">in</span>
              LinkedIn
            </button>
          </div>

          {/* Strategy Panel */}
          {showStrategy && (
            <div className="strategy-panel">
              <div className="strategy-title">
                CALENDRIER STRATÉGIQUE — {network === 'twitter' ? 'TWITTER/X' : 'LINKEDIN'}
              </div>
              <div className="strategy-grid">
                {strategyTips.map((tip, i) => (
                  <div key={i} className="strategy-card">
                    <div className={`strategy-time ${network === 'linkedin' ? 'strategy-time-li' : ''}`}>
                      {tip.time}
                    </div>
                    <div className="strategy-type">{tip.type}</div>
                    <div className="strategy-why">{tip.why}</div>
                  </div>
                ))}
              </div>
              <div className="strategy-footer">
                <div className="pillar">
                  <span className={`pillar-tag ${network === 'linkedin' ? 'pillar-tag-li' : ''}`}>PILIER 1</span>
                  Building in Public (Axora)
                </div>
                <div className="pillar">
                  <span className={`pillar-tag ${network === 'linkedin' ? 'pillar-tag-li' : ''}`}>PILIER 2</span>
                  Expert IA (Claude, automation)
                </div>
                <div className="pillar">
                  <span className={`pillar-tag ${network === 'linkedin' ? 'pillar-tag-li' : ''}`}>PILIER 3</span>
                  Entrepreneuriat francophone
                </div>
              </div>
            </div>
          )}

          {/* Format Selector */}
          <div className="format-section">
            <div className="section-label">FORMAT DU POST</div>
            <div className="format-grid">
              {formats.map(f => (
                <button
                  key={f.id}
                  className={`format-btn ${format === f.id ? (network === 'linkedin' ? 'active-li' : 'active') : ''}`}
                  onClick={() => setFormat(f.id)}
                >
                  <span className="format-icon">{f.icon}</span>
                  <span className="format-label">{f.label}</span>
                </button>
              ))}
            </div>
            <div className="format-desc">{currentFormat.desc}</div>
          </div>

          {/* Input */}
          <div className="input-box">
            <div className="input-label">CE QUI SE PASSE</div>
            <textarea
              className="textarea"
              placeholder="Décris en 2-3 lignes : ce que tu as fait, une décision, un chiffre, une galère, une victoire, un insight..."
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={4}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.metaKey) generate()
              }}
            />
            <div className="starters">
              {(STARTERS[format] || []).map(s => (
                <button key={s} className="starter" onClick={() => setInput(prev => (prev ? prev + ' ' + s : s))}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button className={`gen-btn ${network === 'linkedin' ? 'gen-btn-li' : ''} ${loading ? 'disabled' : ''}`} onClick={generate} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                L'agent réfléchit...
              </>
            ) : (
              <>Générer 3 posts · {currentFormat.label}</>
            )}
          </button>

          {/* Results */}
          {posts.length > 0 && (
            <div className="results">
              <div className="results-label">— 3 versions · {currentFormat.label} —</div>
              {posts.map((post, i) => (
                <div key={i} className="post-card">
                  <div className="post-header">
                    <div className={`avatar ${network === 'linkedin' ? 'avatar-li' : ''}`}>I</div>
                    <div>
                      <div className="post-name">
                        Ismaa{' '}
                        {network === 'twitter' && <span className="post-verified">&#10003;</span>}
                      </div>
                      <div className="post-handle">
                        {network === 'twitter' ? '@ismaa_pxl' : 'Fondateur · Axora & Pulsa Creatives'}
                      </div>
                    </div>
                    <span className={`type-badge ${network === 'linkedin' ? 'type-badge-li' : ''}`}>
                      {post.type}
                    </span>
                  </div>

                  {editing === i ? (
                    <textarea
                      className="edit-area"
                      value={editTexts[i] ?? post.text}
                      onChange={e => setEditTexts(prev => ({ ...prev, [i]: e.target.value }))}
                      rows={network === 'linkedin' ? 12 : 6}
                      autoFocus
                    />
                  ) : (
                    <div className="post-text">
                      {(editTexts[i] ?? post.text).split('\n').map((line, j, arr) => (
                        <span key={j}>
                          {line}
                          {j < arr.length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="post-actions">
                    <button className="action-btn" onClick={() => copyPost(i)}>
                      {copied === i ? 'Copié' : 'Copier'}
                    </button>
                    <button
                      className={`action-btn ${editing === i ? 'action-active' : ''}`}
                      onClick={() => toggleEdit(i)}
                    >
                      {editing === i ? 'OK' : 'Éditer'}
                    </button>
                    <span className={`chars ${charCount(i) > maxChars ? 'over' : ''}`}>
                      {charCount(i)}/{maxChars}
                    </span>
                    <button className={`post-btn ${network === 'linkedin' ? 'post-btn-li' : ''}`} onClick={() => openPost(i)}>
                      Poster sur {network === 'twitter' ? 'X' : 'LinkedIn'}
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
          background-image: linear-gradient(
              ${network === 'linkedin' ? 'rgba(10,102,194,0.03)' : 'rgba(57,255,20,0.03)'} 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              ${network === 'linkedin' ? 'rgba(10,102,194,0.03)' : 'rgba(57,255,20,0.03)'} 1px,
              transparent 1px
            );
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
          background: #fff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          color: #000;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .logo-li {
          background: #0a66c2;
          color: #fff;
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
        .strategy-btn {
          background: #161616;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 12px;
          color: #888;
          cursor: pointer;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          transition: all 0.15s;
        }
        .strategy-btn:hover {
          border-color: ${network === 'linkedin' ? '#0a66c2' : '#39ff14'};
          color: ${network === 'linkedin' ? '#0a66c2' : '#39ff14'};
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(57, 255, 20, 0.06);
          border: 1px solid rgba(57, 255, 20, 0.15);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 11px;
          color: #39ff14;
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
        }
        .status-li {
          background: rgba(10, 102, 194, 0.08);
          border-color: rgba(10, 102, 194, 0.2);
          color: #0a66c2;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${network === 'linkedin' ? '#0a66c2' : '#39ff14'};
          display: inline-block;
          box-shadow: 0 0 6px ${network === 'linkedin' ? '#0a66c2' : '#39ff14'};
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

        /* Strategy */
        .strategy-panel {
          background: #0c0c0c;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          padding: 16px;
        }
        .strategy-title {
          font-size: 10px;
          color: #444;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }
        .strategy-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }
        .strategy-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 8px;
          padding: 10px;
        }
        .strategy-time {
          font-size: 11px;
          font-weight: 700;
          color: #39ff14;
          margin-bottom: 4px;
          font-family: 'JetBrains Mono', monospace;
        }
        .strategy-time-li {
          color: #0a66c2;
        }
        .strategy-type {
          font-size: 12px;
          color: #ddd;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .strategy-why {
          font-size: 11px;
          color: #666;
          line-height: 1.4;
        }
        .strategy-footer {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pillar {
          font-size: 11px;
          color: #888;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pillar-tag {
          background: rgba(57, 255, 20, 0.08);
          color: #39ff14;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
        }
        .pillar-tag-li {
          background: rgba(10, 102, 194, 0.1);
          color: #0a66c2;
        }

        /* Format */
        .section-label {
          font-size: 10px;
          color: #444;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .format-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .format-btn {
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
        .format-btn:hover {
          border-color: #333;
        }
        .format-btn.active {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.04);
        }
        .format-btn.active-li {
          border-color: rgba(10, 102, 194, 0.4);
          background: rgba(10, 102, 194, 0.06);
        }
        .format-icon {
          font-size: 13px;
          font-weight: 900;
          color: #555;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: -0.05em;
        }
        .format-btn.active .format-icon,
        .format-btn.active-li .format-icon {
          color: ${network === 'linkedin' ? '#0a66c2' : '#fff'};
        }
        .format-label {
          font-size: 10px;
          font-weight: 600;
          color: #555;
          line-height: 1.2;
        }
        .format-btn.active .format-label,
        .format-btn.active-li .format-label {
          color: #ccc;
        }
        .format-desc {
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
        .starters {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          padding: 0 14px 12px;
          border-top: 1px solid #1a1a1a;
          padding-top: 8px;
          margin-top: 2px;
        }
        .starter {
          background: #161616;
          border: 1px solid #222;
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 11px;
          color: #555;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          transition: all 0.15s;
        }
        .starter:hover {
          border-color: ${network === 'linkedin' ? '#0a66c2' : '#39ff14'};
          color: ${network === 'linkedin' ? '#0a66c2' : '#39ff14'};
        }

        /* Generate */
        .gen-btn {
          background: #fff;
          color: #000;
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
          letter-spacing: -0.01em;
          font-family: 'Syne', sans-serif;
          transition: all 0.15s;
        }
        .gen-btn:hover {
          background: #39ff14;
        }
        .gen-btn-li:hover {
          background: #0a66c2;
          color: #fff;
        }
        .gen-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #000;
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
        .post-card {
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 16px;
          transition: border-color 0.15s;
        }
        .post-card:hover {
          border-color: #2a2a2a;
        }
        .post-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #1a1a1a;
        }
        .avatar {
          width: 34px;
          height: 34px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 900;
          color: #000;
          flex-shrink: 0;
        }
        .avatar-li {
          background: #0a66c2;
          color: #fff;
        }
        .post-name {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .post-verified {
          color: #1d9bf0;
          font-size: 12px;
        }
        .post-handle {
          font-size: 11px;
          color: #555;
          font-family: 'JetBrains Mono', monospace;
        }
        .type-badge {
          margin-left: auto;
          background: rgba(255, 255, 255, 0.05);
          color: #888;
          font-size: 9px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          font-family: 'JetBrains Mono', monospace;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .type-badge-li {
          background: rgba(10, 102, 194, 0.08);
          color: #0a66c2;
        }
        .post-text {
          font-size: 14px;
          line-height: 1.7;
          color: #ddd;
          white-space: pre-wrap;
        }
        .edit-area {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          color: #ddd;
          font-size: 14px;
          padding: 10px;
          resize: vertical;
          outline: none;
          line-height: 1.7;
          font-family: 'Syne', sans-serif;
        }
        .post-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #1a1a1a;
          flex-wrap: wrap;
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
        .action-active {
          border-color: ${network === 'linkedin' ? 'rgba(10,102,194,0.3)' : 'rgba(57,255,20,0.3)'};
          color: ${network === 'linkedin' ? '#0a66c2' : '#39ff14'};
        }
        .chars {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          color: #444;
          margin-left: auto;
        }
        .chars.over {
          color: #ff4444;
        }
        .post-btn {
          background: #fff;
          border: none;
          border-radius: 6px;
          padding: 5px 14px;
          font-size: 11px;
          color: #000;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          transition: all 0.15s;
        }
        .post-btn:hover {
          background: #39ff14;
        }
        .post-btn-li:hover {
          background: #0a66c2;
          color: #fff;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #222;
          font-family: 'JetBrains Mono', monospace;
          margin-top: 20px;
        }

        @media (max-width: 600px) {
          .format-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .strategy-grid {
            grid-template-columns: 1fr;
          }
          .strategy-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  )
}
