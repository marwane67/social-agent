export default function Newsletter() {
  return (
    <section className="ec-newsletter">
      <div className="ec-newsletter__inner">
        <form
          className="ec-newsletter__form"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="ec-newsletter__label" htmlFor="ec-newsletter-email">
            Newsletter
          </label>
          <input
            id="ec-newsletter-email"
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
    </section>
  );
}
