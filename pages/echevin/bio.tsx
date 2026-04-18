import EchevinLayout from '../../components/echevin/EchevinLayout';
import PageHeader from '../../components/echevin/PageHeader';

export default function EchevinBio() {
  return (
    <EchevinLayout
      title="Bio — Anas Ben Abdelmoumen"
      description="Biographie d'Anas Ben Abdelmoumen, échevin des Finances et de la Propreté publique à la Ville de Bruxelles."
    >
      <PageHeader surtitle="À propos" title="Bio" image="/anas.jpg" />

      <section className="ec-bio">
        <div className="ec-bio__inner">
          <div className="ec-bio__content">
            <p>
              Depuis le 1<sup>er</sup> décembre 2024, je suis{' '}
              <strong>
                échevin des Finances et de la Propreté publique à la Ville de
                Bruxelles
              </strong>
              . J&apos;exerce ce mandat au sein de la majorité conduite par le
              bourgmestre Philippe Close (PS).
            </p>

            <h2 style={{ marginTop: 40, marginBottom: 16 }}>
              Jeunesse et formation
            </h2>
            <p>
              J&apos;ai grandi dans un milieu ouvrier et réside à{' '}
              <strong>Neder-Over-Heembeek</strong> depuis 1997. J&apos;ai
              effectué ma scolarité secondaire à l&apos;Athénée Les Pagodes.
            </p>
            <p>
              En 2015, j&apos;ai obtenu mon bachelier en sciences politiques à
              l&apos;<strong>Université libre de Bruxelles (ULB)</strong>, puis
              en 2017 un master en administration et management public.
              J&apos;ai également suivi plusieurs formations en gestion
              publique à la Haute École Francisco Ferrer.
            </p>
            <p>
              Durant mes études, j&apos;ai effectué des stages au SPF Finances
              et auprès de Karine Lalieux (PS), alors députée et échevine
              bruxelloise. Je me suis aussi engagé au sein de la{' '}
              <em>Belgian Youth Diplomacy</em>, qui outille les jeunes pour
              mieux comprendre l&apos;actualité internationale.
            </p>

            <h2 style={{ marginTop: 40, marginBottom: 16 }}>
              Parcours politique
            </h2>
            <p>
              De novembre 2017 à août 2019, j&apos;ai été{' '}
              <strong>collaborateur parlementaire</strong> du député bruxellois
              Mohamed Ouriaghli (PS). En octobre 2018, je me suis présenté pour
              la première fois aux élections communales à la Ville de
              Bruxelles. 41<sup>ᵉ</sup> sur la liste PS, j&apos;ai récolté{' '}
              <strong>1 124 voix de préférence</strong>, devenant le 10
              <sup>ᵉ</sup> élu du parti. Le 3 décembre 2018, j&apos;ai prêté
              serment comme <strong>conseiller communal</strong>.
            </p>
            <p>
              Dans le cadre de ce mandat, j&apos;ai siégé aux conseils
              d&apos;administration de <strong>Vivaqua</strong>, des{' '}
              <strong>Piscines bruxelloises</strong> et du{' '}
              <strong>Logement bruxellois</strong>. Je me suis notamment
              mobilisé pour le maintien des distributeurs automatiques de
              billets — notamment à Neder-Over-Heembeek, où un nouveau
              distributeur a été installé en octobre 2023 — et pour un meilleur
              encadrement des travaux de voirie.
            </p>
            <p>
              En mai 2019, je me suis présenté aux élections régionales (59
              <sup>ᵉ</sup> sur la liste PS), récoltant 2 754 voix. En décembre
              2021, j&apos;ai rejoint le cabinet du vice-Premier ministre et
              ministre de l&apos;Économie{' '}
              <strong>Pierre-Yves Dermagne</strong> comme{' '}
              <strong>conseiller digitalisation</strong>.
            </p>
            <p>
              En octobre 2024, 13<sup>ᵉ</sup> sur la liste PS-Vooruit aux
              communales, j&apos;ai obtenu <strong>2 450 voix</strong> — le 4
              <sup>ᵉ</sup> meilleur score de ma liste et le 6<sup>ᵉ</sup> toutes
              listes confondues. Fin novembre 2024, l&apos;assemblée générale
              de la section bruxelloise du PS m&apos;a proposé comme échevin.
            </p>

            <h2 style={{ marginTop: 40, marginBottom: 16 }}>Mandat en cours</h2>
            <p>
              Comme échevin de la <strong>Propreté publique</strong>, je porte
              une politique de <strong>tolérance zéro</strong> contre les
              dépôts clandestins. En 2024, la Ville de Bruxelles a infligé
              près de <strong>5 000 amendes</strong> pour ce motif. Début 2025,
              une action conjointe avec la police a permis d&apos;identifier
              et sanctionner quatre personnes en quelques heures.
            </p>
            <p>
              Je mène également un combat contre le{' '}
              <strong>« tourisme des déchets »</strong> : début mars 2025,
              j&apos;ai révélé qu&apos;un tiers des dépôts clandestins
              identifiés à Bruxelles provenaient de l&apos;extérieur de la
              ville. Contrôles renforcés et fermeté entendent mettre un terme à
              ce phénomène.
            </p>
            <p>
              Comme échevin des <strong>Finances</strong>, je veille à une
              gestion rigoureuse et transparente des deniers publics, au
              service des Bruxelloises et des Bruxellois.
            </p>

            <h2 style={{ marginTop: 40, marginBottom: 16 }}>En savoir plus</h2>
            <p>
              &rarr;{' '}
              <a
                href="https://www.bruxelles.be/anas-ben-abdelmoumen"
                target="_blank"
                rel="noopener noreferrer"
              >
                Page officielle sur bruxelles.be
              </a>
              <br />
              &rarr;{' '}
              <a
                href="https://www.linkedin.com/in/anbenabd/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Profil LinkedIn
              </a>
            </p>
          </div>
        </div>
      </section>
    </EchevinLayout>
  );
}
