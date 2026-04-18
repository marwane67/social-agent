import Link from 'next/link';
import { NOTES } from '../../data/notes';

type Props = {
  limit?: number;
  showMore?: boolean;
  moreHref?: string;
};

export default function NotesList({ limit, showMore, moreHref = '/echevin/notes' }: Props) {
  const items = typeof limit === 'number' ? NOTES.slice(0, limit) : NOTES;
  return (
    <section className="ec-articles">
      <div className="ec-articles__inner">
        <div className="ec-articles__grid">
          {items.map((note) => (
            <article className="ec-article-card" key={note.id}>
              <a
                href={note.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ec-article-card__image-link"
              >
                <div className="ec-article-card__image">
                  <img
                    src={note.image}
                    alt={note.title}
                    className="ec-article-card__image-img"
                    loading="lazy"
                  />
                  <span className="ec-article-card__source">{note.source}</span>
                </div>
              </a>
              <div className="ec-article-card__body">
                <p className="ec-article-card__date">{note.date}</p>
                <h3 className="ec-article-card__title">
                  <a href={note.href} target="_blank" rel="noopener noreferrer">
                    {note.title}
                  </a>
                </h3>
                <p className="ec-article-card__excerpt">{note.excerpt}</p>
                <a
                  href={note.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ec-article-card__read"
                >
                  lire l&apos;article →
                </a>
              </div>
            </article>
          ))}
        </div>

        {showMore && (
          <div className="ec-articles__more">
            <Link href={moreHref} className="ec-articles__more-btn">
              lire d&apos;autres actualités →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
