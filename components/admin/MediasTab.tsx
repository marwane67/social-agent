import { useEffect, useState } from 'react';
import { api, uploadFile } from './api';

type Photo = { path: string; caption: string };

function resolve(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path) || path.startsWith('/')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

export default function MediasTab() {
  const [items, setItems] = useState<Photo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const r = await api('GET', '/api/admin/settings');
    const byKey: Record<string, any> = {};
    (r.items || []).forEach((s: any) => (byKey[s.key] = s.value));
    setItems(((byKey.medias?.items ?? []) as Photo[]));
  }
  useEffect(() => { load(); }, []);

  async function persist(next: Photo[]) {
    setItems(next);
    await api('PUT', '/api/admin/settings', { key: 'medias', value: { items: next } });
  }

  async function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBusy('upload');
    setMsg(null);
    const added: Photo[] = [];
    let ok = 0, ko = 0;
    for (const f of Array.from(files)) {
      try {
        const { path } = await uploadFile(f);
        const baseName = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        added.push({ path, caption: baseName || 'Photo presse' });
        ok++;
      } catch {
        ko++;
      }
    }
    if (added.length) await persist([...items, ...added]);
    setBusy(null);
    e.target.value = '';
    setMsg(`${ok} photo(s) ajoutée(s)${ko ? `, ${ko} échec(s)` : ''} ✓`);
    setTimeout(() => setMsg(null), 2000);
  }

  async function updateCaption(i: number, caption: string) {
    const next = items.map((p, idx) => (idx === i ? { ...p, caption } : p));
    setItems(next);
  }
  async function commitCaption(i: number) {
    setBusy(`caption-${i}`);
    try {
      await api('PUT', '/api/admin/settings', { key: 'medias', value: { items } });
      setMsg('Légende enregistrée ✓');
      setTimeout(() => setMsg(null), 1500);
    } finally {
      setBusy(null);
    }
  }

  async function remove(i: number) {
    if (!confirm(`Supprimer « ${items[i].caption} » ?`)) return;
    await persist(items.filter((_, idx) => idx !== i));
    setMsg('Photo supprimée ✓');
    setTimeout(() => setMsg(null), 1500);
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    await persist(next);
  }

  return (
    <div className="ec-admin-tab">
      <div className="ec-admin-tab__head">
        <h2>Médias / Espace presse ({items.length})</h2>
        <label className="ec-admin-btn" style={{ cursor: 'pointer' }}>
          {busy === 'upload' ? 'Upload…' : '+ Ajouter des photos'}
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={pickFiles}
            disabled={busy === 'upload'}
          />
        </label>
      </div>
      {msg && <div className="ec-admin-msg">{msg}</div>}

      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Ces photos apparaissent sur la page <strong>/echevin/echevin/medias</strong>, téléchargeables par les journalistes.
        Tu peux glisser plusieurs photos d'un coup. Les images sont compressées automatiquement avant l'envoi.
      </p>

      {items.length === 0 ? (
        <p style={{ opacity: 0.6 }}>Aucune photo pour le moment. Ajoute-en avec le bouton ci-dessus.</p>
      ) : (
        <div className="ec-admin-photos">
          {items.map((p, i) => (
            <div key={i} className="ec-admin-photo">
              <div className="ec-admin-photo__thumb">
                <img src={resolve(p.path)} alt={p.caption} loading="lazy" />
              </div>
              <div className="ec-admin-photo__body">
                <label style={{ display: 'block', margin: 0 }}>
                  <input
                    value={p.caption}
                    onChange={(e) => updateCaption(i, e.target.value)}
                    onBlur={() => commitCaption(i)}
                    placeholder="Légende"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 13,
                      border: '1px solid #d0d5dd',
                      borderRadius: 6,
                      color: '#111',
                    }}
                  />
                </label>
                <div className="ec-admin-photo__actions">
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="Monter">↑</button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Descendre">↓</button>
                  <a href={resolve(p.path)} target="_blank" rel="noopener noreferrer">Voir</a>
                  <button onClick={() => remove(i)} className="danger">Suppr.</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
