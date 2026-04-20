import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

const SECTIONS = [
  {
    group: 'Création',
    items: [
      { title: 'Compose', desc: 'Générer un post manuellement (si tu ne veux pas passer par Pulse)', href: '/', icon: 'compose' },
      { title: 'Brief du jour', desc: '5 idées quotidiennes + tendances + angle viral', href: '/brief', icon: 'sun' },
      { title: 'Launch Series', desc: 'Arc narratif long (7-30 jours) pour un lancement', href: '/series', icon: 'rocket' },
      { title: 'A/B Test', desc: 'Générer 2 variantes d\'une même idée', href: '/abtest', icon: 'split' },
    ],
  },
  {
    group: 'Ressources',
    items: [
      { title: 'Library', desc: '60 hooks + 5 frameworks storytelling', href: '/library', icon: 'book' },
      { title: 'Swipe File', desc: 'Tes meilleurs posts sauvegardés', href: '/swipe', icon: 'bookmark' },
      { title: 'Images', desc: 'Générer des visuels pour carrousels', href: '/images', icon: 'image' },
    ],
  },
  {
    group: 'Distribution',
    items: [
      { title: 'Newsletter', desc: 'Transformer tes meilleurs posts en newsletter hebdo', href: '/newsletter', icon: 'mail' },
      { title: 'Reply Agent', desc: 'Générer des réponses aux commentaires', href: '/reply', icon: 'reply' },
      { title: 'Outils & Tools', desc: 'Threads, carrousels, polls, DMs, trends', href: '/tools', icon: 'tools' },
    ],
  },
  {
    group: 'Growth',
    items: [
      { title: 'Prospects', desc: 'Trouver des leads B2B en langage naturel', href: '/prospects', icon: 'users' },
      { title: 'Outreach', desc: 'Messages LinkedIn personnalisés', href: '/outreach', icon: 'send' },
      { title: 'Growth Dashboard', desc: 'Vue agrégée audience + engagement', href: '/growth', icon: 'trend' },
    ],
  },
]

export default function StudioPage() {
  const router = useRouter()

  return (
    <>
      <Head><title>Studio — Social Agent</title></Head>
      <Layout title="Studio" subtitle="Tous les outils de création · mais Pulse fait 90% du boulot">
        <div className="intro">
           <strong>Astuce</strong> : Pulse sait utiliser tous ces outils à ta place. Dis-lui <em>"fais-moi un A/B test sur cette idée"</em>, <em>"optimise ma bio"</em>, <em>"génère-moi un carrousel"</em> et il exécute. Ces pages servent surtout si tu veux du manuel.
        </div>

        {SECTIONS.map(sec => (
          <div key={sec.group} className="group">
            <h3>{sec.group}</h3>
            <div className="items">
              {sec.items.map(item => (
                <button key={item.href} className="item" onClick={() => router.push(item.href)}>
                  <div className="item-icon"><ItemIcon name={item.icon} /></div>
                  <div className="item-body">
                    <div className="item-title">{item.title}</div>
                    <div className="item-desc">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <style jsx>{`
          .intro {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-left: 3px solid var(--net);
            border-radius: var(--r-md);
            padding: 12px 14px;
            font-size: 12px;
            color: var(--text-secondary);
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .intro strong { color: var(--text); }
          .intro em { color: var(--text); font-style: normal; background: var(--bg); padding: 1px 6px; border-radius: 3px; font-family: var(--mono); font-size: 11px; }

          .group { margin-bottom: 20px; }
          .group h3 {
            font-size: 10px;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-family: var(--mono);
            margin: 0 0 8px;
          }
          .items {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 6px;
          }
          .item {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-md);
            padding: 12px 14px;
            display: flex;
            gap: 12px;
            align-items: flex-start;
            text-align: left;
            cursor: pointer;
            transition: all var(--t-fast) var(--ease);
          }
          .item:hover { border-color: var(--border-strong); background: var(--bg-card-hover); }
          .item-icon {
            width: 30px;
            height: 30px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--r-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            flex-shrink: 0;
          }
          .item:hover .item-icon { color: var(--net); border-color: var(--net); }
          .item-body { flex: 1; min-width: 0; }
          .item-title { font-size: 13px; font-weight: 600; color: var(--text); }
          .item-desc { font-size: 11px; color: var(--text-muted); line-height: 1.4; margin-top: 3px; }
        `}</style>
      </Layout>
    </>
  )
}

function ItemIcon({ name }: { name: string }) {
  const c = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'compose': return <svg {...c}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
    case 'sun': return <svg {...c}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
    case 'rocket': return <svg {...c}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09ZM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/></svg>
    case 'split': return <svg {...c}><path d="M3 3h6v6M21 3h-6v6M3 21h6v-6M21 21h-6v-6"/></svg>
    case 'book': return <svg {...c}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
    case 'bookmark': return <svg {...c}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/></svg>
    case 'image': return <svg {...c}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.82 0L6 21"/></svg>
    case 'mail': return <svg {...c}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
    case 'reply': return <svg {...c}><path d="M9 17 4 12l5-5M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
    case 'tools': return <svg {...c}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/></svg>
    case 'users': return <svg {...c}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'send': return <svg {...c}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
    case 'trend': return <svg {...c}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
    default: return null
  }
}
