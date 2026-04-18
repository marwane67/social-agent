import { useEffect, useState } from 'react';
import { api, uploadFile } from './api';

type Hero = { surtitle: string; title: string; tagline: string };
type Newsletter = { enabled: boolean; label: string; placeholder: string; button: string };
type Featured = { mode: 'auto' | 'manual' | 'hidden'; article_id: string | null };
type Contact = { enabled: boolean; title: string; intro_html: string; image_path: string | null };

const DEFAULTS = {
  hero: {
    surtitle: 'ÉCHEVIN DES FINANCES ET DE LA PROPRETÉ PUBLIQUE',
    title: 'ANAS BEN ABDELMOUMEN',
    tagline: 'VILLE DE BRUXELLES',
  } as Hero,
  newsletter: {
    enabled: true,
    label: 'MA NEWSLETTER',
    placeholder: 'votre adresse mail',
    button: "je m'abonne",
  } as Newsletter,
  featured: { mode: 'auto', article_id: null } as Featured,
  contact: {
    enabled: true,
    title: 'Me contacter',
    intro_html:
      "<p>Pour toute question relative à l'échevinat des Finances ou de la Propreté publique, vous pouvez me joindre à la <strong>Ville de Bruxelles</strong>.</p>",
    image_path: '/bruxelles.jpg',
  } as Contact,
};

function resolve(path: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path) || path.startsWith('/')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

export default function HomeTab() {
  const [hero, setHero] = useState<Hero>(DEFAULTS.hero);
  const [newsletter, setNewsletter] = useState<Newsletter>(DEFAULTS.newsletter);
  const [featured, setFeatured] = useState<Featured>(DEFAULTS.featured);
  const [contact, setContact] = useState<Contact>(DEFAULTS.contact);
  const [articles, setArticles] = useState<{ id: string; title: string; source: string; date: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const [s, a] = await Promise.all([
      api('GET', '/api/admin/settings'),
      api('GET', '/api/admin/articles'),
    ]);
    const byKey: Record<string, any> = {};
    (s.items || []).forEach((r: any) => (byKey[r.key] = r.value));
    setHero({ ...DEFAULTS.hero, ...(byKey.hero || {}) });
    setNewsletter({ ...DEFAULTS.newsletter, ...(byKey.newsletter || {}) });
    setFeatured({ ...DEFAULTS.featured, ...(byKey.featured || {}) });
    setContact({ ...DEFAULTS.contact, ...(byKey.contact || {}) });
    setArticles((a.items || []).map((x: any) => ({ id: x.id, title: x.title, source: x.source, date: x.date })));
  }
  useEffect(() => {
    load();
  }, []);

  async function saveKey(key: string, value: any, label: string) {
    setBusy(key);
    setMsg(null);
    try {
      await api('PUT', '/api/admin/settings', { key, value });
      setMsg(`${label} : enregistré ✓`);
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      setMsg('Erreur : ' + e.message);
    } finally {
      setBusy(null);
    }
  }

  async function pickContactImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy('contact-upload');
    try {
      const { path } = await uploadFile(f);
      setContact({ ...contact, image_path: path });
    } catch (err: any) {
      alert('Upload échoué : ' + err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="ec-admin-tab">
      <div className="ec-admin-tab__head">
        <h2>Page d’accueil</h2>
      </div>
      {msg && <div className="ec-admin-msg">{msg}</div>}

      {/* HERO */}
      <div className="ec-admin-bio-card">
        <div className="ec-admin-section-head">
          <h3>Héro (titre principal)</h3>
          <button
            className="primary"
            disabled={busy === 'hero'}
            onClick={() => saveKey('hero', hero, 'Héro')}
          >
            {busy === 'hero' ? '…' : 'Enregistrer'}
          </button>
        </div>
        <label>
          Surtitre
          <input value={hero.surtitle} onChange={(e) => setHero({ ...hero, surtitle: e.target.value })} />
        </label>
        <label>
          Titre
          <input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
        </label>
        <label>
          Tagline
          <input value={hero.tagline} onChange={(e) => setHero({ ...hero, tagline: e.target.value })} />
        </label>
      </div>

      {/* NEWSLETTER */}
      <div className="ec-admin-bio-card">
        <div className="ec-admin-section-head">
          <h3>Section Newsletter</h3>
          <button
            className="primary"
            disabled={busy === 'newsletter'}
            onClick={() => saveKey('newsletter', newsletter, 'Newsletter')}
          >
            {busy === 'newsletter' ? '…' : 'Enregistrer'}
          </button>
        </div>
        <label className="ec-admin-check">
          <input
            type="checkbox"
            checked={newsletter.enabled}
            onChange={(e) => setNewsletter({ ...newsletter, enabled: e.target.checked })}
          />
          Afficher la section newsletter
        </label>
        <label>
          Libellé (côté gauche)
          <input value={newsletter.label} onChange={(e) => setNewsletter({ ...newsletter, label: e.target.value })} />
        </label>
        <label>
          Placeholder du champ email
          <input
            value={newsletter.placeholder}
            onChange={(e) => setNewsletter({ ...newsletter, placeholder: e.target.value })}
          />
        </label>
        <label>
          Texte du bouton
          <input value={newsletter.button} onChange={(e) => setNewsletter({ ...newsletter, button: e.target.value })} />
        </label>
      </div>

      {/* FEATURED */}
      <div className="ec-admin-bio-card">
        <div className="ec-admin-section-head">
          <h3>Article mis en avant</h3>
          <button
            className="primary"
            disabled={busy === 'featured'}
            onClick={() => saveKey('featured', featured, 'Article mis en avant')}
          >
            {busy === 'featured' ? '…' : 'Enregistrer'}
          </button>
        </div>
        <label>
          Mode
          <select value={featured.mode} onChange={(e) => setFeatured({ ...featured, mode: e.target.value as any })}>
            <option value="auto">Automatique (le plus récent)</option>
            <option value="manual">Manuel (choisir un article)</option>
            <option value="hidden">Masquer la section</option>
          </select>
        </label>
        {featured.mode === 'manual' && (
          <label>
            Article à mettre en avant
            <select
              value={featured.article_id || ''}
              onChange={(e) => setFeatured({ ...featured, article_id: e.target.value || null })}
            >
              <option value="">— Choisir —</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.source} · {a.date} — {a.title.slice(0, 60)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* CONTACT */}
      <div className="ec-admin-bio-card">
        <div className="ec-admin-section-head">
          <h3>Section Contact</h3>
          <button
            className="primary"
            disabled={busy === 'contact'}
            onClick={() => saveKey('contact', contact, 'Contact')}
          >
            {busy === 'contact' ? '…' : 'Enregistrer'}
          </button>
        </div>
        <label className="ec-admin-check">
          <input
            type="checkbox"
            checked={contact.enabled}
            onChange={(e) => setContact({ ...contact, enabled: e.target.checked })}
          />
          Afficher la section contact
        </label>
        <label>
          Titre affiché
          <input value={contact.title} onChange={(e) => setContact({ ...contact, title: e.target.value })} />
        </label>
        <label>
          Texte d’introduction (HTML accepté)
          <textarea
            rows={4}
            value={contact.intro_html}
            onChange={(e) => setContact({ ...contact, intro_html: e.target.value })}
          />
        </label>
        <label>
          Image d’arrière-plan
          <input type="file" accept="image/*" onChange={pickContactImage} />
          {busy === 'contact-upload' && <div style={{ fontSize: 13, opacity: 0.7 }}>Upload…</div>}
          {contact.image_path && (
            <div className="ec-admin-preview">
              <img src={resolve(contact.image_path)} alt="" />
              <button type="button" onClick={() => setContact({ ...contact, image_path: null })}>
                Retirer
              </button>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
