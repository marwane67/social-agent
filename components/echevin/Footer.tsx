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
              <Link href="/echevin/faq">FAQ</Link>
              <Link href="/echevin/medias">Médias</Link>
              <a
                href="https://www.bruxelles.be/anas-ben-abdelmoumen"
                target="_blank"
                rel="noopener noreferrer"
              >
                Page officielle
              </a>
            </nav>

            <div className="ec-footer__party-logo">
              <a
                href="https://www.ps.be"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Site officiel du Parti Socialiste"
                className="ec-footer__partner ec-footer__partner--ps"
              >
                <img src="/ps-logo.png" alt="Parti Socialiste" className="ec-footer__partner-img" />
              </a>
              <a
                href="https://www.bruxelles.be/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Site officiel de la Ville de Bruxelles"
                className="ec-footer__partner ec-footer__partner--bxl"
              >
                <img src="/bxl-logo.png" alt="Ville de Bruxelles" className="ec-footer__partner-img" />
              </a>
              <a
                href="https://fixmystreet.brussels"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="FixMyStreet Bruxelles"
                className="ec-footer__partner ec-footer__partner--fms"
              >
                {/* TODO : remplacer par <img src="/fixmystreet-logo.png" /> quand le logo arrive */}
                <span className="ec-footer__partner-text">FixMyStreet</span>
              </a>
            </div>

            <p className="ec-footer__credits">
              Échevin des Finances et de la Propreté publique &mdash; Ville de Bruxelles
              <br />
              Tous droits réservés &ndash; 2026
              <br />
              <span className="ec-footer__credits-by">
                Créé par{' '}
                <a
                  href="https://pulsacreatives.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pulsa Creatives
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
