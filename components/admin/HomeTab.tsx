import { useEffect, useState } from 'react';
import { api, uploadFile } from './api';

type Hero = {
  surtitle: string;
  title: string;
  tagline: string;
  body_html: string;
  image_path: string | null;
};
type Newsletter = { enabled: boolean; label: string; placeholder: string; button: string };
type Featured = { mode: 'auto' | 'manual' | 'hidden'; article_id: string | null; image_path: string | null };
type Contact = { enabled: boolean; title: string; intro_html: string; image_path: string | null };
type HeaderImg = { image_path: string | null };

const DEFAULT_HERO_BODY_HTML =
  "<p>Depuis le 1<sup>er</sup> décembre 2024, je suis <strong>échevin des Finances et de la Propreté publique</strong> à la Ville de Bruxelles.</p>" +
  "<p>Socialiste engagé, né et grandit à Bruxelles, je mets mon énergie au service des habitantes et habitants de <strong>notre ville.</strong></p>";

const DEFAULTS = {
  hero: {
    surtitle: 'ÉCHEVIN DES FINANCES ET DE LA PROPRETÉ PUBLIQUE',
    title: 'ANAS BEN ABDELMOUMEN',
    tagline: 'VILLE DE BRUXELLES',
    body_html: DEFAULT_HERO_BODY_HTML,
    image_path: '/anas.jpg',
  } as Hero,
  newsletter: {
    enabled: true,
    label: 'MA NEWSLETTER',
    placeholder: 'votre adresse mail',
    button: "je m'abonne",
  } as Newsletter,
  featured: { mode: 'auto', article_id: null, image_path: null } as Featured,
  contact: {
    enabled: true,
    title: 'Me contacter',
    intro_html:
      "<p>Pour toute question relative à l'échevinat des Finances ou de la Propreté publique, vous pouvez me joindre <strong>via le formulaire ci-dessous</strong> :</p>",
    image_path: '/bruxelles.jpg',
  } as Contact,
  notes_header: { image_path: '/anas.jpg' } as HeaderImg,
  videos_header: { image_path: '/anas.jpg' } as HeaderImg,
  bio_header: { image_path: '/anas.jpg' } as HeaderImg,
  faq_header: { image_path: '/anas.jpg' } as HeaderImg,
  medias_header: { image_path: '/anas.jpg' } as HeaderImg,
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
  const [notesHeader, setNotesHeader] = useState<HeaderImg>(DEFAULTS.notes_header);
  const [videosHeader, setVideosHeader] = useState<HeaderImg>(DEFAULTS.videos_header);
  const [bioHeader, setBioHeader] = useState<HeaderImg>(DEFAULTS.bio_header);
  const [faqHeader, setFaqHeader] = useState<HeaderImg>(DEFAULTS.faq_header);
  const [mediasHeader, setMediasHeader] = useState<HeaderImg>(DEFAULTS.medias_header);
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
    setNotesHeader({ ...DEFAULTS.notes_header, ...(byKey.notes_header || {}) });
    setVideosHeader({ ...DEFAULTS.videos_header, ...(byKey.videos_header || {}) });
    setBioHeader({ ...DEFAULTS.bio_header, ...(byKey.bio_header || {}) });
    setFaqHeader({ ...DEFAULTS.faq_header, ...(byKey.faq_header || {}) });
    setMediasHeader({ ...DEFAULTS.medias_header, ...(byKey.medias_header || {}) });
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
      setTimeout(() => setMsg(null), 1800);
    } catch (e: any) {
      setMsg('Erreur : ' + e.message);
    } finally {
      setBusy(null);
    }
  }

  /**
   * Upload a file then immediately persist the new state to /settings.
   * `currentState` is the latest value of the section (the local state at the moment of upload),
   * and `merge` returns the state with the new image_path applied.
   */
  async function uploadAndSave<T>(
    e: React.ChangeEvent<HTMLInputElement>,
    settingKey: string,
    label: string,
    currentState: T,
    merge: (state: T, path: string) => T,
    setLocal: (s: T) => void,
  ) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(`${settingKey}-upload`);
    setMsg(null);
    try {
      const { path } = await uploadFile(f);
      const next = merge(currentState, path);
      setLocal(next);
      // Persist the freshly-uploaded image immediately
      await api('PUT', '/api/admin/settings', { key: settingKey, value: next });
      setMsg(`${label} : image enregistrée ✓`);
      setTimeout(() => setMsg(null), 1800);
    } catch (err: any) {
      setMsg('Erreur upload : ' + err.message);
    } finally {
      setBusy(null);
      e.target.value = '';
    }
  }

  /** Reset image_path and save in one go. */
  async function resetImage<T extends { image_path: string | null }>(
    settingKey: string,
    label: string,
    currentState: T,
    fallback: string | null,
    setLocal: (s: T) => void,
  ) {
    const next = { ...currentState, image_path: fallback };
    setLocal(next);
    setBusy(`${settingKey}-reset`);
    try {
      await api('PUT', '/api/admin/settings', { key: settingKey, value: next });
      setMsg(`${label} : image réinitialisée ✓`);
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      setMsg('Erreur : ' + e.message);
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
          <h3>Héro (en haut du site)</h3>
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
        <label>
          Texte de présentation (HTML accepté — &lt;p&gt;, &lt;strong&gt;, &lt;sup&gt;, etc.)
          <textarea
            rows={6}
            value={hero.body_html}
            onChange={(e) => setHero({ ...hero, body_html: e.target.value })}
          />
        </label>
        <label>
          Photo du héro (grande image à gauche)
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              uploadAndSave(
                e,
                'hero',
                'Héro',
                hero,
                (s, path) => ({ ...s, image_path: path }),
                setHero,
              )
            }
          />
          {busy === 'hero-upload' && <div style={{ fontSize: 13, opacity: 0.7 }}>Upload…</div>}
          {hero.image_path && (
            <div className="ec-admin-preview">
              <img src={resolve(hero.image_path)} alt="" />
              <button
                type="button"
                onClick={() => resetImage('hero', 'Héro', hero, '/anas.jpg', setHero)}
              >
                Réinitialiser
              </button>
            </div>
          )}
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
        {featured.mode !== 'hidden' && (
          <label>
            Image personnalisée (remplace celle de l’article)
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                uploadAndSave(
                  e,
                  'featured',
                  'Article mis en avant',
                  featured,
                  (s, path) => ({ ...s, image_path: path }),
                  setFeatured,
                )
              }
            />
            {busy === 'featured-upload' && <div style={{ fontSize: 13, opacity: 0.7 }}>Upload…</div>}
            {featured.image_path ? (
              <div className="ec-admin-preview">
                <img src={resolve(featured.image_path)} alt="" />
                <button
                  type="button"
                  onClick={() => resetImage('featured', 'Article mis en avant', featured, null, setFeatured)}
                >
                  Utiliser l’image de l’article
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                Par défaut, l’image de l’article est utilisée.
              </div>
            )}
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
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              uploadAndSave(
                e,
                'contact',
                'Contact',
                contact,
                (s, path) => ({ ...s, image_path: path }),
                setContact,
              )
            }
          />
          {busy === 'contact-upload' && <div style={{ fontSize: 13, opacity: 0.7 }}>Upload…</div>}
          {contact.image_path && (
            <div className="ec-admin-preview">
              <img src={resolve(contact.image_path)} alt="" />
              <button
                type="button"
                onClick={() => resetImage('contact', 'Contact', contact, null, setContact)}
              >
                Retirer
              </button>
            </div>
          )}
        </label>
      </div>

      {/* PAGE HEADERS (images de bannière) */}
      {([
        { key: 'notes_header', label: 'Actualités — image de bannière', state: notesHeader, setState: setNotesHeader },
        { key: 'videos_header', label: 'Vidéos — image de bannière', state: videosHeader, setState: setVideosHeader },
        { key: 'bio_header', label: 'Bio — image de bannière', state: bioHeader, setState: setBioHeader },
        { key: 'faq_header', label: 'FAQ — image de bannière', state: faqHeader, setState: setFaqHeader },
        { key: 'medias_header', label: 'Médias — image de bannière', state: mediasHeader, setState: setMediasHeader },
      ] as const).map(({ key, label, state, setState }) => (
        <div className="ec-admin-bio-card" key={key}>
          <div className="ec-admin-section-head">
            <h3>{label}</h3>
            <span style={{ fontSize: 12, opacity: 0.6 }}>Upload = enregistré automatiquement</span>
          </div>
          <label>
            Image en haut de la page
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                uploadAndSave(
                  e,
                  key,
                  label,
                  state,
                  (s, path) => ({ ...s, image_path: path }),
                  setState,
                )
              }
            />
            {busy === `${key}-upload` && <div style={{ fontSize: 13, opacity: 0.7 }}>Upload…</div>}
            {state.image_path && (
              <div className="ec-admin-preview">
                <img src={resolve(state.image_path)} alt="" />
                <button
                  type="button"
                  onClick={() => resetImage(key, label, state, '/anas.jpg', setState)}
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </label>
        </div>
      ))}
    </div>
  );
}
