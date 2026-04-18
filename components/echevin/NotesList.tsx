import Link from 'next/link';
import type { Article } from '../../lib/content';

type Props = {
  articles: Article[];
  limit?: number;
  showMore?: boolean;
  moreHref?: string;
};

export default function NotesList({ articles, limit, showMore, moreHref = '/echevin/notes' }: Props) {
  const items = typeof limit === 'number' ? articles.slice(0, limit) : articles;
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
                  {note.image_url && (
                    <img
                      src={note.image_url}
                      alt={note.title}
                      className="ec-article-card__image-img"
                      loading="lazy"
                    />
                  )}
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
