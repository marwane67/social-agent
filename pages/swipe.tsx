import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

type Network = 'twitter' | 'linkedin'
type SwipeEntry = { id: string; text: string; author: string; why: string; network: Network; tags: string[]; date: string; rating: number }

export default function SwipePage() {
  const [network, setNetwork] = useState<Network>('twitter')
  const [entries, setEntries] = useState<SwipeEntry[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newText, setNewText] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newWhy, setNewWhy] = useState('')
  const [newTags, setNewTags] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => { try { const s = localStorage.getItem('sa-swipe'); if (s) setEntries(JSON.parse(s)) } catch {} }, [])
  const save = (u: SwipeEntry[]) => { setEntries(u); localStorage.setItem('sa-swipe', JSON.stringify(u)) }

  const addEntry = () => {
    if (!newText.trim()) return
    save([{
      id: Date.now().toString(), text: newText, author: newAuthor, why: newWhy,
      network, tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), rating: 0,
    }, ...entries])
    setNewText(''); setNewAuthor(''); setNewWhy(''); setNewTags(''); setShowAdd(false)
  }

  const filtered = entries.filter(e => e.network === network && (!filter || e.tags.some(t => t.toLowerCase().includes(filter.toLowerCase())) || e.author.toLowerCase().includes(filter.toLowerCase())))
  const allTags = Array.from(new Set(entries.filter(e => e.network === network).flatMap(e => e.tags)))
  const accent = network === 'linkedin' ? 'var(--li)' : 'var(--accent)'

  return (
    <>
      <Head><title>Swipe File — Marwane</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <Layout network={network} onNetworkChange={setNetwork} title="Swipe File" subtitle={`${filtered.length} posts sauvegardés pour inspiration`}>
        <div className="pc">
          <div className="top-row">
            <button className="add-btn" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Annuler' : '+ Sauvegarder un post'}</button>
            <input className="search" placeholder="Filtrer par tag ou auteur..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>

          {allTags.length > 0 && (
            <div className="tags-row">
              <button className={`tag-btn ${!filter ? 'tag-on' : ''}`} onClick={() => setFilter('')}>Tous</button>
              {allTags.map(tag => (
                <button key={tag} className={`tag-btn ${filter === tag ? 'tag-on' : ''}`} onClick={() => setFilter(filter === tag ? '' : tag)}>{tag}</button>
              ))}
            </div>
          )}

          {showAdd && (
            <div className="add-panel">
              <textarea className="input" placeholder="Colle le post qui t'a inspiré..." value={newText} onChange={e => setNewText(e.target.value)} rows={4} />
              <input className="input-sm" placeholder="Auteur (@handle ou nom)" value={newAuthor} onChange={e => setNewAuthor(e.target.value)} />
              <input className="input-sm" placeholder="Pourquoi il marche ? (hook, structure, ton...)" value={newWhy} onChange={e => setNewWhy(e.target.value)} />
              <input className="input-sm" placeholder="Tags (séparés par virgule : hook, storytelling, données...)" value={newTags} onChange={e => setNewTags(e.target.value)} />
              <button className="save-btn" onClick={addEntry}>Sauvegarder</button>
            </div>
          )}

          {filtered.length === 0 && <div className="empty">Pas encore de posts sauvegardés. Quand tu vois un post qui cartonne, sauvegarde-le ici pour t'en inspirer.</div>}

          {filtered.map(entry => (
            <div key={entry.id} className="swipe-card">
              <div className="sc-header">
                <span className="sc-author">{entry.author || 'Anonyme'}</span>
                <span className="sc-date">{entry.date}</span>
                <div className="sc-stars">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} className={`star ${entry.rating >= n ? 'star-on' : ''}`}
                      onClick={() => save(entries.map(e => e.id === entry.id ? { ...e, rating: n } : e))}>*</button>
                  ))}
                </div>
                <button className="del" onClick={() => save(entries.filter(e => e.id !== entry.id))}>x</button>
              </div>
              <div className="sc-text">{entry.text}</div>
              {entry.why && <div className="sc-why">{entry.why}</div>}
              {entry.tags.length > 0 && (
                <div className="sc-tags">{entry.tags.map(t => <span key={t} className="sc-tag">{t}</span>)}</div>
              )}
            </div>
          ))}
        </div>

        <style jsx>{`
          .pc { display:flex; flex-direction:column; gap:10px; }
          .top-row { display:flex; gap:8px; align-items:center; }
          .add-btn { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:7px 14px; font-size:12px; font-weight:600; color:var(--text2); cursor:pointer; white-space:nowrap; flex-shrink:0; }
          .add-btn:hover { border-color:${accent}; color:${accent}; }
          .search { flex:1; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:7px 10px; font-size:12px; color:var(--text); outline:none; }

          .tags-row { display:flex; gap:4px; flex-wrap:wrap; }
          .tag-btn { background:var(--card); border:1px solid var(--border); border-radius:20px; padding:3px 10px; font-size:10px; color:var(--muted); cursor:pointer; font-weight:500; }
          .tag-btn:hover { border-color:var(--border2); }
          .tag-on { border-color:${accent}; color:${accent}; background:${network === 'linkedin' ? 'var(--li-dim)' : 'var(--accent-dim)'}; }

          .add-panel { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:12px; display:flex; flex-direction:column; gap:6px; }
          .input { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-size:13px; padding:10px; resize:none; outline:none; line-height:1.6; }
          .input-sm { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); padding:7px 10px; font-size:12px; outline:none; }
          .save-btn { background:${accent}; color:${network === 'linkedin' ? '#fff' : '#000'}; border:none; border-radius:var(--radius-sm); padding:8px; font-size:13px; font-weight:700; cursor:pointer; }

          .empty { font-size:12px; color:var(--muted); text-align:center; padding:32px 16px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); line-height:1.6; }

          .swipe-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:14px; }
          .swipe-card:hover { border-color:var(--border2); }
          .sc-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
          .sc-author { font-size:12px; font-weight:700; color:${accent}; font-family:var(--mono); }
          .sc-date { font-size:9px; color:var(--muted); font-family:var(--mono); }
          .sc-stars { display:flex; gap:1px; margin-left:auto; }
          .star { background:none; border:none; color:var(--border); font-size:16px; cursor:pointer; padding:0 1px; }
          .star-on { color:${accent}; }
          .del { background:none; border:none; color:var(--muted); font-size:12px; cursor:pointer; margin-left:4px; }
          .del:hover { color:var(--danger); }

          .sc-text { font-size:13px; color:var(--text); line-height:1.6; white-space:pre-wrap; }
          .sc-why { font-size:11px; color:var(--text2); margin-top:6px; padding-top:6px; border-top:1px solid var(--border); font-style:italic; }
          .sc-tags { display:flex; gap:4px; flex-wrap:wrap; margin-top:6px; }
          .sc-tag { font-size:9px; color:var(--muted); background:var(--card2); padding:2px 6px; border-radius:4px; font-family:var(--mono); }
        `}</style>
      </Layout>
    </>
  )
}
