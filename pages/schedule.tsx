import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type ScheduledPost = { id: string; text: string; network: Network; date: string; time: string; format: string; status: 'scheduled' | 'posted' }

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function SchedulePage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newText, setNewText] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('09:00')

  useEffect(() => { try { const s = localStorage.getItem('social-agent-schedule'); if (s) setPosts(JSON.parse(s)) } catch {} }, [])
  const save = (u: ScheduledPost[]) => { setPosts(u); localStorage.setItem('social-agent-schedule', JSON.stringify(u)) }
  const addPost = () => { if (!newText.trim() || !newDate) return; save([...posts, { id: Date.now().toString(), text: newText, network, date: newDate, time: newTime, format: '', status: 'scheduled' }]); setNewText(''); setNewDate(''); setShowAdd(false) }
  const removePost = (id: string) => save(posts.filter(p => p.id !== id))
  const postNow = (p: ScheduledPost) => {
    navigator.clipboard.writeText(p.text)
    save(posts.map(x => x.id === p.id ? { ...x, status: 'posted' as const } : x))
    window.open(p.network === 'twitter' ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(p.text)}` : `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(p.text)}`, '_blank')
  }

  const upcoming = posts.filter(p => p.status === 'scheduled' && p.network === network).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const accent = network === 'linkedin' ? 'var(--li)' : 'var(--accent)'

  return (
    <>
      <Head><title>Schedule — Ismaa</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Schedule" subtitle="Planification des posts">
        <div className="page-content">
          <button className="add-toggle" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Annuler' : '+ Programmer un post'}
          </button>

          {showAdd && (
            <div className="add-panel">
              <textarea className="input" placeholder="Écris ou colle ton post..." value={newText} onChange={e => setNewText(e.target.value)} rows={4} />
              <div className="add-row">
                <input type="date" className="date-input" value={newDate} onChange={e => setNewDate(e.target.value)} />
                <select className="time-input" value={newTime} onChange={e => setNewTime(e.target.value)}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <button className="add-btn" onClick={addPost}>Programmer</button>
              </div>
            </div>
          )}

          <div className="label">Prochains posts ({upcoming.length})</div>

          {upcoming.length === 0 && <div className="empty">Aucun post programmé</div>}

          {upcoming.map(p => (
            <div key={p.id} className="sched-card">
              <div className="sc-top">
                <span className="sc-time">{p.date} · {p.time}</span>
                <span className="sc-net">{p.network === 'twitter' ? 'X' : 'LI'}</span>
              </div>
              <div className="sc-text">{p.text}</div>
              <div className="sc-actions">
                <button className="sc-btn post" onClick={() => postNow(p)}>Poster maintenant</button>
                <button className="sc-btn del" onClick={() => removePost(p.id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>

        <style jsx>{`
          .page-content { display:flex; flex-direction:column; gap:12px; }
          .label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
          .empty { font-size:12px; color:var(--muted); text-align:center; padding:24px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); }

          .add-toggle { width:100%; padding:10px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); font-size:13px; font-weight:600; color:var(--text2); cursor:pointer; }
          .add-toggle:hover { border-color:${accent}; color:${accent}; }

          .add-panel { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:12px; display:flex; flex-direction:column; gap:8px; }
          .input { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-size:14px; padding:10px; resize:none; outline:none; line-height:1.6; }
          .add-row { display:flex; gap:6px; align-items:center; }
          .date-input,.time-input { background:var(--bg); border:1px solid var(--border); border-radius:6px; color:var(--text); padding:6px 8px; font-size:12px; font-family:var(--mono); outline:none; }
          .add-btn { background:${accent}; color:${network === 'linkedin' ? '#fff' : '#000'}; border:none; border-radius:var(--radius-sm); padding:6px 16px; font-size:12px; font-weight:700; cursor:pointer; margin-left:auto; }

          .sched-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:12px; }
          .sc-top { display:flex; justify-content:space-between; margin-bottom:6px; }
          .sc-time { font-size:11px; font-weight:600; color:${accent}; font-family:var(--mono); }
          .sc-net { font-size:9px; font-weight:700; color:var(--muted); font-family:var(--mono); background:var(--card2); padding:1px 6px; border-radius:4px; }
          .sc-text { font-size:13px; color:var(--text); line-height:1.6; white-space:pre-wrap; margin-bottom:8px; }
          .sc-actions { display:flex; gap:6px; }
          .sc-btn { background:var(--card2); border:1px solid var(--border); border-radius:6px; padding:4px 12px; font-size:11px; color:var(--text2); cursor:pointer; font-weight:500; }
          .sc-btn:hover { border-color:var(--border2); }
          .sc-btn.post:hover { border-color:${accent}; color:${accent}; }
          .sc-btn.del:hover { border-color:var(--danger); color:var(--danger); }
        `}</style>
      </Layout>
    </>
  )
}
