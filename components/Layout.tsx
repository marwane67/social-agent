import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

type Network = 'twitter' | 'linkedin'

// 6 sections principales — tout le reste accessible via /more
const NAV = [
  { href: '/', label: 'Compose', short: 'C' },
  { href: '/brief', label: 'Brief du jour', short: 'B' },
  { href: '/library', label: 'Library', short: 'L' },
  { href: '/analytics', label: 'Analytics', short: 'A' },
  { href: '/plan', label: 'Plan', short: 'P' },
  { href: '/grow', label: 'Grow', short: 'G' },
]

const MORE = [
  { href: '/voice', label: 'Ma voix' },
  { href: '/bio', label: 'Bio' },
  { href: '/reply', label: 'Reply' },
  { href: '/tools', label: 'Tools' },
  { href: '/newsletter', label: 'Newsletter' },
  { href: '/more', label: 'Tout voir' },
]

type Props = {
  children: React.ReactNode
  network: Network
  onNetworkChange: (n: Network) => void
  title?: string
  subtitle?: string
}

export default function Layout({ children, network, onNetworkChange, title, subtitle }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const isLi = network === 'linkedin'

  // Close mobile menu on route change
  useEffect(() => {
    const close = () => setOpen(false)
    router.events?.on('routeChangeStart', close)
    return () => router.events?.off('routeChangeStart', close)
  }, [router.events])

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className={`sb ${open ? 'sb-open' : ''}`}>
        {/* Brand */}
        <div className="sb-brand">
          <div className="sb-mark">●</div>
          <div className="sb-name">Social Agent</div>
        </div>

        {/* Network switcher */}
        <div className="sb-net">
          <button
            className={`sb-net-btn ${!isLi ? 'sb-net-on' : ''}`}
            onClick={() => onNetworkChange('twitter')}
          >
            Twitter
          </button>
          <button
            className={`sb-net-btn ${isLi ? 'sb-net-on sb-net-li' : ''}`}
            onClick={() => onNetworkChange('linkedin')}
          >
            LinkedIn
          </button>
        </div>

        {/* Main nav */}
        <nav className="sb-nav">
          {NAV.map(item => {
            const active = router.pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={`sb-link ${active ? 'sb-on' : ''}`}>
                <span className="sb-dot-mark">{active ? '●' : '○'}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* More section */}
        <div className="sb-more-wrap">
          <button className="sb-more-btn" onClick={() => setShowMore(!showMore)}>
            <span>{showMore ? '−' : '+'}</span>
            <span>Plus</span>
          </button>
          {showMore && (
            <div className="sb-more-list">
              {MORE.map(item => (
                <Link key={item.href} href={item.href} className={`sb-sublink ${router.pathname === item.href ? 'sb-sub-on' : ''}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="sb-foot">
          <div className="sb-user">
            <div className="sb-avatar">I</div>
            <div>
              <div className="sb-uname">Ismaa</div>
              <div className="sb-handle">@ismaa_pxl</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="mob">
        <button className="mob-burger" onClick={() => setOpen(!open)} aria-label="Menu">
          <span /><span /><span />
        </button>
        <div className="mob-title">{title || 'Social Agent'}</div>
        <button
          className={`mob-net ${isLi ? 'mob-net-li' : ''}`}
          onClick={() => onNetworkChange(isLi ? 'twitter' : 'linkedin')}
          aria-label="Toggle network"
        >
          {isLi ? 'in' : 'X'}
        </button>
      </div>

      {open && <div className="mob-overlay" onClick={() => setOpen(false)} />}

      {/* Main */}
      <main className="main">
        {title && (
          <header className="page-head">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-sub">{subtitle}</p>}
          </header>
        )}
        <div className="page-body">{children}</div>
      </main>

      <style jsx>{`
        .shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg);
        }

        /* === Sidebar === */
        .sb {
          width: var(--sidebar-w);
          background: var(--bg);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 40;
          padding: 20px 12px;
          overflow-y: auto;
        }

        .sb-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 8px 20px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 16px;
        }
        .sb-mark {
          font-size: 14px;
          color: ${isLi ? 'var(--linkedin)' : 'var(--text)'};
          line-height: 1;
        }
        .sb-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.01em;
        }

        .sb-net {
          display: flex;
          background: var(--card);
          border-radius: var(--r-sm);
          padding: 3px;
          margin-bottom: 16px;
        }
        .sb-net-btn {
          flex: 1;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-radius: 4px;
          letter-spacing: -0.005em;
        }
        .sb-net-on {
          background: var(--surface);
          color: var(--text);
        }
        .sb-net-li {
          background: rgba(10, 102, 194, 0.15);
          color: var(--linkedin);
        }

        .sb-nav {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 0 0 auto;
        }
        .sb-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: var(--r-sm);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: -0.005em;
        }
        .sb-link:hover {
          background: var(--card);
          color: var(--text);
        }
        .sb-on {
          color: var(--text);
          background: var(--card);
          font-weight: 600;
        }
        .sb-dot-mark {
          font-size: 8px;
          color: var(--text-faint);
          width: 12px;
          text-align: center;
        }
        .sb-on .sb-dot-mark {
          color: ${isLi ? 'var(--linkedin)' : 'var(--text)'};
        }

        .sb-more-wrap {
          margin-top: 12px;
        }
        .sb-more-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: transparent;
          border: none;
          border-radius: var(--r-sm);
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: var(--mono);
        }
        .sb-more-btn:hover { color: var(--text-secondary); }
        .sb-more-btn span:first-child {
          width: 12px;
          text-align: center;
          font-family: var(--mono);
        }

        .sb-more-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding-top: 4px;
        }
        .sb-sublink {
          padding: 6px 10px 6px 32px;
          font-size: 12px;
          color: var(--text-muted);
          border-radius: var(--r-sm);
        }
        .sb-sublink:hover {
          color: var(--text-secondary);
          background: var(--card);
        }
        .sb-sub-on {
          color: var(--text);
          background: var(--card);
        }

        .sb-foot {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .sb-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 8px;
        }
        .sb-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${isLi ? 'var(--linkedin)' : 'var(--surface)'};
          color: ${isLi ? '#fff' : 'var(--text)'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .sb-uname { font-size: 12px; font-weight: 600; color: var(--text); }
        .sb-handle { font-size: 10px; color: var(--text-muted); font-family: var(--mono); }

        /* === Mobile bar === */
        .mob {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 52px;
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          padding: 0 14px;
          z-index: 30;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .mob-burger {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px;
        }
        .mob-burger span {
          width: 18px;
          height: 1.5px;
          background: var(--text);
          border-radius: 1px;
        }
        .mob-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }
        .mob-net {
          width: 32px;
          height: 32px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          color: var(--text);
          font-size: 12px;
          font-weight: 700;
        }
        .mob-net-li {
          background: rgba(10, 102, 194, 0.15);
          color: var(--linkedin);
          border-color: rgba(10, 102, 194, 0.3);
        }
        .mob-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 35;
          backdrop-filter: blur(2px);
        }

        /* === Main === */
        .main {
          flex: 1;
          margin-left: var(--sidebar-w);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .page-head {
          padding: 32px 32px 8px;
          max-width: var(--content-max);
          margin: 0 auto;
          width: 100%;
        }
        .page-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.025em;
        }
        .page-sub {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .page-body {
          padding: 16px 32px 64px;
          max-width: var(--content-max);
          margin: 0 auto;
          width: 100%;
        }

        @media (max-width: 768px) {
          .sb {
            transform: translateX(-100%);
            transition: transform 0.22s ease;
            width: 260px;
          }
          .sb-open { transform: translateX(0); }
          .mob { display: flex; }
          .mob-overlay { display: ${open ? 'block' : 'none'}; }
          .main { margin-left: 0; padding-top: 52px; }
          .page-head { padding: 20px 16px 4px; }
          .page-body { padding: 12px 16px 64px; }
        }
      `}</style>
    </div>
  )
}
