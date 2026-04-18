import { useEffect, useState } from 'react';
import { api } from './api';

type Section = {
  id?: string;
  heading: string | null;
  body_html: string;
  position: number;
};

export default function BioTab() {
  const [items, setItems] = useState<Section[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const j = await api('GET', '/api/admin/bio');
    setItems(j.items || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function saveOne(s: Section) {
    setBusy(true);
    setMsg(null);
    try {
      if (s.id) {
        await api('PATCH', '/api/admin/bio', s);
      } else {
        await api('POST', '/api/admin/bio', s);
      }
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
    if (!confirm('Supprimer cette section ?')) return;
    await api('DELETE', `/api/admin/bio?id=${id}`);
    load();
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((x) => x.id === id);
    const swap = items[idx + dir];
    if (!swap) return;
    await Promise.all([
      api('PATCH', '/api/admin/bio', { id, position: swap.position }),
      api('PATCH', '/api/admin/bio', { id: swap.id, position: items[idx].position }),
    ]);
    load();
  }

  function addSection() {
    const maxPos = items.reduce((m, it) => Math.max(m, it.position || 0), 0);
    setItems([...items, { heading: '', body_html: '<p></p>', position: maxPos + 1 }]);
  }

  function updateLocal(idx: number, patch: Partial<Section>) {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  }

  return (
    <div className="ec-admin-tab">
      <div className="ec-admin-tab__head">
        <h2>Biographie ({items.length} sections)</h2>
        <button className="ec-admin-btn" onClick={addSection}>+ Nouvelle section</button>
      </div>
      {msg && <div className="ec-admin-msg">{msg}</div>}
      <p style={{ fontSize: 13, opacity: 0.65, marginBottom: 16 }}>
        Astuce : laisse le <em>Titre</em> vide pour une section d’introduction sans titre.
        Le contenu accepte du HTML (ex : <code>&lt;p&gt;</code>, <code>&lt;strong&gt;</code>, <code>&lt;a href&gt;</code>).
      </p>

      <div className="ec-admin-bio-list">
        {items.map((s, i) => (
          <div key={s.id || `new-${i}`} className="ec-admin-bio-card">
            <div className="ec-admin-bio-card__head">
              <input
                placeholder="Titre de la section (ou vide pour intro)"
                value={s.heading || ''}
                onChange={(e) => updateLocal(i, { heading: e.target.value || null })}
              />
              <div className="ec-admin-bio-card__actions">
                {s.id && (
                  <>
                    <button onClick={() => move(s.id!, -1)} disabled={i === 0}>↑</button>
                    <button onClick={() => move(s.id!, 1)} disabled={i === items.length - 1}>↓</button>
                  </>
                )}
                <button onClick={() => saveOne(s)} disabled={busy} className="primary">
                  {s.id ? 'Sauver' : 'Créer'}
                </button>
                {s.id && (
                  <button onClick={() => remove(s.id!)} className="danger">Suppr.</button>
                )}
              </div>
            </div>
            <textarea
              rows={8}
              value={s.body_html}
              onChange={(e) => updateLocal(i, { body_html: e.target.value })}
              placeholder="<p>Contenu HTML de la section…</p>"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
