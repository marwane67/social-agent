import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

const PROJECTS = [
  { id: '', label: 'Tous projets' },
  { id: 'pulsa', label: 'Pulsa' },
  { id: 'axora', label: 'Axora' },
  { id: 'personal', label: 'Personnel' },
]

type Account = {
  id: string
  url: string
  kind: 'competitor' | 'influencer' | 'own_post' | 'company'
  label: string
  notes: string
  active: boolean
  last_checked_at: string | null
  created_at: string
}

type Signal = {
  id: string
  engager_name: string
  engager_headline: string
  engager_company: string
  engager_url: string | null
  source_url: string | null
  source_account: string
  source_excerpt: string
  signal_type: 'like' | 'comment' | 'share' | 'reaction'
  comment_text: string
  icp_score: number
  icp_reason: string
  status: 'new' | 'qualified' | 'contacted' | 'replied' | 'dismissed'
  detected_at: string
}

const KIND_LABEL: Record<Account['kind'], string> = {
  competitor: 'Concurrent',
  influencer: 'Influenceur',
  own_post: 'Mon post',
  company: 'Entreprise',
}

const STATUS_LABEL: Record<Signal['status'], string> = {
  new: 'Nouveau',
  qualified: 'Qualifié',
  contacted: 'Contacté',
  replied: 'A répondu',
  dismissed: 'Écarté',
}

const SIGNAL_ICON: Record<Signal['signal_type'], string> = {
  like: '♡',
  comment: '💬',
  share: '↗',
  reaction: '✨',
}

export default function SignalsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'signals' | 'accounts' | 'import'>('signals')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterProject, setFilterProject] = useState<string>('')
  const [minScore, setMinScore] = useState(0)
  const [loading, setLoading] = useState(false)

  // Lire ?tab= et ?project= en query string (depuis /outbound-pulsa)
  useEffect(() => {
    if (!router.isReady) return
    const t = router.query.tab as string
    if (t === 'accounts' || t === 'import' || t === 'signals') setTab(t)
    const p = router.query.project as string
    if (p) setFilterProject(p)
  }, [router.isReady, router.query.tab, router.query.project])

  // Form: nouveau tracked account
  const [newUrl, setNewUrl] = useState('')
  const [newKind, setNewKind] = useState<Account['kind']>('competitor')
  const [newLabel, setNewLabel] = useState('')

  // Form: import
  const [importMode, setImportMode] = useState<'paste' | 'phantombuster'>('paste')
  const [rawPaste, setRawPaste] = useState('')
  const [phantomContainer, setPhantomContainer] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceAccount, setSourceAccount] = useState('')
  const [sourceExcerpt, setSourceExcerpt] = useState('')
  const [importSignalType, setImportSignalType] = useState<'like' | 'comment' | 'share'>('like')
  const [importTrackedId, setImportTrackedId] = useState('')
  const [icpOverride, setIcpOverride] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string>('')

  useEffect(() => { load() }, [filterStatus, filterProject, minScore]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    try {
      const accParams = filterProject ? `?project=${filterProject}` : ''
      const sigParams = new URLSearchParams({
        status: filterStatus,
        project: filterProject,
        minScore: String(minScore),
      })
      const [a, s] = await Promise.all([
        fetch(`/api/linkedin/tracked-accounts${accParams}`).then(r => r.json()),
        fetch(`/api/linkedin/signals?${sigParams}`).then(r => r.json()),
      ])
      setAccounts(a.accounts || [])
      setSignals(s.signals || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function addAccount() {
    if (!newUrl.trim()) return
    await fetch('/api/linkedin/tracked-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newUrl, kind: newKind, label: newLabel, project: filterProject || null }),
    })
    setNewUrl(''); setNewLabel('')
    load()
  }

  async function deleteAccount(id: string) {
    if (!confirm('Supprimer ce compte suivi ?')) return
    await fetch(`/api/linkedin/tracked-accounts?id=${id}`, { method: 'DELETE' })
    load()
  }

  async function toggleAccount(a: Account) {
    await fetch('/api/linkedin/tracked-accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, active: !a.active }),
    })
    load()
  }

  async function updateStatus(id: string, status: Signal['status']) {
    await fetch('/api/linkedin/signals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  async function deleteSignal(id: string) {
    if (!confirm('Supprimer ce signal ?')) return
    await fetch(`/api/linkedin/signals?id=${id}`, { method: 'DELETE' })
    load()
  }

  async function runImport() {
    if (importMode === 'paste' && !rawPaste.trim()) { setImportResult('Colle des engagers d\'abord'); return }
    if (importMode === 'phantombuster' && !phantomContainer.trim()) { setImportResult('Container ID requis'); return }
    setImporting(true); setImportResult('')
    try {
      const res = await fetch('/api/linkedin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: importMode,
          raw: rawPaste,
          containerId: phantomContainer,
          source_url: sourceUrl,
          source_account: sourceAccount,
          source_excerpt: sourceExcerpt,
          signal_type: importSignalType,
          tracked_account_id: importTrackedId || undefined,
          icp: icpOverride || undefined,
          project: filterProject || undefined,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setImportResult(`Erreur : ${data.error}`)
      } else {
        setImportResult(`${data.imported} signaux importés${data.note ? ` (${data.note})` : ''}`)
        setRawPaste(''); setPhantomContainer('')
        setTab('signals')
        load()
      }
    } catch (e: any) {
      setImportResult(`Erreur : ${e?.message || 'unknown'}`)
    } finally {
      setImporting(false)
    }
  }

  function generateMessage(s: Signal) {
    // Stocker le signal dans sessionStorage pour pré-remplir /outreach
    sessionStorage.setItem('signal-prefill', JSON.stringify({
      name: s.engager_name,
      title: s.engager_headline,
      company: s.engager_company,
      context: s.icp_reason,
      linkedinUrl: s.engager_url || '',
      signal: {
        source_url: s.source_url,
        source_account: s.source_account,
        source_excerpt: s.source_excerpt,
        signal_type: s.signal_type,
        comment_text: s.comment_text,
      },
    }))
    // Marquer comme contacté
    updateStatus(s.id, 'contacted')
    router.push('/outreach')
  }

  const stats = {
    total: signals.length,
    qualified: signals.filter(s => s.icp_score >= 60).length,
    new: signals.filter(s => s.status === 'new').length,
    contacted: signals.filter(s => s.status === 'contacted').length,
  }

  return (
    <>
      <Head><title>Signaux LinkedIn — Marwane</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout title="Signaux LinkedIn" subtitle="Détecte qui engage avec tes concurrents et tes posts. Outreach signal-based.">
        <div className="page">
          {/* Tabs */}
          <div className="tabs">
            <button className={`tab ${tab === 'signals' ? 'tab-on' : ''}`} onClick={() => setTab('signals')}>
              Signaux <span className="tab-count">{stats.total}</span>
            </button>
            <button className={`tab ${tab === 'accounts' ? 'tab-on' : ''}`} onClick={() => setTab('accounts')}>
              Comptes suivis <span className="tab-count">{accounts.length}</span>
            </button>
            <button className={`tab ${tab === 'import' ? 'tab-on' : ''}`} onClick={() => setTab('import')}>
              Importer
            </button>
          </div>

          {/* === TAB SIGNAUX === */}
          {tab === 'signals' && (
            <>
              <div className="stats">
                <div className="stat"><span className="stat-num">{stats.qualified}</span><span className="stat-label">Qualifiés (≥60)</span></div>
                <div className="stat"><span className="stat-num">{stats.new}</span><span className="stat-label">Nouveaux</span></div>
                <div className="stat"><span className="stat-num">{stats.contacted}</span><span className="stat-label">Contactés</span></div>
              </div>

              <div className="filters">
                <select className="select" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                  {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Tous statuts</option>
                  <option value="new">Nouveau</option>
                  <option value="qualified">Qualifié</option>
                  <option value="contacted">Contacté</option>
                  <option value="replied">A répondu</option>
                  <option value="dismissed">Écarté</option>
                </select>
                <select className="select" value={minScore} onChange={e => setMinScore(parseInt(e.target.value))}>
                  <option value={0}>Score ≥ 0</option>
                  <option value={40}>Score ≥ 40</option>
                  <option value={60}>Score ≥ 60</option>
                  <option value={80}>Score ≥ 80</option>
                </select>
                <button className="btn-ghost" onClick={load}>Actualiser</button>
              </div>

              {loading && <div className="empty">Chargement…</div>}
              {!loading && signals.length === 0 && (
                <div className="empty">
                  Aucun signal pour l'instant.<br />
                  <button className="btn-primary" onClick={() => setTab('import')}>Importer des engagers</button>
                </div>
              )}

              <div className="signal-list">
                {signals.map(s => (
                  <div key={s.id} className={`signal-card score-${scoreTier(s.icp_score)}`}>
                    <div className="signal-head">
                      <div className="signal-who">
                        <div className="avatar">{(s.engager_name || '?').charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="signal-name">{s.engager_name || 'Inconnu'}</div>
                          <div className="signal-title">{s.engager_headline}</div>
                          {s.engager_company && <div className="signal-company">{s.engager_company}</div>}
                        </div>
                      </div>
                      <div className="signal-score">
                        <div className="score-num">{s.icp_score}</div>
                        <div className="score-label">ICP</div>
                      </div>
                    </div>

                    <div className="signal-source">
                      <span className="signal-icon">{SIGNAL_ICON[s.signal_type]}</span>
                      <span className="signal-action">
                        a {s.signal_type === 'comment' ? 'commenté' : s.signal_type === 'share' ? 'partagé' : 'liké'}
                        {s.source_account && <> un post de <strong>{s.source_account}</strong></>}
                      </span>
                    </div>

                    {s.source_excerpt && (
                      <div className="signal-excerpt">"{s.source_excerpt.slice(0, 200)}{s.source_excerpt.length > 200 ? '…' : ''}"</div>
                    )}
                    {s.comment_text && (
                      <div className="signal-comment"><span className="comment-tag">SON COMMENTAIRE</span>{s.comment_text}</div>
                    )}
                    {s.icp_reason && (
                      <div className="signal-reason">{s.icp_reason}</div>
                    )}

                    <div className="signal-actions">
                      <span className={`status-pill status-${s.status}`}>{STATUS_LABEL[s.status]}</span>
                      <div className="action-group">
                        <button className="btn-action btn-primary" onClick={() => generateMessage(s)}>
                          Générer DM
                        </button>
                        {s.engager_url && (
                          <a className="btn-action" href={ensureHttps(s.engager_url)} target="_blank" rel="noreferrer">
                            Profil
                          </a>
                        )}
                        {s.source_url && (
                          <a className="btn-action" href={ensureHttps(s.source_url)} target="_blank" rel="noreferrer">
                            Post
                          </a>
                        )}
                        <select className="select-sm" value={s.status} onChange={e => updateStatus(s.id, e.target.value as Signal['status'])}>
                          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <button className="btn-icon" onClick={() => deleteSignal(s.id)} title="Supprimer">×</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* === TAB COMPTES === */}
          {tab === 'accounts' && (
            <>
              <div className="add-form">
                <input className="input" placeholder="URL profil ou post LinkedIn" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                <input className="input" placeholder="Label (ex : Hubspot CMO)" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
                <select className="select" value={newKind} onChange={e => setNewKind(e.target.value as Account['kind'])}>
                  <option value="competitor">Concurrent</option>
                  <option value="influencer">Influenceur</option>
                  <option value="own_post">Mon post</option>
                  <option value="company">Entreprise</option>
                </select>
                <button className="btn-primary" onClick={addAccount}>Ajouter</button>
              </div>

              {accounts.length === 0 && (
                <div className="empty">
                  Aucun compte suivi.<br />
                  <span className="empty-hint">Ajoute des concurrents, influenceurs, ou tes propres posts viraux pour récolter des engagers qualifiés.</span>
                </div>
              )}

              <div className="account-list">
                {accounts.map(a => (
                  <div key={a.id} className={`account-card ${!a.active ? 'inactive' : ''}`}>
                    <div className="account-info">
                      <div className="account-row">
                        <span className={`kind-pill kind-${a.kind}`}>{KIND_LABEL[a.kind]}</span>
                        <span className="account-label">{a.label || a.url}</span>
                      </div>
                      <a className="account-url" href={ensureHttps(a.url)} target="_blank" rel="noreferrer">{a.url}</a>
                      {a.last_checked_at && <div className="account-meta">Dernier check : {new Date(a.last_checked_at).toLocaleString('fr-FR')}</div>}
                    </div>
                    <div className="account-actions">
                      <button className="btn-icon" onClick={() => toggleAccount(a)} title={a.active ? 'Désactiver' : 'Activer'}>{a.active ? '⏸' : '▶'}</button>
                      <button className="btn-icon" onClick={() => deleteAccount(a.id)} title="Supprimer">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* === TAB IMPORT === */}
          {tab === 'import' && (
            <div className="import-form">
              <div className="import-modes">
                <button className={`mode-btn ${importMode === 'paste' ? 'mode-on' : ''}`} onClick={() => setImportMode('paste')}>
                  <div className="mode-name">Copier/Coller</div>
                  <div className="mode-desc">Gratuit. Colle le texte des engagers.</div>
                </button>
                <button className={`mode-btn ${importMode === 'phantombuster' ? 'mode-on' : ''}`} onClick={() => setImportMode('phantombuster')}>
                  <div className="mode-name">PhantomBuster</div>
                  <div className="mode-desc">Auto. Container ID d'un agent terminé.</div>
                </button>
              </div>

              <div className="form-section">
                <label className="lbl">Compte suivi (optionnel)</label>
                <select className="select" value={importTrackedId} onChange={e => setImportTrackedId(e.target.value)}>
                  <option value="">— Aucun —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{KIND_LABEL[a.kind]} : {a.label || a.url}</option>)}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-section">
                  <label className="lbl">URL du post engagé</label>
                  <input className="input" placeholder="https://www.linkedin.com/posts/..." value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} />
                </div>
                <div className="form-section">
                  <label className="lbl">Compte source</label>
                  <input className="input" placeholder="@hubspot" value={sourceAccount} onChange={e => setSourceAccount(e.target.value)} />
                </div>
              </div>

              <div className="form-section">
                <label className="lbl">Extrait du post (contexte pour les DMs)</label>
                <textarea className="input" rows={2} placeholder="Premier paragraphe du post engagé..." value={sourceExcerpt} onChange={e => setSourceExcerpt(e.target.value)} />
              </div>

              <div className="form-section">
                <label className="lbl">Type d'engagement</label>
                <div className="type-row">
                  {(['like', 'comment', 'share'] as const).map(t => (
                    <button key={t} className={`pill ${importSignalType === t ? 'pill-on' : ''}`} onClick={() => setImportSignalType(t)}>
                      {SIGNAL_ICON[t]} {t === 'like' ? 'Like' : t === 'comment' ? 'Commentaire' : 'Partage'}
                    </button>
                  ))}
                </div>
              </div>

              {importMode === 'paste' ? (
                <div className="form-section">
                  <label className="lbl">Coller les engagers</label>
                  <textarea
                    className="input mono"
                    rows={10}
                    placeholder={'Colle le texte de la liste des likers/commenters LinkedIn, ou un export JSON/CSV.\n\nExemple :\nMarie Dubois\nFounder @ Acme · 1ère\nlinkedin.com/in/marie-dubois\n\nPaul Martin\nCMO @ Stripe · 2ème\nlinkedin.com/in/paul-martin'}
                    value={rawPaste}
                    onChange={e => setRawPaste(e.target.value)}
                  />
                  <div className="hint">Claude extrait + score chaque engager contre ton ICP.</div>
                </div>
              ) : (
                <div className="form-section">
                  <label className="lbl">PhantomBuster Container ID</label>
                  <input className="input mono" placeholder="1234567890123456" value={phantomContainer} onChange={e => setPhantomContainer(e.target.value)} />
                  <div className="hint">ID de l'exécution terminée (LinkedIn Post Likers Export, Post Commenters Scraper, etc.). Nécessite PHANTOMBUSTER_API_KEY dans .env.</div>
                </div>
              )}

              <div className="form-section">
                <label className="lbl">Override ICP (optionnel)</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Laisse vide pour utiliser l'ICP par défaut (Axora + Pulsa). Override si tu cherches un profil spécifique pour cette campagne."
                  value={icpOverride}
                  onChange={e => setIcpOverride(e.target.value)}
                />
              </div>

              <button className="btn-primary big" onClick={runImport} disabled={importing}>
                {importing ? 'Import en cours…' : 'Importer + scorer'}
              </button>

              {importResult && <div className={`import-result ${importResult.startsWith('Erreur') ? 'err' : 'ok'}`}>{importResult}</div>}
            </div>
          )}
        </div>

        <style jsx>{`
          .page { display:flex; flex-direction:column; gap:18px; }
          .tabs { display:flex; gap:4px; border-bottom:1px solid var(--border); margin-bottom:4px; }
          .tab { background:none; border:none; padding:10px 16px; font-size:13px; color:var(--text-muted); cursor:pointer; font-weight:500; border-bottom:2px solid transparent; display:inline-flex; align-items:center; gap:6px; }
          .tab:hover { color:var(--text-secondary); }
          .tab-on { color:var(--text); border-bottom-color:var(--li); }
          .tab-count { font-size:10px; background:var(--bg-card); padding:2px 6px; border-radius:8px; font-family:var(--mono); color:var(--text-muted); }

          .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
          .stat { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:14px 16px; }
          .stat-num { font-size:24px; font-weight:700; color:var(--text); display:block; line-height:1.1; }
          .stat-label { font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; font-family:var(--mono); }

          .filters { display:flex; gap:6px; align-items:center; }
          .select, .select-sm { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); padding:8px 10px; font-size:12px; outline:none; cursor:pointer; }
          .select-sm { padding:5px 8px; font-size:11px; }
          .select:focus, .select-sm:focus { border-color:var(--li); }
          .btn-ghost { background:none; border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); padding:8px 12px; font-size:12px; cursor:pointer; }
          .btn-ghost:hover { border-color:var(--border-strong); color:var(--text); }

          .empty { text-align:center; padding:40px 20px; color:var(--text-muted); font-size:13px; background:var(--bg-card); border:1px dashed var(--border); border-radius:var(--radius); }
          .empty-hint { display:block; font-size:11px; margin-top:8px; max-width:380px; margin-left:auto; margin-right:auto; line-height:1.5; }

          /* Signal cards */
          .signal-list { display:flex; flex-direction:column; gap:10px; }
          .signal-card { background:var(--bg-card); border:1px solid var(--border); border-left:3px solid var(--border); border-radius:var(--radius); padding:14px 16px; transition:border-color .15s; }
          .signal-card.score-hot { border-left-color:#22c55e; }
          .signal-card.score-warm { border-left-color:#f59e0b; }
          .signal-card.score-cold { border-left-color:var(--border-strong); }
          .signal-card:hover { border-color:var(--border-strong); }
          .signal-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
          .signal-who { display:flex; gap:10px; align-items:flex-start; flex:1; min-width:0; }
          .avatar { width:36px; height:36px; border-radius:50%; background:var(--li); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0; }
          .signal-name { font-size:14px; font-weight:600; color:var(--text); }
          .signal-title { font-size:12px; color:var(--text-secondary); margin-top:1px; }
          .signal-company { font-size:11px; color:var(--li); font-weight:500; margin-top:1px; }
          .signal-score { text-align:center; flex-shrink:0; padding:4px 12px; background:var(--bg-surface); border-radius:8px; }
          .score-num { font-size:20px; font-weight:700; font-family:var(--mono); color:var(--text); line-height:1; }
          .score-label { font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.08em; margin-top:2px; }

          .signal-source { font-size:12px; color:var(--text-secondary); margin-top:10px; display:flex; align-items:center; gap:6px; }
          .signal-icon { font-size:14px; color:var(--li); }
          .signal-action strong { color:var(--text); font-weight:600; }

          .signal-excerpt { font-size:12px; color:var(--text-muted); font-style:italic; margin-top:8px; padding:8px 10px; background:var(--bg); border-left:2px solid var(--border); border-radius:4px; line-height:1.5; }
          .signal-comment { font-size:12px; color:var(--text); margin-top:8px; padding:8px 10px; background:var(--li-dim); border-radius:6px; line-height:1.5; }
          .comment-tag { display:block; font-size:9px; color:var(--li); font-weight:700; text-transform:uppercase; letter-spacing:.08em; margin-bottom:4px; font-family:var(--mono); }
          .signal-reason { font-size:11px; color:var(--text-muted); margin-top:8px; padding-top:8px; border-top:1px dashed var(--border); }

          .signal-actions { display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:10px; border-top:1px solid var(--border); flex-wrap:wrap; gap:8px; }
          .action-group { display:flex; gap:4px; align-items:center; flex-wrap:wrap; }
          .btn-action { background:var(--bg-surface); border:1px solid var(--border); border-radius:6px; padding:6px 10px; font-size:11px; color:var(--text-secondary); cursor:pointer; text-decoration:none; display:inline-block; font-weight:500; }
          .btn-action:hover { border-color:var(--border-strong); color:var(--text); }
          .btn-action.btn-primary { background:var(--li); border-color:var(--li); color:#fff; }
          .btn-action.btn-primary:hover { opacity:.9; color:#fff; }
          .btn-icon { background:none; border:1px solid var(--border); border-radius:6px; width:24px; height:24px; color:var(--text-muted); cursor:pointer; font-size:14px; line-height:1; }
          .btn-icon:hover { color:var(--danger); border-color:var(--danger); }

          .status-pill { font-size:10px; font-weight:600; padding:3px 8px; border-radius:10px; font-family:var(--mono); text-transform:uppercase; letter-spacing:.04em; }
          .status-new { background:var(--bg-surface); color:var(--text-secondary); }
          .status-qualified { background:rgba(34,197,94,.12); color:#22c55e; }
          .status-contacted { background:var(--li-dim); color:var(--li); }
          .status-replied { background:rgba(168,85,247,.12); color:#a855f7; }
          .status-dismissed { background:rgba(239,68,68,.1); color:#ef4444; }

          /* Accounts */
          .add-form { display:grid; grid-template-columns:2fr 1.5fr 1fr auto; gap:6px; }
          .input { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); padding:9px 12px; font-size:13px; outline:none; width:100%; font-family:var(--font); }
          .input.mono { font-family:var(--mono); font-size:12px; }
          .input:focus { border-color:var(--li); }
          .btn-primary { background:var(--li); color:#fff; border:none; border-radius:var(--radius-sm); padding:9px 16px; font-size:13px; font-weight:600; cursor:pointer; }
          .btn-primary:hover { opacity:.9; }
          .btn-primary.big { padding:12px 18px; font-size:14px; width:100%; }
          .btn-primary:disabled { opacity:.5; cursor:not-allowed; }

          .account-list { display:flex; flex-direction:column; gap:6px; }
          .account-card { display:flex; justify-content:space-between; align-items:center; gap:12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:12px 16px; }
          .account-card.inactive { opacity:.5; }
          .account-info { flex:1; min-width:0; }
          .account-row { display:flex; align-items:center; gap:8px; }
          .account-label { font-size:13px; font-weight:600; color:var(--text); }
          .account-url { display:block; font-size:11px; color:var(--text-muted); font-family:var(--mono); margin-top:3px; word-break:break-all; }
          .account-url:hover { color:var(--li); }
          .account-meta { font-size:10px; color:var(--text-faint); margin-top:3px; }
          .account-actions { display:flex; gap:4px; }
          .kind-pill { font-size:10px; font-weight:600; padding:3px 8px; border-radius:10px; font-family:var(--mono); text-transform:uppercase; letter-spacing:.04em; }
          .kind-competitor { background:rgba(239,68,68,.1); color:#ef4444; }
          .kind-influencer { background:rgba(168,85,247,.12); color:#a855f7; }
          .kind-own_post { background:rgba(34,197,94,.12); color:#22c55e; }
          .kind-company { background:var(--li-dim); color:var(--li); }

          /* Import */
          .import-form { display:flex; flex-direction:column; gap:14px; }
          .import-modes { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
          .mode-btn { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:14px; text-align:left; cursor:pointer; }
          .mode-btn:hover { border-color:var(--border-strong); }
          .mode-on { border-color:var(--li); background:var(--li-dim); }
          .mode-name { font-size:13px; font-weight:600; color:var(--text); }
          .mode-desc { font-size:11px; color:var(--text-muted); margin-top:3px; }

          .form-section { display:flex; flex-direction:column; gap:6px; }
          .form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
          .lbl { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; }
          .hint { font-size:11px; color:var(--text-muted); line-height:1.5; }
          .type-row { display:flex; gap:6px; }
          .pill { background:var(--bg-card); border:1px solid var(--border); border-radius:100px; padding:6px 14px; font-size:12px; cursor:pointer; color:var(--text-secondary); }
          .pill:hover { border-color:var(--border-strong); }
          .pill-on { background:var(--li-dim); border-color:var(--li); color:var(--li); }

          .import-result { padding:12px; border-radius:var(--radius); font-size:13px; text-align:center; }
          .import-result.ok { background:rgba(34,197,94,.1); color:#22c55e; border:1px solid rgba(34,197,94,.3); }
          .import-result.err { background:rgba(239,68,68,.1); color:#ef4444; border:1px solid rgba(239,68,68,.3); }

          @media (max-width:680px) {
            .stats { grid-template-columns:1fr 1fr 1fr; }
            .add-form, .form-grid-2, .import-modes { grid-template-columns:1fr; }
            .signal-actions { flex-direction:column; align-items:stretch; }
            .action-group { justify-content:flex-start; }
          }
        `}</style>
      </Layout>
    </>
  )
}

function scoreTier(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 60) return 'hot'
  if (score >= 40) return 'warm'
  return 'cold'
}

function ensureHttps(url: string): string {
  if (!url) return '#'
  if (/^https?:\/\//.test(url)) return url
  return `https://${url}`
}
