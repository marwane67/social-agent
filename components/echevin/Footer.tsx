import Link from 'next/link';
import SocialRow from './SocialRow';

export default function Footer() {
  return (
    <footer className="ec-footer">
      <div className="ec-footer__inner">
        <div className="ec-footer__top">
          {/* Logo */}
          <Link href="/echevin" className="ec-footer__logo">
            {/* PLACEHOLDER : logo de l'échevin */}
            <div
              style={{
                width: '160px',
                height: '48px',
                borderRadius: '6px',
                background: 'rgba(123, 19, 214, 0.15)',
                border: '1px solid rgba(123, 19, 214, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ec-primary)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              LOGO
            </div>
          </Link>

          {/* Social */}
          <div className="ec-footer__social">
            <SocialRow />
          </div>
        </div>

        <div className="ec-footer__mid">
          <nav className="ec-footer__nav">
            <Link href="/echevin/notes">Actualités</Link>
            <Link href="/echevin/videos">Vidéos</Link>
            <Link href="/echevin/bio">Bio</Link>
          </nav>
        </div>

        <div className="ec-footer__bottom">
          <span>Tous droits réservés &ndash; 2026</span>
          <span>
            {/* PLACEHOLDER : crédit */}
            <a href="#" target="_blank" rel="noopener noreferrer">
              Créé par [Votre nom]
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
