import { useState } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Actualités', href: '/echevin/notes' },
  {
    label: 'Vidéos',
    href: '/echevin/videos',
    children: [
      { label: 'Interventions', href: '/echevin/videos?cat=interventions' },
      { label: 'Médias', href: '/echevin/videos?cat=medias' },
      { label: 'Conseil communal', href: '/echevin/videos?cat=conseil' },
      { label: 'Sur le terrain', href: '/echevin/videos?cat=terrain' },
    ],
  },
  { label: 'Bio', href: '/echevin/bio' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="ec-header">
        <Link href="/echevin" className="ec-header__logo">
          <span className="ec-header__logo-text">
            {/* PLACEHOLDER : remplacer par le nom de l'échevin */}
            <span>Prénom</span> Nom
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="ec-nav">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div className="ec-nav__dropdown" key={item.label}>
                <Link href={item.href} className="ec-nav__link">
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
              <Link href={item.href} className="ec-nav__link" key={item.label}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <button className="ec-header__search" aria-label="Rechercher">
          &#128269;
        </button>

        {/* Hamburger */}
        <button
          className="ec-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span className="ec-hamburger__line" />
          <span className="ec-hamburger__line" />
          <span className="ec-hamburger__line" />
        </button>
      </header>

      {/* Mobile Nav */}
      <div className={`ec-mobile-nav ${mobileOpen ? 'active' : ''}`}>
        {NAV_ITEMS.map((item) => (
          <div key={item.label}>
            <Link href={item.href} onClick={() => setMobileOpen(false)}>
              {item.label}
            </Link>
            {item.children && (
              <div className="ec-mobile-nav__sub">
                {item.children.map((child) => (
                  <Link
                    href={child.href}
                    key={child.label}
                    onClick={() => setMobileOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
