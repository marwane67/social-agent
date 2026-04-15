import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

type Network = 'twitter' | 'linkedin'

const NAV = [
  { href: '/', label: 'Posts', emoji: 'P' },
  { href: '/reply', label: 'Reply', emoji: 'R' },
  { href: '/tools', label: 'Tools', emoji: 'T' },
  { href: '/swipe', label: 'Swipe File', emoji: 'F' },
  { href: '/schedule', label: 'Schedule', emoji: 'S' },
  { href: '/prospects', label: 'Prospects', emoji: 'Q' },
  { href: '/outreach', label: 'Outreach', emoji: 'O' },
  { href: '/growth', label: 'Growth', emoji: 'G' },
  { href: '/dashboard', label: 'Dashboard', emoji: 'D' },
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
  const isLi = network === 'linkedin'

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sb-top">
          <div className="sb-brand">
            <div className={`sb-logo ${isLi ? 'sb-logo-li' : ''}`}>{isLi ? 'in' : 'X'}</div>
            <div>
              <div className="sb-name">Social Agent</div>
              <div className="sb-handle">@ismaa_pxl</div>
            </div>
          </div>

          <div className="sb-net">
            <button className={`sb-net-btn ${!isLi ? 'sb-net-on' : ''}`} onClick={() => onNetworkChange('twitter')}>Twitter</button>
            <button className={`sb-net-btn ${isLi ? 'sb-net-on sb-net-li' : ''}`} onClick={() => onNetworkChange('linkedin')}>LinkedIn</button>
          </div>
        </div>

        <nav className="sb-nav">
          {NAV.map(item => {
            const active = router.pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={`sb-link ${active ? 'sb-active' : ''}`} onClick={() => setOpen(false)}>
                <span className={`sb-icon ${active ? (isLi ? 'sb-icon-li' : 'sb-icon-on') : ''}`}>{item.emoji}</span>
                <span className="sb-label">{item.label}</span>
                {active && <span className="sb-dot" />}
              </Link>
            )
          })}
        </nav>

        <div className="sb-foot">Pixel Company · Brussels</div>
      </aside>

      {/* Mobile topbar */}
      <div className="mobile-bar">
        <button className="burger" onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
        <div className="mb-title">{title || 'Social Agent'}</div>
        <div className="mb-net">
          <button className={`mn-btn ${!isLi ? 'mn-on' : ''}`} onClick={() => onNetworkChange('twitter')}>X</button>
          <button className={`mn-btn ${isLi ? 'mn-on mn-li' : ''}`} onClick={() => onNetworkChange('linkedin')}>in</button>
        </div>
      </div>

      {/* Overlay */}
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      {/* Main content */}
      <main className="main">
        {title && (
          <div className="page-head">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-sub">{subtitle}</p>}
          </div>
        )}
        <div className="page-body">{children}</div>
      </main>

      <style jsx>{`
        .shell { display:flex; min-height:100vh; background:#09090b; }

        /* Sidebar */
        .sidebar { width:220px; background:#0e0e11; border-right:1px solid #1c1c22; display:flex; flex-direction:column; position:fixed; top:0; left:0; bottom:0; z-index:40; }
        .sb-top { padding:20px 16px 12px; border-bottom:1px solid #1c1c22; }
        .sb-brand { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
        .sb-logo { width:32px; height:32px; background:#fff; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:900; color:#000; flex-shrink:0; }
        .sb-logo-li { background:#0a66c2; color:#fff; }
        .sb-name { font-size:14px; font-weight:700; color:#fafafa; }
        .sb-handle { font-size:10px; color:#52525b; font-family:'JetBrains Mono',monospace; }

        .sb-net { display:flex; gap:4px; background:#18181b; border-radius:8px; padding:3px; }
        .sb-net-btn { flex:1; padding:6px; font-size:11px; font-weight:600; color:#52525b; background:transparent; border:none; border-radius:6px; cursor:pointer; text-align:center; transition:all .15s; }
        .sb-net-on { background:#27272a; color:#fafafa; }
        .sb-net-li { background:rgba(10,102,194,.15); color:#3b9eff; }

        .sb-nav { flex:1; padding:8px; display:flex; flex-direction:column; gap:2px; }
        .sb-link { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; text-decoration:none; color:#71717a; transition:all .12s; position:relative; }
        .sb-link:hover { background:#18181b; color:#a1a1aa; }
        .sb-active { background:#18181b; color:#fafafa; }
        .sb-icon { width:26px; height:26px; background:#18181b; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; font-family:'JetBrains Mono',monospace; color:#52525b; flex-shrink:0; }
        .sb-icon-on { background:rgba(57,255,20,.1); color:#39ff14; }
        .sb-icon-li { background:rgba(10,102,194,.12); color:#3b9eff; }
        .sb-label { font-size:13px; font-weight:500; }
        .sb-dot { position:absolute; right:10px; width:5px; height:5px; border-radius:50%; background:${isLi ? '#3b9eff' : '#39ff14'}; }

        .sb-foot { padding:12px 16px; font-size:9px; color:#27272a; font-family:'JetBrains Mono',monospace; border-top:1px solid #1c1c22; }

        /* Mobile bar */
        .mobile-bar { display:none; position:fixed; top:0; left:0; right:0; height:50px; background:rgba(14,14,17,.92); backdrop-filter:blur(12px); border-bottom:1px solid #1c1c22; z-index:30; padding:0 12px; align-items:center; justify-content:space-between; }
        .burger { background:none; border:none; cursor:pointer; display:flex; flex-direction:column; gap:4px; padding:4px; }
        .burger span { display:block; width:18px; height:2px; background:#a1a1aa; border-radius:1px; }
        .mb-title { font-size:14px; font-weight:700; color:#fafafa; }
        .mb-net { display:flex; background:#18181b; border-radius:6px; overflow:hidden; }
        .mn-btn { padding:4px 10px; font-size:11px; font-weight:800; color:#52525b; background:transparent; border:none; cursor:pointer; }
        .mn-on { background:#27272a; color:#fafafa; }
        .mn-li { color:#3b9eff; }

        .overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:35; }

        /* Main */
        .main { flex:1; margin-left:220px; min-height:100vh; }
        .page-head { padding:28px 32px 0; }
        .page-title { font-size:22px; font-weight:800; color:#fafafa; letter-spacing:-.02em; }
        .page-sub { font-size:13px; color:#52525b; margin-top:2px; }
        .page-body { padding:16px 32px 48px; }

        @media (max-width:768px) {
          .sidebar { transform:translateX(-100%); transition:transform .2s ease; width:260px; }
          .sidebar-open { transform:translateX(0); }
          .mobile-bar { display:flex; }
          .overlay { display:block; }
          .main { margin-left:0; padding-top:50px; }
          .page-head { padding:20px 16px 0; }
          .page-body { padding:12px 16px 48px; }
        }
      `}</style>
    </div>
  )
}
