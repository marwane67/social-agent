import { useEffect, useRef, useState } from 'react';
import { api, uploadFile } from './api';

type Media = {
  name: string;
  path: string;
  url: string;
  size: number | null;
  mimetype: string | null;
  created_at: string | null;
};

function fmtSize(n: number | null): string {
  if (!n) return '—';
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
}

function fmtDate(s: string | null): string {
  if (!s) return '';
  try {
    return new Date(s).toLocaleDateString('fr-BE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function PhotosTab() {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const j = await api('GET', '/api/admin/media');
      setItems(j.items || []);
    } catch (e: any) {
      setMsg('Erreur : ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (arr.length === 0) return;
    setUploading(true);
    setMsg(null);
    let ok = 0;
    let ko = 0;
    for (const f of arr) {
      try {
        await uploadFile(f);
        ok++;
      } catch {
        ko++;
      }
    }
    setUploading(false);
    setMsg(`${ok} fichier(s) uploadé(s)${ko ? `, ${ko} échec(s)` : ''} ✓`);
    setTimeout(() => setMsg(null), 2500);
    load();
  }

  async function remove(m: Media) {
    if (!confirm(`Supprimer « ${m.name} » ?\nCette action est définitive.`)) return;
    try {
      await api('DELETE', `/api/admin/media?path=${encodeURIComponent(m.path)}`);
      setItems((xs) => xs.filter((x) => x.path !== m.path));
      setMsg('Supprimé ✓');
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      alert('Suppression échouée : ' + e.message);
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg(`${label} copié ✓`);
      setTimeout(() => setMsg(null), 1500);
    } catch {
      alert('Copie impossible');
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
  }

  const filtered = query.trim()
    ? items.filter((x) => x.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  const isImg = (m: Media) =>
    /^image\//.test(m.mimetype || '') || /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(m.name);
  const isVideo = (m: Media) =>
    /^video\//.test(m.mimetype || '') || /\.(mp4|mov|webm)$/i.test(m.name);

  return (
    <div className="ec-admin-tab">
      <div className="ec-admin-tab__head">
        <h2>Photos & médias ({items.length})</h2>
        <button className="ec-admin-btn" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Upload…' : '+ Ajouter des photos'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>
      {msg && <div className="ec-admin-msg">{msg}</div>}

      <div
        className={`ec-admin-drop${dragOver ? ' is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <div className="ec-admin-drop__icon">⇪</div>
        <div className="ec-admin-drop__text">
          Glissez-déposez vos photos ici, ou <u>cliquez pour parcourir</u>
        </div>
        <div className="ec-admin-drop__hint">
          Images et vidéos — plusieurs fichiers acceptés
        </div>
      </div>

      <div className="ec-admin-photos__search">
        <input
          type="search"
          placeholder="Rechercher un fichier…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ opacity: 0.6 }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <p style={{ opacity: 0.6 }}>
          {items.length === 0 ? 'Aucune photo pour le moment.' : 'Aucun résultat.'}
        </p>
      ) : (
        <div className="ec-admin-photos">
          {filtered.map((m) => (
            <div key={m.path} className="ec-admin-photo">
              <div className="ec-admin-photo__thumb">
                {isImg(m) ? (
                  <img src={m.url} alt={m.name} loading="lazy" />
                ) : isVideo(m) ? (
                  <video src={m.url} muted />
                ) : (
                  <div className="ec-admin-photo__file">📄</div>
                )}
              </div>
              <div className="ec-admin-photo__body">
                <div className="ec-admin-photo__name" title={m.name}>
                  {m.name}
                </div>
                <div className="ec-admin-photo__meta">
                  {fmtSize(m.size)} · {fmtDate(m.created_at)}
                </div>
                <div className="ec-admin-photo__actions">
                  <button onClick={() => copy(m.path, 'Chemin')} title="Copier le chemin (à coller dans les articles / bio)">
                    Copier chemin
                  </button>
                  <button onClick={() => copy(m.url, 'URL')} title="Copier l’URL publique">
                    Copier URL
                  </button>
                  <a href={m.url} target="_blank" rel="noopener noreferrer">
                    Ouvrir
                  </a>
                  <button onClick={() => remove(m)} className="danger">
                    Suppr.
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
