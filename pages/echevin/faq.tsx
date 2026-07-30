import type { GetServerSideProps } from 'next';
import EchevinLayout from '../../components/echevin/EchevinLayout';
import PageHeader from '../../components/echevin/PageHeader';
import FaqSection from '../../components/echevin/FaqSection';
import { getPageHeaderImage } from '../../lib/content';

export default function EchevinFaq({ headerImage }: { headerImage: string }) {
  return (
    <EchevinLayout
      title="FAQ — Anas Ben Abdelmoumen"
      description="Foire aux questions : propreté publique, dératisation, finances communales — Ville de Bruxelles."
    >
      <PageHeader surtitle="Vos questions" title="FAQ" image={headerImage} />
      <FaqSection />
    </EchevinLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const h = await getPageHeaderImage('faq_header');
  return { props: { headerImage: h.image_url || '/anas.jpg' } };
};
