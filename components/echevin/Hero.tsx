import SocialRow from './SocialRow';
import Logo from './Logo';
import StackedNav from './StackedNav';

export default function Hero() {
  return (
    <section className="ec-hero">
      {/* COL GAUCHE : photo d'Anas */}
      <div className="ec-hero__img-col ec-hero__img-col--photo">
        <img
          src="/anas.jpg"
          alt="Anas Ben Abdelmoumen"
          className="ec-hero__photo"
        />
      </div>

      {/* COL DROITE : nav empilée + contenu bordé */}
      <div className="ec-hero__content-col">
        <StackedNav />

        <div className="ec-hero__box">
          <div className="ec-hero__logo">
            <Logo size="md" variant="dark" />
          </div>

          <div className="ec-hero__text">
            <p>
              Depuis le 1<sup>er</sup> décembre 2024, je suis{' '}
              <strong>échevin des Finances et de la Propreté publique</strong>{' '}
              à la Ville de Bruxelles.
            </p>
            <p>
              Socialiste engagé, né et élevé à Bruxelles, je mets mon énergie
              au service des habitantes et habitants de{' '}
              <strong>notre ville.</strong>
            </p>
          </div>

          <SocialRow />
        </div>
      </div>
    </section>
  );
}
