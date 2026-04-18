import Link from 'next/link';
import SocialRow from './SocialRow';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="ec-footer">
      <div className="ec-footer__inner">
        <div className="ec-footer__row">
          <div className="ec-footer__left">
            <Link href="/echevin" className="ec-footer__logo">
              <Logo size="sm" variant="light" />
            </Link>
            <SocialRow />
          </div>

          <div className="ec-footer__right">
            <nav className="ec-footer__nav">
              <Link href="/echevin/notes">Actualités</Link>
              <Link href="/echevin/videos">Vidéos</Link>
              <Link href="/echevin/bio">Bio</Link>
              <a
                href="https://www.bruxelles.be/anas-ben-abdelmoumen"
                target="_blank"
                rel="noopener noreferrer"
              >
                Page officielle
              </a>
            </nav>

            <div className="ec-footer__party-logo">
              <img
                src="/ps-logo.svg"
                alt="Parti Socialiste"
                className="ec-footer__party-img"
              />
            </div>

            <p className="ec-footer__credits">
              Échevin des Finances et de la Propreté publique &mdash; Ville de Bruxelles
              <br />
              Tous droits réservés &ndash; 2026
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
