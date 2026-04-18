import type { ContactSettings } from '../../lib/content';

export default function ContactSection({ settings }: { settings?: ContactSettings }) {
  const s =
    settings || {
      enabled: true,
      title: 'Me contacter',
      intro_html:
        "<p>Pour toute question relative à l'échevinat des Finances ou de la Propreté publique, vous pouvez me joindre à la <strong>Ville de Bruxelles</strong>.</p>",
      image_path: '/bruxelles.jpg',
      image_url: '/bruxelles.jpg',
    };
  if (!s.enabled) return null;
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
            <div
              className="ec-contact__address"
              dangerouslySetInnerHTML={{ __html: s.intro_html }}
            />

            <form className="ec-contact__form" onSubmit={(e) => e.preventDefault()}>
              <div className="ec-contact__form-row">
                <input type="text" placeholder="Prénom" required />
                <input type="text" placeholder="Nom" required />
              </div>
              <input type="email" placeholder="E-mail" required />
              <textarea placeholder="Votre message" rows={7} required />
              <button type="submit">Envoyer</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
