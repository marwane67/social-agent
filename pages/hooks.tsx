import { useState, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { HOOKS, CATEGORIES, HookCategory, Hook } from '../lib/hooks'
import { FRAMEWORKS } from '../lib/frameworks'

type Network = 'twitter' | 'linkedin'
type Tab = 'hooks' | 'frameworks'

export default function HooksPage() {
  const router = useRouter()
  const [network, setNetwork] = useState<Network>('twitter')
  const [tab, setTab] = useState<Tab>('hooks')
  const [selectedCat, setSelectedCat] = useState<HookCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [filledHooks, setFilledHooks] = useState<Record<number, string>>({})

  const filtered = useMemo(() => {
    return HOOKS.filter(h => {
      if (selectedCat !== 'all' && h.category !== selectedCat) return false
      if (search && !h.text.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [selectedCat, search])

  const switchNetwork = (n: Network) => setNetwork(n)

  const copyHook = (h: Hook) => {
    const text = filledHooks[h.id]
      ? h.text.replace('___', filledHooks[h.id])
      : h.text
    navigator.clipboard.writeText(text)
    setCopied(h.id)
    setTimeout(() => setCopied(null), 1500)
  }

  const useHookInGenerator = (h: Hook) => {
    // Stocke le hook dans localStorage pour que la page index puisse l'utiliser
    localStorage.setItem('selected-hook', JSON.stringify({ id: h.id, text: h.text }))
    router.push('/')
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: HOOKS.length }
    for (const cat of Object.keys(CATEGORIES)) {
      c[cat] = HOOKS.filter(h => h.category === cat).length
    }
    return c
  }, [])

  return (
    <>
      <Head><title>Hooks & Frameworks — Social Agent</title></Head>
      <Layout network={network} onNetworkChange={switchNetwork} title="Hooks & Frameworks" subtitle="60 hooks viraux + 5 frameworks storytelling">
        <div className="page">
          {/* Tabs */}
          <div className="tabs">
            <button className={`tab ${tab === 'hooks' ? 'tab-on' : ''}`} onClick={() => setTab('hooks')}>
              Hooks ({HOOKS.length})
            </button>
            <button className={`tab ${tab === 'frameworks' ? 'tab-on' : ''}`} onClick={() => setTab('frameworks')}>
              Frameworks ({FRAMEWORKS.length})
            </button>
          </div>

          {tab === 'hooks' && (
            <>
              <div className="intro">
                Pioche un hook, copie-le, ou envoie-le directement dans le générateur.
                Les hooks avec <span className="blank">___</span> sont des templates à compléter.
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Chercher un hook..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search"
              />

              {/* Category pills */}
              <div className="cats">
                <button
                  className={`cat-pill ${selectedCat === 'all' ? 'cat-on' : ''}`}
                  onClick={() => setSelectedCat('all')}
                  style={selectedCat === 'all' ? { borderColor: '#fff', color: '#fff' } : {}}
                >
                  Tous · {counts.all}
                </button>
                {(Object.keys(CATEGORIES) as HookCategory[]).map(cat => (
                  <button
                    key={cat}
                    className={`cat-pill ${selectedCat === cat ? 'cat-on' : ''}`}
                    onClick={() => setSelectedCat(cat)}
                    style={selectedCat === cat ? { borderColor: CATEGORIES[cat].color, color: CATEGORIES[cat].color } : {}}
                  >
                    {CATEGORIES[cat].label} · {counts[cat]}
                  </button>
                ))}
              </div>

              {selectedCat !== 'all' && (
                <div className="cat-desc" style={{ borderLeftColor: CATEGORIES[selectedCat].color }}>
                  <strong>{CATEGORIES[selectedCat].label}</strong> — {CATEGORIES[selectedCat].desc}
                </div>
              )}

              {/* Hooks list */}
              <div className="hooks-list">
                {filtered.map(h => {
                  const cat = CATEGORIES[h.category]
                  const filled = filledHooks[h.id]
                  const previewText = h.template && filled
                    ? h.text.replace('___', filled)
                    : h.text
                  return (
                    <div key={h.id} className="hook">
                      <div className="hook-num" style={{ color: cat.color }}>#{h.id}</div>
                      <div className="hook-body">
                        <div className="hook-text">{previewText}</div>
                        <div className="hook-meta">
                          <span className="hook-cat" style={{ color: cat.color, borderColor: cat.color }}>
                            {cat.label}
                          </span>
                          {h.template && (
                            <input
                              type="text"
                              placeholder="Remplir le ___"
                              value={filled || ''}
                              onChange={e => setFilledHooks(prev => ({ ...prev, [h.id]: e.target.value }))}
                              className="hook-fill"
                            />
                          )}
                        </div>
                      </div>
                      <div className="hook-actions">
                        <button className="hook-btn" onClick={() => copyHook(h)}>
                          {copied === h.id ? 'Copié !' : 'Copier'}
                        </button>
                        <button className="hook-btn primary" onClick={() => useHookInGenerator(h)}>
                          Générer
                        </button>
                      </div>
                    </div>
                  )
                })}
                {filtered.length === 0 && <div className="empty">Aucun hook ne matche.</div>}
              </div>
            </>
          )}

          {tab === 'frameworks' && (
            <>
              <div className="intro">
                5 structures narratives pour tes posts longs (LinkedIn surtout).
                Clique sur "Utiliser" pour générer un post avec cette structure.
              </div>

              <div className="fw-list">
                {FRAMEWORKS.map(fw => (
                  <div key={fw.id} className="fw">
                    <div className="fw-head">
                      <h3>{fw.name}</h3>
                      <div className="fw-tags">
                        {fw.bestFor.map(n => (
                          <span key={n} className={`fw-tag fw-tag-${n}`}>{n === 'twitter' ? 'X' : 'LinkedIn'}</span>
                        ))}
                      </div>
                    </div>
                    <p className="fw-desc">{fw.desc}</p>
                    <div className="fw-steps">
                      {fw.steps.map((s, i) => (
                        <div key={i} className="fw-step">
                          <span className="fw-step-num">{i + 1}</span>
                          <div>
                            <div className="fw-step-name">{s.name}</div>
                            <div className="fw-step-exp">{s.explanation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      className="fw-use"
                      onClick={() => {
                        localStorage.setItem('selected-framework', fw.id)
                        router.push('/')
                      }}
                    >
                      Utiliser ce framework dans le générateur
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .page { display: flex; flex-direction: column; gap: 16px; }
          .tabs { display: flex; gap: 4px; }
          .tab { padding: 8px 16px; font-size: 13px; font-weight: 600; color: var(--muted); background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; }
          .tab:hover { border-color: var(--border2); }
          .tab-on { border-color: var(--text); color: var(--text); }

          .intro { font-size: 12px; color: var(--text2); padding: 10px 14px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
          .blank { font-family: var(--mono); background: rgba(251, 191, 36, .15); color: #fbbf24; padding: 1px 6px; border-radius: 3px; }

          .search { width: 100%; padding: 10px 14px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 13px; outline: none; font-family: var(--font); }
          .search:focus { border-color: var(--border2); }

          .cats { display: flex; flex-wrap: wrap; gap: 4px; }
          .cat-pill { padding: 4px 10px; font-size: 11px; font-weight: 600; color: var(--muted); background: var(--card); border: 1px solid var(--border); border-radius: 20px; cursor: pointer; font-family: var(--mono); }
          .cat-pill:hover { border-color: var(--border2); }
          .cat-on { background: var(--card2); }

          .cat-desc { font-size: 12px; color: var(--text2); padding: 8px 12px; background: var(--card); border-left: 3px solid; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }

          .hooks-list { display: flex; flex-direction: column; gap: 6px; }
          .hook { display: flex; gap: 10px; padding: 12px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); align-items: flex-start; }
          .hook:hover { border-color: var(--border2); }
          .hook-num { font-size: 11px; font-weight: 700; font-family: var(--mono); width: 32px; flex-shrink: 0; padding-top: 2px; }
          .hook-body { flex: 1; min-width: 0; }
          .hook-text { font-size: 14px; color: var(--text); line-height: 1.5; }
          .hook-meta { display: flex; gap: 8px; align-items: center; margin-top: 6px; flex-wrap: wrap; }
          .hook-cat { font-size: 9px; font-weight: 700; font-family: var(--mono); padding: 2px 8px; border-radius: 20px; border: 1px solid; text-transform: uppercase; letter-spacing: .05em; }
          .hook-fill { background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; font-size: 11px; color: var(--text); font-family: var(--mono); outline: none; min-width: 140px; }
          .hook-fill:focus { border-color: var(--border2); }

          .hook-actions { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
          .hook-btn { background: var(--card2); border: 1px solid var(--border); border-radius: 4px; padding: 4px 10px; font-size: 10px; font-weight: 600; color: var(--text2); cursor: pointer; font-family: var(--mono); white-space: nowrap; }
          .hook-btn:hover { border-color: var(--border2); }
          .hook-btn.primary { background: var(--text); color: var(--bg); border-color: var(--text); }

          .empty { text-align: center; color: var(--muted); font-size: 12px; padding: 32px; }

          /* Frameworks */
          .fw-list { display: flex; flex-direction: column; gap: 12px; }
          .fw { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
          .fw-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
          .fw h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); }
          .fw-tags { display: flex; gap: 4px; }
          .fw-tag { font-size: 9px; font-weight: 700; font-family: var(--mono); padding: 2px 6px; border-radius: 3px; text-transform: uppercase; }
          .fw-tag-twitter { background: rgba(29, 161, 242, .15); color: #1da1f2; }
          .fw-tag-linkedin { background: rgba(10, 102, 194, .15); color: #0a66c2; }
          .fw-desc { font-size: 13px; color: var(--text2); margin: 0 0 12px; line-height: 1.5; }
          .fw-steps { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
          .fw-step { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; background: var(--bg); border-radius: var(--radius-sm); }
          .fw-step-num { font-size: 12px; font-weight: 800; font-family: var(--mono); color: var(--accent); width: 20px; flex-shrink: 0; }
          .fw-step-name { font-size: 12px; font-weight: 700; color: var(--text); }
          .fw-step-exp { font-size: 11px; color: var(--muted); margin-top: 2px; }
          .fw-use { width: 100%; padding: 10px; background: var(--text); color: var(--bg); border: none; border-radius: var(--radius-sm); font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--font); }
          .fw-use:hover { opacity: .9; }
        `}</style>
      </Layout>
    </>
  )
}
