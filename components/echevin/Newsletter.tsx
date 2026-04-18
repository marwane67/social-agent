import type { NewsletterSettings } from '../../lib/content';

export default function Newsletter({ settings }: { settings?: NewsletterSettings }) {
  const s = settings || { enabled: true, label: 'MA NEWSLETTER', placeholder: 'votre adresse mail', button: "je m'abonne" };
  if (!s.enabled) return null;
  return (
    <section className="ec-newsletter">
      <div className="ec-newsletter__inner">
        <div className="ec-newsletter__label-col">
          <div className="ec-newsletter__label-placeholder">{s.label}</div>
        </div>
        <div className="ec-newsletter__form-col">
          <form className="ec-newsletter__form" onSubmit={(e) => e.preventDefault()}>
            <input className="ec-newsletter__input" type="email" placeholder={s.placeholder} required />
            <button className="ec-newsletter__btn" type="submit">
              {s.button}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
