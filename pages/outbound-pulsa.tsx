import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { PULSA_TEMPLATES, PulsaTemplate } from '../lib/pulsa-templates'

type Account = {
  id: string
  url: string
  kind: string
  label: string
  notes: string
  active: boolean
  last_checked_at: string | null
}

type SignalStats = { total: number; qualified: number; new: number; contacted: number }

// Sales Nav URL avec keywords pré-remplis. Sales Nav ne supporte pas tous
// les filtres en URL (companySize, intent, etc. nécessitent des URN LinkedIn
// internes), donc on fait ce qu'on peut : keywords + geo. Le reste s'ajoute
// en 30 sec via les boutons "Add filter" sur la page.
const SALES_NAV_KEYWORDS_PULSA = '(CEO OR Founder OR Fondateur OR "Co-fondateur" OR Directeur OR CMO) (Belgique OR Belgium OR Bruxelles OR Brussels)'
const SALES_NAV_SEARCH_URL = `https://www.linkedin.com/sales/search/people?keywords=${encodeURIComponent(SALES_NAV_KEYWORDS_PULSA)}`

// Lien direct vers la page de création de saved search Sales Nav
const SALES_NAV_SAVED_SEARCHES = 'https://www.linkedin.com/sales/search/people?savedSearchOption=true'

// Bloc texte à copier-coller — l'utilisateur peut le coller dans n'importe quel
// outil pour appliquer la config rapidement (ChatGPT, doc, etc.)
const SALES_NAV_CONFIG_TEXT = `🎯 SALES NAVIGATOR — Recherche Pulsa

ENTREPRISE
- Effectifs : 2-10, 11-50
- Lieu siège : Belgique (Bruxelles, Anvers, Liège, Gand, Charleroi, Mons, Namur)

RÔLE
- Niveau hiérarchique : Owner, CXO, VP, Founder
- Fonction : Founder, Marketing, General Management, Operations
- Intitulé poste : CEO, Fondateur, Founder, Co-fondateur, Directeur, CMO

PERSONNEL
- Zone géographique : Belgium, Brussels
- Langue profil : Français

INTENTION D'ACHAT (toggle ON)
✓ Le compte affiche une intention
✓ Suivent votre entreprise (Pulsa)
✓ Vues de profil récentes

NOUVELLES RÉCENTES (toggle ON)
✓ Nouveau poste (vendor evaluation 30-60j)
✓ Nouveau financement (cash frais)
✓ Posts sur LinkedIn (actifs)

→ Sauvegarder sous : "Pulsa — PME BE qui ont besoin d'un site"`

const SALES_NAV_FILTERS_PULSA = [
  { label: 'Effectifs', value: '2-10, 11-50' },
  { label: 'Lieu siège', value: 'Belgique entière (BXL prioritaire)' },
  { label: 'Niveau hiérarchique', value: 'Owner, CXO, VP, Founder' },
  { label: 'Fonction', value: 'Founder, Marketing, General Management' },
  { label: 'Intitulé poste', value: 'CEO, Fondateur, Directeur, CMO' },
  { label: 'Langue profil', value: 'Français' },
  { label: 'Intention d\'achat', value: 'ON' },
  { label: 'Suivent ton entreprise', value: 'ON' },
  { label: 'Vues profil récentes', value: 'ON' },
  { label: 'Nouveau poste', value: 'ON (vendor evaluation 30-60j)' },
  { label: 'Nouveau financement', value: 'ON (cash frais)' },
  { label: 'Posts sur LinkedIn', value: 'ON (actifs et joignables)' },
]

export default function OutboundPulsaPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [stats, setStats] = useState<SignalStats>({ total: 0, qualified: 0, new: 0, contacted: 0 })
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  function copyConfig() {
    navigator.clipboard.writeText(SALES_NAV_CONFIG_TEXT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [aRes, sRes] = await Promise.all([
        fetch('/api/linkedin/tracked-accounts?project=pulsa').then(r => r.json()),
        fetch('/api/linkedin/signals?project=pulsa&limit=500').then(r => r.json()),
      ])
      const accs = aRes.accounts || []
      const sigs = sRes.signals || []
      setAccounts(accs)
      setStats({
        total: sigs.length,
        qualified: sigs.filter((s: any) => s.icp_score >= 60).length,
        new: sigs.filter((s: any) => s.status === 'new').length,
        contacted: sigs.filter((s: any) => s.status === 'contacted').length,
      })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function runSeed() {
    if (!confirm('Ajouter ~12 comptes Pulsa pré-séléctionnés (concurrents, influenceurs, écosystème, secteurs) ? Les doublons seront skippés.')) return
    setSeeding(true); setSeedResult('')
    try {
      const r = await fetch('/api/linkedin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'pulsa' }),
      })
      const data = await r.json()
      if (data.error) setSeedResult(`Erreur : ${data.error}`)
      else setSeedResult(`✓ ${data.inserted} comptes ajoutés${data.skipped ? `, ${data.skipped} déjà présents` : ''}`)
      load()
    } catch (e: any) {
      setSeedResult(`Erreur : ${e?.message}`)
    } finally {
      setSeeding(false)
    }
  }

  function useTemplate(t: PulsaTemplate) {
    // Pré-remplit /outreach avec le template (via sessionStorage)
    sessionStorage.setItem('signal-prefill', JSON.stringify({
      name: '',
      title: '',
      company: '',
      context: t.signal,
      linkedinUrl: '',
      template: t.id,
      goal: t.goal,
      messageType: t.messageType,
    }))
    router.push('/outreach')
  }

  return (
    <>
      <Head><title>Outbound Pulsa — Marwane</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout title="Outbound Pulsa" subtitle="Le hub de prospection pour Pulsa Creatives — sites web Bruxelles">
        <div className="page">

          {/* Stats Pulsa */}
          <div className="stats-row">
            <div className="stat"><span className="num">{accounts.length}</span><span className="lbl">Comptes suivis</span></div>
            <div className="stat"><span className="num">{stats.total}</span><span className="lbl">Signaux</span></div>
            <div className="stat hot"><span className="num">{stats.qualified}</span><span className="lbl">Qualifiés (≥60)</span></div>
            <div className="stat"><span className="num">{stats.contacted}</span><span className="lbl">Contactés</span></div>
          </div>

          {/* Action setup */}
          {accounts.length === 0 && !loading && (
            <div className="setup-card">
              <div className="setup-tag">SETUP RAPIDE</div>
              <h3 className="setup-title">Tu n'as encore aucun compte Pulsa configuré</h3>
              <p className="setup-desc">Pré-remplir avec 12 comptes stratégiques (Startup.be, BeAngels, Co.Station, Stan Leloup, Emakina, etc.) — ce sont ceux dont les <strong>engagers = tes futurs clients Pulsa</strong>.</p>
              <button className="btn-primary" onClick={runSeed} disabled={seeding}>
                {seeding ? 'Ajout en cours…' : '⚡ Pré-remplir les comptes Pulsa'}
              </button>
              {seedResult && <div className={`setup-result ${seedResult.startsWith('Erreur') ? 'err' : 'ok'}`}>{seedResult}</div>}
            </div>
          )}

          {/* === STEP 1 : SALES NAV === */}
          <section className="section">
            <div className="step-head">
              <span className="step-num">1</span>
              <div>
                <h2 className="step-title">Sales Navigator — recherche sauvegardée Pulsa</h2>
                <p className="step-sub">Ouvre Sales Nav, configure ces filtres exacts, sauvegarde sous "Pulsa — PME BE qui ont besoin d'un site"</p>
              </div>
              <div className="head-actions">
                <button className={`btn-link ${copied ? 'btn-copied' : ''}`} onClick={copyConfig}>
                  {copied ? '✓ Config copiée' : '📋 Copier la config'}
                </button>
                <a href={SALES_NAV_SEARCH_URL} target="_blank" rel="noreferrer" className="btn-link primary">
                  Ouvrir Sales Nav ↗
                </a>
              </div>
            </div>

            <div className="callout-blue">
              ⚡ <strong>Workflow rapide :</strong> clique <strong>"Ouvrir Sales Nav"</strong> → la recherche s'ouvre déjà avec les keywords <em>"CEO OR Founder OR Fondateur Belgique"</em> pré-remplis. Ensuite, ajoute les 12 filtres ci-dessous via le panneau de droite (30 sec).
            </div>

            <div className="filters-grid">
              {SALES_NAV_FILTERS_PULSA.map((f, i) => (
                <div key={i} className="filter-card">
                  <div className="filter-label">{f.label}</div>
                  <div className="filter-value">{f.value}</div>
                </div>
              ))}
            </div>

            <div className="callout">
              💡 <strong>Une fois sauvegardée :</strong> tous les matins Sales Nav t'envoie un mail avec les nouveaux résultats. Tu cliques 5-10 leads chauds → tu copies leurs profils → tu vas étape 3 ci-dessous.
            </div>
          </section>

          {/* === STEP 2 : COMPTES À SURVEILLER === */}
          <section className="section">
            <div className="step-head">
              <span className="step-num">2</span>
              <div>
                <h2 className="step-title">Comptes à surveiller — leurs engagers = tes leads</h2>
                <p className="step-sub">Quand un de ces comptes poste, ses likers/commenters sont des founders/marketers BE/FR matchant Pulsa.</p>
              </div>
              <Link href="/signals?tab=accounts" className="btn-link">Tout voir ↗</Link>
            </div>

            {accounts.length > 0 && (
              <div className="accounts-grid">
                {accounts.slice(0, 12).map(a => (
                  <div key={a.id} className={`acc-card kind-${a.kind}`}>
                    <div className="acc-row">
                      <span className={`kind-pill kind-pill-${a.kind}`}>{kindLabel(a.kind)}</span>
                      <span className={a.active ? 'dot dot-on' : 'dot dot-off'}>●</span>
                    </div>
                    <div className="acc-name">{a.label}</div>
                    <div className="acc-notes">{a.notes}</div>
                    <a href={ensureHttps(a.url)} target="_blank" rel="noreferrer" className="acc-link">Ouvrir LinkedIn →</a>
                  </div>
                ))}
              </div>
            )}

            {accounts.length > 0 && accounts.length < 12 && (
              <button className="btn-ghost" onClick={runSeed} disabled={seeding}>
                {seeding ? 'Ajout…' : '+ Ajouter les comptes Pulsa manquants'}
              </button>
            )}
          </section>

          {/* === STEP 3 : TEMPLATES DM === */}
          <section className="section">
            <div className="step-head">
              <span className="step-num">3</span>
              <div>
                <h2 className="step-title">Templates DM — choisis le signal détecté</h2>
                <p className="step-sub">Un click → /outreach pré-rempli avec l'angle gagnant. Tu n'as plus qu'à coller le profil et générer.</p>
              </div>
            </div>

            <div className="templates-grid">
              {PULSA_TEMPLATES.map(t => (
                <button key={t.id} className="tpl-card" onClick={() => useTemplate(t)}>
                  <div className="tpl-emoji">{t.emoji}</div>
                  <div className="tpl-body">
                    <div className="tpl-label">{t.label}</div>
                    <div className="tpl-desc">{t.desc}</div>
                    <div className="tpl-signal">📡 {t.signal}</div>
                  </div>
                  <div className="tpl-arrow">→</div>
                </button>
              ))}
            </div>
          </section>

          {/* === STEP 4 : LIENS UTILES === */}
          <section className="section links-section">
            <h2 className="step-title small">Liens utiles</h2>
            <div className="links-grid">
              <Link href="/signals?project=pulsa" className="link-card">
                <div className="link-name">📊 Signaux Pulsa</div>
                <div className="link-desc">Voir les leads détectés filtré sur Pulsa uniquement</div>
              </Link>
              <Link href="/signals?tab=import" className="link-card">
                <div className="link-name">📥 Importer engagers</div>
                <div className="link-desc">Coller les likers/commenters d'un post LinkedIn</div>
              </Link>
              <Link href="/outreach" className="link-card">
                <div className="link-name">✉️ Outreach manuel</div>
                <div className="link-desc">Générer un DM sans template (à partir d'un profil)</div>
              </Link>
              <Link href="/brain" className="link-card">
                <div className="link-name">🧠 Brain Pulsa</div>
                <div className="link-desc">Ajuster le pitch, les key messages, le ton</div>
              </Link>
            </div>
          </section>

          <div className="footer-tip">
            ⚡ <strong>Auto pilot :</strong> ajoute <code>BEREACH_API_KEY</code> dans Vercel env vars pour que le cron toutes les 6h scrape automatiquement les engagers de tous tes comptes suivis.
          </div>
        </div>

        <style jsx>{`
          .page { display:flex; flex-direction:column; gap:24px; }

          .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
          .stat { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:14px 16px; }
          .stat.hot { border-color:rgba(34,197,94,.3); background:rgba(34,197,94,.05); }
          .num { font-size:24px; font-weight:700; color:var(--text); display:block; line-height:1.1; }
          .lbl { font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; font-family:var(--mono); margin-top:4px; display:block; }

          /* Setup card */
          .setup-card { background:linear-gradient(135deg, var(--li-dim), transparent); border:1px solid var(--li-border); border-radius:var(--radius); padding:20px; }
          .setup-tag { font-size:9px; font-weight:700; color:var(--li); letter-spacing:.08em; font-family:var(--mono); margin-bottom:8px; }
          .setup-title { font-size:16px; font-weight:600; color:var(--text); margin:0 0 6px; }
          .setup-desc { font-size:13px; color:var(--text-secondary); margin:0 0 14px; line-height:1.5; }
          .setup-desc strong { color:var(--text); }
          .setup-result { margin-top:10px; padding:8px 12px; border-radius:var(--radius-sm); font-size:12px; }
          .setup-result.ok { background:rgba(34,197,94,.1); color:#22c55e; }
          .setup-result.err { background:rgba(239,68,68,.1); color:#ef4444; }

          /* Section */
          .section { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; }
          .step-head { display:flex; align-items:flex-start; gap:14px; margin-bottom:16px; }
          .step-num { width:32px; height:32px; background:var(--li); color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0; }
          .step-head > div:nth-child(2) { flex:1; min-width:0; }
          .step-title { font-size:16px; font-weight:600; color:var(--text); margin:0; }
          .step-title.small { font-size:14px; margin-bottom:12px; }
          .step-sub { font-size:12px; color:var(--text-muted); margin:3px 0 0; line-height:1.5; }
          .head-actions { display:flex; gap:6px; flex-shrink:0; flex-wrap:wrap; }
          .btn-link { font-size:12px; color:var(--li); text-decoration:none; padding:6px 12px; background:var(--li-dim); border-radius:var(--radius-sm); white-space:nowrap; flex-shrink:0; border:1px solid var(--li-border); cursor:pointer; font-weight:500; font-family:inherit; }
          .btn-link:hover { background:var(--li); color:#fff; }
          .btn-link.primary { background:var(--li); color:#fff; }
          .btn-link.primary:hover { opacity:.9; }
          .btn-copied { background:rgba(34,197,94,.15); color:#22c55e; border-color:rgba(34,197,94,.3); }
          .btn-copied:hover { background:rgba(34,197,94,.25); color:#22c55e; }

          .callout-blue { background:var(--li-dim); border-left:3px solid var(--li); padding:10px 14px; border-radius:0 var(--radius-sm) var(--radius-sm) 0; font-size:12px; color:var(--text-secondary); line-height:1.6; margin-bottom:14px; }
          .callout-blue strong { color:var(--text); }
          .callout-blue em { color:var(--li); font-style:normal; font-family:var(--mono); font-size:11px; padding:1px 5px; background:var(--bg); border-radius:3px; }

          /* Filters Sales Nav */
          .filters-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-bottom:14px; }
          .filter-card { background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:8px 12px; }
          .filter-label { font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.04em; font-family:var(--mono); }
          .filter-value { font-size:12px; color:var(--text); margin-top:3px; font-weight:500; }

          .callout { background:rgba(245,158,11,.08); border-left:3px solid #f59e0b; padding:10px 14px; border-radius:0 var(--radius-sm) var(--radius-sm) 0; font-size:12px; color:var(--text-secondary); line-height:1.6; }
          .callout strong { color:var(--text); }

          /* Accounts grid */
          .accounts-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
          .acc-card { background:var(--bg); border:1px solid var(--border); border-left:3px solid var(--border); border-radius:var(--radius-sm); padding:10px 12px; display:flex; flex-direction:column; gap:6px; }
          .acc-card.kind-competitor { border-left-color:#ef4444; }
          .acc-card.kind-influencer { border-left-color:#a855f7; }
          .acc-card.kind-ecosystem { border-left-color:#22c55e; }
          .acc-card.kind-sector { border-left-color:#f59e0b; }
          .acc-card.kind-company { border-left-color:var(--li); }
          .acc-row { display:flex; justify-content:space-between; align-items:center; }
          .kind-pill { font-size:9px; font-weight:700; padding:2px 7px; border-radius:8px; font-family:var(--mono); text-transform:uppercase; letter-spacing:.04em; }
          .kind-pill-competitor { background:rgba(239,68,68,.12); color:#ef4444; }
          .kind-pill-influencer { background:rgba(168,85,247,.12); color:#a855f7; }
          .kind-pill-ecosystem { background:rgba(34,197,94,.12); color:#22c55e; }
          .kind-pill-sector { background:rgba(245,158,11,.12); color:#f59e0b; }
          .kind-pill-company { background:var(--li-dim); color:var(--li); }
          .dot { font-size:10px; }
          .dot-on { color:#22c55e; }
          .dot-off { color:var(--text-faint); }
          .acc-name { font-size:13px; font-weight:600; color:var(--text); }
          .acc-notes { font-size:11px; color:var(--text-muted); line-height:1.4; }
          .acc-link { font-size:11px; color:var(--li); text-decoration:none; margin-top:auto; padding-top:4px; }
          .acc-link:hover { text-decoration:underline; }

          .btn-ghost { margin-top:12px; background:none; border:1px dashed var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); padding:8px 14px; font-size:12px; cursor:pointer; width:100%; }
          .btn-ghost:hover { border-color:var(--li); color:var(--li); }
          .btn-primary { background:var(--li); color:#fff; border:none; border-radius:var(--radius-sm); padding:10px 18px; font-size:13px; font-weight:600; cursor:pointer; }
          .btn-primary:hover { opacity:.9; }
          .btn-primary:disabled { opacity:.5; cursor:not-allowed; }

          /* Templates */
          .templates-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
          .tpl-card { background:var(--bg); border:1px solid var(--border); border-radius:var(--radius); padding:14px; cursor:pointer; text-align:left; display:flex; gap:12px; align-items:flex-start; transition:all .15s; }
          .tpl-card:hover { border-color:var(--li); background:var(--li-dim); }
          .tpl-emoji { font-size:24px; flex-shrink:0; }
          .tpl-body { flex:1; min-width:0; }
          .tpl-label { font-size:13px; font-weight:600; color:var(--text); }
          .tpl-desc { font-size:11px; color:var(--text-secondary); margin-top:2px; }
          .tpl-signal { font-size:10px; color:var(--text-muted); margin-top:6px; padding:4px 6px; background:var(--bg-card); border-radius:4px; font-family:var(--mono); }
          .tpl-arrow { font-size:18px; color:var(--text-muted); align-self:center; flex-shrink:0; transition:color .15s; }
          .tpl-card:hover .tpl-arrow { color:var(--li); }

          /* Links */
          .links-section { background:transparent; border:none; padding:0; }
          .links-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:6px; }
          .link-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px; text-decoration:none; transition:all .15s; }
          .link-card:hover { border-color:var(--border-strong); }
          .link-name { font-size:13px; font-weight:600; color:var(--text); }
          .link-desc { font-size:11px; color:var(--text-muted); margin-top:3px; line-height:1.4; }

          .footer-tip { background:rgba(245,158,11,.06); border:1px dashed rgba(245,158,11,.3); border-radius:var(--radius); padding:12px 14px; font-size:12px; color:var(--text-secondary); line-height:1.5; }
          .footer-tip strong { color:var(--text); }
          .footer-tip code { background:var(--bg); padding:2px 6px; border-radius:4px; font-family:var(--mono); font-size:11px; color:var(--li); }

          @media (max-width:760px) {
            .stats-row { grid-template-columns:repeat(2,1fr); }
            .filters-grid, .accounts-grid, .templates-grid, .links-grid { grid-template-columns:1fr; }
            .step-head { flex-wrap:wrap; }
          }
        `}</style>
      </Layout>
    </>
  )
}

function kindLabel(kind: string): string {
  return ({
    competitor: 'Concurrent',
    influencer: 'Influenceur',
    ecosystem: 'Écosystème',
    sector: 'Secteur',
    company: 'Entreprise',
    own_post: 'Mon post',
  } as Record<string, string>)[kind] || kind
}

function ensureHttps(url: string): string {
  if (!url) return '#'
  if (/^https?:\/\//.test(url)) return url
  return `https://${url}`
}
