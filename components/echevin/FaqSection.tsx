import { useState } from 'react';

type QA = { q: string; a: string };
type Category = { id: string; title: string; items: QA[] };

const CATEGORIES: Category[] = [
  {
    id: 'proprete',
    title: 'Propreté publique',
    items: [
      {
        q: 'Comment signaler un dépôt clandestin ou toutes autres incivilités ?',
        a: `<p>Les habitants peuvent signaler un dépôt clandestin, une poubelle débordante, des sacs éventrés ou un problème de propreté via l'application <strong>FixMyStreet</strong> ou via les canaux officiels communaux.</p>
<p>Lors d'un signalement, il est conseillé de :</p>
<ul>
  <li>préciser l'adresse exacte ;</li>
  <li>joindre une photo si possible ;</li>
  <li>préciser la nature du problème (meubles, déchets ménagers, gravats, déchets alimentaires, etc.).</li>
</ul>
<p>Le signalement est alors transmis aux équipes de la propreté qui interviennent ensuite selon le niveau d'urgence et les contraintes opérationnelles. Les dépôts clandestins représentent un coût important pour la collectivité et mobilisent quotidiennement des moyens humains et logistiques conséquents.</p>
<p>J'encourage les habitants à signaler rapidement les problèmes afin de permettre une intervention plus efficace et de limiter l'effet d'accumulation.</p>
<p>Pour contacter les services en priorité, veuillez composer le numéro vert du Service Propreté de la Ville de Bruxelles : <strong><a href="tel:080090107">0800 90 107</a></strong><br/>ou envoyer un mail à : <a href="mailto:proprete@brucity.be"><strong>proprete@brucity.be</strong></a></p>`,
      },
      {
        q: "Que risque-t-on en cas de dépôt clandestin ou d'incivilité liée à la propreté ?",
        a: `<p>Les dépôts clandestins, jets de déchets sur la voie publique, abandon de sacs hors horaires autorisés ou autres incivilités peuvent faire l'objet de <strong>taxes</strong> conformément aux règlements communaux.</p>
<p>Le montant des taxes peut varier selon :</p>
<ul>
  <li>la nature des faits ;</li>
  <li>le volume des déchets.</li>
</ul>
<p>L'objectif n'est pas uniquement répressif : il vise aussi à <strong>protéger l'espace public</strong>, à garantir la qualité de vie des habitants et à éviter que les coûts de nettoyage soient supportés par l'ensemble des citoyens.</p>`,
      },
      {
        q: 'Puis-je déposer des meubles ou encombrants sur le trottoir ?',
        a: `<p><strong>Non !</strong> Le dépôt d'encombrants sur la voie publique sans autorisation ou sans respect des procédures prévues sera considéré comme un dépôt clandestin.</p>
<p>Pour se débarrasser légalement d'encombrants, plusieurs solutions existent :</p>
<ul>
  <li>prise de rendez-vous pour enlèvement (Ville ou Région) ;</li>
  <li>dépôt dans un recypark ;</li>
  <li>recours à des filières de réemploi ou de don (Troc&amp;Brol, Cycl'Up, etc.).</li>
</ul>
<p>Les objets déposés sans encadrement :</p>
<ul>
  <li>gênent les piétons et les PMR ;</li>
  <li>attirent d'autres déchets ;</li>
  <li>favorisent les nuisances ;</li>
  <li>facilitent l'arrivée de foyers de rats ;</li>
  <li>augmentent les coûts de nettoyage pour la collectivité.</li>
</ul>`,
      },
      {
        q: 'Pourquoi la Ville verbalise-t-elle les incivilités liées à la propreté ?',
        a: `<p>Le maintien de la propreté dans une grande ville nécessite un équilibre entre <strong>prévention, sensibilisation et verbalisation</strong>.</p>
<p>Les équipes communales réalisent quotidiennement un travail important de nettoyage, mais certaines incivilités répétées ont un impact direct sur :</p>
<ul>
  <li>la qualité de vie ;</li>
  <li>le sentiment d'insécurité ;</li>
  <li>l'image des quartiers ;</li>
  <li>les finances publiques.</li>
</ul>
<p>La verbalisation vise donc à :</p>
<ul>
  <li>responsabiliser ;</li>
  <li>lutter contre les comportements abusifs ;</li>
  <li>protéger les habitants respectueux des règles ;</li>
  <li>éviter que quelques comportements pénalisent l'ensemble des citoyens.</li>
</ul>`,
      },
    ],
  },
  {
    id: 'deratisation',
    title: 'Dératisation & Désinfection',
    items: [
      {
        q: 'Que faire si je constate la présence de rats dans mon quartier ?',
        a: `<p>La présence de rats doit être signalée rapidement afin de permettre une intervention adaptée.</p>
<p>Lors d'un signalement, il est utile de préciser :</p>
<ul>
  <li>l'adresse exacte ;</li>
  <li>les zones concernées (égouts, caves, espaces verts, dépôts de déchets…) ;</li>
  <li>la fréquence d'observation (première fois ? présence régulière ? etc.).</li>
</ul>
<p>Les rats prolifèrent principalement dans les zones où ils trouvent :</p>
<ul>
  <li>nourriture ;</li>
  <li>humidité ;</li>
  <li>abris ;</li>
  <li>déchets accessibles.</li>
</ul>
<p>La lutte contre les nuisibles nécessite donc à la fois des interventions techniques, une gestion rigoureuse des déchets et une prévention collective.</p>`,
      },
      {
        q: 'Qui peut bénéficier du service communal de dératisation de la Ville de Bruxelles et comment faire une demande ?',
        a: `<p>Le service communal de dératisation et de désinfection de la Ville de Bruxelles peut intervenir afin de lutter contre les problèmes de rats et de nuisibles sur le territoire communal.</p>
<p>Peuvent bénéficier du service :</p>
<ul>
  <li>les habitants domiciliés sur le territoire de la Ville de Bruxelles ;</li>
  <li>les locataires ;</li>
  <li>les propriétaires occupants ;</li>
  <li>les propriétaires de logements mis en location ;</li>
  <li>les établissements Horeca ;</li>
  <li>les commerces situés sur le territoire communal.</li>
</ul>
<p>Les demandes peuvent être introduites :</p>
<ul>
  <li>en ligne via <strong>MyBXL</strong> ;</li>
  <li>ou par téléphone auprès du service Désinfection au <strong><a href="tel:022741685">02 274 16 85</a></strong>, du lundi au vendredi de 8h30 à 12h et de 12h30 à 15h30.</li>
</ul>
<p>Une pièce d'identité peut être demandée lors de l'introduction de la demande. L'objectif du service est d'intervenir rapidement afin de limiter les risques sanitaires, protéger la salubrité publique et éviter la propagation des nuisibles.</p>`,
      },
      {
        q: 'Comment éviter la propagation des rats ?',
        a: `<p>La <strong>prévention</strong> joue un rôle essentiel dans la lutte contre les rats et autres nuisibles urbains.</p>
<p>Pour limiter leur prolifération, plusieurs gestes simples peuvent faire une réelle différence :</p>
<ul>
  <li>fermer hermétiquement les sources de nourriture ;</li>
  <li>nettoyer régulièrement afin d'éviter les miettes et déchets alimentaires ;</li>
  <li>respecter les horaires de sortie des sacs-poubelle ;</li>
  <li>éviter les accumulations de déchets ou d'objets pouvant servir d'abri ;</li>
  <li>ne pas nourrir les pigeons ou les animaux errants sur l'espace public.</li>
</ul>
<p>Certaines solutions naturelles peuvent également aider à éloigner les rats, comme le poivre, la sauge, la menthe ou l'huile essentielle de citronnelle.</p>`,
      },
    ],
  },
  {
    id: 'finances',
    title: 'Finances communales',
    items: [
      {
        q: 'À quoi servent les taxes communales ?',
        a: `<p>Les taxes communales permettent de financer les <strong>services essentiels</strong> rendus aux habitants.</p>
<p>Elles contribuent notamment à financer :</p>
<ul>
  <li>la propreté publique ;</li>
  <li>l'entretien des voiries ;</li>
  <li>les espaces publics ;</li>
  <li>la sécurité ;</li>
  <li>les équipements collectifs ;</li>
  <li>les services administratifs ;</li>
  <li>certaines politiques sociales et de prévention.</li>
</ul>
<p>Dans une grande ville, les coûts liés au nettoyage, à la gestion des déchets et aux interventions contre les nuisances représentent des montants importants assumés quotidiennement par la collectivité.</p>`,
      },
      {
        q: 'Pourquoi certaines taxes ciblent-elles des activités économiques spécifiques ?',
        a: `<p>Certaines taxes communales ont pour objectif :</p>
<ul>
  <li>de garantir une contribution équitable ;</li>
  <li>de lutter contre certains abus ;</li>
  <li>de mieux répartir les charges publiques ;</li>
  <li>d'adapter la fiscalité aux réalités urbaines contemporaines.</li>
</ul>
<p>Certaines activités économiques génèrent une pression accrue sur l'espace public, des coûts administratifs, des nuisances ou des mécanismes d'optimisation nécessitant un encadrement.</p>
<p>L'objectif est de construire une fiscalité locale plus <strong>juste, plus transparente</strong> et mieux adaptée aux réalités de la ville.</p>`,
      },
      {
        q: 'Pourquoi la propreté coûte-t-elle si cher à une grande ville ?',
        a: `<p>La propreté publique mobilise quotidiennement des centaines d'agents, des véhicules spécialisés, du matériel, des centres logistiques, des interventions d'urgence, des enlèvements de dépôts clandestins et des opérations de nettoyage intensif.</p>
<p>Les incivilités représentent une part importante des coûts supportés par la collectivité. Chaque dépôt sauvage, sac abandonné ou dégradation de l'espace public entraîne du temps de travail, des déplacements, du traitement de déchets et des coûts logistiques supplémentaires.</p>
<p>La propreté est donc un enjeu à la fois <strong>environnemental, sanitaire, budgétaire</strong> et <strong>collectif</strong>.</p>`,
      },
    ],
  },
];

function Item({ qa }: { qa: QA }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`ec-faq__item${open ? ' is-open' : ''}`}>
      <button className="ec-faq__q" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{qa.q}</span>
        <span className="ec-faq__chev" aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      {open && <div className="ec-faq__a" dangerouslySetInnerHTML={{ __html: qa.a }} />}
    </div>
  );
}

export default function FaqSection() {
  return (
    <section className="ec-faq">
      <div className="ec-faq__inner">
        <p className="ec-faq__intro">
          Retrouvez ici les réponses aux questions les plus fréquentes concernant
          la <strong>propreté publique</strong>, la <strong>dératisation</strong> et
          les <strong>finances communales</strong> à la Ville de Bruxelles.
        </p>
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="ec-faq__cat">
            <h3 className="ec-faq__cat-title">{cat.title}</h3>
            {cat.items.map((qa, i) => (
              <Item key={i} qa={qa} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
