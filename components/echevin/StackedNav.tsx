import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { NOTES } from '../../data/notes';
import Logo from './Logo';

const HOME_HREF = '/echevin';

const NAV_ITEMS = [
  { label: 'Actualités', href: '/echevin/notes' },
  {
    label: 'Vidéos',
    href: '/echevin/videos',
    children: [
      { label: 'Au conseil communal', href: '/echevin/videos?cat=conseil' },
      { label: 'Médias', href: '/echevin/videos?cat=medias' },
      { label: 'Sur le terrain', href: '/echevin/videos?cat=terrain' },
      { label: 'Interviews', href: '/echevin/videos?cat=interviews' },
    ],
  },
  { label: 'Bio', href: '/echevin/bio' },
];

type Props = {
  /** If true, this nav is overlaid on a photo hero (used on bio/notes/videos pages). */
  floating?: boolean;
};

export default function StackedNav({ floating = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return NOTES.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  const isActive = (href: string) => {
    const clean = href.split('?')[0];
    return router.asPath === clean || router.asPath.startsWith(clean + '/');
  };

  return (
    <div className={`ec-nav-wrap${floating ? ' ec-nav-wrap--floating' : ''}`}>
      <div className="ec-nav-layer ec-nav-layer--purple">
        <div className="ec-nav-layer ec-nav-layer--red">
          <div className="ec-nav-layer ec-nav-layer--black">
            {floating && (
              <Link href={HOME_HREF} className="ec-nav__logo" aria-label="Accueil">
                <Logo size="sm" variant="light" />
              </Link>
            )}
            <nav className="ec-nav">
              {NAV_ITEMS.map((item) =>
                item.children ? (
                  <div className="ec-nav__dropdown" key={item.label}>
                    <Link
                      href={item.href}
                      className={`ec-nav__link${isActive(item.href) ? ' is-active' : ''}`}
                    >
                      {item.label}
                    </Link>
                    <div className="ec-nav__dropdown-menu">
                      {item.children.map((child) => (
                        <Link href={child.href} key={child.label}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`ec-nav__link${isActive(item.href) ? ' is-active' : ''}`}
                    key={item.label}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            <div className={`ec-search${open ? ' ec-search--open' : ''}`}>
              {open && (
                <input
                  type="search"
                  autoFocus
                  placeholder="Rechercher une actualité…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="ec-search__input"
                />
              )}
              <button
                className="ec-nav__search"
                aria-label={open ? 'Fermer la recherche' : 'Rechercher'}
                onClick={() => {
                  setOpen((o) => !o);
                  if (open) setQuery('');
                }}
              >
                {open ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="20" y1="20" x2="16.5" y2="16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {open && query.trim() && (
        <div className="ec-search__results">
          {matches.length === 0 ? (
            <p className="ec-search__empty">Aucun résultat pour « {query} »</p>
          ) : (
            <ul>
              {matches.map((n) => (
                <li key={n.id}>
                  <a
                    href={n.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ec-search__item"
                  >
                    <span className="ec-search__source">{n.source}</span>
                    <span className="ec-search__title">{n.title}</span>
                    <span className="ec-search__date">{n.date}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
