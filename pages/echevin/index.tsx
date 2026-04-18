import type { GetServerSideProps } from 'next';
import EchevinLayout from '../../components/echevin/EchevinLayout';
import Hero from '../../components/echevin/Hero';
import Newsletter from '../../components/echevin/Newsletter';
import FeaturedNote from '../../components/echevin/FeaturedNote';
import NotesList from '../../components/echevin/NotesList';
import VideosSection from '../../components/echevin/VideosSection';
import ContactSection from '../../components/echevin/ContactSection';
import { getArticles, getHero, getVideos, type Article, type Video, type HeroSettings } from '../../lib/content';

type Props = {
  articles: Article[];
  videos: Video[];
  hero: HeroSettings;
};

export default function EchevinHome({ articles, videos, hero }: Props) {
  const featured = articles[0] || null;
  const rest = articles.slice(1);
  return (
    <EchevinLayout
      title="Anas Ben Abdelmoumen — Échevin à la Ville de Bruxelles"
      description="Site officiel d'Anas Ben Abdelmoumen, échevin des Finances et de la Propreté publique à la Ville de Bruxelles (PS). Actualités, vidéos, contact."
    >
      <Hero hero={hero} />
      <Newsletter />
      <FeaturedNote featured={featured} />
      <NotesList articles={rest} limit={4} showMore moreHref="/echevin/notes" />
      <VideosSection videos={videos.slice(0, 4)} />
      <ContactSection />
    </EchevinLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const [articles, videos, hero] = await Promise.all([
    getArticles({ limit: 20 }),
    getVideos(),
    getHero(),
  ]);
  return { props: { articles, videos, hero } };
};
