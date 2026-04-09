import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

type Network = 'twitter' | 'linkedin'

const NAV_ITEMS = [
  { href: '/', label: 'Posts', icon: 'P' },
  { href: '/reply', label: 'Reply', icon: 'R' },
  { href: '/tools', label: 'Tools', icon: 'T' },
  { href: '/schedule', label: 'Schedule', icon: 'S' },
  { href: '/growth', label: 'Growth', icon: 'G' },
  { href: '/dashboard', label: 'Dashboard', icon: 'D' },
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
  const [mobileNav, setMobileNav] = useState(false)

  const accent = network === 'linkedin' ? 'var(--li)' : 'var(--accent)'

  return (
    <div className="layout">
      {/* Top Bar */}
      <nav className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <div className="brand">
              <div className="brand-icon" style={{ background: accent, color: network === 'linkedin' ? '#fff' : '#000' }}>
                {network === 'twitter' ? 'X' : 'in'}
              </div>
              <div className="brand-text">
                <span className="brand-name">Social Agent</span>
                <span className="brand-sub">@ismaa_pxl</span>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="nav-links">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${router.pathname === item.href ? 'nav-active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="topbar-right">
            {/* Network toggle */}
            <div className="net-toggle">
              <button
                className={`net-btn ${network === 'twitter' ? 'net-on' : ''}`}
                onClick={() => onNetworkChange('twitter')}
              >
                X
              </button>
              <button
                className={`net-btn ${network === 'linkedin' ? 'net-on net-li' : ''}`}
                onClick={() => onNetworkChange('linkedin')}
              >
                in
              </button>
            </div>

            {/* Mobile hamburger */}
            <button className="hamburger" onClick={() => setMobileNav(!mobileNav)}>
              {mobileNav ? 'X' : '='}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNav && (
          <div className="mobile-nav">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-link ${router.pathname === item.href ? 'mobile-active' : ''}`}
                onClick={() => setMobileNav(false)}
              >
                <span className="mobile-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Page header */}
      {title && (
        <div className="page-header">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      )}

      {/* Content */}
      <main className="content">{children}</main>

      {/* Footer */}
      <footer className="foot">Pixel Company · Ismaa · Brussels</footer>

      <style jsx>{`
        .layout { min-height:100vh; background:var(--bg); }

        /* Topbar */
        .topbar { position:sticky; top:0; z-index:50; background:rgba(9,9,11,0.85); backdrop-filter:blur(12px); border-bottom:1px solid var(--border); }
        .topbar-inner { max-width:800px; margin:0 auto; padding:0 20px; height:52px; display:flex; align-items:center; justify-content:space-between; }
        .topbar-left { display:flex; align-items:center; gap:24px; }
        .topbar-right { display:flex; align-items:center; gap:10px; }

        .brand { display:flex; align-items:center; gap:8px; }
        .brand-icon { width:28px; height:28px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:900; flex-shrink:0; }
        .brand-text { display:flex; flex-direction:column; }
        .brand-name { font-size:13px; font-weight:800; color:var(--text); line-height:1.2; }
        .brand-sub { font-size:9px; color:var(--muted); font-family:var(--mono); }

        .nav-links { display:flex; gap:2px; }
        .nav-link { padding:6px 10px; font-size:12px; font-weight:600; color:var(--muted); border-radius:6px; transition:all .15s; }
        .nav-link:hover { color:var(--text2); background:var(--card); }
        .nav-active { color:var(--text); background:var(--card2); }

        .net-toggle { display:flex; background:var(--card); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
        .net-btn { padding:5px 10px; font-size:11px; font-weight:800; color:var(--muted); background:transparent; border:none; cursor:pointer; transition:all .15s; }
        .net-on { color:#fff; background:var(--card2); }
        .net-li { color:var(--li); }

        .hamburger { display:none; background:var(--card); border:1px solid var(--border); border-radius:6px; padding:4px 8px; font-size:14px; font-weight:900; color:var(--text2); cursor:pointer; }

        .mobile-nav { display:none; padding:8px 20px 12px; border-top:1px solid var(--border); }
        .mobile-link { display:flex; align-items:center; gap:8px; padding:8px 10px; font-size:13px; font-weight:600; color:var(--muted); border-radius:8px; }
        .mobile-active { color:var(--text); background:var(--card); }
        .mobile-icon { width:20px; height:20px; background:var(--card2); border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; font-family:var(--mono); }

        /* Page header */
        .page-header { max-width:800px; margin:0 auto; padding:24px 20px 0; }
        .page-title { font-size:20px; font-weight:800; color:var(--text); letter-spacing:-0.02em; }
        .page-subtitle { font-size:12px; color:var(--muted); margin-top:2px; }

        /* Content */
        .content { max-width:800px; margin:0 auto; padding:16px 20px 40px; }

        /* Footer */
        .foot { text-align:center; font-size:10px; color:var(--border); font-family:var(--mono); padding:20px; }

        @media (max-width:700px) {
          .nav-links { display:none; }
          .hamburger { display:block; }
          .mobile-nav { display:flex; flex-direction:column; gap:2px; }
          .topbar-inner { padding:0 12px; }
          .content { padding:12px 12px 40px; }
          .page-header { padding:16px 12px 0; }
        }
      `}</style>
    </div>
  )
}
