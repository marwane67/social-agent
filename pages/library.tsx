import { useState, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { HOOKS, CATEGORIES, HookCategory, Hook } from '../lib/hooks'
import { FRAMEWORKS } from '../lib/frameworks'

type Network = 'twitter' | 'linkedin'
type Tab = 'hooks' | 'frameworks' | 'swipe'

export default function LibraryPage() {
  const router = useRouter()
  const [network, setNetwork] = useState<Network>('twitter')
  const [tab, setTab] = useState<Tab>('hooks')
  const [selectedCat, setSelectedCat] = useState<HookCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [filledHooks, setFilledHooks] = useState<Record<number, string>>({})

  const filtered = useMemo(() => {
    return HOOKS.filter(h => {
      if (selectedCat !== 'all' && h.category !== selectedCat) return false
      if (search && !h.text.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [selectedCat, search])

  const useHook = (h: Hook) => {
    const text = filledHooks[h.id] ? h.text.replace('___', filledHooks[h.id]) : h.text
    localStorage.setItem('selected-hook', JSON.stringify({ id: h.id, text }))
    router.push('/')
  }

  const useFramework = (id: string) => {
    localStorage.setItem('selected-framework', id)
    router.push('/')
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <>
      <Head><title>Library — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Library" subtitle="Hooks, frameworks & swipe">
        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === 'hooks' ? 'on' : ''}`} onClick={() => setTab('hooks')}>
            Hooks <span className="tab-count">{HOOKS.length}</span>
          </button>
          <button className={`tab ${tab === 'frameworks' ? 'on' : ''}`} onClick={() => setTab('frameworks')}>
            Frameworks <span className="tab-count">{FRAMEWORKS.length}</span>
          </button>
          <button className={`tab ${tab === 'swipe' ? 'on' : ''}`} onClick={() => setTab('swipe')}>
            Swipe File
          </button>
        </div>

        {tab === 'hooks' && (
          <>
            <input
              type="text"
              placeholder="Chercher un hook..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search"
            />

            <div className="cats">
              <button className={`cat ${selectedCat === 'all' ? 'cat-on' : ''}`} onClick={() => setSelectedCat('all')}>
                Tous
              </button>
              {(Object.keys(CATEGORIES) as HookCategory[]).map(cat => (
                <button
                  key={cat}
                  className={`cat ${selectedCat === cat ? 'cat-on' : ''}`}
                  onClick={() => setSelectedCat(cat)}
                  style={selectedCat === cat ? { borderColor: CATEGORIES[cat].color } : {}}
                >
                  {CATEGORIES[cat].label}
                </button>
              ))}
            </div>

            <div className="list">
              {filtered.map(h => {
                const cat = CATEGORIES[h.category]
                const filled = filledHooks[h.id]
                const preview = h.template && filled ? h.text.replace('___', filled) : h.text
                return (
                  <div key={h.id} className="row">
                    <span className="row-num">#{h.id}</span>
                    <div className="row-body">
                      <div className="row-text">{preview}</div>
                      {h.template && (
                        <input
                          type="text"
                          placeholder="Remplir le ___"
                          value={filled || ''}
                          onChange={e => setFilledHooks(prev => ({ ...prev, [h.id]: e.target.value }))}
                          className="row-fill"
                        />
                      )}
                      <span className="row-cat" style={{ color: cat.color }}>{cat.label}</span>
                    </div>
                    <div className="row-actions">
                      <button className="row-btn" onClick={() => copy(`h-${h.id}`, preview)}>
                        {copied === `h-${h.id}` ? '✓' : 'Copier'}
                      </button>
                      <button className="row-btn primary" onClick={() => useHook(h)}>
                        Utiliser →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab === 'frameworks' && (
          <div className="frameworks">
            {FRAMEWORKS.map(fw => (
              <div key={fw.id} className="fw">
                <div className="fw-head">
                  <h3>{fw.name}</h3>
                  <div className="fw-tags">
                    {fw.bestFor.map(n => <span key={n} className={`fw-tag tag-${n}`}>{n === 'twitter' ? 'X' : 'LI'}</span>)}
                  </div>
                </div>
                <p className="fw-desc">{fw.desc}</p>
                <ol className="fw-steps">
                  {fw.steps.map((s, i) => (
                    <li key={i}>
                      <strong>{s.name}</strong> — <span>{s.explanation}</span>
                    </li>
                  ))}
                </ol>
                <button className="fw-use" onClick={() => useFramework(fw.id)}>
                  Utiliser ce framework →
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'swipe' && (
          <div className="swipe-empty">
            <p>La Swipe File classique reste sur <button onClick={() => router.push('/swipe')} className="lnk">/swipe</button>.</p>
            <p className="muted">À venir ici : import direct depuis tes top posts trackés.</p>
          </div>
        )}

        <style jsx>{`
          .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--border); }
          .tab {
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            padding: 10px 14px;
            font-size: 13px;
            color: var(--text-muted);
            font-weight: 500;
            margin-bottom: -1px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .tab:hover { color: var(--text-secondary); }
          .tab.on { color: var(--text); border-bottom-color: var(--text); font-weight: 600; }
          .tab-count {
            font-family: var(--mono);
            font-size: 10px;
            color: var(--text-faint);
            background: var(--card);
            padding: 1px 6px;
            border-radius: 100px;
          }

          .search {
            width: 100%;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-md);
            color: var(--text);
            font-size: 13px;
            padding: 10px 14px;
            margin-bottom: 12px;
          }

          .cats { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 16px; }
          .cat {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-muted);
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 100px;
            font-weight: 500;
          }
          .cat:hover { color: var(--text-secondary); border-color: var(--border-strong); }
          .cat-on { color: var(--text); }

          .list { display: flex; flex-direction: column; gap: 4px; }
          .row {
            display: flex;
            gap: 12px;
            padding: 12px 14px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-md);
            align-items: flex-start;
          }
          .row:hover { border-color: var(--border-strong); }
          .row-num {
            font-size: 11px;
            font-weight: 700;
            font-family: var(--mono);
            color: var(--text-faint);
            width: 28px;
            flex-shrink: 0;
            padding-top: 2px;
          }
          .row-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
          .row-text { font-size: 14px; color: var(--text); line-height: 1.5; }
          .row-fill {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: var(--r-sm);
            color: var(--text);
            font-size: 11px;
            padding: 3px 8px;
            font-family: var(--mono);
            max-width: 220px;
          }
          .row-cat {
            font-size: 9px;
            font-weight: 700;
            font-family: var(--mono);
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          .row-actions { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
          .row-btn {
            background: var(--card);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 11px;
            padding: 4px 10px;
            border-radius: var(--r-sm);
            font-family: var(--mono);
          }
          .row-btn:hover { color: var(--text); border-color: var(--border-strong); }
          .row-btn.primary { background: var(--text); color: var(--bg); border-color: var(--text); }

          .frameworks { display: flex; flex-direction: column; gap: 12px; }
          .fw {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-lg);
            padding: 18px;
          }
          .fw-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
          .fw h3 { font-size: 16px; font-weight: 700; color: var(--text); margin: 0; }
          .fw-tags { display: flex; gap: 4px; flex-shrink: 0; }
          .fw-tag {
            font-size: 9px;
            font-weight: 700;
            font-family: var(--mono);
            padding: 2px 6px;
            border-radius: 3px;
            text-transform: uppercase;
          }
          .tag-twitter { background: var(--surface); color: var(--text); }
          .tag-linkedin { background: rgba(10, 102, 194, 0.15); color: var(--linkedin); }
          .fw-desc { font-size: 13px; color: var(--text-secondary); margin: 8px 0 12px; }
          .fw-steps {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
            counter-reset: step;
          }
          .fw-steps li {
            counter-increment: step;
            font-size: 12px;
            color: var(--text-secondary);
            padding: 6px 10px 6px 32px;
            background: var(--bg);
            border-radius: var(--r-sm);
            position: relative;
          }
          .fw-steps li::before {
            content: counter(step);
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            font-family: var(--mono);
            font-weight: 700;
            color: var(--text-faint);
            font-size: 11px;
          }
          .fw-steps strong { color: var(--text); font-weight: 600; }
          .fw-use {
            margin-top: 14px;
            background: var(--text);
            color: var(--bg);
            border: none;
            padding: 10px 14px;
            border-radius: var(--r-md);
            font-size: 12px;
            font-weight: 600;
          }
          .fw-use:hover { background: #fff; }

          .swipe-empty { padding: 32px; text-align: center; color: var(--text-secondary); }
          .swipe-empty .muted { color: var(--text-muted); font-size: 12px; margin-top: 8px; }
          .lnk { background: transparent; border: none; color: var(--text); text-decoration: underline; padding: 0; font-family: var(--mono); }
        `}</style>
      </Layout>
    </>
  )
}
