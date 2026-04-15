import Link from 'next/link';
import EchevinLayout from '../../../components/echevin/EchevinLayout';

// PLACEHOLDER : remplacer par des données dynamiques
const PLACEHOLDER_NOTES = [
  {
    date: '15 avril 2026',
    title: 'Titre de la première actualité',
    excerpt:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...',
    href: '#',
  },
  {
    date: '10 avril 2026',
    title: 'Titre de la deuxième actualité',
    excerpt:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat...',
    href: '#',
  },
  {
    date: '2 avril 2026',
    title: 'Titre de la troisième actualité',
    excerpt:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur...',
    href: '#',
  },
  {
    date: '25 mars 2026',
    title: 'Titre de la quatrième actualité',
    excerpt:
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum...',
    href: '#',
  },
  {
    date: '18 mars 2026',
    title: 'Titre de la cinquième actualité',
    excerpt:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium...',
    href: '#',
  },
  {
    date: '10 mars 2026',
    title: 'Titre de la sixième actualité',
    excerpt:
      'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur...',
    href: '#',
  },
];

export default function EchevinNotes() {
  return (
    <EchevinLayout
      title="Actualités — Prénom Nom"
      description="Toutes les actualités de Prénom Nom, Échevin de [Commune]."
    >
      <section className="ec-notes-page">
        <div className="ec-notes-page__inner">
          <p className="ec-notes-page__surtitle">MES PUBLICATIONS</p>
          <h1 className="ec-notes-page__title">Actualités</h1>

          <div className="ec-notes-page__grid">
            {PLACEHOLDER_NOTES.map((note, i) => (
              <article className="ec-note-card" key={i}>
                <p className="ec-note-card__date">{note.date}</p>
                <h2 className="ec-note-card__title">
                  <Link href={note.href}>{note.title}</Link>
                </h2>
                <p className="ec-note-card__excerpt">{note.excerpt}</p>
                <Link href={note.href} className="ec-note-card__read-more">
                  lire la suite
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </EchevinLayout>
  );
}
