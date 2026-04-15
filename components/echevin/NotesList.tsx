import Link from 'next/link';

// PLACEHOLDER : remplacer par des données dynamiques
const PLACEHOLDER_NOTES = [
  {
    date: '10 avril 2026',
    title: 'Titre de la deuxième actualité',
    excerpt:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...',
    href: '#',
  },
  {
    date: '2 avril 2026',
    title: 'Titre de la troisième actualité',
    excerpt:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat...',
    href: '#',
  },
  {
    date: '25 mars 2026',
    title: 'Titre de la quatrième actualité',
    excerpt:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur...',
    href: '#',
  },
  {
    date: '18 mars 2026',
    title: 'Titre de la cinquième actualité',
    excerpt:
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum...',
    href: '#',
  },
];

export default function NotesList() {
  return (
    <section className="ec-notes-list">
      <div className="ec-notes-list__inner">
        {PLACEHOLDER_NOTES.map((note, i) => (
          <article className="ec-notes-list__item" key={i}>
            <p className="ec-notes-list__date">{note.date}</p>
            <h3 className="ec-notes-list__title">
              <Link href={note.href}>{note.title}</Link>
            </h3>
            <p className="ec-notes-list__excerpt">{note.excerpt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
