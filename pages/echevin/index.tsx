import type { GetServerSideProps } from 'next';
import EchevinLayout from '../../components/echevin/EchevinLayout';
import Hero from '../../components/echevin/Hero';
import Newsletter from '../../components/echevin/Newsletter';
import FeaturedNote from '../../components/echevin/FeaturedNote';
import NotesList from '../../components/echevin/NotesList';
import VideosSection from '../../components/echevin/VideosSection';
import ContactSection from '../../components/echevin/ContactSection';
import {
  getArticles,
  getHomeSettings,
  getFeaturedArticle,
  getVideos,
  type Article,
  type Video,
  type HomeSettings,
} from '../../lib/content';

type Props = {
  articles: Article[];
  featured: Article | null;
  videos: Video[];
  settings: HomeSettings;
};

export default function EchevinHome({ articles, featured, videos, settings }: Props) {
  const rest = featured ? articles.filter((a) => a.id !== featured.id) : articles;
  return (
    <EchevinLayout
      title="Anas Ben Abdelmoumen — Échevin à la Ville de Bruxelles"
      description="Site officiel d'Anas Ben Abdelmoumen, échevin des Finances et de la Propreté publique à la Ville de Bruxelles (PS). Actualités, vidéos, contact."
    >
      <Hero hero={settings.hero} />
      <Newsletter settings={settings.newsletter} />
      <FeaturedNote featured={featured} imageOverride={settings.featured.image_url || null} />
      <NotesList articles={rest} limit={4} showMore moreHref="/echevin/notes" />
      <VideosSection videos={videos.slice(0, 4)} />
      <ContactSection settings={settings.contact} />
    </EchevinLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const [articles, videos, settings] = await Promise.all([
    getArticles({ limit: 20 }),
    getVideos(),
    getHomeSettings(),
  ]);
  const featured = await getFeaturedArticle(settings.featured, articles);
  return { props: { articles, featured, videos, settings } };
};
