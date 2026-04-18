export default function Newsletter() {
  return (
    <section className="ec-newsletter">
      <div className="ec-newsletter__inner">
        {/* GAUCHE 20% : image label */}
        <div className="ec-newsletter__label-col">
          {/* PLACEHOLDER : image "MA NEWSLETTER" */}
          <div className="ec-newsletter__label-placeholder">MA NEWSLETTER</div>
        </div>

        {/* DROITE 80% : formulaire */}
        <div className="ec-newsletter__form-col">
          <form
            className="ec-newsletter__form"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              className="ec-newsletter__input"
              type="email"
              placeholder="votre adresse mail"
              required
            />
            <button className="ec-newsletter__btn" type="submit">
              je m&apos;abonne
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
