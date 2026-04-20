import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

type Stats = {
  hooks: number
  frameworks: number
  voiceProfile: boolean
  voiceSamples: number
  perfPosts: number
  brainProjects: number
  brainAxes: number
  brainChannels: number
  hasBio: boolean
}

const SECTIONS = [
  {
    id: 'strategy',
    title: 'Stratégie',
    desc: 'Tes projets, channels Buffer et axes de contenu. C\'est la boussole de Pulse : il route chaque post vers les bons canaux selon tes règles.',
    href: '/strategy',
    icon: 'strategy',
  },
  {
    id: 'voice',
    title: 'Ma voix',
    desc: 'Colle tes meilleurs posts → l\'IA analyse ton style et l\'imite à chaque génération. Sans voice profile, Pulse sonne générique.',
    href: '/voice',
    icon: 'voice',
  },
  {
    id: 'performance',
    title: 'Performance',
    desc: 'Tracke les stats de chaque post posté. Pulse apprend ce qui marche POUR TOI et priorise ces patterns.',
    href: '/analytics',
    icon: 'perf',
  },
  {
    id: 'bio',
    title: 'Bio Optimizer',
    desc: 'Génère et teste des variantes de bio. Important pour la conversion profil → follower.',
    href: '/bio',
    icon: 'bio',
  },
]

export default function BrainHubPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { HOOKS } = await import('../lib/hooks')
        const { FRAMEWORKS } = await import('../lib/frameworks')
        const { getBrain } = await import('../lib/brain')
        const brain = getBrain()
        const vp = localStorage.getItem('voice-profile')
        let voiceSamples = 0
        try { voiceSamples = JSON.parse(localStorage.getItem('voice-samples') || '[]').length } catch {}
        let perfPosts = 0
        try { perfPosts = JSON.parse(localStorage.getItem('post-performance') || '[]').length } catch {}
        let hasBio = false
        try { hasBio = JSON.parse(localStorage.getItem('bio-history') || '[]').length > 0 } catch {}
        setStats({
          hooks: HOOKS.length,
          frameworks: FRAMEWORKS.length,
          voiceProfile: !!vp,
          voiceSamples,
          perfPosts,
          brainProjects: brain.projects.length,
          brainAxes: brain.axes.length,
          brainChannels: brain.channels.length,
          hasBio,
        })
      } catch {}
    })()
  }, [])

  return (
    <>
      <Head><title>Brain — Social Agent</title></Head>
      <Layout title="Brain" subtitle="Tout ce que Pulse sait sur toi et ton style">
        {/* Overview stats */}
        {stats && (
          <div className="overview">
            <div className="ov-title">Ce que Pulse utilise automatiquement à chaque génération :</div>
            <div className="ov-grid">
              <Pill label="Hooks library" value={`${stats.hooks} hooks`} status="ok" />
              <Pill label="Frameworks storytelling" value={`${stats.frameworks}`} status="ok" />
              <Pill label="Voice profile" value={stats.voiceProfile ? `✓ actif (${stats.voiceSamples} samples)` : 'À configurer'} status={stats.voiceProfile ? 'ok' : 'warn'} />
              <Pill label="Performance insights" value={stats.perfPosts >= 5 ? `✓ ${stats.perfPosts} posts trackés` : `${stats.perfPosts}/5 minimum`} status={stats.perfPosts >= 5 ? 'ok' : 'warn'} />
              <Pill label="Projets actifs" value={`${stats.brainProjects}`} status="ok" />
              <Pill label="Axes de contenu" value={`${stats.brainAxes}`} status="ok" />
              <Pill label="Channels Buffer" value={`${stats.brainChannels}`} status="ok" />
              <Pill label="Bio optimisée" value={stats.hasBio ? '✓' : 'À faire'} status={stats.hasBio ? 'ok' : 'warn'} />
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="sections">
          {SECTIONS.map(s => (
            <button key={s.id} className="section" onClick={() => router.push(s.href)}>
              <div className="sec-icon"><SectionIcon name={s.icon} /></div>
              <div className="sec-body">
                <div className="sec-title">{s.title}</div>
                <div className="sec-desc">{s.desc}</div>
              </div>
              <div className="sec-arrow">→</div>
            </button>
          ))}
        </div>

        <div className="hint">
           <strong>Plus tu remplis ton Brain, plus Pulse écrit comme toi.</strong> Commence par "Ma voix" (colle 5 posts), puis tracke tes 5 premiers posts dans Performance. À partir de là, l'IA apprend et s'améliore.
        </div>

        <style jsx>{`
          .overview {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-lg);
            padding: 16px 18px;
            margin-bottom: 18px;
          }
          .ov-title {
            font-size: 11px;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-family: var(--mono);
            margin-bottom: 12px;
          }
          .ov-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 6px;
          }

          .sections {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 24px;
          }
          .section {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-lg);
            padding: 16px;
            display: flex;
            gap: 14px;
            align-items: flex-start;
            text-align: left;
            cursor: pointer;
            transition: all var(--t-fast) var(--ease);
          }
          .section:hover {
            border-color: var(--border-strong);
            background: var(--bg-card-hover);
            transform: translateY(-1px);
          }
          .sec-icon {
            width: 36px;
            height: 36px;
            background: var(--bg-card);
            border: 1px solid var(--border-strong);
            border-radius: var(--r-md);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--net);
            flex-shrink: 0;
          }
          .sec-body { flex: 1; min-width: 0; }
          .sec-title {
            font-size: 15px;
            font-weight: 700;
            color: var(--text);
            letter-spacing: -0.01em;
          }
          .sec-desc {
            font-size: 12px;
            color: var(--text-secondary);
            line-height: 1.5;
            margin-top: 4px;
          }
          .sec-arrow {
            color: var(--text-muted);
            font-size: 16px;
            flex-shrink: 0;
            padding-top: 6px;
            transition: transform var(--t-fast) var(--ease);
          }
          .section:hover .sec-arrow { transform: translateX(3px); color: var(--text); }

          .hint {
            font-size: 12px;
            color: var(--text-secondary);
            padding: 12px 16px;
            background: var(--bg-card);
            border-radius: var(--r-md);
            border-left: 3px solid var(--net);
            line-height: 1.5;
          }
          .hint strong { color: var(--text); }
        `}</style>
      </Layout>
    </>
  )
}

function Pill({ label, value, status }: { label: string; value: string; status: 'ok' | 'warn' }) {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-sm)',
      padding: '8px 10px',
      borderLeft: `2px solid ${status === 'ok' ? 'var(--success)' : 'var(--warning)'}`,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--mono)' }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 3, fontFamily: 'var(--mono)' }}>{value}</div>
    </div>
  )
}

function SectionIcon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'strategy':
      return <svg {...common}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
    case 'voice':
      return <svg {...common}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
    case 'perf':
      return <svg {...common}><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-5"/></svg>
    case 'bio':
      return <svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    default: return null
  }
}
