import type { Article } from '../../lib/content';

/**
 * Bandeau d'actualités défilant en continu de droite à gauche, façon "ticker".
 * Pause au survol pour permettre de cliquer. Boucle infinie en dupliquant la
 * liste deux fois (technique classique CSS keyframes).
 */
export default function NewsMarquee({ articles }: { articles: Article[] }) {
  if (!articles || articles.length === 0) return null;
  const items = [...articles, ...articles]; // dupliqué pour la boucle fluide
  return (
    <section className="ec-marquee" aria-label="Dernières actualités">
      <div className="ec-marquee__track">
        {items.map((a, i) => (
          <a
            key={`${a.id}-${i}`}
            href={a.href}
            target="_blank"
            rel="noopener noreferrer"
            className="ec-marquee__item"
          >
            <div className="ec-marquee__thumb">
              {a.image_url && <img src={a.image_url} alt="" loading="lazy" />}
            </div>
            <div className="ec-marquee__body">
              <span className="ec-marquee__source">{a.source}</span>
              <span className="ec-marquee__title">{a.title}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
