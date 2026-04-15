import Link from 'next/link';

export default function FeaturedNote() {
  return (
    <section className="ec-featured-note">
      <div className="ec-featured-note__inner">
        <div className="ec-featured-note__card">
          {/* Colonne gauche : image */}
          <div className="ec-featured-note__image">
            {/* PLACEHOLDER : image de l'article */}
            <div
              style={{
                width: '100%',
                height: '100%',
                minHeight: '300px',
                background: 'linear-gradient(135deg, #7B13D6 0%, #4a0a80 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Image article
            </div>
          </div>

          {/* Colonne droite : contenu sur fond sombre */}
          <div className="ec-featured-note__body">
            <p className="ec-featured-note__date">15 avril</p>
            <h2 className="ec-featured-note__title">
              Titre de l&apos;article mis en avant
            </h2>
            <p className="ec-featured-note__excerpt">
              {/* PLACEHOLDER : extrait de l'article */}
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore...
            </p>
            <div className="ec-featured-note__buttons">
              <Link href="#" className="ec-featured-note__btn">
                lire la suite
              </Link>
              <Link href="/echevin/notes" className="ec-featured-note__btn">
                toutes mes actualités
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
