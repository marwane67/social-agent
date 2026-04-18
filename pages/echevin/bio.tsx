import type { GetServerSideProps } from 'next';
import EchevinLayout from '../../components/echevin/EchevinLayout';
import PageHeader from '../../components/echevin/PageHeader';
import { getBio, type BioSection } from '../../lib/content';

export default function EchevinBio({ sections }: { sections: BioSection[] }) {
  return (
    <EchevinLayout
      title="Bio — Anas Ben Abdelmoumen"
      description="Biographie d'Anas Ben Abdelmoumen, échevin des Finances et de la Propreté publique à la Ville de Bruxelles."
    >
      <PageHeader surtitle="À propos" title="Bio" image="/anas.jpg" />

      <section className="ec-bio">
        <div className="ec-bio__inner">
          <div className="ec-bio__content">
            {sections.map((s) => (
              <div key={s.id}>
                {s.heading && (
                  <h2 style={{ marginTop: 40, marginBottom: 16 }}>{s.heading}</h2>
                )}
                <div dangerouslySetInnerHTML={{ __html: s.body_html }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </EchevinLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const sections = await getBio();
  return { props: { sections } };
};
