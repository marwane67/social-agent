export default function ContactSection() {
  return (
    <section className="ec-contact">
      <div className="ec-contact__inner">
        <div className="ec-contact__bg">
          <img
            src="/bruxelles.jpg"
            alt="Bruxelles"
            className="ec-contact__bg-img"
          />
          <div className="ec-contact__overlay" />
        </div>

        <div className="ec-contact__content">
          <div className="ec-contact__title-image">
            <div className="ec-contact__title-placeholder">Me contacter</div>
          </div>

          <div className="ec-contact__box">
            <p className="ec-contact__address">
              Pour toute question relative à l&apos;échevinat des Finances ou de
              la Propreté publique, vous pouvez me joindre à la{' '}
              <strong>Ville de Bruxelles</strong>. Retrouvez également toutes
              les informations officielles sur ma{' '}
              <a
                href="https://www.bruxelles.be/anas-ben-abdelmoumen"
                target="_blank"
                rel="noopener noreferrer"
              >
                page bruxelles.be
              </a>
              .
            </p>

            <form
              className="ec-contact__form"
              onSubmit={(e) => e.preventDefault()}
            >
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
