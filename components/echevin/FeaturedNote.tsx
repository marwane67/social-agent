import Link from 'next/link';
import { NOTES } from '../../data/notes';

export default function FeaturedNote() {
  const featured = NOTES[0];

  return (
    <section className="ec-featured">
      <div className="ec-featured__inner">
        <div className="ec-featured__card">
          <div className="ec-featured__sidebar">
            <div className="ec-featured__sidebar-label">Actualités</div>
          </div>

          <div className="ec-featured__body">
            <p className="ec-featured__date">
              {featured.source} &mdash; {featured.date}
            </p>
            <h2 className="ec-featured__title">{featured.title}</h2>
            <p className="ec-featured__excerpt">{featured.excerpt}</p>
            <div className="ec-featured__buttons">
              <a
                href={featured.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ec-featured__btn"
              >
                lire l&apos;article
              </a>
              <Link href="/echevin/notes" className="ec-featured__btn">
                toutes mes actualités
              </Link>
            </div>
          </div>

          <div className="ec-featured__image">
            <img
              src={featured.image}
              alt={featured.title}
              className="ec-featured__image-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
