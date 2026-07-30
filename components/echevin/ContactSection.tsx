import { useState } from 'react';
import type { ContactSettings } from '../../lib/content';

const DEST_EMAIL = 'Cabinet.A.Benabdelmoumen@brucity.be';

export default function ContactSection({ settings }: { settings?: ContactSettings }) {
  const s =
    settings || {
      enabled: true,
      title: 'Me contacter',
      intro_html:
        "<p>Pour toute question relative à l'échevinat des Finances ou de la Propreté publique, vous pouvez me joindre <strong>via le formulaire ci-dessous</strong> :</p>",
      image_path: '/bruxelles.jpg',
      image_url: '/bruxelles.jpg',
    };
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  if (!s.enabled) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${DEST_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `[Site] Nouveau message de ${form.firstName} ${form.lastName}`,
          _template: 'table',
          _replyto: form.email,
          Prénom: form.firstName,
          Nom: form.lastName,
          'E-mail': form.email,
          Message: form.message,
        }),
      });
      if (!r.ok) throw new Error();
      setStatus('sent');
      setForm({ firstName: '', lastName: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="ec-contact">
      <div className="ec-contact__inner">
        <div className="ec-contact__bg">
          {s.image_url && <img src={s.image_url} alt="" className="ec-contact__bg-img" />}
          <div className="ec-contact__overlay" />
        </div>

        <div className="ec-contact__content">
          <div className="ec-contact__title-image">
            <div className="ec-contact__title-placeholder">{s.title}</div>
          </div>

          <div className="ec-contact__box">
            <div className="ec-contact__address" dangerouslySetInnerHTML={{ __html: s.intro_html }} />

            <form className="ec-contact__form" onSubmit={onSubmit}>
              <div className="ec-contact__form-row">
                <input
                  type="text"
                  placeholder="Prénom"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Nom"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
              <input
                type="email"
                placeholder="E-mail"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <textarea
                placeholder="Votre message"
                rows={7}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Envoi…' : status === 'sent' ? 'Message envoyé ✓' : 'Envoyer'}
              </button>
            </form>
            {status === 'error' && (
              <p style={{ marginTop: 12, color: '#b00020', fontSize: 14 }}>
                Une erreur est survenue. Écrivez-nous directement à{' '}
                <a href={`mailto:${DEST_EMAIL}`} style={{ textDecoration: 'underline' }}>
                  {DEST_EMAIL}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
