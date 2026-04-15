import SocialRow from './SocialRow';

export default function Hero() {
  return (
    <section className="ec-hero">
      {/* Background image — PLACEHOLDER : remplacer par l'image de fond */}
      <div className="ec-hero__bg">
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #2d1b4e 0%, #1a1a2e 50%, #16213e 100%)',
          }}
        />
      </div>

      <div className="ec-hero__content">
        {/* Colonne gauche : logo + texte + réseaux */}
        <div className="ec-hero__left">
          {/* PLACEHOLDER : logo de l'échevin */}
          <div className="ec-hero__logo">
            <div
              style={{
                width: '320px',
                maxWidth: '100%',
                height: '95px',
                borderRadius: '10px',
                background: 'rgba(123, 19, 214, 0.3)',
                border: '2px solid rgba(123, 19, 214, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              LOGO
            </div>
          </div>

          <div className="ec-hero__text">
            <p className="ec-hero__line1">
              {/* PLACEHOLDER : adapter le texte */}
              Depuis [année], je suis{' '}
              <strong>échevin de [Commune]</strong> en charge de la [compétence].
            </p>
            <p className="ec-hero__line2">
              {/* PLACEHOLDER : adapter la description */}
              [Description du parcours], je suis aujourd&apos;hui{' '}
              <strong>[fonction actuelle].</strong>
            </p>
          </div>

          <SocialRow />
        </div>

        {/* Colonne droite : vide, laisse voir le background */}
        <div className="ec-hero__right" />
      </div>
    </section>
  );
}
