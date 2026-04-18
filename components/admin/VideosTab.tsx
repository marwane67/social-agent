import { useEffect, useState } from 'react';
import { api, uploadFile } from './api';

type Video = {
  id?: string;
  title: string;
  source: string;
  date: string;
  duration: string;
  category: string;
  video_url: string | null;
  file_path: string | null;
  thumb_path: string | null;
  position: number;
  published: boolean;
};

const EMPTY: Video = {
  title: '',
  source: '',
  date: '',
  duration: '',
  category: 'conseil',
  video_url: null,
  file_path: null,
  thumb_path: null,
  position: 0,
  published: true,
};

const CATEGORIES = [
  { id: 'conseil', label: 'Au conseil communal' },
  { id: 'medias', label: 'Médias' },
  { id: 'terrain', label: 'Sur le terrain' },
  { id: 'interviews', label: 'Interviews' },
];

export default function VideosTab() {
  const [items, setItems] = useState<Video[]>([]);
  const [editing, setEditing] = useState<Video | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  async function load() {
    const j = await api('GET', '/api/admin/videos');
    setItems(j.items || []);
  }
  useEffect(() => {
    load();
  }, []);

  function resolve(path: string | null): string {
    if (!path) return '';
    if (/^https?:\/\//.test(path) || path.startsWith('/')) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      if (editing.id) {
        await api('PATCH', '/api/admin/videos', editing);
      } else {
        const maxPos = items.reduce((m, it) => Math.max(m, it.position || 0), 0);
        await api('POST', '/api/admin/videos', { ...editing, position: editing.position || maxPos + 1 });
      }
      setEditing(null);
      await load();
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette vidéo ?')) return;
    await api('DELETE', `/api/admin/videos?id=${id}`);
    load();
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((x) => x.id === id);
    const swap = items[idx + dir];
    if (!swap) return;
    await Promise.all([
      api('PATCH', '/api/admin/videos', { id, position: swap.position }),
      api('PATCH', '/api/admin/videos', { id: swap.id, position: items[idx].position }),
    ]);
    load();
  }

  async function pickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !editing) return;
    if (f.size > 90 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 90 Mo). Utilise plutôt une URL YouTube/Vimeo.');
      return;
    }
    setBusy(true);
    setUploadProgress(`Upload ${f.name}…`);
    try {
      const { path } = await uploadFile(f);
      setEditing({ ...editing, file_path: path, video_url: null });
    } catch (err: any) {
      alert('Upload échoué : ' + err.message);
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  }

  async function pickThumb(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !editing) return;
    setBusy(true);
    try {
      const { path } = await uploadFile(f);
      setEditing({ ...editing, thumb_path: path });
    } catch (err: any) {
      alert('Upload échoué : ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ec-admin-tab">
      <div className="ec-admin-tab__head">
        <h2>Vidéos ({items.length})</h2>
        <button className="ec-admin-btn" onClick={() => setEditing({ ...EMPTY })}>
          + Nouvelle vidéo
        </button>
      </div>

      <div className="ec-admin-list">
        {items.length === 0 && <p style={{ opacity: 0.6 }}>Aucune vidéo pour le moment.</p>}
        {items.map((it, i) => (
          <div key={it.id} className={`ec-admin-row${it.published ? '' : ' is-draft'}`}>
            <div className="ec-admin-row__thumb">
              {it.thumb_path && <img src={resolve(it.thumb_path)} alt="" />}
            </div>
            <div className="ec-admin-row__body">
              <div className="ec-admin-row__meta">
                <strong>{it.source || it.category}</strong> · {it.date} · {it.duration}
                {!it.published && <span className="ec-admin-badge">Brouillon</span>}
              </div>
              <div className="ec-admin-row__title">{it.title}</div>
            </div>
            <div className="ec-admin-row__actions">
              <button onClick={() => move(it.id!, -1)} disabled={i === 0}>↑</button>
              <button onClick={() => move(it.id!, 1)} disabled={i === items.length - 1}>↓</button>
              <button onClick={() => setEditing({ ...it })}>Modifier</button>
              <button onClick={() => remove(it.id!)} className="danger">Suppr.</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="ec-admin-modal" onClick={() => !busy && setEditing(null)}>
          <div className="ec-admin-modal__card" onClick={(e) => e.stopPropagation()}>
            <h3>{editing.id ? 'Modifier la vidéo' : 'Nouvelle vidéo'}</h3>
            <label>
              Titre
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </label>
            <div className="ec-admin-grid2">
              <label>
                Catégorie
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Source (ex: RTBF)
                <input value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value })} />
              </label>
            </div>
            <div className="ec-admin-grid2">
              <label>
                Date affichée
                <input placeholder="Mars 2025" value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
              </label>
              <label>
                Durée
                <input placeholder="3:45" value={editing.duration}
                  onChange={(e) => setEditing({ ...editing, duration: e.target.value })} />
              </label>
            </div>

            <div className="ec-admin-divider">Vidéo — URL OU fichier</div>
            <label>
              URL YouTube / Vimeo / externe (recommandé)
              <input
                placeholder="https://youtube.com/..."
                value={editing.video_url || ''}
                onChange={(e) => setEditing({ ...editing, video_url: e.target.value || null, file_path: null })}
              />
            </label>
            <label>
              Ou fichier vidéo (max 90 Mo)
              <input type="file" accept="video/*" onChange={pickVideo} />
              {uploadProgress && <div style={{ fontSize: 13, opacity: 0.7 }}>{uploadProgress}</div>}
              {editing.file_path && (
                <div style={{ fontSize: 13 }}>
                  Fichier : {editing.file_path}{' '}
                  <button type="button" onClick={() => setEditing({ ...editing, file_path: null })}>Retirer</button>
                </div>
              )}
            </label>

            <label>
              Vignette (image)
              <input type="file" accept="image/*" onChange={pickThumb} />
              {editing.thumb_path && (
                <div className="ec-admin-preview">
                  <img src={resolve(editing.thumb_path)} alt="" />
                  <button type="button" onClick={() => setEditing({ ...editing, thumb_path: null })}>Retirer</button>
                </div>
              )}
            </label>

            <label className="ec-admin-check">
              <input type="checkbox" checked={editing.published}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
              Publier
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
