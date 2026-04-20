import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'

const CARDS = [
  {
    title: 'Launch Series',
    desc: 'Arc narratif complet pour un lancement (Axora ou autre). 30 posts générés en une fois.',
    href: '/series',
  },
  {
    title: 'A/B Test',
    desc: '2 variantes d\'un même post avec angles opposés. Compare ce qui marche.',
    href: '/abtest',
  },
  {
    title: 'Schedule',
    desc: 'Programme tes posts (avec n8n / Buffer connecté).',
    href: '/schedule',
  },
]

export default function PlanPage() {
  const router = useRouter()
  const [network, setNetwork] = useState<Network>('twitter')

  return (
    <>
      <Head><title>Plan — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Plan" subtitle="Séries, A/B test, planification">
        <div className="cards">
          {CARDS.map(c => (
            <button key={c.href} className="card" onClick={() => router.push(c.href)}>
              <div className="c-title">{c.title}</div>
              <div className="c-desc">{c.desc}</div>
              <div className="c-arrow">→</div>
            </button>
          ))}
        </div>

        <style jsx>{`
          .cards { display: flex; flex-direction: column; gap: 8px; }
          .card {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-lg);
            padding: 18px;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 6px;
            position: relative;
            cursor: pointer;
          }
          .card:hover { border-color: var(--border-strong); background: var(--card-hover); }
          .c-title { font-size: 16px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
          .c-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
          .c-arrow { position: absolute; top: 18px; right: 18px; color: var(--text-muted); font-size: 16px; }
          .card:hover .c-arrow { color: var(--text); }
        `}</style>
      </Layout>
    </>
  )
}
