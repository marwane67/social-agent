export default function ContactSection() {
  return (
    <section className="ec-contact">
      <div className="ec-contact__inner">
        {/* Info */}
        <div className="ec-contact__info">
          <h2>Contact</h2>
          <h3>Me contacter</h3>
          <p>
            {/* PLACEHOLDER : adapter l'adresse et les infos */}
            Ma permanence est située au{' '}
            <strong>[Adresse de la permanence], [Code postal] [Commune]</strong>.
          </p>
          <p style={{ marginTop: 16 }}>
            Vous pouvez prendre rendez-vous en écrivant à{' '}
            <a href="mailto:contact@echevin.be">contact@echevin.be</a> ou
            par téléphone au <a href="tel:+3200000000">+32 (0) 00 00 00 00</a>.
          </p>
        </div>

        {/* Form */}
        <form
          className="ec-contact__form"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="ec-contact__form-row">
            <input
              className="ec-contact__input"
              type="text"
              placeholder="Prénom"
              required
            />
            <input
              className="ec-contact__input"
              type="text"
              placeholder="Nom"
              required
            />
          </div>
          <input
            className="ec-contact__input"
            type="email"
            placeholder="E-mail"
            required
          />
          <textarea
            className="ec-contact__textarea"
            placeholder="Message"
            required
          />
          <button className="ec-contact__submit" type="submit">
            Envoyer
          </button>
        </form>
      </div>
    </section>
  );
}
