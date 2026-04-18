import type { GetServerSideProps } from 'next';
import EchevinLayout from '../../../components/echevin/EchevinLayout';
import PageHeader from '../../../components/echevin/PageHeader';
import NotesList from '../../../components/echevin/NotesList';
import { getArticles, getPageHeaderImage, type Article } from '../../../lib/content';

type Props = { articles: Article[]; headerImage: string };

export default function EchevinNotes({ articles, headerImage }: Props) {
  return (
    <EchevinLayout
      title="Actualités — Anas Ben Abdelmoumen"
      description="Toutes les actualités d'Anas Ben Abdelmoumen, échevin à la Ville de Bruxelles."
    >
      <PageHeader surtitle="Mes publications" title="Actualités" image={headerImage} />
      <NotesList articles={articles} />
    </EchevinLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const [articles, header] = await Promise.all([getArticles(), getPageHeaderImage('notes_header')]);
  return { props: { articles, headerImage: header.image_url || '/anas.jpg' } };
};
