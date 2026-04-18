import { useState } from 'react';
import Link from 'next/link';
import EchevinLayout from '../../../components/echevin/EchevinLayout';
import PageHeader from '../../../components/echevin/PageHeader';

const CATEGORIES = [
  { id: 'all', label: 'Tout' },
  { id: 'conseil', label: 'Au conseil communal' },
  { id: 'medias', label: 'Médias' },
  { id: 'terrain', label: 'Sur le terrain' },
  { id: 'interviews', label: 'Interviews' },
];

// PLACEHOLDER : a remplacer par les vraies videos d'Anas
const PLACEHOLDER_VIDEOS = [
  { date: 'Mars 2025', title: 'Intervention : tolérance zéro contre les dépôts clandestins', source: 'Conseil communal', duration: '8:20', category: 'conseil', href: '#' },
  { date: 'Février 2025', title: 'Action sur le terrain avec la police', source: 'Reportage', duration: '3:45', category: 'terrain', href: '#' },
  { date: 'Janvier 2025', title: 'Bilan 2024 : 5 000 amendes pour dépôts clandestins', source: 'BX1', duration: '12:10', category: 'medias', href: '#' },
  { date: 'Décembre 2024', title: 'Prestation de serment — Ville de Bruxelles', source: 'Ville de Bruxelles', duration: '4:30', category: 'conseil', href: '#' },
  { date: 'Décembre 2024', title: 'Première interview comme échevin', source: 'RTBF', duration: '6:15', category: 'interviews', href: '#' },
  { date: 'Octobre 2024', title: 'Campagne communale — Neder-Over-Heembeek', source: 'Campagne', duration: '2:40', category: 'terrain', href: '#' },
];

export default function EchevinVideos() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredVideos =
    activeCategory === 'all'
      ? PLACEHOLDER_VIDEOS
      : PLACEHOLDER_VIDEOS.filter((v) => v.category === activeCategory);

  return (
    <EchevinLayout
      title="Vidéos — Anas Ben Abdelmoumen"
      description="Toutes les vidéos d'Anas Ben Abdelmoumen, échevin à la Ville de Bruxelles."
    >
      <PageHeader surtitle="Mes vidéos" title="Vidéos" image="/anas.jpg" />
      <section className="ec-videos-page">
        <div className="ec-videos-page__inner">
          <div className="ec-videos-page__tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`ec-videos-page__tab ${
                  activeCategory === cat.id ? 'active' : ''
                }`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="ec-videos-page__grid">
            {filteredVideos.map((video, i) => (
              <Link href={video.href} className="ec-video-card" key={i}>
                <div className="ec-video-card__thumb">
                  <div className="ec-video-card__thumb-placeholder">
                    &#9654;
                  </div>
                </div>
                <div className="ec-video-card__body">
                  <p className="ec-video-card__date">{video.date}</p>
                  <h2 className="ec-video-card__title">{video.title}</h2>
                  <div className="ec-video-card__meta">
                    <span className="ec-video-card__source">{video.source}</span>
                    <span className="ec-video-card__duration">
                      {video.duration}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </EchevinLayout>
  );
}
