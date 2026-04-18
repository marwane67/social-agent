import { useEffect, useState } from 'react';
import { api, uploadFile } from './api';

type Article = {
  id?: string;
  title: string;
  source: string;
  date: string;
  sort_date: string | null;
  excerpt: string;
  href: string;
  image_path: string | null;
  theme: string | null;
  position: number;
  published: boolean;
};

const EMPTY: Article = {
  title: '',
  source: '',
  date: '',
  sort_date: null,
  excerpt: '',
  href: '',
  image_path: null,
  theme: 'proprete',
  position: 0,
  published: true,
};

export default function ArticlesTab() {
  const [items, setItems] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fetchUrl, setFetchUrl] = useState('');
  const [fetching, setFetching] = useState(false);

  async function load() {
    const j = await api('GET', '/api/admin/articles');
    setItems(j.items || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!editing) return;
    setBusy(true);
    setMsg(null);
    try {
      if (editing.id) {
        await api('PATCH', '/api/admin/articles', editing);
      } else {
        const maxPos = items.reduce((m, it) => Math.max(m, it.position || 0), 0);
        await api('POST', '/api/admin/articles', { ...editing, position: editing.position || maxPos + 1 });
      }
      setEditing(null);
      await load();
      setMsg('Enregistré ✓');
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      setMsg('Erreur : ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cet article ?')) return;
    await api('DELETE', `/api/admin/articles?id=${id}`);
    load();
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((x) => x.id === id);
    const swap = items[idx + dir];
    if (!swap) return;
    await Promise.all([
      api('PATCH', '/api/admin/articles', { id, position: swap.position }),
      api('PATCH', '/api/admin/articles', { id: swap.id, position: items[idx].position }),
    ]);
    load();
  }

  async function autofill() {
    if (!fetchUrl.trim() || !editing) return;
    setFetching(true);
    try {
      const j = await api('POST', '/api/admin/fetch-url', { url: fetchUrl.trim() });
      setEditing({
        ...editing,
        title: j.title || editing.title,
        excerpt: j.excerpt || editing.excerpt,
        source: j.source || editing.source,
        date: j.date || editing.date,
        sort_date: j.sort_date || editing.sort_date,
        image_path: j.image_path || j.image_external || editing.image_path,
        href: j.href || fetchUrl.trim(),
      });
      setFetchUrl('');
    } catch (e: any) {
      alert('Extraction échouée : ' + e.message);
    } finally {
      setFetching(false);
    }
  }

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !editing) return;
    setBusy(true);
    try {
      const { path } = await uploadFile(f);
      setEditing({ ...editing, image_path: path });
    } catch (err: any) {
      alert('Upload échoué : ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  function resolveImg(path: string | null): string {
    if (!path) return '';
    if (/^https?:\/\//.test(path) || path.startsWith('/')) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
  }

  return (
    <div className="ec-admin-tab">
      <div className="ec-admin-tab__head">
        <h2>Actualités ({items.length})</h2>
        <button className="ec-admin-btn" onClick={() => setEditing({ ...EMPTY })}>
          + Nouvel article
        </button>
      </div>
      {msg && <div className="ec-admin-msg">{msg}</div>}

      <div className="ec-admin-list">
        {items.map((it, i) => (
          <div key={it.id} className={`ec-admin-row${it.published ? '' : ' is-draft'}`}>
            <div className="ec-admin-row__thumb">
              {it.image_path && <img src={resolveImg(it.image_path)} alt="" />}
            </div>
            <div className="ec-admin-row__body">
              <div className="ec-admin-row__meta">
                <strong>{it.source}</strong> · {it.date}
                {!it.published && <span className="ec-admin-badge">Brouillon</span>}
              </div>
              <div className="ec-admin-row__title">{it.title}</div>
            </div>
            <div className="ec-admin-row__actions">
              <button onClick={() => move(it.id!, -1)} disabled={i === 0} title="Monter">↑</button>
              <button onClick={() => move(it.id!, 1)} disabled={i === items.length - 1} title="Descendre">↓</button>
              <button onClick={() => setEditing({ ...it })}>Modifier</button>
              <button onClick={() => remove(it.id!)} className="danger">Suppr.</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="ec-admin-modal" onClick={() => !busy && setEditing(null)}>
          <div className="ec-admin-modal__card" onClick={(e) => e.stopPropagation()}>
            <h3>{editing.id ? 'Modifier l’article' : 'Nouvel article'}</h3>

            <div className="ec-admin-autofill">
              <label style={{ marginBottom: 8 }}>
                ⚡ Auto-remplir depuis un lien
              </label>
              <div className="ec-admin-autofill__row">
                <input
                  type="url"
                  placeholder="https://www.lesoir.be/..."
                  value={fetchUrl}
                  onChange={(e) => setFetchUrl(e.target.value)}
                  disabled={fetching}
                />
                <button
                  type="button"
                  onClick={autofill}
                  disabled={fetching || !fetchUrl.trim()}
                  className="primary"
                >
                  {fetching ? 'Extraction…' : 'Extraire'}
                </button>
              </div>
              <div className="ec-admin-autofill__hint">
                Colle l’URL d’un article : titre, extrait, source, date et couverture sont récupérés automatiquement.
              </div>
            </div>

            <label>
              Titre
              <input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </label>
            <div className="ec-admin-grid2">
              <label>
                Source (ex: Le Soir)
                <input
                  value={editing.source}
                  onChange={(e) => setEditing({ ...editing, source: e.target.value })}
                />
              </label>
              <label>
                Date affichée
                <input
                  placeholder="17 février 2026"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                />
              </label>
            </div>
            <div className="ec-admin-grid2">
              <label>
                Date de tri (YYYY-MM-DD)
                <input
                  type="date"
                  value={editing.sort_date || ''}
                  onChange={(e) => setEditing({ ...editing, sort_date: e.target.value || null })}
                />
              </label>
              <label>
                Thème
                <select
                  value={editing.theme || ''}
                  onChange={(e) => setEditing({ ...editing, theme: e.target.value })}
                >
                  <option value="proprete">Propreté</option>
                  <option value="finances">Finances</option>
                  <option value="deratisation">Dératisation</option>
                  <option value="toilettes">Toilettes</option>
                  <option value="solidarite">Solidarité</option>
                </select>
              </label>
            </div>
            <label>
              Extrait
              <textarea
                rows={3}
                value={editing.excerpt}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
              />
            </label>
            <label>
              Lien vers l’article (URL)
              <input
                value={editing.href}
                onChange={(e) => setEditing({ ...editing, href: e.target.value })}
              />
            </label>
            <label>
              Image de couverture
              <input type="file" accept="image/*" onChange={pickImage} />
              {editing.image_path && (
                <div className="ec-admin-preview">
                  <img src={resolveImg(editing.image_path)} alt="" />
                  <button type="button" onClick={() => setEditing({ ...editing, image_path: null })}>
                    Retirer
                  </button>
                </div>
              )}
            </label>
            <label className="ec-admin-check">
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
              />
              Publier (décocher pour brouillon)
            </label>
            <div className="ec-admin-modal__actions">
              <button onClick={() => setEditing(null)} disabled={busy}>Annuler</button>
              <button onClick={save} disabled={busy} className="primary">
                {busy ? '…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
