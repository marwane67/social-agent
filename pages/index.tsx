import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type Post = { type: string; text: string }
type Network = 'twitter' | 'linkedin'
type ScoreData = { viral: number; engagement: number; authority: number; overall: number }
type Enhancement = {
  score?: { score: ScoreData; strengths: string[]; weaknesses: string[]; suggestion: string }
  translation?: { translation: string; note: string }
  visual?: { visual: { type: string; description: string; text_on_image: string; colors: string; tool: string; impact: string } }
}

type HistoryEntry = {
  id: string
  network: Network
  format: string
  input: string
  posts: Post[]
  date: string
}

type Format = { id: string; label: string; icon: string; desc: string }

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
  { id: 'transparency', label: 'Transparence Radicale', icon: '%', desc: 'Chiffres réels, coulisses, décisions' },
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
  raw_build: ["Aujourd'hui j'ai build...", "Décision prise :", "Feature shipped :"],
  hot_take: ["L'IA ne va pas...", "Le marché francophone...", "Unpopular opinion :"],
  behind_scenes: ["Notre stack :", "Process interne :", "Conversation avec un user..."],
  ai_authority: ["J'utilise Claude pour...", "Ce que l'IA fait vraiment...", "Le prompt qui a tout changé :"],
  storytelling: ["Il y a 3 mois...", "Le moment où j'ai failli...", "Un client m'a dit :"],
  engagement_bait: ["Question sincère :", "Dilemme du jour :", "Vous en pensez quoi ?"],
  one_liner: ["Le business c'est...", "L'IA c'est juste...", "Builder seul c'est..."],
  axora_hype: ["Nouvelle feature Axora :", "Le problème que personne résout :", "Sneak peek :"],
  transparency: ["Ce mois-ci en chiffres :", "J'ai fait une erreur :", "Voilà nos vrais chiffres :"],
  thought_leadership: ["Ce que je vois venir :", "Mon framework pour...", "Dans 12 mois..."],
  storytelling_li: ["Il y a 6 mois...", "Le jour où j'ai décidé...", "Ma plus grosse erreur :"],
  value_bomb: ["Mon process exact pour...", "L'outil que personne connaît :", "Ce hack m'a fait gagner..."],
  axora_linkedin: ["Pourquoi j'ai créé Axora :", "Le problème avec...", "Le marché de l'acquisition..."],
  debate_li: ["Opinion impopulaire :", "On doit arrêter de...", "Le mythe de..."],
  personal_brand: ["Ce que j'ai appris :", "Ma routine du matin :", "Pourquoi j'ai choisi..."],
  ai_expert_li: ["Avant l'IA vs maintenant :", "Comment on utilise Claude :", "La tendance IA que personne ne voit :"],
  lead_magnet: ["Mon framework pour...", "La checklist que j'utilise...", "5 prompts IA pour..."],
}

const STRATEGY = {
  twitter: [
    { time: 'Matin 8h-9h', type: 'Raw Build / AI Authority', why: 'Scroll matinal, contenu inspirant' },
    { time: 'Midi 12h-13h', type: 'Hot Take / Reply Magnet', why: 'Pause déj = débat, max engagement' },
    { time: 'Soir 18h-20h', type: 'Micro Story / BTS', why: 'Storytelling, les gens veulent du vrai' },
    { time: 'Weekend', type: 'One-Liner / Axora Hype', why: 'Léger mais mémorable' },
  ],
  linkedin: [
    { time: 'Mardi 8h-9h', type: 'Thought Leader / AI Expert', why: 'Meilleur jour, pros focus' },
    { time: 'Mercredi 12h', type: 'Storytelling / Personal Brand', why: 'Milieu semaine, réceptivité max' },
    { time: 'Jeudi 8h-9h', type: 'Transparence / Value Bomb', why: 'Avant weekend, gens sauvegardent' },
    { time: 'Dimanche 18h', type: 'Axora Vision / Debate', why: 'Préparation semaine' },
  ],
}

const CALENDAR_SLOTS = [
  { day: 'Lun', slots: ['Raw Build', 'Reply Magnet'] },
  { day: 'Mar', slots: ['AI Authority', 'Hot Take'] },
  { day: 'Mer', slots: ['Storytelling', 'BTS'] },
  { day: 'Jeu', slots: ['Axora Hype', 'One-Liner'] },
  { day: 'Ven', slots: ['Value Bomb', 'Hot Take'] },
  { day: 'Sam', slots: ['One-Liner'] },
  { day: 'Dim', slots: ['Micro Story'] },
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
  const [showHistory, setShowHistory] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [enhancements, setEnhancements] = useState<Record<number, Enhancement>>({})
  const [enhLoading, setEnhLoading] = useState<Record<number, string>>({})
  const [activePanel, setActivePanel] = useState<Record<number, string>>({})

  // Load history
  useEffect(() => {
    try {
      const h = localStorage.getItem('social-agent-history')
      if (h) setHistory(JSON.parse(h))
    } catch {}
  }, [])

  const saveHistory = useCallback(
    (newPosts: Post[], fmt: string, inp: string, net: Network) => {
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        network: net,
        format: fmt,
        input: inp,
        posts: newPosts,
        date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      }
      const updated = [entry, ...history].slice(0, 50)
      setHistory(updated)
      localStorage.setItem('social-agent-history', JSON.stringify(updated))
    },
    [history]
  )

  const formats = network === 'twitter' ? TWITTER_FORMATS : LINKEDIN_FORMATS
  const maxChars = network === 'twitter' ? 280 : 3000
  const currentFormat = formats.find(f => f.id === format) || formats[0]

  const switchNetwork = (n: Network) => {
    setNetwork(n)
    setFormat(n === 'twitter' ? 'raw_build' : 'transparency')
    setPosts([])
    setEditTexts({})
    setEditing(null)
    setEnhancements({})
    setActivePanel({})
  }

  const generate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setPosts([])
    setEnhancements({})
    setActivePanel({})
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, format, network }),
      })
      const data = await res.json()
      if (data.posts) {
        setPosts(data.posts)
        setEditTexts({})
        setEditing(null)
        saveHistory(data.posts, format, input, network)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const enhance = async (i: number, action: string) => {
    const text = editTexts[i] ?? posts[i]?.text
    if (!text) return
    if (activePanel[i] === action && enhancements[i]?.[action as keyof Enhancement]) {
      setActivePanel(prev => { const n = { ...prev }; delete n[i]; return n })
      return
    }
    setActivePanel(prev => ({ ...prev, [i]: action }))
    if (enhancements[i]?.[action as keyof Enhancement]) return
    setEnhLoading(prev => ({ ...prev, [i]: action }))
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: text, action, network }),
      })
      const data = await res.json()
      setEnhancements(prev => ({
        ...prev,
        [i]: { ...prev[i], [action]: data },
      }))
    } catch (e) {
      console.error(e)
    } finally {
      setEnhLoading(prev => { const n = { ...prev }; delete n[i]; return n })
    }
  }

  const copyPost = (i: number) => {
    navigator.clipboard.writeText(editTexts[i] ?? posts[i].text)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  const openPost = (i: number) => {
    const text = encodeURIComponent(editTexts[i] ?? posts[i].text)
    if (network === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
    else window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${text}`, '_blank')
  }

  const toggleEdit = (i: number) => {
    if (editing === i) setEditing(null)
    else {
      setEditing(i)
      if (!editTexts[i]) setEditTexts(prev => ({ ...prev, [i]: posts[i].text }))
    }
  }

  const charCount = (i: number) => (editTexts[i] ?? posts[i]?.text ?? '').length

  const loadFromHistory = (entry: HistoryEntry) => {
    setNetwork(entry.network)
    setFormat(entry.format)
    setInput(entry.input)
    setPosts(entry.posts)
    setEditTexts({})
    setEditing(null)
    setEnhancements({})
    setActivePanel({})
    setShowHistory(false)
  }

  const renderScore = (s: Enhancement['score']) => {
    if (!s) return null
    const d = s.score
    const bar = (v: number, label: string) => (
      <div className="score-row">
        <span className="score-label">{label}</span>
        <div className="score-bar-bg">
          <div className="score-bar-fill" style={{ width: `${v * 10}%` }} />
        </div>
        <span className="score-val">{v}/10</span>
      </div>
    )
    return (
      <div className="enhancement-panel">
        <div className="score-overall">{d.overall}<span>/10</span></div>
        {bar(d.viral, 'Viral')}
        {bar(d.engagement, 'Engagement')}
        {bar(d.authority, 'Authority')}
        <div className="score-feedback">
          {s.strengths.map((st, j) => <div key={j} className="score-strength">+ {st}</div>)}
          {s.weaknesses.map((w, j) => <div key={j} className="score-weakness">- {w}</div>)}
          <div className="score-suggestion">{s.suggestion}</div>
        </div>
      </div>
    )
  }

  const renderTranslation = (t: Enhancement['translation']) => {
    if (!t) return null
    return (
      <div className="enhancement-panel">
        <div className="trans-label">ENGLISH VERSION</div>
        <div className="trans-text">{t.translation}</div>
        <div className="trans-note">{t.note}</div>
        <button className="trans-copy" onClick={() => { navigator.clipboard.writeText(t.translation) }}>
          Copier EN
        </button>
      </div>
    )
  }

  const renderVisual = (v: Enhancement['visual']) => {
    if (!v) return null
    const d = v.visual
    return (
      <div className="enhancement-panel">
        <div className="visual-type">{d.type.toUpperCase()}</div>
        <div className="visual-desc">{d.description}</div>
        {d.text_on_image && <div className="visual-text">Texte : "{d.text_on_image}"</div>}
        <div className="visual-meta">
          <span>Couleurs : {d.colors}</span>
          <span>Outil : {d.tool}</span>
        </div>
        <div className="visual-impact">{d.impact}</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{network === 'twitter' ? 'X' : 'LinkedIn'} Agent — Ismaa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
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
                <div className="logo-sub">{network === 'twitter' ? '@ismaa_pxl' : 'Ismaa'} · Bruxelles</div>
              </div>
            </div>
            <div className="header-right">
              <Link href="/reply" className="h-btn">Reply</Link>
              <Link href="/schedule" className="h-btn">Sched</Link>
              <Link href="/growth" className="h-btn">Growth</Link>
              <button className="h-btn" onClick={() => { setShowHistory(!showHistory); setShowStrategy(false); setShowCalendar(false) }}>
                {history.length}
              </button>
              <button className="h-btn" onClick={() => { setShowCalendar(!showCalendar); setShowStrategy(false); setShowHistory(false) }}>
                Cal
              </button>
              <button className="h-btn" onClick={() => { setShowStrategy(!showStrategy); setShowHistory(false); setShowCalendar(false) }}>
                Strat
              </button>
            </div>
          </header>

          {/* Network Switch */}
          <div className="network-switch">
            <button className={`net-btn ${network === 'twitter' ? 'net-active' : ''}`} onClick={() => switchNetwork('twitter')}>
              <span className="net-icon">X</span> Twitter / X
            </button>
            <button className={`net-btn ${network === 'linkedin' ? 'net-active net-li' : ''}`} onClick={() => switchNetwork('linkedin')}>
              <span className="net-icon">in</span> LinkedIn
            </button>
          </div>

          {/* History Panel */}
          {showHistory && (
            <div className="panel">
              <div className="panel-title">HISTORIQUE ({history.length} posts)</div>
              {history.length === 0 && <div className="panel-empty">Aucun post généré pour l'instant</div>}
              <div className="history-list">
                {history.slice(0, 20).map(entry => (
                  <button key={entry.id} className="history-item" onClick={() => loadFromHistory(entry)}>
                    <div className="history-meta">
                      <span className="history-net">{entry.network === 'twitter' ? 'X' : 'LI'}</span>
                      <span className="history-date">{entry.date}</span>
                    </div>
                    <div className="history-preview">{entry.posts[0]?.text.slice(0, 80)}...</div>
                  </button>
                ))}
              </div>
              {history.length > 0 && (
                <button className="clear-btn" onClick={() => { setHistory([]); localStorage.removeItem('social-agent-history') }}>
                  Vider l'historique
                </button>
              )}
            </div>
          )}

          {/* Calendar Panel */}
          {showCalendar && (
            <div className="panel">
              <div className="panel-title">CONTENT CALENDAR — SEMAINE TYPE</div>
              <div className="cal-grid">
                {CALENDAR_SLOTS.map(day => (
                  <div key={day.day} className="cal-day">
                    <div className="cal-day-label">{day.day}</div>
                    {day.slots.map((slot, j) => (
                      <div key={j} className="cal-slot">{slot}</div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="cal-tip">Poste 1-2x/jour sur X, 1x/jour sur LinkedIn. Régularité {'>'} volume.</div>
            </div>
          )}

          {/* Strategy Panel */}
          {showStrategy && (
            <div className="panel">
              <div className="panel-title">STRATÉGIE — {network === 'twitter' ? 'TWITTER/X' : 'LINKEDIN'}</div>
              <div className="strat-grid">
                {STRATEGY[network].map((tip, i) => (
                  <div key={i} className="strat-card">
                    <div className="strat-time">{tip.time}</div>
                    <div className="strat-type">{tip.type}</div>
                    <div className="strat-why">{tip.why}</div>
                  </div>
                ))}
              </div>
              <div className="pillars">
                <span className="pillar"><b>P1</b> Building in Public</span>
                <span className="pillar"><b>P2</b> Expert IA</span>
                <span className="pillar"><b>P3</b> Entrepreneuriat FR</span>
              </div>
            </div>
          )}

          {/* Format Selector */}
          <div>
            <div className="section-label">FORMAT</div>
            <div className="format-grid">
              {formats.map(f => (
                <button key={f.id} className={`format-btn ${format === f.id ? (network === 'linkedin' ? 'active-li' : 'active') : ''}`} onClick={() => setFormat(f.id)}>
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
              placeholder="Décris en 2-3 lignes : ce que tu as fait, une décision, un chiffre, une galère, une victoire..."
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={4}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate() }}
            />
            <div className="starters">
              {(STARTERS[format] || []).map(s => (
                <button key={s} className="starter" onClick={() => setInput(p => p ? p + ' ' + s : s)}>{s}</button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button className={`gen-btn ${network === 'linkedin' ? 'gen-li' : ''} ${loading ? 'disabled' : ''}`} onClick={generate} disabled={loading}>
            {loading ? <><span className="spinner" /> L'agent réfléchit...</> : <>Générer 3 posts · {currentFormat.label}</>}
          </button>

          {/* Results */}
          {posts.length > 0 && (
            <div className="results">
              <div className="results-label">— 3 versions · {currentFormat.label} —</div>
              {posts.map((post, i) => (
                <div key={i} className="post-card">
                  {/* Preview Header */}
                  <div className="preview-header">
                    <div className={`preview-avatar ${network === 'linkedin' ? 'preview-avatar-li' : ''}`}>I</div>
                    <div className="preview-info">
                      <div className="preview-name">
                        Ismaa {network === 'twitter' && <span className="verified">&#10003;</span>}
                      </div>
                      <div className="preview-handle">
                        {network === 'twitter' ? '@ismaa_pxl · maintenant' : 'Fondateur, Axora & Pulsa Creatives · maintenant'}
                      </div>
                    </div>
                    <span className="type-badge">{post.type}</span>
                  </div>

                  {/* Post Content */}
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
                        <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                      ))}
                    </div>
                  )}

                  {/* Preview Footer (fake metrics) */}
                  <div className="preview-metrics">
                    <span>3 replies</span>
                    <span>12 {network === 'twitter' ? 'reposts' : 'reposts'}</span>
                    <span>47 likes</span>
                    <span>{network === 'twitter' ? '2.1K vues' : '1,204 impressions'}</span>
                  </div>

                  {/* Enhancement Buttons */}
                  <div className="enhance-bar">
                    <button
                      className={`enh-btn ${activePanel[i] === 'score' ? 'enh-active' : ''}`}
                      onClick={() => enhance(i, 'score')}
                      disabled={!!enhLoading[i]}
                    >
                      {enhLoading[i] === 'score' ? '...' : 'Score'}
                    </button>
                    <button
                      className={`enh-btn ${activePanel[i] === 'translate' ? 'enh-active' : ''}`}
                      onClick={() => enhance(i, 'translate')}
                      disabled={!!enhLoading[i]}
                    >
                      {enhLoading[i] === 'translate' ? '...' : 'EN'}
                    </button>
                    <button
                      className={`enh-btn ${activePanel[i] === 'visual' ? 'enh-active' : ''}`}
                      onClick={() => enhance(i, 'visual')}
                      disabled={!!enhLoading[i]}
                    >
                      {enhLoading[i] === 'visual' ? '...' : 'Visuel'}
                    </button>
                  </div>

                  {/* Enhancement Panels */}
                  {activePanel[i] === 'score' && enhancements[i]?.score && renderScore(enhancements[i].score)}
                  {activePanel[i] === 'translate' && enhancements[i]?.translation && renderTranslation(enhancements[i].translation)}
                  {activePanel[i] === 'visual' && enhancements[i]?.visual && renderVisual(enhancements[i].visual)}

                  {/* Actions */}
                  <div className="post-actions">
                    <button className="action-btn" onClick={() => copyPost(i)}>{copied === i ? 'Copié' : 'Copier'}</button>
                    <button className={`action-btn ${editing === i ? 'act-active' : ''}`} onClick={() => toggleEdit(i)}>
                      {editing === i ? 'OK' : 'Éditer'}
                    </button>
                    <span className={`chars ${charCount(i) > maxChars ? 'over' : ''}`}>{charCount(i)}/{maxChars}</span>
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
        .page { min-height:100vh; background:#080808; position:relative; overflow-x:hidden; }
        .grid-bg { position:fixed; inset:0; background-image:linear-gradient(${network==='linkedin'?'rgba(10,102,194,0.03)':'rgba(57,255,20,0.03)'} 1px,transparent 1px),linear-gradient(90deg,${network==='linkedin'?'rgba(10,102,194,0.03)':'rgba(57,255,20,0.03)'} 1px,transparent 1px); background-size:60px 60px; pointer-events:none; z-index:0; }
        .wrapper { position:relative; z-index:1; max-width:720px; margin:0 auto; padding:24px 16px 60px; display:flex; flex-direction:column; gap:12px; }

        .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
        .header-left { display:flex; align-items:center; gap:10px; }
        .header-right { display:flex; align-items:center; gap:6px; }
        .logo { width:38px; height:38px; background:#fff; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:#000; flex-shrink:0; }
        .logo-li { background:#0a66c2; color:#fff; }
        .logo-title { font-size:16px; font-weight:800; color:#fff; }
        .logo-sub { font-size:10px; color:#555; font-family:'JetBrains Mono',monospace; }
        .h-btn { background:#161616; border:1px solid #2a2a2a; border-radius:8px; padding:5px 10px; font-size:11px; color:#888; cursor:pointer; font-weight:600; font-family:'Syne',sans-serif; text-decoration:none; transition:all .15s; }
        .h-btn:hover { border-color:${network==='linkedin'?'#0a66c2':'#39ff14'}; color:${network==='linkedin'?'#0a66c2':'#39ff14'}; }

        .network-switch { display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#0f0f0f; border:1px solid #1e1e1e; border-radius:12px; padding:5px; }
        .net-btn { background:transparent; border:1px solid transparent; border-radius:8px; padding:8px 12px; color:#555; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; font-family:'Syne',sans-serif; }
        .net-active { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.15); color:#fff; }
        .net-li { background:rgba(10,102,194,.1); border-color:rgba(10,102,194,.3); color:#0a66c2; }
        .net-icon { font-size:14px; font-weight:900; }

        /* Panels */
        .panel { background:#0c0c0c; border:1px solid #1a1a1a; border-radius:12px; padding:14px; }
        .panel-title { font-size:10px; color:#444; font-family:'JetBrains Mono',monospace; letter-spacing:.1em; margin-bottom:10px; }
        .panel-empty { font-size:12px; color:#444; text-align:center; padding:16px; }

        .history-list { display:flex; flex-direction:column; gap:6px; max-height:300px; overflow-y:auto; }
        .history-item { background:#111; border:1px solid #1e1e1e; border-radius:8px; padding:8px 10px; cursor:pointer; text-align:left; font-family:'Syne',sans-serif; transition:all .15s; width:100%; }
        .history-item:hover { border-color:#333; }
        .history-meta { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
        .history-net { background:${network==='linkedin'?'rgba(10,102,194,.1)':'rgba(57,255,20,.08)'}; color:${network==='linkedin'?'#0a66c2':'#39ff14'}; font-size:9px; font-weight:700; padding:1px 5px; border-radius:4px; font-family:'JetBrains Mono',monospace; }
        .history-date { font-size:10px; color:#555; font-family:'JetBrains Mono',monospace; }
        .history-preview { font-size:11px; color:#888; line-height:1.3; }
        .clear-btn { background:transparent; border:1px solid #2a2a2a; border-radius:6px; padding:4px 10px; font-size:10px; color:#555; cursor:pointer; margin-top:8px; font-family:'Syne',sans-serif; }

        .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; margin-bottom:8px; }
        .cal-day { background:#111; border:1px solid #1e1e1e; border-radius:6px; padding:6px; text-align:center; }
        .cal-day-label { font-size:10px; font-weight:700; color:${network==='linkedin'?'#0a66c2':'#39ff14'}; margin-bottom:4px; font-family:'JetBrains Mono',monospace; }
        .cal-slot { font-size:9px; color:#888; padding:2px 0; border-top:1px solid #1a1a1a; margin-top:2px; }
        .cal-tip { font-size:11px; color:#555; text-align:center; }

        .strat-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px; }
        .strat-card { background:#111; border:1px solid #1e1e1e; border-radius:8px; padding:8px; }
        .strat-time { font-size:10px; font-weight:700; color:${network==='linkedin'?'#0a66c2':'#39ff14'}; font-family:'JetBrains Mono',monospace; }
        .strat-type { font-size:11px; color:#ddd; font-weight:600; margin:2px 0; }
        .strat-why { font-size:10px; color:#666; }
        .pillars { display:flex; gap:8px; flex-wrap:wrap; }
        .pillar { font-size:10px; color:#666; }
        .pillar b { color:${network==='linkedin'?'#0a66c2':'#39ff14'}; font-family:'JetBrains Mono',monospace; margin-right:4px; }

        /* Format */
        .section-label { font-size:10px; color:#444; font-family:'JetBrains Mono',monospace; letter-spacing:.08em; margin-bottom:6px; }
        .format-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; }
        .format-btn { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:10px; padding:8px 4px; cursor:pointer; text-align:center; display:flex; flex-direction:column; align-items:center; gap:3px; font-family:'Syne',sans-serif; transition:all .15s; }
        .format-btn:hover { border-color:#333; }
        .format-btn.active { border-color:rgba(255,255,255,.3); background:rgba(255,255,255,.04); }
        .format-btn.active-li { border-color:rgba(10,102,194,.4); background:rgba(10,102,194,.06); }
        .format-icon { font-size:12px; font-weight:900; color:#555; font-family:'JetBrains Mono',monospace; }
        .format-btn.active .format-icon,.format-btn.active-li .format-icon { color:${network==='linkedin'?'#0a66c2':'#fff'}; }
        .format-label { font-size:9px; font-weight:600; color:#555; line-height:1.2; }
        .format-btn.active .format-label,.format-btn.active-li .format-label { color:#ccc; }
        .format-desc { font-size:11px; color:#555; margin-top:6px; padding:6px 10px; background:#0c0c0c; border:1px solid #1a1a1a; border-radius:8px; }

        /* Input */
        .input-box { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:12px; overflow:hidden; }
        .input-label { padding:8px 12px 0; font-size:10px; color:#444; font-family:'JetBrains Mono',monospace; letter-spacing:.08em; }
        .textarea { width:100%; background:transparent; border:none; color:#e2e2e2; font-size:14px; padding:6px 12px 10px; resize:none; outline:none; line-height:1.6; font-family:'Syne',sans-serif; }
        .starters { display:flex; gap:5px; flex-wrap:wrap; padding:0 12px 10px; border-top:1px solid #1a1a1a; padding-top:6px; }
        .starter { background:#161616; border:1px solid #222; border-radius:20px; padding:2px 8px; font-size:10px; color:#555; cursor:pointer; font-family:'JetBrains Mono',monospace; }
        .starter:hover { border-color:${network==='linkedin'?'#0a66c2':'#39ff14'}; color:${network==='linkedin'?'#0a66c2':'#39ff14'}; }

        /* Generate */
        .gen-btn { background:#fff; color:#000; border:none; border-radius:12px; padding:13px 20px; font-size:14px; font-weight:800; cursor:pointer; width:100%; display:flex; align-items:center; justify-content:center; gap:8px; font-family:'Syne',sans-serif; }
        .gen-btn:hover { background:#39ff14; }
        .gen-li:hover { background:#0a66c2; color:#fff; }
        .gen-btn.disabled { opacity:.5; cursor:not-allowed; }
        .spinner { width:14px; height:14px; border:2px solid #000; border-top-color:transparent; border-radius:50%; display:inline-block; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* Results */
        .results { display:flex; flex-direction:column; gap:12px; }
        .results-label { text-align:center; font-size:10px; color:#333; font-family:'JetBrains Mono',monospace; letter-spacing:.1em; }

        .post-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:14px; padding:14px; transition:border-color .15s; }
        .post-card:hover { border-color:#2a2a2a; }

        /* Preview */
        .preview-header { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .preview-avatar { width:36px; height:36px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:900; color:#000; flex-shrink:0; }
        .preview-avatar-li { background:#0a66c2; color:#fff; }
        .preview-info { flex:1; min-width:0; }
        .preview-name { font-size:13px; font-weight:700; color:#fff; display:flex; align-items:center; gap:3px; }
        .verified { color:#1d9bf0; font-size:11px; }
        .preview-handle { font-size:10px; color:#555; font-family:'JetBrains Mono',monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .type-badge { background:${network==='linkedin'?'rgba(10,102,194,.08)':'rgba(255,255,255,.05)'}; color:${network==='linkedin'?'#0a66c2':'#888'}; font-size:8px; font-weight:700; padding:2px 6px; border-radius:20px; font-family:'JetBrains Mono',monospace; text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; }

        .post-text { font-size:14px; line-height:1.7; color:#ddd; white-space:pre-wrap; padding:4px 0; }
        .edit-area { width:100%; background:#0a0a0a; border:1px solid #2a2a2a; border-radius:8px; color:#ddd; font-size:14px; padding:10px; resize:vertical; outline:none; line-height:1.7; font-family:'Syne',sans-serif; }

        .preview-metrics { display:flex; gap:16px; padding:8px 0; border-top:1px solid #1a1a1a; margin-top:8px; font-size:10px; color:#444; font-family:'JetBrains Mono',monospace; }

        /* Enhancement */
        .enhance-bar { display:flex; gap:6px; padding:8px 0; border-top:1px solid #1a1a1a; }
        .enh-btn { background:#161616; border:1px solid #222; border-radius:6px; padding:4px 10px; font-size:10px; color:#666; cursor:pointer; font-family:'JetBrains Mono',monospace; font-weight:600; transition:all .15s; }
        .enh-btn:hover { border-color:#444; color:#aaa; }
        .enh-btn:disabled { opacity:.5; }
        .enh-active { border-color:${network==='linkedin'?'rgba(10,102,194,.4)':'rgba(57,255,20,.4)'}; color:${network==='linkedin'?'#0a66c2':'#39ff14'}; }

        .enhancement-panel { background:#0a0a0a; border:1px solid #1a1a1a; border-radius:8px; padding:12px; margin-bottom:4px; }

        /* Score */
        .score-overall { font-size:28px; font-weight:900; color:${network==='linkedin'?'#0a66c2':'#39ff14'}; text-align:center; margin-bottom:8px; }
        .score-overall span { font-size:14px; color:#555; }
        .score-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
        .score-label { font-size:10px; color:#888; width:70px; font-family:'JetBrains Mono',monospace; }
        .score-bar-bg { flex:1; height:6px; background:#1a1a1a; border-radius:3px; overflow:hidden; }
        .score-bar-fill { height:100%; background:${network==='linkedin'?'#0a66c2':'#39ff14'}; border-radius:3px; transition:width .3s; }
        .score-val { font-size:10px; color:#666; font-family:'JetBrains Mono',monospace; width:30px; text-align:right; }
        .score-feedback { margin-top:8px; border-top:1px solid #1a1a1a; padding-top:8px; }
        .score-strength { font-size:11px; color:#4a4; margin-bottom:2px; }
        .score-weakness { font-size:11px; color:#a44; margin-bottom:2px; }
        .score-suggestion { font-size:11px; color:#888; margin-top:4px; font-style:italic; }

        /* Translation */
        .trans-label { font-size:9px; color:#666; font-family:'JetBrains Mono',monospace; letter-spacing:.1em; margin-bottom:6px; }
        .trans-text { font-size:13px; color:#ddd; line-height:1.6; margin-bottom:6px; white-space:pre-wrap; }
        .trans-note { font-size:10px; color:#555; font-style:italic; margin-bottom:6px; }
        .trans-copy { background:${network==='linkedin'?'#0a66c2':'#39ff14'}; color:${network==='linkedin'?'#fff':'#000'}; border:none; border-radius:6px; padding:4px 10px; font-size:10px; cursor:pointer; font-weight:700; font-family:'Syne',sans-serif; }

        /* Visual */
        .visual-type { font-size:10px; font-weight:700; color:${network==='linkedin'?'#0a66c2':'#39ff14'}; font-family:'JetBrains Mono',monospace; margin-bottom:4px; }
        .visual-desc { font-size:12px; color:#ddd; line-height:1.5; margin-bottom:6px; }
        .visual-text { font-size:11px; color:#aaa; font-style:italic; margin-bottom:6px; background:#111; padding:4px 8px; border-radius:4px; }
        .visual-meta { display:flex; gap:12px; font-size:10px; color:#555; font-family:'JetBrains Mono',monospace; margin-bottom:4px; }
        .visual-impact { font-size:10px; color:#666; font-style:italic; }

        /* Actions */
        .post-actions { display:flex; align-items:center; gap:6px; padding-top:8px; border-top:1px solid #1a1a1a; flex-wrap:wrap; }
        .action-btn { background:#161616; border:1px solid #222; border-radius:6px; padding:4px 10px; font-size:10px; color:#666; cursor:pointer; font-family:'Syne',sans-serif; font-weight:600; }
        .action-btn:hover { border-color:#444; color:#aaa; }
        .act-active { border-color:${network==='linkedin'?'rgba(10,102,194,.3)':'rgba(57,255,20,.3)'}; color:${network==='linkedin'?'#0a66c2':'#39ff14'}; }
        .chars { font-size:10px; font-family:'JetBrains Mono',monospace; color:#444; margin-left:auto; }
        .chars.over { color:#ff4444; }
        .post-btn { background:#fff; border:none; border-radius:6px; padding:4px 12px; font-size:10px; color:#000; cursor:pointer; font-family:'Syne',sans-serif; font-weight:700; }
        .post-btn:hover { background:#39ff14; }
        .post-btn-li:hover { background:#0a66c2; color:#fff; }

        .footer { text-align:center; font-size:10px; color:#222; font-family:'JetBrains Mono',monospace; margin-top:16px; }

        @media (max-width:600px) {
          .format-grid { grid-template-columns:repeat(2,1fr); }
          .strat-grid { grid-template-columns:1fr; }
          .cal-grid { grid-template-columns:repeat(4,1fr); }
          .header-right { gap:4px; }
          .h-btn { padding:4px 7px; font-size:10px; }
          .preview-metrics { gap:8px; flex-wrap:wrap; }
          .pillars { flex-direction:column; }
        }
      `}</style>
    </>
  )
}
