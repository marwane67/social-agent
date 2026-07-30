import { useState } from 'react';
import type { NewsletterSettings } from '../../lib/content';

const DEST_EMAIL = 'Cabinet.A.Benabdelmoumen@brucity.be';

export default function Newsletter({ settings }: { settings?: NewsletterSettings }) {
  const s =
    settings || {
      enabled: true,
      label: 'MA NEWSLETTER',
      placeholder: 'votre adresse mail',
      button: "je m'abonne",
    };
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  if (!s.enabled) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${DEST_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email,
          _subject: '[Newsletter] Nouvelle inscription',
          _template: 'table',
          source: 'Site Anas Ben Abdelmoumen — newsletter',
        }),
      });
      if (!r.ok) throw new Error();
      setStatus('sent');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="ec-newsletter">
      <div className="ec-newsletter__inner">
        <div className="ec-newsletter__label-col">
          <div className="ec-newsletter__label-placeholder">{s.label}</div>
        </div>
        <div className="ec-newsletter__form-col">
          <form className="ec-newsletter__form" onSubmit={onSubmit}>
            <input
              className="ec-newsletter__input"
              type="email"
              placeholder={s.placeholder}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'sending'}
            />
            <button className="ec-newsletter__btn" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? '…' : status === 'sent' ? 'Merci ✓' : s.button}
            </button>
          </form>
          {status === 'error' && (
            <div className="ec-newsletter__msg ec-newsletter__msg--err">
              Une erreur est survenue. Réessayez ou écrivez-nous directement à{' '}
              <a href={`mailto:${DEST_EMAIL}`}>{DEST_EMAIL}</a>.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
