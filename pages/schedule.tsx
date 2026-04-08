import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type Network = 'twitter' | 'linkedin'
type ScheduledPost = {
  id: string
  text: string
  network: Network
  date: string
  time: string
  format: string
  status: 'scheduled' | 'posted' | 'draft'
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

const OPTIMAL: Record<string, { day: number; hour: string; label: string }[]> = {
  twitter: [
    { day: 0, hour: '08:00', label: 'Raw Build' },
    { day: 1, hour: '12:00', label: 'Hot Take' },
    { day: 2, hour: '18:00', label: 'Micro Story' },
    { day: 3, hour: '09:00', label: 'AI Authority' },
    { day: 4, hour: '12:00', label: 'Reply Magnet' },
    { day: 0, hour: '18:00', label: 'BTS' },
    { day: 3, hour: '18:00', label: 'Axora Hype' },
    { day: 5, hour: '10:00', label: 'One-Liner' },
    { day: 6, hour: '18:00', label: 'Storytelling' },
  ],
  linkedin: [
    { day: 1, hour: '08:00', label: 'Thought Leader' },
    { day: 2, hour: '12:00', label: 'Storytelling' },
    { day: 3, hour: '08:00', label: 'Value Bomb' },
    { day: 0, hour: '09:00', label: 'AI Expert' },
    { day: 4, hour: '09:00', label: 'Transparence' },
    { day: 6, hour: '18:00', label: 'Axora Vision' },
    { day: 2, hour: '08:00', label: 'Personal Brand' },
  ],
}

export default function SchedulePage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newText, setNewText] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('09:00')
  const [newFormat, setNewFormat] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('social-agent-schedule')
      if (saved) setPosts(JSON.parse(saved))
    } catch {}
  }, [])

  const save = (updated: ScheduledPost[]) => {
    setPosts(updated)
    localStorage.setItem('social-agent-schedule', JSON.stringify(updated))
  }

  const addPost = () => {
    if (!newText.trim() || !newDate) return
    const post: ScheduledPost = {
      id: Date.now().toString(),
      text: newText,
      network,
      date: newDate,
      time: newTime,
      format: newFormat || 'custom',
      status: 'scheduled',
    }
    save([...posts, post])
    setNewText('')
    setNewDate('')
    setNewFormat('')
    setShowAdd(false)
  }

  const removePost = (id: string) => save(posts.filter(p => p.id !== id))
  const markPosted = (id: string) => save(posts.map(p => p.id === id ? { ...p, status: 'posted' as const } : p))

  const copyAndMark = (post: ScheduledPost) => {
    navigator.clipboard.writeText(post.text)
    markPosted(post.id)
    if (post.network === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.text)}`, '_blank')
    } else {
      window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(post.text)}`, '_blank')
    }
  }

  const today = new Date()
  const getWeekDates = () => {
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }
  const weekDates = getWeekDates()

  const getPostsForSlot = (date: string, hour: string) =>
    posts.filter(p => p.date === date && p.time === hour && p.network === network)

  const getOptimalForSlot = (dayIdx: number, hour: string) =>
    OPTIMAL[network].find(o => o.day === dayIdx && o.hour === hour)

  const upcoming = posts
    .filter(p => p.status === 'scheduled' && p.network === network)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

  const accent = network === 'linkedin' ? '#0a66c2' : '#39ff14'
  const accentBg = network === 'linkedin' ? 'rgba(10,102,194,' : 'rgba(57,255,20,'

  return (
    <>
      <Head>
        <title>Schedule — Ismaa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="page">
        <div className="wrapper">
          <header className="header">
            <div className="header-left">
              <div className="logo">S</div>
              <div>
                <div className="logo-title">Schedule</div>
                <div className="logo-sub">Planification des posts</div>
              </div>
            </div>
            <div className="header-right">
              <Link href="/" className="nav-link">Posts</Link>
              <Link href="/reply" className="nav-link">Reply</Link>
              <Link href="/growth" className="nav-link">Growth</Link>
            </div>
          </header>

          <div className="network-switch">
            <button className={`net-btn ${network === 'twitter' ? 'net-active' : ''}`} onClick={() => setNetwork('twitter')}>
              X · Twitter
            </button>
            <button className={`net-btn ${network === 'linkedin' ? 'net-active net-li' : ''}`} onClick={() => setNetwork('linkedin')}>
              in · LinkedIn
            </button>
          </div>

          {/* Week Grid */}
          <div className="section-label">SEMAINE EN COURS</div>
          <div className="week-grid">
            <div className="week-header">
              <div className="hour-col" />
              {DAYS.map((d, i) => (
                <div key={d} className={`day-col-header ${weekDates[i] === today.toISOString().split('T')[0] ? 'today' : ''}`}>
                  <span className="day-name">{d}</span>
                  <span className="day-date">{new Date(weekDates[i]).getDate()}</span>
                </div>
              ))}
            </div>
            <div className="week-body">
              {HOURS.map(hour => (
                <div key={hour} className="hour-row">
                  <div className="hour-label">{hour}</div>
                  {weekDates.map((date, dayIdx) => {
                    const slotPosts = getPostsForSlot(date, hour)
                    const optimal = getOptimalForSlot(dayIdx, hour)
                    return (
                      <div key={date} className="slot" onClick={() => { setNewDate(date); setNewTime(hour); setNewFormat(optimal?.label || ''); setShowAdd(true) }}>
                        {optimal && slotPosts.length === 0 && (
                          <div className="optimal-hint">{optimal.label}</div>
                        )}
                        {slotPosts.map(p => (
                          <div key={p.id} className={`slot-post ${p.status}`}>
                            {p.text.slice(0, 25)}...
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Add Post Modal */}
          {showAdd && (
            <div className="add-panel">
              <div className="add-header">
                <span>Programmer un post — {newDate} à {newTime}</span>
                <button className="close-btn" onClick={() => setShowAdd(false)}>X</button>
              </div>
              {newFormat && <div className="add-format">Format suggéré : {newFormat}</div>}
              <textarea
                className="add-textarea"
                placeholder="Écris ou colle ton post ici..."
                value={newText}
                onChange={e => setNewText(e.target.value)}
                rows={5}
              />
              <div className="add-row">
                <input type="date" className="add-input" value={newDate} onChange={e => setNewDate(e.target.value)} />
                <select className="add-input" value={newTime} onChange={e => setNewTime(e.target.value)}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <button className="add-btn" onClick={addPost}>Programmer</button>
              </div>
            </div>
          )}

          {/* Upcoming */}
          <div className="section-label">PROCHAINS POSTS ({upcoming.length})</div>
          {upcoming.length === 0 && <div className="empty">Aucun post programmé. Clique sur un créneau dans le calendrier.</div>}
          {upcoming.map(post => (
            <div key={post.id} className="upcoming-card">
              <div className="upcoming-header">
                <span className="upcoming-time">{post.date} · {post.time}</span>
                <span className="upcoming-format">{post.format}</span>
              </div>
              <div className="upcoming-text">{post.text}</div>
              <div className="upcoming-actions">
                <button className="act-btn" onClick={() => copyAndMark(post)}>Poster maintenant</button>
                <button className="act-btn del" onClick={() => removePost(post.id)}>Supprimer</button>
              </div>
            </div>
          ))}

          <div className="footer">Built by Pixel Company · Ismaa · Brussels</div>
        </div>
      </div>

      <style jsx>{`
        .page { min-height:100vh; background:#080808; }
        .wrapper { max-width:900px; margin:0 auto; padding:24px 16px 60px; display:flex; flex-direction:column; gap:12px; }
        .header { display:flex; align-items:center; justify-content:space-between; }
        .header-left { display:flex; align-items:center; gap:10px; }
        .header-right { display:flex; gap:6px; }
        .logo { width:38px; height:38px; background:${accent}; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:${network==='linkedin'?'#fff':'#000'}; }
        .logo-title { font-size:16px; font-weight:800; color:#fff; }
        .logo-sub { font-size:10px; color:#555; font-family:'JetBrains Mono',monospace; }
        .nav-link { background:#161616; border:1px solid #2a2a2a; border-radius:8px; padding:5px 10px; font-size:11px; color:#888; text-decoration:none; font-weight:600; font-family:'Syne',sans-serif; }
        .nav-link:hover { border-color:${accent}; color:${accent}; }
        .network-switch { display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#0f0f0f; border:1px solid #1e1e1e; border-radius:12px; padding:5px; }
        .net-btn { background:transparent; border:1px solid transparent; border-radius:8px; padding:8px; color:#555; font-size:13px; font-weight:600; cursor:pointer; text-align:center; font-family:'Syne',sans-serif; }
        .net-active { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.15); color:#fff; }
        .net-li { background:rgba(10,102,194,.1); border-color:rgba(10,102,194,.3); color:#0a66c2; }
        .section-label { font-size:10px; color:#444; font-family:'JetBrains Mono',monospace; letter-spacing:.08em; margin-top:8px; }

        /* Week Grid */
        .week-grid { background:#0c0c0c; border:1px solid #1a1a1a; border-radius:12px; overflow:hidden; }
        .week-header { display:grid; grid-template-columns:50px repeat(7,1fr); border-bottom:1px solid #1a1a1a; }
        .hour-col { }
        .day-col-header { text-align:center; padding:8px 4px; border-left:1px solid #1a1a1a; }
        .day-col-header.today { background:${accentBg}0.06); }
        .day-name { font-size:11px; font-weight:700; color:#888; display:block; }
        .day-date { font-size:10px; color:#555; font-family:'JetBrains Mono',monospace; }
        .day-col-header.today .day-name { color:${accent}; }
        .week-body { max-height:400px; overflow-y:auto; }
        .hour-row { display:grid; grid-template-columns:50px repeat(7,1fr); border-bottom:1px solid #111; }
        .hour-label { font-size:9px; color:#444; font-family:'JetBrains Mono',monospace; padding:4px; display:flex; align-items:flex-start; justify-content:center; }
        .slot { border-left:1px solid #1a1a1a; padding:2px; min-height:32px; cursor:pointer; transition:background .1s; }
        .slot:hover { background:${accentBg}0.04); }
        .optimal-hint { font-size:8px; color:#444; font-family:'JetBrains Mono',monospace; padding:2px 4px; background:#111; border-radius:3px; text-align:center; }
        .slot-post { font-size:8px; color:#ddd; background:${accentBg}0.12); border:1px solid ${accentBg}0.2); border-radius:3px; padding:2px 4px; margin:1px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .slot-post.posted { opacity:.4; text-decoration:line-through; }

        /* Add Panel */
        .add-panel { background:#0f0f0f; border:1px solid ${accentBg}0.3); border-radius:12px; padding:14px; }
        .add-header { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#ddd; font-weight:600; margin-bottom:8px; }
        .close-btn { background:transparent; border:none; color:#666; cursor:pointer; font-size:14px; }
        .add-format { font-size:10px; color:${accent}; font-family:'JetBrains Mono',monospace; margin-bottom:6px; }
        .add-textarea { width:100%; background:#0a0a0a; border:1px solid #2a2a2a; border-radius:8px; color:#ddd; font-size:14px; padding:10px; resize:none; outline:none; line-height:1.6; font-family:'Syne',sans-serif; margin-bottom:8px; }
        .add-row { display:flex; gap:6px; align-items:center; }
        .add-input { background:#0a0a0a; border:1px solid #2a2a2a; border-radius:6px; color:#ddd; padding:6px 8px; font-size:12px; font-family:'JetBrains Mono',monospace; outline:none; }
        .add-btn { background:${accent}; color:${network==='linkedin'?'#fff':'#000'}; border:none; border-radius:8px; padding:6px 16px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Syne',sans-serif; margin-left:auto; }

        /* Upcoming */
        .empty { font-size:12px; color:#444; text-align:center; padding:16px; }
        .upcoming-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:10px; padding:12px; }
        .upcoming-header { display:flex; justify-content:space-between; margin-bottom:6px; }
        .upcoming-time { font-size:10px; color:${accent}; font-family:'JetBrains Mono',monospace; font-weight:700; }
        .upcoming-format { font-size:9px; color:#666; font-family:'JetBrains Mono',monospace; text-transform:uppercase; }
        .upcoming-text { font-size:13px; color:#ddd; line-height:1.6; margin-bottom:8px; white-space:pre-wrap; }
        .upcoming-actions { display:flex; gap:6px; }
        .act-btn { background:#161616; border:1px solid #2a2a2a; border-radius:6px; padding:4px 12px; font-size:10px; color:#888; cursor:pointer; font-family:'Syne',sans-serif; font-weight:600; }
        .act-btn:hover { border-color:${accent}; color:${accent}; }
        .act-btn.del:hover { border-color:#ef4444; color:#ef4444; }
        .footer { text-align:center; font-size:10px; color:#222; font-family:'JetBrains Mono',monospace; margin-top:16px; }

        @media (max-width:600px) {
          .week-grid { overflow-x:auto; }
          .week-header,.hour-row { min-width:600px; }
        }
      `}</style>
    </>
  )
}
