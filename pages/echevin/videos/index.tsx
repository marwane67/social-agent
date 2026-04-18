import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import EchevinLayout from '../../../components/echevin/EchevinLayout';
import PageHeader from '../../../components/echevin/PageHeader';
import { getVideos, getPageHeaderImage, type Video } from '../../../lib/content';

const CATEGORIES = [
  { id: 'all', label: 'Tout' },
  { id: 'conseil', label: 'Au conseil communal' },
  { id: 'medias', label: 'Médias' },
  { id: 'terrain', label: 'Sur le terrain' },
  { id: 'interviews', label: 'Interviews' },
];

export default function EchevinVideos({ videos, headerImage }: { videos: Video[]; headerImage: string }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered =
    activeCategory === 'all' ? videos : videos.filter((v) => v.category === activeCategory);

  return (
    <EchevinLayout
      title="Vidéos — Anas Ben Abdelmoumen"
      description="Toutes les vidéos d'Anas Ben Abdelmoumen, échevin à la Ville de Bruxelles."
    >
      <PageHeader surtitle="Mes vidéos" title="Vidéos" image={headerImage} />
      <section className="ec-videos-page">
        <div className="ec-videos-page__inner">
          <div className="ec-videos-page__tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`ec-videos-page__tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px 0', opacity: 0.6 }}>
              Aucune vidéo dans cette catégorie pour le moment.
            </p>
          ) : (
            <div className="ec-videos-page__grid">
              {filtered.map((video) => (
                <a
                  href={video.file_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ec-video-card"
                  key={video.id}
                >
                  <div className="ec-video-card__thumb">
                    {video.thumb_url ? (
                      <img src={video.thumb_url} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="ec-video-card__thumb-placeholder">&#9654;</div>
                    )}
                  </div>
                  <div className="ec-video-card__body">
                    <p className="ec-video-card__date">{video.date}</p>
                    <h2 className="ec-video-card__title">{video.title}</h2>
                    <div className="ec-video-card__meta">
                      <span className="ec-video-card__source">{video.source}</span>
                      <span className="ec-video-card__duration">{video.duration}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </EchevinLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const [videos, header] = await Promise.all([getVideos(), getPageHeaderImage('videos_header')]);
  return { props: { videos, headerImage: header.image_url || '/anas.jpg' } };
};
