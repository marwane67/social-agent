import EchevinLayout from '../../components/echevin/EchevinLayout';

export default function EchevinBio() {
  return (
    <EchevinLayout
      title="Bio — Prénom Nom"
      description="Biographie de Prénom Nom, Échevin de [Commune]."
    >
      <section className="ec-bio">
        <div className="ec-bio__inner">
          <p className="ec-bio__surtitle">À PROPOS</p>
          <h1 className="ec-bio__title">Bio</h1>

          <div className="ec-bio__content">
            {/* PLACEHOLDER : remplacer par la vraie biographie */}
            <p>
              Depuis [année], je suis{' '}
              <strong>Échevin de [compétences] à [Commune]</strong>. En charge
              de [liste des compétences], je m&apos;engage au quotidien pour
              améliorer la vie de nos concitoyens.
            </p>

            <p>
              Je suis né à <strong>[Ville de naissance]</strong> le [date de
              naissance] et j&apos;ai grandi dans la région de [région].
            </p>

            <p>
              J&apos;ai d&apos;abord fait des études de [domaine d&apos;études]
              au sein de l&apos;
              <a href="#">[Université / École]</a>. À l&apos;issue de cette
              formation, j&apos;ai obtenu{' '}
              <strong>[diplôme obtenu]</strong>.
            </p>

            <p>
              Avant de m&apos;engager en politique, j&apos;ai travaillé dans le
              secteur [secteur professionnel] pendant [nombre] années, où
              j&apos;ai acquis une expertise en [domaine d&apos;expertise].
            </p>

            <p>
              Mes premiers engagements politiques ont eu lieu en [année] au sein
              de <strong>[parti / mouvement]</strong>. Depuis, je me consacre à
              [cause / domaine politique].
            </p>

            <p>
              En tant qu&apos;Échevin, je suis particulièrement investi dans les
              dossiers de [dossier 1], [dossier 2] et [dossier 3]. Mon ambition
              est de [objectif politique principal].
            </p>

            <p>
              Je siège également au sein de [commissions / conseils] où je
              représente [commune / parti] sur les questions de [thématiques].
            </p>
          </div>
        </div>
      </section>
    </EchevinLayout>
  );
}
