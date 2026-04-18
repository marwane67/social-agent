import Link from 'next/link';
import type { Video } from '../../lib/content';

export default function VideosSection({ videos }: { videos: Video[] }) {
  if (!videos || videos.length === 0) {
    return null;
  }
  const featured = videos[0];
  const rest = videos.slice(1, 5);
  const featuredHref = featured.file_url || '#';
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
              <a href={featuredHref} target="_blank" rel="noopener noreferrer" className="ec-videos__featured-card">
                <div className="ec-videos__featured-thumb">
                  {featured.thumb_url ? (
                    <img src={featured.thumb_url} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="ec-videos__thumb-placeholder ec-videos__thumb-placeholder--large">&#9654;</div>
                  )}
                </div>
                <div className="ec-videos__featured-info">
                  <p className="ec-videos__date">{featured.date}</p>
                  <h3 className="ec-videos__title">{featured.title}</h3>
                  <div className="ec-videos__meta">
                    <span>{featured.source}</span>
                    <span>{featured.duration}</span>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {rest.length > 0 && (
            <div className="ec-videos__grid">
              {rest.map((video) => (
                <a href={video.file_url || '#'} target="_blank" rel="noopener noreferrer" className="ec-videos__card" key={video.id}>
                  <div className="ec-videos__card-thumb">
                    {video.thumb_url ? (
                      <img src={video.thumb_url} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="ec-videos__thumb-placeholder">&#9654;</div>
                    )}
                  </div>
                  <p className="ec-videos__date">{video.date}</p>
                  <h4 className="ec-videos__card-title">{video.title}</h4>
                  <div className="ec-videos__meta">
                    <span>{video.source}</span>
                    <span>{video.duration}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
