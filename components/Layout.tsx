import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, ReactNode } from 'react'
import { useNetwork, Network } from '../lib/network-context'

const NAV = [
  { href: '/agent', label: 'Pulse · Agent IA', icon: 'sparkle' },
  { href: '/', label: 'Compose', icon: 'compose' },
  { href: '/calendar', label: 'Calendrier', icon: 'calendar' },
  { href: '/brief', label: 'Brief du jour', icon: 'sun' },
  { href: '/library', label: 'Library', icon: 'book' },
  { href: '/analytics', label: 'Analytics', icon: 'chart' },
  { href: '/grow', label: 'Grow', icon: 'sprout' },
]

const MORE = [
  { href: '/strategy', label: 'Stratégie (brain)' },
  { href: '/voice', label: 'Ma voix' },
  { href: '/bio', label: 'Bio' },
  { href: '/plan', label: 'Plan (séries + A/B)' },
  { href: '/reply', label: 'Reply' },
  { href: '/tools', label: 'Tools' },
  { href: '/newsletter', label: 'Newsletter' },
  { href: '/more', label: 'Tout voir' },
]

type Props = {
  children: ReactNode
  /** @deprecated kept for backward compat — use useNetwork() instead */
  network?: Network
  /** @deprecated kept for backward compat — handled by NetworkProvider now */
  onNetworkChange?: (n: Network) => void
  title?: string
  subtitle?: string
}

export default function Layout({ children, title, subtitle }: Props) {
  const router = useRouter()
  const { network, setNetwork, isLi } = useNetwork()
  const [open, setOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    const close = () => setOpen(false)
    router.events?.on('routeChangeStart', close)
    return () => router.events?.off('routeChangeStart', close)
  }, [router.events])

  return (
    <div className="shell">
      {/* === SIDEBAR === */}
      <aside className={`sb ${open ? 'sb-open' : ''}`}>
        {/* Brand */}
        <div className="sb-brand">
          <div className="sb-logo">
            <span className="sb-logo-dot" />
          </div>
          <div className="sb-brand-text">
            <div className="sb-brand-name">Social Agent</div>
            <div className="sb-brand-sub">{isLi ? 'LinkedIn mode' : 'Twitter mode'}</div>
          </div>
        </div>

        {/* Network switcher — pill design */}
        <div className="sb-net">
          <div className={`sb-net-thumb ${isLi ? 'thumb-right' : ''}`} />
          <button
            className={`sb-net-btn ${!isLi ? 'sb-net-on' : ''}`}
            onClick={() => setNetwork('twitter')}
          >
            <span className="sb-net-icon">𝕏</span>
            <span>Twitter</span>
          </button>
          <button
            className={`sb-net-btn ${isLi ? 'sb-net-on' : ''}`}
            onClick={() => setNetwork('linkedin')}
          >
            <span className="sb-net-icon">in</span>
            <span>LinkedIn</span>
          </button>
        </div>

        {/* Main nav */}
        <nav className="sb-nav">
          {NAV.map(item => {
            const active = router.pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={`sb-link ${active ? 'sb-on' : ''}`}>
                <span className="sb-icon">
                  <NavIcon name={item.icon} active={active} />
                </span>
                <span className="sb-label">{item.label}</span>
                {active && <span className="sb-active-bar" />}
              </Link>
            )
          })}
        </nav>

        {/* More */}
        <div className="sb-more-wrap">
          <button className="sb-more-btn" onClick={() => setShowMore(!showMore)}>
            <span className="sb-more-icon">{showMore ? '−' : '+'}</span>
            <span>Plus</span>
          </button>
          {showMore && (
            <div className="sb-more-list">
              {MORE.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sb-sublink ${router.pathname === item.href ? 'sb-sub-on' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* User */}
        <div className="sb-foot">
          <div className="sb-user">
            <div className="sb-avatar">I</div>
            <div className="sb-user-info">
              <div className="sb-uname">Marwane</div>
              <div className="sb-handle">@ismaa_pxl</div>
            </div>
          </div>
        </div>
      </aside>

      {/* === MOBILE BAR === */}
      <header className="mob">
        <button className="mob-burger" onClick={() => setOpen(!open)} aria-label="Menu">
          <span /><span /><span />
        </button>
        <div className="mob-title">{title || 'Social Agent'}</div>
        <button
          className="mob-net"
          onClick={() => setNetwork(isLi ? 'twitter' : 'linkedin')}
          aria-label="Toggle network"
        >
          {isLi ? 'in' : '𝕏'}
        </button>
      </header>

      {open && <div className="mob-overlay" onClick={() => setOpen(false)} />}

      {/* === MAIN === */}
      <main className="main">
        {title && (
          <header className="page-head">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-sub">{subtitle}</p>}
          </header>
        )}
        <div className="page-body">{children}</div>
      </main>

      {/* === FLOATING PULSE BUTTON === */}
      {router.pathname !== '/agent' && (
        <Link href="/agent" className="pulse-fab" aria-label="Ouvrir Pulse, agent IA">
          <span className="pulse-fab-orb" />
          <span className="pulse-fab-label">Pulse</span>
        </Link>
      )}

      <style jsx>{`
        .shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg);
        }

        /* === SIDEBAR === */
        .sb {
          width: var(--sidebar-w);
          background: var(--bg);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 40;
          padding: 24px 14px;
          overflow-y: auto;
        }

        .sb-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 6px 22px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 18px;
        }
        .sb-logo {
          width: 32px;
          height: 32px;
          background: var(--bg-card);
          border: 1px solid var(--border-strong);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }
        .sb-logo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--net);
          box-shadow: 0 0 12px var(--net);
          animation: pulse-soft 2.4s ease-in-out infinite;
        }
        .sb-brand-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.012em;
          line-height: 1.2;
        }
        .sb-brand-sub {
          font-size: 10px;
          color: var(--net);
          font-family: var(--mono);
          margin-top: 1px;
        }

        /* === Network switcher (pill with sliding thumb) === */
        .sb-net {
          position: relative;
          display: flex;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 3px;
          margin-bottom: 24px;
        }
        .sb-net-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: calc(50% - 3px);
          height: calc(100% - 6px);
          background: var(--bg-surface);
          border-radius: 100px;
          transition: transform var(--t-med) var(--ease-snap);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .sb-net-thumb.thumb-right {
          transform: translateX(100%);
          background: var(--accent);
        }
        .sb-net-btn {
          flex: 1;
          padding: 6px 8px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-radius: 100px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          letter-spacing: -0.005em;
          position: relative;
          z-index: 1;
          transition: color var(--t-med) var(--ease);
        }
        .sb-net-on {
          color: var(--text);
        }
        .sb-net.thumb-right-active .sb-net-on { color: var(--accent-text-on); }
        :global(html[data-network="linkedin"]) .sb-net-on:nth-child(3) { color: #fff; }
        .sb-net-icon {
          font-weight: 800;
          font-size: 11px;
          font-family: var(--mono);
        }

        /* === Nav === */
        .sb-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sb-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
          border-radius: var(--r-md);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: -0.005em;
          position: relative;
          transition: background var(--t-fast) var(--ease), color var(--t-fast) var(--ease);
        }
        .sb-link:hover {
          background: var(--bg-card);
          color: var(--text);
        }
        .sb-on {
          color: var(--text);
          background: var(--bg-card);
          font-weight: 600;
        }
        .sb-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color var(--t-fast) var(--ease);
        }
        .sb-on .sb-icon { color: var(--net); }
        .sb-active-bar {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 18px;
          background: var(--net);
          border-radius: 0 3px 3px 0;
          margin-left: -14px;
        }

        /* More */
        .sb-more-wrap {
          margin-top: 16px;
        }
        .sb-more-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: var(--r-md);
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-family: var(--mono);
        }
        .sb-more-btn:hover { color: var(--text-secondary); background: var(--bg-card); }
        .sb-more-icon {
          width: 16px;
          font-size: 14px;
          text-align: center;
          font-family: var(--mono);
        }

        .sb-more-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding-top: 4px;
          animation: fade-in var(--t-fast) var(--ease) both;
        }
        .sb-sublink {
          padding: 7px 12px 7px 40px;
          font-size: 12px;
          color: var(--text-muted);
          border-radius: var(--r-sm);
          transition: color var(--t-fast) var(--ease), background var(--t-fast) var(--ease);
        }
        .sb-sublink:hover { color: var(--text-secondary); background: var(--bg-card); }
        .sb-sub-on { color: var(--text); background: var(--bg-card); }

        /* Foot */
        .sb-foot {
          margin-top: auto;
          padding-top: 18px;
          border-top: 1px solid var(--border);
        }
        .sb-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 6px;
        }
        .sb-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--net);
          color: var(--accent-text-on);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          transition: background var(--t-med) var(--ease);
        }
        .sb-user-info { min-width: 0; }
        .sb-uname { font-size: 12px; font-weight: 600; color: var(--text); }
        .sb-handle { font-size: 10px; color: var(--text-muted); font-family: var(--mono); }

        /* === MOBILE BAR === */
        .mob {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          background: rgba(10, 10, 11, 0.85);
          backdrop-filter: blur(20px) saturate(1.4);
          -webkit-backdrop-filter: blur(20px) saturate(1.4);
          border-bottom: 1px solid var(--border);
          padding: 0 14px;
          z-index: 30;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        :global(html[data-network="linkedin"]) .mob {
          background: rgba(8, 17, 28, 0.85);
        }
        .mob-burger {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px;
          margin-left: -8px;
        }
        .mob-burger span {
          width: 18px;
          height: 1.5px;
          background: var(--text);
          border-radius: 1px;
          transition: transform var(--t-fast) var(--ease);
        }
        .mob-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        .mob-net {
          width: 36px;
          height: 36px;
          background: var(--bg-card);
          border: 1px solid var(--border-strong);
          border-radius: var(--r-md);
          color: var(--net);
          font-size: 14px;
          font-weight: 700;
          font-family: var(--mono);
        }
        .mob-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 35;
          backdrop-filter: blur(3px);
          animation: fade-in var(--t-fast) var(--ease);
        }

        /* === MAIN === */
        .main {
          flex: 1;
          margin-left: var(--sidebar-w);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .page-head {
          padding: 36px 36px 8px;
          max-width: var(--content-max);
          margin: 0 auto;
          width: 100%;
        }
        .page-title {
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.028em;
          line-height: 1.15;
        }
        .page-sub {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 6px;
        }
        .page-body {
          padding: 18px 36px 80px;
          max-width: var(--content-max);
          margin: 0 auto;
          width: 100%;
        }

        /* === FLOATING PULSE BUTTON === */
        .pulse-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 50;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px 10px 12px;
          background: var(--accent);
          color: var(--accent-text-on);
          border-radius: 100px;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: -0.01em;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--accent-border);
          transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
        }
        .pulse-fab:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--accent);
        }
        .pulse-fab-orb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent-text-on);
          opacity: 0.85;
          animation: pulse-soft 2s ease-in-out infinite;
        }
        .pulse-fab-label { font-family: var(--font); }

        @media (max-width: 768px) {
          .sb {
            transform: translateX(-100%);
            transition: transform var(--t-med) var(--ease);
            width: 280px;
          }
          .sb-open { transform: translateX(0); box-shadow: 0 0 40px rgba(0, 0, 0, 0.6); }
          .mob { display: flex; }
          .mob-overlay { display: ${open ? 'block' : 'none'}; }
          .main { margin-left: 0; padding-top: 56px; }
          .page-head { padding: 24px 18px 4px; }
          .page-title { font-size: 22px; }
          .page-body { padding: 14px 18px 80px; }
          .pulse-fab { bottom: 16px; right: 16px; padding: 9px 14px 9px 10px; font-size: 12px; }
        }
      `}</style>
    </div>
  )
}

/* ==========================================================
   Inline icons — outline style, 16x16
   ========================================================== */

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? 'currentColor' : 'currentColor'
  const sw = active ? 1.8 : 1.6
  switch (name) {
    case 'sparkle':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
        </svg>
      )
    case 'compose':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      )
    case 'sun':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )
    case 'book':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      )
    case 'chart':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m7 14 4-4 3 3 5-5" />
        </svg>
      )
    case 'calendar':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      )
    case 'sprout':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 20h10" />
          <path d="M10 20c5.5-2.5.8-6.4 3-10" />
          <path d="M9.5 9.4C7.9 8.4 6 8 4 8c.4 4 2 5.6 5.5 5.5" />
          <path d="M14.1 6c.7-1.4 2.4-2.5 4.5-3-.3 2-1.5 3.5-3 4.4" />
        </svg>
      )
    default:
      return <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
  }
}
