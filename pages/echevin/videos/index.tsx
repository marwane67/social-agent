import { useState } from 'react';
import Link from 'next/link';
import EchevinLayout from '../../../components/echevin/EchevinLayout';

const CATEGORIES = [
  { id: 'all', label: 'Tout' },
  { id: 'interventions', label: 'Interventions' },
  { id: 'medias', label: 'Médias' },
  { id: 'conseil', label: 'Conseil communal' },
  { id: 'terrain', label: 'Sur le terrain' },
];

// PLACEHOLDER : remplacer par des données dynamiques
const PLACEHOLDER_VIDEOS = [
  {
    date: '15 avril 2026',
    title: 'Titre de la première vidéo',
    source: 'Média local',
    duration: '23:39',
    category: 'medias',
    href: '#',
  },
  {
    date: '10 avril 2026',
    title: 'Intervention au conseil communal',
    source: 'Conseil communal',
    duration: '12:17',
    category: 'conseil',
    href: '#',
  },
  {
    date: '5 avril 2026',
    title: 'Visite de terrain — Quartier [nom]',
    source: 'Sur le terrain',
    duration: '10:24',
    category: 'terrain',
    href: '#',
  },
  {
    date: '1 avril 2026',
    title: 'Interview sur [sujet]',
    source: 'TV locale',
    duration: '20:55',
    category: 'medias',
    href: '#',
  },
  {
    date: '28 mars 2026',
    title: 'Intervention au conseil — Budget 2026',
    source: 'Conseil communal',
    duration: '25:26',
    category: 'conseil',
    href: '#',
  },
  {
    date: '20 mars 2026',
    title: 'Inauguration [lieu]',
    source: 'Sur le terrain',
    duration: '8:45',
    category: 'terrain',
    href: '#',
  },
];

export default function EchevinVideos() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredVideos =
    activeCategory === 'all'
      ? PLACEHOLDER_VIDEOS
      : PLACEHOLDER_VIDEOS.filter((v) => v.category === activeCategory);

  return (
    <EchevinLayout
      title="Vidéos — Prénom Nom"
      description="Toutes les vidéos de Prénom Nom, Échevin de [Commune]."
    >
      <section className="ec-videos-page">
        <div className="ec-videos-page__inner">
          <p className="ec-videos-page__surtitle">MES VIDÉOS</p>
          <h1 className="ec-videos-page__title">Vidéos</h1>

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
