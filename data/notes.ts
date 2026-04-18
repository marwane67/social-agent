export type Note = {
  id: string;
  title: string;
  source: string;
  date: string;
  excerpt: string;
  href: string;
  image: string;
  theme: 'proprete' | 'deratisation' | 'toilettes' | 'finances' | 'solidarite';
};

export const NOTES: Note[] = [
  {
    id: 'lesoir-tourisme-dechets',
    title: '« Tourisme des déchets » dans la capitale : 37 % des dépôts sauvages par des non-Bruxellois',
    source: 'Le Soir',
    date: '17 février 2026',
    excerpt:
      "Le constat est sans appel : plus d'un dépôt sauvage sur trois à Bruxelles est le fait d'habitants de la périphérie. La Ville durcit les sanctions.",
    href: 'https://www.lesoir.be/729457/article/2026-02-17/tourisme-des-dechets-dans-la-capitale-37-des-depots-sauvages-par-des-non',
    image: '/notes/01-lesoir.jpeg',
    theme: 'proprete',
  },
  {
    id: 'lalibre-amende-sur-trois',
    title: 'À Bruxelles, une amende sur trois pour dépôt clandestin concerne des non-résidents',
    source: 'La Libre',
    date: '17 février 2026',
    excerpt:
      "Les chiffres 2025 de la Ville confirment l'ampleur du phénomène du « tourisme des déchets ». L'échevin annonce de nouvelles mesures.",
    href: 'https://www.lalibre.be/dernieres-depeches/2026/02/17/a-bruxelles-une-amende-sur-trois-pour-depot-clandestin-concerne-des-non-residents-CYKFLE7YEJCVVBFY3SUG7XKLNU',
    image: '/notes/02-lalibre.avif',
    theme: 'proprete',
  },
  {
    id: 'rtbf-amende-non-residents',
    title: 'À Bruxelles, une amende sur trois pour dépôt clandestin concerne des non-résidents',
    source: 'RTBF',
    date: '17 février 2026',
    excerpt:
      "La RTBF revient sur les statistiques rendues publiques par l'échevin des Finances et de la Propreté publique. Un bilan sans concession.",
    href: 'https://www.rtbf.be/article/a-bruxelles-une-amende-sur-trois-pour-depot-clandestin-concerne-des-non-residents-11681004',
    image: '/notes/03-rtbf.jpeg',
    theme: 'proprete',
  },
  {
    id: 'bx1-depots-clandestins',
    title: 'Dépôts clandestins à Bruxelles : une amende sur trois concerne des non-résidents',
    source: 'BX1',
    date: '17 février 2026',
    excerpt:
      "La chaîne bruxelloise décrypte la politique de verbalisation mise en place par la Ville et ses premiers effets concrets sur le terrain.",
    href: 'https://bx1.be/categories/news/depots-clandestins-a-bruxelles-une-amende-sur-trois-concerne-des-non-residents',
    image: '/notes/04-bx1.jpeg',
    theme: 'proprete',
  },
  {
    id: 'lalibre-7000-taxes',
    title: 'Plus de 7 000 taxes pour dépôts clandestins dressées à Bruxelles en 2025',
    source: 'La Libre',
    date: '4 février 2026',
    excerpt:
      "Record historique : la Ville a émis plus de 7 000 taxes pour dépôts clandestins en 2025, pour un montant dépassant le million d'euros.",
    href: 'https://www.lalibre.be/dernieres-depeches/2026/02/04/plus-de-7000-taxes-pour-depots-clandestins-dressees-a-bruxelles-en-2025-OONRHVCBH5AEBDJRPPATDCFEBE',
    image: '/notes/05-lalibre2.avif',
    theme: 'finances',
  },
  {
    id: 'bx1-7000-taxes',
    title: 'Dépôts clandestins : plus de 7 000 taxes émises par la Ville de Bruxelles en 2025',
    source: 'BX1',
    date: '4 février 2026',
    excerpt:
      "BX1 détaille le bilan annuel de la politique de propreté de la Ville de Bruxelles : moyens renforcés, nouvelles brigades, verbalisations en hausse.",
    href: 'https://bx1.be/categories/news/depots-clandestins-plus-de-7000-taxes-emises-par-la-ville-de-bruxelles-en-2025',
    image: '/notes/06-bx1b.jpeg',
    theme: 'finances',
  },
  {
    id: 'lalibre-boulevard-midi',
    title: 'Une grande opération de nettoyage effectuée sur le boulevard du Midi à Bruxelles',
    source: 'La Libre',
    date: '17 janvier 2026',
    excerpt:
      "Opération d'envergure menée avec les services de la Ville : le boulevard du Midi a été entièrement nettoyé, et le stationnement des camionnettes désormais interdit sur la berme centrale.",
    href: 'https://www.lalibre.be/dernieres-depeches/2026/01/17/une-grande-operation-de-nettoyage-effectuee-sur-le-boulevard-du-midi-a-bruxelles-24ZZXB63SFE2XGTVGU3ELPOSPY',
    image: '/notes/07-lalibre3.avif',
    theme: 'proprete',
  },
  {
    id: 'bx1-boulevard-midi',
    title: 'Boulevard du Midi : les camionnettes ne pourront plus stationner sur la berme centrale',
    source: 'BX1',
    date: '17 janvier 2026',
    excerpt:
      "Fin des stationnements sauvages sur la berme centrale du boulevard du Midi. Une mesure annoncée par l'échevin pour mettre fin aux points noirs de propreté.",
    href: 'https://bx1.be/categories/news/grande-operation-de-nettoyage-sur-le-boulevard-du-midi-les-camionnettes-ne-pourront-plus-stationner-sur-la-berme-centrale',
    image: '/notes/08-bx1c.png',
    theme: 'proprete',
  },
  {
    id: 'rtbf-500-verbalisations',
    title: 'Tourisme des poubelles : plus de 500 personnes verbalisées en huit mois à Bruxelles',
    source: 'RTBF',
    date: 'Décembre 2025',
    excerpt:
      "Premier bilan de la nouvelle politique de lutte contre les dépôts sauvages : plus de 500 verbalisations en seulement huit mois d'application.",
    href: 'https://www.rtbf.be/article/tourisme-des-poubelles-plus-de-500-personnes-verbalisees-en-huit-mois-a-bruxelles-11625508',
    image: '/notes/09-rtbf2.jpeg',
    theme: 'proprete',
  },
  {
    id: 'rtbf-rats-parcs',
    title: 'De plus en plus de rats dans les parcs bruxellois : la Ville de Bruxelles multiplie les actions',
    source: 'RTBF',
    date: 'Avril 2025',
    excerpt:
      "Face à la prolifération des rongeurs dans les parcs publics, la Ville intensifie ses opérations de dératisation et installe de nouveaux dispositifs de piégeage.",
    href: 'https://www.rtbf.be/article/de-plus-en-plus-de-rats-dans-les-parcs-bruxellois-la-ville-de-bruxelles-multiplie-les-actions-11530818',
    image: '/notes/10-rtbf3.jpeg',
    theme: 'deratisation',
  },
  {
    id: 'bx1-toilettes-intelligentes',
    title: 'Trois nouvelles toilettes intelligentes installées par la Ville de Bruxelles',
    source: 'BX1',
    date: 'Octobre 2025',
    excerpt:
      "La Ville de Bruxelles remplace ses toilettes publiques vétustes par des modèles autonettoyants de nouvelle génération. Où les trouver en pratique ?",
    href: 'https://bx1.be/categories/news/la-ville-de-bruxelles-remplace-ses-toilettes-publiques-vetustes-par-des-modeles-autonettoyants',
    image: '/notes/11-bx1d.jpeg',
    theme: 'toilettes',
  },
  {
    id: 'lalibre-world-cleanup',
    title: 'La Ville de Bruxelles sensibilise à la propreté pour le World Cleanup Day',
    source: 'La Libre',
    date: 'Septembre 2025',
    excerpt:
      "Mobilisation citoyenne inédite à l'occasion du World Cleanup Day : habitants, agents et associations se sont rassemblés pour nettoyer les quartiers de la Ville.",
    href: 'https://www.lalibre.be/dernieres-depeches/2025/09/20/la-ville-de-bruxelles-sensibilise-a-la-proprete-pour-le-world-cleanup-day-QLEL3WT7AFBVXLNSRXSNV2CJIA',
    image: '/notes/12-lalibre4.jpeg',
    theme: 'solidarite',
  },
];
