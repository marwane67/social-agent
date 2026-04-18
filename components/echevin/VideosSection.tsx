import Link from 'next/link';

// PLACEHOLDER : a remplacer par les vraies videos
const FEATURED_VIDEO = {
  date: 'Mars 2025',
  title: 'Tolérance zéro contre les dépôts clandestins',
  source: 'Conseil communal',
  duration: '8:20',
  href: '#',
};

const VIDEOS = [
  { date: 'Février 2025', title: 'Action Propreté–Police sur le terrain', source: 'Reportage', duration: '3:45', href: '#' },
  { date: 'Janvier 2025', title: 'Bilan 2024 : 5 000 amendes', source: 'BX1', duration: '12:10', href: '#' },
  { date: 'Décembre 2024', title: 'Prestation de serment', source: 'Ville de Bruxelles', duration: '4:30', href: '#' },
  { date: 'Décembre 2024', title: 'Première interview comme échevin', source: 'RTBF', duration: '6:15', href: '#' },
];

export default function VideosSection() {
  return (
    <section className="ec-videos">
      <div className="ec-videos__inner">
        <div className="ec-videos__container">
          <div className="ec-videos__featured">
            <div className="ec-videos__featured-left">
              <div className="ec-videos__thumb-placeholder">&#9654;</div>
              <Link href="/echevin/videos" className="ec-videos__all-btn">
                toutes mes vidéos
              </Link>
            </div>
            <div className="ec-videos__featured-right">
              <Link href={FEATURED_VIDEO.href} className="ec-videos__featured-card">
                <div className="ec-videos__featured-thumb">
                  <div className="ec-videos__thumb-placeholder ec-videos__thumb-placeholder--large">&#9654;</div>
                </div>
                <div className="ec-videos__featured-info">
                  <p className="ec-videos__date">{FEATURED_VIDEO.date}</p>
                  <h3 className="ec-videos__title">{FEATURED_VIDEO.title}</h3>
                  <div className="ec-videos__meta">
                    <span>{FEATURED_VIDEO.source}</span>
                    <span>{FEATURED_VIDEO.duration}</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="ec-videos__grid">
            {VIDEOS.map((video, i) => (
              <Link href={video.href} className="ec-videos__card" key={i}>
                <div className="ec-videos__card-thumb">
                  <div className="ec-videos__thumb-placeholder">&#9654;</div>
                </div>
                <p className="ec-videos__date">{video.date}</p>
                <h4 className="ec-videos__card-title">{video.title}</h4>
                <div className="ec-videos__meta">
                  <span>{video.source}</span>
                  <span>{video.duration}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
