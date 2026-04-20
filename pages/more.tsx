import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'

const SECTIONS = [
  {
    title: 'Personnalisation',
    items: [
      { title: 'Ma voix', desc: 'Apprends ton style à l\'IA', href: '/voice' },
      { title: 'Bio Optimizer', desc: '5 variantes de bio + tracking', href: '/bio' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { title: 'Reply', desc: 'Réponds aux commentaires intelligemment', href: '/reply' },
      { title: 'Tools', desc: 'Threads, carrousels, polls, DMs...', href: '/tools' },
      { title: 'Swipe File', desc: 'Tes meilleurs posts sauvegardés', href: '/swipe' },
    ],
  },
  {
    title: 'Distribution',
    items: [
      { title: 'Newsletter', desc: 'Hebdo depuis tes meilleurs posts', href: '/newsletter' },
      { title: 'Schedule', desc: 'Planifie tes posts', href: '/schedule' },
    ],
  },
  {
    title: 'Création avancée',
    items: [
      { title: 'Launch Series', desc: 'Arc narratif 30 jours', href: '/series' },
      { title: 'A/B Test', desc: '2 variantes à tester', href: '/abtest' },
      { title: 'Images', desc: 'Génération d\'images standalone', href: '/images' },
    ],
  },
]

export default function MorePage() {
  const router = useRouter()
  const [network, setNetwork] = useState<Network>('twitter')

  return (
    <>
      <Head><title>Plus — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Tout voir" subtitle="Toutes les fonctionnalités du Social Agent">
        {SECTIONS.map(s => (
          <div key={s.title} className="section">
            <h3>{s.title}</h3>
            <div className="grid">
              {s.items.map(item => (
                <button key={item.href} className="item" onClick={() => router.push(item.href)}>
                  <div className="i-title">{item.title}</div>
                  <div className="i-desc">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <style jsx>{`
          .section { margin-bottom: 24px; }
          .section h3 { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px; font-family: var(--mono); }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
          @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
          .item { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--r-md); padding: 12px 14px; text-align: left; display: flex; flex-direction: column; gap: 4px; cursor: pointer; }
          .item:hover { border-color: var(--border-strong); background: var(--card-hover); }
          .i-title { font-size: 13px; font-weight: 600; color: var(--text); }
          .i-desc { font-size: 11px; color: var(--text-muted); line-height: 1.4; }
        `}</style>
      </Layout>
    </>
  )
}
