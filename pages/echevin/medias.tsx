import type { GetServerSideProps } from 'next';
import EchevinLayout from '../../components/echevin/EchevinLayout';
import PageHeader from '../../components/echevin/PageHeader';
import { getPageHeaderImage, getMediasList, type MediaPhoto } from '../../lib/content';

type Props = { headerImage: string; photos: MediaPhoto[] };

export default function EchevinMedias({ headerImage, photos }: Props) {
  return (
    <EchevinLayout
      title="Médias & presse — Anas Ben Abdelmoumen"
      description="Espace presse : photos haute définition et ressources libres de droits pour les journalistes."
    >
      <PageHeader surtitle="Espace presse" title="Médias" image={headerImage} />

      <section className="ec-medias">
        <div className="ec-medias__inner">
          <p className="ec-medias__intro">
            Cet espace est dédié aux <strong>journalistes et professionnels des médias</strong>.
            Vous y trouverez des <strong>photos haute définition</strong>, des éléments biographiques
            et des ressources visuelles libres de droits pour illustrer vos articles sur Anas Ben Abdelmoumen.
          </p>

          <h2 className="ec-medias__h2">Photos officielles</h2>
          {photos.length === 0 ? (
            <p className="ec-medias__empty">
              Les photos officielles seront mises à disposition prochainement.<br />
              Pour toute demande urgente, contactez-nous directement par mail.
            </p>
          ) : (
            <div className="ec-medias__grid">
              {photos.map((p, i) => (
                <a
                  key={i}
                  href={p.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ec-medias__card"
                  title={`Télécharger : ${p.caption}`}
                >
                  <div className="ec-medias__thumb">
                    <img src={p.url} alt={p.caption} loading="lazy" />
                  </div>
                  <div className="ec-medias__caption">
                    <span>{p.caption}</span>
                    <small>↓ Télécharger en HD</small>
                  </div>
                </a>
              ))}
            </div>
          )}

          <h2 className="ec-medias__h2">Contact presse</h2>
          <p className="ec-medias__contact">
            Pour toute demande spécifique (interview, photo personnalisée, réaction officielle, etc.) :{' '}
            <a href="mailto:presse@anas-benabdelmoumen.be">
              <strong>presse@anas-benabdelmoumen.be</strong>
            </a>
          </p>
        </div>
      </section>
    </EchevinLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const [h, photos] = await Promise.all([
    getPageHeaderImage('medias_header'),
    getMediasList(),
  ]);
  return { props: { headerImage: h.image_url || '/anas.jpg', photos } };
};
