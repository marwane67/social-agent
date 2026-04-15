import Link from 'next/link';

// PLACEHOLDER : remplacer par des données dynamiques
const PLACEHOLDER_VIDEOS = [
  {
    date: '15 avril',
    title: 'Titre de la vidéo mise en avant',
    source: 'Média local',
    duration: '23:39',
    href: '#',
    featured: true,
  },
  {
    date: '10 avril',
    title: 'Deuxième vidéo — Intervention au conseil',
    source: 'Conseil communal',
    duration: '12:17',
    href: '#',
  },
  {
    date: '5 avril',
    title: 'Troisième vidéo — Sur le terrain',
    source: 'Terrain',
    duration: '10:24',
    href: '#',
  },
  {
    date: '1 avril',
    title: 'Quatrième vidéo — Interview média',
    source: 'TV locale',
    duration: '20:55',
    href: '#',
  },
  {
    date: '28 mars',
    title: 'Cinquième vidéo — Débat public',
    source: 'Débat',
    duration: '25:26',
    href: '#',
  },
];

export default function VideosSection() {
  const featured = PLACEHOLDER_VIDEOS.find((v) => v.featured);
  const rest = PLACEHOLDER_VIDEOS.filter((v) => !v.featured);

  return (
    <section className="ec-videos">
      <div className="ec-videos__inner">
        <div className="ec-videos__header">
          <Link href="/echevin/videos" className="ec-videos__all">
            toutes mes vidéos
          </Link>
        </div>

        {/* Featured video */}
        {featured && (
          <div className="ec-videos__grid ec-videos__grid--featured" style={{ marginBottom: 24 }}>
            <Link href={featured.href} className="ec-video-card ec-video-card--featured">
              <div className="ec-video-card__thumb">
                <div className="ec-video-card__thumb-placeholder">&#9654;</div>
              </div>
              <div className="ec-video-card__body">
                <p className="ec-video-card__date">{featured.date}</p>
                <h3 className="ec-video-card__title">{featured.title}</h3>
                <div className="ec-video-card__meta">
                  <span className="ec-video-card__source">{featured.source}</span>
                  <span className="ec-video-card__duration">{featured.duration}</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Video grid */}
        <div className="ec-videos__grid">
          {rest.map((video, i) => (
            <Link href={video.href} className="ec-video-card" key={i}>
              <div className="ec-video-card__thumb">
                <div className="ec-video-card__thumb-placeholder">&#9654;</div>
              </div>
              <div className="ec-video-card__body">
                <p className="ec-video-card__date">{video.date}</p>
                <h3 className="ec-video-card__title">{video.title}</h3>
                <div className="ec-video-card__meta">
                  <span className="ec-video-card__source">{video.source}</span>
                  <span className="ec-video-card__duration">{video.duration}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
