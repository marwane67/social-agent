import { useEffect, useState } from 'react';
import { api } from './api';

type HeroV = { surtitle: string; title: string; tagline: string };

export default function SettingsTab() {
  const [hero, setHero] = useState<HeroV>({ surtitle: '', title: '', tagline: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const j = await api('GET', '/api/admin/settings');
    const h = (j.items || []).find((s: any) => s.key === 'hero')?.value || {};
    setHero({
      surtitle: h.surtitle || 'ÉCHEVIN DES FINANCES ET DE LA PROPRETÉ PUBLIQUE',
      title: h.title || 'ANAS BEN ABDELMOUMEN',
      tagline: h.tagline || 'VILLE DE BRUXELLES',
    });
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await api('PUT', '/api/admin/settings', { key: 'hero', value: hero });
      setMsg('Enregistré ✓');
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      setMsg('Erreur : ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ec-admin-tab">
      <div className="ec-admin-tab__head">
        <h2>Paramètres de la page d’accueil</h2>
      </div>
      {msg && <div className="ec-admin-msg">{msg}</div>}
      <div className="ec-admin-bio-card">
        <label>
          Surtitre
          <input value={hero.surtitle} onChange={(e) => setHero({ ...hero, surtitle: e.target.value })} />
        </label>
        <label>
          Titre principal
          <input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
        </label>
        <label>
          Tagline (sous le titre)
          <input value={hero.tagline} onChange={(e) => setHero({ ...hero, tagline: e.target.value })} />
        </label>
        <div style={{ marginTop: 16 }}>
          <button onClick={save} disabled={busy} className="primary ec-admin-btn">
            {busy ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
