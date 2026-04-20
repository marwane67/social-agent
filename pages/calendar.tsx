import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useNetwork } from '../lib/network-context'
import { CalendarEntry, getEntries, deleteEntry, updateEntry } from '../lib/calendar'

type View = 'week' | 'month' | 'list'
type GoogleStatus = { connected: boolean; configured: boolean; email: string | null }

export default function CalendarPage() {
  const router = useRouter()
  const { network, isLi } = useNetwork()
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [view, setView] = useState<View>('week')
  const [anchorDate, setAnchorDate] = useState(new Date())
  const [selected, setSelected] = useState<CalendarEntry | null>(null)
  const [filterNetwork, setFilterNetwork] = useState<'all' | 'twitter' | 'linkedin'>('all')
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setEntries(getEntries())
    fetchGoogleStatus()
    // Handle redirect from Google OAuth
    if (router.query.google_connected === '1') {
      setSyncMsg({ type: 'success', text: '✓ Google Calendar connecté !' })
      router.replace('/calendar', undefined, { shallow: true })
    } else if (router.query.google_error) {
      setSyncMsg({ type: 'error', text: 'Erreur Google : ' + router.query.google_error })
      router.replace('/calendar', undefined, { shallow: true })
    }
  }, [router.query.google_connected, router.query.google_error])

  const fetchGoogleStatus = async () => {
    try {
      const res = await fetch('/api/google/status')
      const data = await res.json()
      setGoogleStatus(data)
    } catch {}
  }

  const connectGoogle = () => {
    window.location.href = '/api/google/auth'
  }

  const disconnectGoogle = async () => {
    if (!confirm('Déconnecter Google Calendar ?')) return
    await fetch('/api/google/disconnect', { method: 'POST' })
    fetchGoogleStatus()
    setSyncMsg({ type: 'success', text: 'Google Calendar déconnecté' })
  }

  const syncToGoogle = async (which: 'all' | 'upcoming' = 'upcoming') => {
    const toSync = which === 'all'
      ? entries
      : entries.filter(e => new Date(e.scheduledAt).getTime() > Date.now())
    if (toSync.length === 0) {
      setSyncMsg({ type: 'error', text: 'Aucun post à syncer' })
      return
    }
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: toSync }),
      })
      const data = await res.json()
      if (res.ok) {
        setSyncMsg({
          type: 'success',
          text: `✓ ${data.created}/${data.total} évènements créés sur Google Calendar`,
        })
      } else {
        setSyncMsg({ type: 'error', text: data.message || data.error || 'Sync échouée' })
      }
    } catch (e: any) {
      setSyncMsg({ type: 'error', text: 'Connexion impossible' })
    } finally {
      setSyncing(false)
    }
  }

  const exportICS = async () => {
    if (entries.length === 0) return
    const res = await fetch('/api/google/export-ics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'social-agent-calendar.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() => {
    return filterNetwork === 'all' ? entries : entries.filter(e => e.network === filterNetwork)
  }, [entries, filterNetwork])

  const refresh = () => setEntries(getEntries())

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce post planifié ?')) return
    deleteEntry(id)
    refresh()
    setSelected(null)
  }

  const handleStatusChange = (id: string, status: CalendarEntry['status']) => {
    updateEntry(id, { status })
    refresh()
    if (selected?.id === id) setSelected({ ...selected, status })
  }

  const goToday = () => setAnchorDate(new Date())
  const goPrev = () => {
    const d = new Date(anchorDate)
    d.setDate(d.getDate() - (view === 'month' ? 30 : 7))
    setAnchorDate(d)
  }
  const goNext = () => {
    const d = new Date(anchorDate)
    d.setDate(d.getDate() + (view === 'month' ? 30 : 7))
    setAnchorDate(d)
  }

  return (
    <>
      <Head><title>Calendrier — Social Agent</title></Head>
      <Layout title="Calendrier" subtitle={`${filtered.length} posts planifiés`}>
        {/* Google Calendar bar */}
        <div className="gcal-bar">
          {googleStatus?.connected ? (
            <>
              <div className="gcal-info">
                <span className="gcal-dot connected" />
                <span className="gcal-text">
                  Google Calendar connecté
                  {googleStatus.email && <span className="gcal-email"> · {googleStatus.email}</span>}
                </span>
              </div>
              <div className="gcal-actions">
                <button onClick={() => syncToGoogle('upcoming')} disabled={syncing} className="gcal-btn primary">
                  {syncing ? 'Sync…' : `Sync ${entries.filter(e => new Date(e.scheduledAt).getTime() > Date.now()).length} à venir`}
                </button>
                <button onClick={exportICS} className="gcal-btn">Export .ics</button>
                <button onClick={disconnectGoogle} className="gcal-btn ghost">Déconnecter</button>
              </div>
            </>
          ) : googleStatus?.configured ? (
            <>
              <div className="gcal-info">
                <span className="gcal-dot" />
                <span className="gcal-text">Google Calendar non connecté</span>
              </div>
              <div className="gcal-actions">
                <button onClick={connectGoogle} className="gcal-btn primary">
                  Connecter Google Calendar
                </button>
                <button onClick={exportICS} className="gcal-btn">Export .ics</button>
              </div>
            </>
          ) : (
            <>
              <div className="gcal-info">
                <span className="gcal-dot warning" />
                <span className="gcal-text">
                  Google OAuth pas configuré · <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="gcal-link">setup en 5 min</a>
                </span>
              </div>
              <div className="gcal-actions">
                <button onClick={exportICS} className="gcal-btn">Export .ics</button>
              </div>
            </>
          )}
        </div>

        {syncMsg && (
          <div className={`sync-msg sync-${syncMsg.type}`}>{syncMsg.text}</div>
        )}

        {/* Toolbar */}
        <div className="toolbar">
          <div className="nav-group">
            <button onClick={goPrev} className="nav-btn">←</button>
            <button onClick={goToday} className="today-btn">Aujourd'hui</button>
            <button onClick={goNext} className="nav-btn">→</button>
          </div>
          <div className="anchor-label">
            {anchorDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </div>
          <div className="filter-group">
            <select value={filterNetwork} onChange={e => setFilterNetwork(e.target.value as any)} className="filter">
              <option value="all">Tous</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            <div className="view-switch">
              <button className={`view ${view === 'week' ? 'on' : ''}`} onClick={() => setView('week')}>Sem</button>
              <button className={`view ${view === 'month' ? 'on' : ''}`} onClick={() => setView('month')}>Mois</button>
              <button className={`view ${view === 'list' ? 'on' : ''}`} onClick={() => setView('list')}>Liste</button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {entries.length === 0 ? (
          <div className="empty">
            <p>Aucun post planifié.</p>
            <p className="muted">
              Demande à <button onClick={() => router.push('/agent')} className="lnk">Pulse</button> de planifier ta semaine, ou utilise <button onClick={() => router.push('/series')} className="lnk">Launch Series</button>.
            </p>
          </div>
        ) : (
          <>
            {view === 'week' && <WeekView anchorDate={anchorDate} entries={filtered} onSelect={setSelected} />}
            {view === 'month' && <MonthView anchorDate={anchorDate} entries={filtered} onSelect={setSelected} />}
            {view === 'list' && <ListView entries={filtered} onSelect={setSelected} />}
          </>
        )}

        {/* Detail modal */}
        {selected && (
          <DetailModal
            entry={selected}
            onClose={() => setSelected(null)}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}

        <style jsx>{`
          /* === Google Calendar bar === */
          .gcal-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 16px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-md);
            margin-bottom: 12px;
            flex-wrap: wrap;
          }
          .gcal-info {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            color: var(--text-secondary);
          }
          .gcal-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--text-faint);
            flex-shrink: 0;
          }
          .gcal-dot.connected { background: var(--success); box-shadow: 0 0 8px var(--success); }
          .gcal-dot.warning { background: var(--warning); }
          .gcal-text { color: var(--text); font-weight: 500; }
          .gcal-email {
            color: var(--text-muted);
            font-family: var(--mono);
            font-size: 11px;
            font-weight: 400;
          }
          .gcal-link { color: var(--accent); text-decoration: underline; }
          .gcal-actions { display: flex; gap: 6px; flex-wrap: wrap; }
          .gcal-btn {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
            padding: 7px 14px;
            border-radius: var(--r-sm);
            font-weight: 500;
          }
          .gcal-btn:hover:not(:disabled) { color: var(--text); border-color: var(--border-strong); }
          .gcal-btn.primary {
            background: var(--accent);
            color: var(--accent-text-on);
            border-color: var(--accent);
            font-weight: 600;
          }
          .gcal-btn.primary:hover:not(:disabled) { background: #fff; }
          .gcal-btn.ghost { background: transparent; color: var(--text-muted); border-color: transparent; }
          .gcal-btn.ghost:hover { color: var(--danger); }

          .sync-msg {
            padding: 10px 14px;
            border-radius: var(--r-sm);
            font-size: 12px;
            margin-bottom: 12px;
            border: 1px solid;
          }
          .sync-success {
            background: rgba(74, 222, 128, 0.08);
            border-color: rgba(74, 222, 128, 0.3);
            color: var(--success);
          }
          .sync-error {
            background: rgba(239, 68, 68, 0.08);
            border-color: rgba(239, 68, 68, 0.3);
            color: var(--danger);
          }

          .toolbar {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
            flex-wrap: wrap;
          }
          .nav-group, .filter-group {
            display: flex;
            gap: 4px;
            align-items: center;
          }
          .nav-btn, .today-btn, .view {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
            font-weight: 500;
            padding: 6px 12px;
            border-radius: var(--r-sm);
          }
          .nav-btn { width: 32px; padding: 6px 8px; font-family: var(--mono); }
          .nav-btn:hover, .today-btn:hover, .view:hover { color: var(--text); border-color: var(--border-strong); }
          .anchor-label {
            flex: 1;
            font-size: 14px;
            font-weight: 600;
            color: var(--text);
            text-transform: capitalize;
          }
          .filter {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
            padding: 6px 10px;
            border-radius: var(--r-sm);
          }
          .view-switch {
            display: flex;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--r-sm);
            padding: 2px;
          }
          .view-switch .view { background: transparent; border: none; padding: 4px 10px; }
          .view-switch .view.on { background: var(--bg-surface); color: var(--text); font-weight: 600; }

          .empty {
            text-align: center;
            padding: 60px 24px;
            background: var(--bg-elevated);
            border: 1px dashed var(--border);
            border-radius: var(--r-lg);
            color: var(--text-secondary);
          }
          .empty p { margin: 0 0 8px; }
          .muted { font-size: 13px; color: var(--text-muted); }
          .lnk { background: transparent; border: none; color: var(--text); text-decoration: underline; padding: 0; font-family: var(--mono); font-size: inherit; }
        `}</style>
      </Layout>
    </>
  )
}

/* ============== WEEK VIEW ============== */
function WeekView({ anchorDate, entries, onSelect }: { anchorDate: Date; entries: CalendarEntry[]; onSelect: (e: CalendarEntry) => void }) {
  const start = new Date(anchorDate)
  start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1)) // Monday
  start.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  return (
    <div className="week">
      {days.map(d => {
        const dayKey = d.toISOString().split('T')[0]
        const dayEntries = entries.filter(e => e.scheduledAt.split('T')[0] === dayKey)
        const isToday = d.toDateString() === new Date().toDateString()
        return (
          <div key={dayKey} className={`day ${isToday ? 'today' : ''}`}>
            <div className="day-head">
              <div className="dh-name">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
              <div className="dh-num">{d.getDate()}</div>
            </div>
            <div className="day-entries">
              {dayEntries.length === 0 && <div className="day-empty">—</div>}
              {dayEntries.map(e => (
                <button key={e.id} onClick={() => onSelect(e)} className={`entry entry-${e.network} entry-${e.status}`}>
                  <div className="e-time">{new Date(e.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="e-text">{e.text.slice(0, 60)}{e.text.length > 60 ? '…' : ''}</div>
                </button>
              ))}
            </div>
          </div>
        )
      })}

      <style jsx>{`
        .week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        @media (max-width: 768px) { .week { grid-template-columns: 1fr; } }
        .day {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 10px;
          min-height: 180px;
          display: flex;
          flex-direction: column;
        }
        .day.today { border-color: var(--net); background: var(--net-soft); }
        .day-head {
          display: flex;
          align-items: baseline;
          gap: 6px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 8px;
        }
        .dh-name {
          font-size: 9px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-family: var(--mono);
        }
        .day.today .dh-name { color: var(--net); }
        .dh-num { font-size: 14px; font-weight: 700; color: var(--text); }

        .day-entries { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .day-empty {
          text-align: center;
          color: var(--text-faint);
          font-family: var(--mono);
          font-size: 11px;
          padding: 8px;
        }

        .entry {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-left: 3px solid var(--text-faint);
          border-radius: var(--r-sm);
          padding: 6px 8px;
          text-align: left;
          font-size: 11px;
          color: var(--text);
          cursor: pointer;
          transition: all var(--t-fast) var(--ease);
        }
        .entry:hover { background: var(--bg-card-hover); transform: translateX(1px); }
        .entry-twitter { border-left-color: var(--text); }
        .entry-linkedin { border-left-color: var(--linkedin); }
        .entry-published { opacity: 0.5; }
        .entry-draft { border-left-style: dashed; }
        .e-time {
          font-size: 9px;
          color: var(--text-muted);
          font-family: var(--mono);
          margin-bottom: 2px;
        }
        .e-text { line-height: 1.35; }
      `}</style>
    </div>
  )
}

/* ============== MONTH VIEW ============== */
function MonthView({ anchorDate, entries, onSelect }: { anchorDate: Date; entries: CalendarEntry[]; onSelect: (e: CalendarEntry) => void }) {
  const year = anchorDate.getFullYear()
  const month = anchorDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDay = (firstDay.getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="month">
      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
        <div key={d} className="m-head">{d}</div>
      ))}
      {cells.map((d, i) => {
        if (!d) return <div key={i} className="m-cell empty" />
        const dayEntries = entries.filter(e => {
          const ed = new Date(e.scheduledAt)
          return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
        })
        const isToday = d.toDateString() === new Date().toDateString()
        return (
          <div key={i} className={`m-cell ${isToday ? 'today' : ''}`}>
            <div className="m-num">{d.getDate()}</div>
            <div className="m-entries">
              {dayEntries.slice(0, 3).map(e => (
                <button key={e.id} onClick={() => onSelect(e)} className={`m-entry entry-${e.network}`}>
                  <span className="m-dot" />
                  <span>{e.text.slice(0, 22)}…</span>
                </button>
              ))}
              {dayEntries.length > 3 && (
                <div className="m-more">+{dayEntries.length - 3}</div>
              )}
            </div>
          </div>
        )
      })}

      <style jsx>{`
        .month {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .m-head {
          font-size: 9px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-family: var(--mono);
          padding: 6px 4px;
          text-align: center;
        }
        .m-cell {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          padding: 6px;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .m-cell.empty { background: transparent; border: none; }
        .m-cell.today { border-color: var(--net); background: var(--net-soft); }
        .m-num { font-size: 11px; font-weight: 600; color: var(--text); font-family: var(--mono); }
        .m-cell.today .m-num { color: var(--net); }

        .m-entries { display: flex; flex-direction: column; gap: 2px; flex: 1; min-height: 0; }
        .m-entry {
          background: var(--bg-card);
          border: none;
          color: var(--text-secondary);
          font-size: 9px;
          padding: 2px 5px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          gap: 4px;
          text-align: left;
          line-height: 1.3;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .m-entry:hover { background: var(--bg-card-hover); color: var(--text); }
        .m-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--text-faint);
          flex-shrink: 0;
        }
        .entry-twitter .m-dot { background: var(--text); }
        .entry-linkedin .m-dot { background: var(--linkedin); }
        .m-more {
          font-size: 9px;
          color: var(--text-muted);
          font-family: var(--mono);
          padding-left: 5px;
        }

        @media (max-width: 600px) {
          .m-cell { min-height: 60px; padding: 4px; }
          .m-entry { font-size: 8px; }
        }
      `}</style>
    </div>
  )
}

/* ============== LIST VIEW ============== */
function ListView({ entries, onSelect }: { entries: CalendarEntry[]; onSelect: (e: CalendarEntry) => void }) {
  const sorted = [...entries].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  return (
    <div className="list">
      {sorted.map(e => (
        <button key={e.id} onClick={() => onSelect(e)} className="row">
          <div className="r-date">
            <div className="rd-day">{new Date(e.scheduledAt).getDate()}</div>
            <div className="rd-mo">{new Date(e.scheduledAt).toLocaleDateString('fr-FR', { month: 'short' })}</div>
          </div>
          <div className="r-body">
            <div className="r-head">
              <span className={`r-net r-net-${e.network}`}>{e.network === 'twitter' ? 'X' : 'in'}</span>
              <span className="r-time">{new Date(e.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className={`r-status r-status-${e.status}`}>{e.status}</span>
            </div>
            <div className="r-text">{e.text.slice(0, 140)}{e.text.length > 140 ? '…' : ''}</div>
          </div>
        </button>
      ))}

      <style jsx>{`
        .list { display: flex; flex-direction: column; gap: 6px; }
        .row {
          display: flex;
          gap: 14px;
          padding: 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          text-align: left;
          cursor: pointer;
          align-items: center;
        }
        .row:hover { border-color: var(--border-strong); background: var(--bg-card-hover); }
        .r-date {
          width: 50px;
          flex-shrink: 0;
          text-align: center;
          padding: 6px;
          background: var(--bg-card);
          border-radius: var(--r-sm);
        }
        .rd-day { font-size: 18px; font-weight: 700; color: var(--text); font-family: var(--mono); line-height: 1; }
        .rd-mo { font-size: 9px; color: var(--text-muted); font-family: var(--mono); text-transform: uppercase; margin-top: 2px; }
        .r-body { flex: 1; min-width: 0; }
        .r-head { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
        .r-net { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; font-family: var(--mono); }
        .r-net-twitter { background: rgba(255,255,255,.1); color: var(--text); }
        .r-net-linkedin { background: rgba(10,102,194,.15); color: var(--linkedin); }
        .r-time { font-size: 11px; color: var(--text-muted); font-family: var(--mono); }
        .r-status { font-size: 9px; padding: 2px 6px; border-radius: 100px; font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.05em; }
        .r-status-scheduled { background: rgba(251,191,36,.12); color: var(--warning); }
        .r-status-published { background: rgba(74,222,128,.12); color: var(--success); }
        .r-status-draft { background: var(--bg-card); color: var(--text-muted); }
        .r-status-idea { background: rgba(168,85,247,.12); color: #c084fc; }
        .r-text { font-size: 13px; color: var(--text); line-height: 1.5; }
      `}</style>
    </div>
  )
}

/* ============== HELPERS ============== */
// Build a Google Calendar "Add event" URL with prefilled data (no OAuth needed)
function addToGCalUrl(entry: CalendarEntry, durationMinutes = 30): string {
  const start = new Date(entry.scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const networkLabel = entry.network === 'twitter' ? 'Twitter / X' : 'LinkedIn'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `[${networkLabel}] ${entry.topic || entry.text.slice(0, 60)}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: entry.text,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/* ============== DETAIL MODAL ============== */
function DetailModal({
  entry,
  onClose,
  onDelete,
  onStatusChange,
}: {
  entry: CalendarEntry
  onClose: () => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: CalendarEntry['status']) => void
}) {
  const copy = () => {
    navigator.clipboard.writeText(entry.text)
  }
  const open = () => {
    const text = encodeURIComponent(entry.text)
    window.open(
      entry.network === 'linkedin'
        ? `https://www.linkedin.com/feed/?shareActive=true&text=${text}`
        : `https://twitter.com/intent/tweet?text=${text}`,
      '_blank'
    )
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <header className="m-head">
          <div className="mh-meta">
            <span className={`r-net r-net-${entry.network}`}>{entry.network === 'twitter' ? 'X' : 'in'}</span>
            <span className="mh-date">{new Date(entry.scheduledAt).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button onClick={onClose} className="m-close">×</button>
        </header>

        <div className="m-text">{entry.text}</div>

        {entry.imageUrl && <img src={entry.imageUrl} alt="" className="m-img" />}

        <div className="m-status">
          <label>Statut :</label>
          <select value={entry.status} onChange={e => onStatusChange(entry.id, e.target.value as any)}>
            <option value="idea">Idée</option>
            <option value="draft">Brouillon</option>
            <option value="scheduled">Programmé</option>
            <option value="published">Publié</option>
          </select>
        </div>

        <footer className="m-foot">
          <button onClick={copy} className="m-btn">Copier</button>
          <a href={addToGCalUrl(entry)} target="_blank" rel="noreferrer" className="m-btn">+ Google Calendar</a>
          <button onClick={open} className="m-btn primary">Poster sur {entry.network === 'twitter' ? 'X' : 'LinkedIn'}</button>
          <button onClick={() => onDelete(entry.id)} className="m-btn danger">Supprimer</button>
        </footer>
      </div>

      <style jsx>{`
        .modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fade-in var(--t-fast) var(--ease);
        }
        .modal-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-strong);
          border-radius: var(--r-xl);
          padding: 24px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          animation: fade-in-strong var(--t-med) var(--ease);
        }
        .m-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--border); }
        .mh-meta { display: flex; align-items: center; gap: 10px; }
        .r-net { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; font-family: var(--mono); }
        .r-net-twitter { background: rgba(255,255,255,.1); color: var(--text); }
        .r-net-linkedin { background: rgba(10,102,194,.15); color: var(--linkedin); }
        .mh-date { font-size: 12px; color: var(--text-secondary); }
        .m-close { background: transparent; border: none; color: var(--text-muted); font-size: 24px; line-height: 1; padding: 0 8px; }
        .m-close:hover { color: var(--text); }

        .m-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text);
          white-space: pre-wrap;
          padding: 14px;
          background: var(--bg);
          border-radius: var(--r-md);
        }
        .m-img { width: 100%; border-radius: var(--r-md); margin-top: 12px; }

        .m-status { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding: 10px; background: var(--bg-card); border-radius: var(--r-sm); }
        .m-status label { font-size: 11px; color: var(--text-muted); font-family: var(--mono); }
        .m-status select { background: var(--bg); border: 1px solid var(--border); color: var(--text); font-size: 12px; padding: 5px 8px; border-radius: var(--r-sm); }

        .m-foot { display: flex; gap: 6px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
        .m-btn { flex: 1; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary); font-size: 12px; padding: 9px; border-radius: var(--r-sm); font-weight: 500; text-align: center; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
        .m-btn:hover { color: var(--text); border-color: var(--border-strong); }
        .m-btn.primary { background: var(--accent); color: var(--accent-text-on); border-color: var(--accent); font-weight: 600; }
        .m-btn.danger { color: var(--danger); border-color: rgba(239,68,68,.3); }
        .m-btn.danger:hover { background: rgba(239,68,68,.08); }
      `}</style>
    </div>
  )
}
