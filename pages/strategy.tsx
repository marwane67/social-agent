import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { Brain, Project, Channel, Axis, Trend, getBrain, saveBrain, resetBrain, DEFAULT_BRAIN, hydrateFromCloud, pullFromCloud } from '../lib/brain'

type Tab = 'projects' | 'channels' | 'axes' | 'trends'
type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'table_missing'

export default function StrategyPage() {
  const [brain, setBrain] = useState<Brain>(DEFAULT_BRAIN)
  const [tab, setTab] = useState<Tab>('projects')
  const [dirty, setDirty] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState('')
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  useEffect(() => {
    // Hydrate from cloud on mount (if remote is newer than local)
    setSyncStatus('syncing')
    hydrateFromCloud().then(b => {
      setBrain(b)
      setSyncStatus('synced')
      setLastSynced(b.lastUpdated)
    }).catch(e => {
      setBrain(getBrain())
      if (e.message === 'table_missing') setSyncStatus('table_missing')
      else setSyncStatus('error')
      setSyncError(e.message || '')
    })
  }, [])

  const pullNow = async () => {
    setSyncStatus('syncing')
    const res = await pullFromCloud()
    if (res.error === 'table_missing') {
      setSyncStatus('table_missing')
    } else if (res.brain) {
      // Force overwrite local with remote
      setBrain(res.brain)
      setDirty(false)
      setSyncStatus('synced')
      setLastSynced(res.updatedAt)
      setSavedMsg('Brain chargé depuis le cloud.')
      setTimeout(() => setSavedMsg(''), 3000)
    } else {
      setSyncStatus('error')
      setSyncError(res.error || 'Aucune donnée cloud')
    }
  }

  const save = () => {
    saveBrain(brain)
    setDirty(false)
    setSyncStatus('syncing')
    setSavedMsg('Sauvegardé en local · sync cloud en cours…')
    // saveBrain triggers syncToCloud in background — we poll briefly
    setTimeout(async () => {
      const res = await pullFromCloud()
      if (res.brain && res.updatedAt) {
        setSyncStatus('synced')
        setLastSynced(res.updatedAt)
        setSavedMsg('Sauvegardé et synchronisé sur Supabase. Pulse l\'utilise déjà.')
      } else if (res.error === 'table_missing') {
        setSyncStatus('table_missing')
        setSavedMsg('Sauvegardé en local. Table Supabase manquante — voir instructions en haut.')
      } else {
        setSyncStatus('error')
        setSavedMsg('Sauvegardé en local. Sync cloud échouée : ' + (res.error || ''))
      }
      setTimeout(() => setSavedMsg(''), 4000)
    }, 700)
  }

  const reset = () => {
    if (!confirm('Remettre la stratégie par défaut (pré-remplie Marwane) ? Tes modifs seront perdues.')) return
    const def = resetBrain()
    setBrain(def)
    setDirty(false)
    setSavedMsg('Réinitialisé aux valeurs par défaut')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  /* === Projects mutations === */
  const updateProject = (idx: number, patch: Partial<Project>) => {
    const projects = [...brain.projects]
    projects[idx] = { ...projects[idx], ...patch }
    setBrain({ ...brain, projects }); setDirty(true)
  }
  const addProject = () => {
    setBrain({
      ...brain,
      projects: [...brain.projects, {
        id: 'new_project', name: 'Nouveau projet', status: '', pitch: '', audience: '',
        key_messages: [], tone: '', cta: ''
      }],
    }); setDirty(true)
  }
  const removeProject = (idx: number) => {
    const projects = brain.projects.filter((_, i) => i !== idx)
    setBrain({ ...brain, projects }); setDirty(true)
  }

  /* === Channels mutations === */
  const updateChannel = (idx: number, patch: Partial<Channel>) => {
    const channels = [...brain.channels]
    channels[idx] = { ...channels[idx], ...patch }
    setBrain({ ...brain, channels }); setDirty(true)
  }
  const toggleProjectOnChannel = (chIdx: number, projectId: string) => {
    const channel = brain.channels[chIdx]
    const projects = channel.projects.includes(projectId)
      ? channel.projects.filter(p => p !== projectId)
      : [...channel.projects, projectId]
    updateChannel(chIdx, { projects })
  }

  /* === Axes mutations === */
  const updateAxis = (idx: number, patch: Partial<Axis>) => {
    const axes = [...brain.axes]
    axes[idx] = { ...axes[idx], ...patch }
    setBrain({ ...brain, axes }); setDirty(true)
  }
  const toggleProjectOnAxis = (axIdx: number, projectId: string) => {
    const a = brain.axes[axIdx]
    const projects = a.projects.includes(projectId) ? a.projects.filter(p => p !== projectId) : [...a.projects, projectId]
    updateAxis(axIdx, { projects })
  }
  const toggleChannelOnAxis = (axIdx: number, channelId: string) => {
    const a = brain.axes[axIdx]
    const channels = a.channels.includes(channelId) ? a.channels.filter(c => c !== channelId) : [...a.channels, channelId]
    updateAxis(axIdx, { channels })
  }
  const addAxis = () => {
    setBrain({
      ...brain,
      axes: [...brain.axes, {
        id: 'new_axis', name: 'Nouvel axe', description: '', projects: [], channels: [], frequency: ''
      }],
    }); setDirty(true)
  }
  const removeAxis = (idx: number) => {
    const axes = brain.axes.filter((_, i) => i !== idx)
    setBrain({ ...brain, axes }); setDirty(true)
  }

  return (
    <>
      <Head><title>Stratégie — Social Agent</title></Head>
      <Layout title="Stratégie" subtitle="Le brain de Pulse : projets, channels, axes de contenu">
        {/* Table missing warning */}
        {syncStatus === 'table_missing' && (
          <div className="table-warn">
            <strong>Table Supabase manquante.</strong> Exécute ce SQL dans ton Supabase (SQL Editor) pour activer le cloud sync :
            <pre className="sql">{`create table if not exists app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);`}</pre>
            Puis recharge cette page. En attendant, le brain reste stocké en local (localStorage).
          </div>
        )}

        {/* Save bar */}
        <div className="save-bar">
          <div className="save-status">
            {dirty ? (
              <span className="dirty">Modifications non sauvegardées</span>
            ) : (
              <span className="clean">Dernière maj : {new Date(brain.lastUpdated).toLocaleString('fr-FR')}</span>
            )}
            <span className={`sync-pill sync-${syncStatus}`}>
              {syncStatus === 'synced' && 'Cloud ✓'}
              {syncStatus === 'syncing' && 'Cloud…'}
              {syncStatus === 'error' && 'Cloud × ' + (syncError.slice(0, 40))}
              {syncStatus === 'table_missing' && 'Cloud (table manquante)'}
              {syncStatus === 'idle' && 'Cloud —'}
            </span>
          </div>
          <div className="save-actions">
            <button onClick={pullNow} className="ghost-btn" title="Récupérer la dernière version du cloud">Pull</button>
            <button onClick={reset} className="ghost-btn">Reset par défaut</button>
            <button onClick={save} disabled={!dirty} className="save-btn">Sauvegarder</button>
          </div>
        </div>

        {savedMsg && <div className="msg">{savedMsg}</div>}

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === 'projects' ? 'on' : ''}`} onClick={() => setTab('projects')}>
            Projets <span className="count">{brain.projects.length}</span>
          </button>
          <button className={`tab ${tab === 'channels' ? 'on' : ''}`} onClick={() => setTab('channels')}>
            Channels <span className="count">{brain.channels.length}</span>
          </button>
          <button className={`tab ${tab === 'axes' ? 'on' : ''}`} onClick={() => setTab('axes')}>
            Axes <span className="count">{brain.axes.length}</span>
          </button>
          <button className={`tab ${tab === 'trends' ? 'on' : ''}`} onClick={() => setTab('trends')}>
            Tendances <span className="count">{brain.trends?.length || 0}</span>
          </button>
        </div>

        {/* PROJECTS */}
        {tab === 'projects' && (
          <div className="list">
            {brain.projects.map((p, i) => (
              <div key={i} className="card">
                <div className="card-head">
                  <input
                    className="title-input"
                    value={p.name}
                    onChange={e => updateProject(i, { name: e.target.value })}
                  />
                  <input
                    className="id-input"
                    value={p.id}
                    onChange={e => updateProject(i, { id: e.target.value })}
                    placeholder="id"
                  />
                  <button onClick={() => removeProject(i)} className="del-btn">×</button>
                </div>
                <Field label="Statut" value={p.status} onChange={v => updateProject(i, { status: v })} />
                <Field label="Pitch" value={p.pitch} onChange={v => updateProject(i, { pitch: v })} multiline />
                <Field label="Audience" value={p.audience} onChange={v => updateProject(i, { audience: v })} />
                <Field label="Ton" value={p.tone} onChange={v => updateProject(i, { tone: v })} />
                <Field label="CTA" value={p.cta || ''} onChange={v => updateProject(i, { cta: v })} />
                <ListField
                  label="Key messages (1 par ligne)"
                  items={p.key_messages}
                  onChange={items => updateProject(i, { key_messages: items })}
                />
              </div>
            ))}
            <button onClick={addProject} className="add-btn">+ Ajouter un projet</button>
          </div>
        )}

        {/* CHANNELS */}
        {tab === 'channels' && (
          <div className="list">
            {brain.channels.map((c, i) => (
              <div key={i} className="card">
                <div className="card-head">
                  <span className={`service-badge service-${c.service}`}>{c.service === 'twitter' ? 'X' : 'in'}</span>
                  <input
                    className="title-input"
                    value={c.name}
                    onChange={e => updateChannel(i, { name: e.target.value })}
                  />
                  <input
                    className="id-input"
                    value={c.id}
                    readOnly
                    title="Buffer channel ID (non modifiable)"
                  />
                </div>
                <Field label="Purpose" value={c.purpose} onChange={v => updateChannel(i, { purpose: v })} multiline />
                <Field label="Voice (style d'écriture)" value={c.voice} onChange={v => updateChannel(i, { voice: v })} multiline />
                <div className="field">
                  <label>Projets autorisés sur ce channel</label>
                  <div className="chips">
                    {brain.projects.map(p => (
                      <button
                        key={p.id}
                        className={`chip ${c.projects.includes(p.id) ? 'chip-on' : ''}`}
                        onClick={() => toggleProjectOnChannel(i, p.id)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="hint">Les channels sont récupérés automatiquement depuis Buffer. Si tu en connectes de nouveaux, ils apparaîtront ici au prochain refresh.</div>
          </div>
        )}

        {/* AXES */}
        {tab === 'axes' && (
          <div className="list">
            {brain.axes.map((a, i) => (
              <div key={i} className="card">
                <div className="card-head">
                  <input
                    className="title-input"
                    value={a.name}
                    onChange={e => updateAxis(i, { name: e.target.value })}
                  />
                  <input
                    className="id-input"
                    value={a.id}
                    onChange={e => updateAxis(i, { id: e.target.value })}
                  />
                  <button onClick={() => removeAxis(i)} className="del-btn">×</button>
                </div>
                <Field label="Description / angle" value={a.description} onChange={v => updateAxis(i, { description: v })} multiline />
                <Field label="Fréquence" value={a.frequency} onChange={v => updateAxis(i, { frequency: v })} placeholder="ex: 3x/semaine" />
                <div className="field">
                  <label>Projets inclus</label>
                  <div className="chips">
                    {brain.projects.map(p => (
                      <button key={p.id} className={`chip ${a.projects.includes(p.id) ? 'chip-on' : ''}`} onClick={() => toggleProjectOnAxis(i, p.id)}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Channels ciblés</label>
                  <div className="chips">
                    {brain.channels.map(c => (
                      <button key={c.id} className={`chip ${a.channels.includes(c.id) ? 'chip-on' : ''}`} onClick={() => toggleChannelOnAxis(i, c.id)}>
                        <span className={`service-mini service-${c.service}`}>{c.service === 'twitter' ? 'X' : 'in'}</span>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addAxis} className="add-btn">+ Ajouter un axe</button>
          </div>
        )}

        {/* TRENDS */}
        {tab === 'trends' && (
          <div className="list">
            <div className="trends-intro">
              Ajoute ici les tendances tech ou business du moment (ex: "Claude Design", "GPT-5.5", "lancement Vercel AI 3.0"). Pulse les intègre dans au moins 1 post par jour par compte, via l'angle <strong>insight_actualite</strong>.
            </div>
            {(brain.trends || []).map((t, i) => (
              <div key={i} className="card">
                <div className="card-head">
                  <input
                    className="title-input"
                    value={t.title}
                    placeholder="Titre de la tendance"
                    onChange={e => {
                      const trends = [...(brain.trends || [])]
                      trends[i] = { ...trends[i], title: e.target.value }
                      setBrain({ ...brain, trends })
                      setDirty(true)
                    }}
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                    ajouté {new Date(t.addedAt).toLocaleDateString('fr-FR')}
                  </span>
                  <button
                    onClick={() => {
                      setBrain({ ...brain, trends: (brain.trends || []).filter((_, j) => j !== i) })
                      setDirty(true)
                    }}
                    className="del-btn"
                  >×</button>
                </div>
                <textarea
                  value={t.description}
                  placeholder="Pourquoi c'est pertinent, comment l'utiliser dans un post, angle..."
                  onChange={e => {
                    const trends = [...(brain.trends || [])]
                    trends[i] = { ...trends[i], description: e.target.value }
                    setBrain({ ...brain, trends })
                    setDirty(true)
                  }}
                  rows={2}
                  style={{
                    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 13, padding: '8px 10px',
                    fontFamily: 'var(--font)', lineHeight: 1.5, resize: 'vertical',
                  }}
                />
              </div>
            ))}
            <button
              onClick={() => {
                setBrain({
                  ...brain,
                  trends: [...(brain.trends || []), {
                    id: 'trend_' + Date.now(),
                    title: 'Nouvelle tendance',
                    description: '',
                    addedAt: new Date().toISOString(),
                  }],
                })
                setDirty(true)
              }}
              className="add-btn"
            >+ Ajouter une tendance</button>
          </div>
        )}

        <style jsx>{`
          .trends-intro {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-left: 3px solid var(--net);
            border-radius: var(--r-md);
            padding: 12px 14px;
            font-size: 12px;
            color: var(--text-secondary);
            line-height: 1.5;
            margin-bottom: 10px;
          }
          .trends-intro strong { color: var(--text); font-family: var(--mono); }
          .save-bar {
            position: sticky;
            top: 0;
            background: var(--bg);
            padding: 12px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
            z-index: 20;
            border-bottom: 1px solid var(--border);
          }
          .save-status { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
          .save-status .dirty { color: var(--warning); font-size: 12px; font-family: var(--mono); }
          .save-status .clean { color: var(--text-muted); font-size: 11px; font-family: var(--mono); }
          .sync-pill { font-size: 10px; padding: 2px 8px; border-radius: 100px; font-family: var(--mono); font-weight: 600; }
          .sync-synced { background: rgba(74,222,128,0.1); color: var(--success); border: 1px solid rgba(74,222,128,0.3); }
          .sync-syncing { background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border); animation: pulse-soft 1.5s ease-in-out infinite; }
          .sync-error, .sync-table_missing { background: rgba(239,68,68,0.08); color: var(--danger); border: 1px solid rgba(239,68,68,0.3); }
          .sync-idle { background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border); }

          .table-warn {
            background: rgba(251,191,36,0.08);
            border: 1px solid rgba(251,191,36,0.3);
            border-left: 3px solid var(--warning);
            border-radius: var(--r-md);
            padding: 14px 16px;
            font-size: 12px;
            color: var(--text-secondary);
            line-height: 1.6;
            margin-bottom: 14px;
          }
          .table-warn strong { color: var(--warning); }
          .sql {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: var(--r-sm);
            padding: 10px;
            font-family: var(--mono);
            font-size: 11px;
            color: var(--text);
            overflow-x: auto;
            margin: 10px 0;
            line-height: 1.5;
          }
          .save-actions { display: flex; gap: 6px; }
          .ghost-btn { background: transparent; border: 1px solid var(--border); color: var(--text-muted); font-size: 11px; padding: 6px 12px; border-radius: var(--r-sm); font-family: var(--mono); }
          .ghost-btn:hover { color: var(--danger); border-color: var(--danger); }
          .save-btn { background: var(--accent); color: var(--accent-text-on); border: none; font-size: 12px; font-weight: 600; padding: 7px 16px; border-radius: var(--r-sm); }
          .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

          .msg { font-size: 12px; color: var(--success); padding: 10px 14px; background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.3); border-radius: var(--r-sm); margin-bottom: 12px; }

          .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--border); }
          .tab { background: transparent; border: none; border-bottom: 2px solid transparent; padding: 10px 14px; font-size: 13px; color: var(--text-muted); font-weight: 500; margin-bottom: -1px; display: inline-flex; align-items: center; gap: 8px; }
          .tab:hover { color: var(--text-secondary); }
          .tab.on { color: var(--text); border-bottom-color: var(--text); font-weight: 600; }
          .count { font-family: var(--mono); font-size: 10px; color: var(--text-faint); background: var(--bg-card); padding: 1px 6px; border-radius: 100px; }

          .list { display: flex; flex-direction: column; gap: 10px; }
          .card { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 16px; display: flex; flex-direction: column; gap: 10px; }
          .card-head { display: flex; align-items: center; gap: 8px; }
          .title-input { flex: 1; background: transparent; border: none; color: var(--text); font-size: 16px; font-weight: 700; padding: 4px; border-bottom: 1px solid transparent; }
          .title-input:focus { border-bottom-color: var(--border-strong); }
          .id-input { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-sm); color: var(--text-muted); font-family: var(--mono); font-size: 11px; padding: 4px 8px; width: 140px; }
          .del-btn { background: transparent; border: none; color: var(--text-faint); font-size: 22px; padding: 0 8px; cursor: pointer; }
          .del-btn:hover { color: var(--danger); }

          .service-badge { font-size: 11px; font-weight: 700; font-family: var(--mono); padding: 4px 10px; border-radius: 4px; }
          .service-twitter { background: rgba(255,255,255,0.1); color: var(--text); }
          .service-linkedin { background: rgba(10,102,194,0.18); color: var(--linkedin); }
          .service-mini { font-size: 9px; padding: 1px 5px; border-radius: 3px; margin-right: 5px; font-family: var(--mono); font-weight: 700; }

          .field { display: flex; flex-direction: column; gap: 4px; }
          .field label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--mono); }

          .chips { display: flex; flex-wrap: wrap; gap: 4px; }
          .chip { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-muted); font-size: 11px; padding: 4px 10px; border-radius: 100px; display: inline-flex; align-items: center; }
          .chip-on { background: var(--accent-soft); border-color: var(--accent-border); color: var(--text); }

          .add-btn { background: var(--bg-card); border: 1px dashed var(--border-strong); color: var(--text-muted); padding: 12px; border-radius: var(--r-md); font-size: 12px; font-weight: 500; }
          .add-btn:hover { color: var(--text); border-color: var(--text-faint); }
          .hint { font-size: 11px; color: var(--text-muted); padding: 10px 14px; background: var(--bg-card); border-radius: var(--r-sm); border-left: 2px solid var(--accent); }
        `}</style>
      </Layout>
    </>
  )
}

function Field({ label, value, onChange, multiline, placeholder }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--mono)' }}>{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={2}
          placeholder={placeholder}
          style={{
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
            color: 'var(--text)', fontSize: 13, padding: '8px 10px', fontFamily: 'var(--font)',
            lineHeight: 1.5, resize: 'vertical',
          }}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
            color: 'var(--text)', fontSize: 13, padding: '8px 10px', fontFamily: 'var(--font)',
          }}
        />
      )}
    </div>
  )
}

function ListField({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--mono)' }}>{label}</label>
      <textarea
        value={items.join('\n')}
        onChange={e => onChange(e.target.value.split('\n').filter(Boolean))}
        rows={Math.max(items.length + 1, 3)}
        style={{
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
          color: 'var(--text)', fontSize: 12, padding: '8px 10px', fontFamily: 'var(--font)',
          lineHeight: 1.5, resize: 'vertical',
        }}
      />
    </div>
  )
}
