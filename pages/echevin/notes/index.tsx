import type { GetServerSideProps } from 'next';
import EchevinLayout from '../../../components/echevin/EchevinLayout';
import PageHeader from '../../../components/echevin/PageHeader';
import NotesList from '../../../components/echevin/NotesList';
import { getArticles, type Article } from '../../../lib/content';

export default function EchevinNotes({ articles }: { articles: Article[] }) {
  return (
    <EchevinLayout
      title="Actualités — Anas Ben Abdelmoumen"
      description="Toutes les actualités d'Anas Ben Abdelmoumen, échevin à la Ville de Bruxelles."
    >
      <PageHeader surtitle="Mes publications" title="Actualités" image="/anas.jpg" />
      <NotesList articles={articles} />
    </EchevinLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const articles = await getArticles();
  return { props: { articles } };
};
