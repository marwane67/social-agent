import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'

const CARDS = [
  {
    title: 'Prospects',
    desc: 'Trouve des prospects B2B en langage naturel (PME, VCs, startups...).',
    href: '/prospects',
  },
  {
    title: 'Outreach',
    desc: 'Messages LinkedIn personnalisés en quelques clics.',
    href: '/outreach',
  },
  {
    title: 'Growth',
    desc: 'Vue agrégée de ton growth (followers, engagement, audience).',
    href: '/growth',
  },
  {
    title: 'Bio Optimizer',
    desc: '5 variantes de bio optimisées pour convertir.',
    href: '/bio',
  },
]

export default function GrowPage() {
  const router = useRouter()
  const [network, setNetwork] = useState<Network>('twitter')

  return (
    <>
      <Head><title>Grow — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Grow" subtitle="Prospection, outreach, audience">
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
          .card { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 18px; text-align: left; display: flex; flex-direction: column; gap: 6px; position: relative; cursor: pointer; }
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
