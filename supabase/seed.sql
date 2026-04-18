-- Seed articles + bio from static content

truncate table public.articles restart identity;
truncate table public.bio_sections restart identity;

-- Articles (12) -----------------------------------------------------
insert into public.articles (title, source, date, sort_date, excerpt, href, image_path, theme, position) values
('« Tourisme des déchets » dans la capitale : 37 % des dépôts sauvages par des non-Bruxellois',
 'Le Soir','17 février 2026','2026-02-17',
 'Le constat est sans appel : plus d''un dépôt sauvage sur trois à Bruxelles est le fait d''habitants de la périphérie. La Ville durcit les sanctions.',
 'https://www.lesoir.be/729457/article/2026-02-17/tourisme-des-dechets-dans-la-capitale-37-des-depots-sauvages-par-des-non',
 '/notes/01-lesoir.jpeg','proprete',1),
('À Bruxelles, une amende sur trois pour dépôt clandestin concerne des non-résidents',
 'La Libre','17 février 2026','2026-02-17',
 'Les chiffres 2025 de la Ville confirment l''ampleur du phénomène du « tourisme des déchets ». L''échevin annonce de nouvelles mesures.',
 'https://www.lalibre.be/dernieres-depeches/2026/02/17/a-bruxelles-une-amende-sur-trois-pour-depot-clandestin-concerne-des-non-residents-CYKFLE7YEJCVVBFY3SUG7XKLNU',
 '/notes/02-lalibre.avif','proprete',2),
('À Bruxelles, une amende sur trois pour dépôt clandestin concerne des non-résidents',
 'RTBF','17 février 2026','2026-02-17',
 'La RTBF revient sur les statistiques rendues publiques par l''échevin des Finances et de la Propreté publique. Un bilan sans concession.',
 'https://www.rtbf.be/article/a-bruxelles-une-amende-sur-trois-pour-depot-clandestin-concerne-des-non-residents-11681004',
 '/notes/03-rtbf.jpeg','proprete',3),
('Dépôts clandestins à Bruxelles : une amende sur trois concerne des non-résidents',
 'BX1','17 février 2026','2026-02-17',
 'La chaîne bruxelloise décrypte la politique de verbalisation mise en place par la Ville et ses premiers effets concrets sur le terrain.',
 'https://bx1.be/categories/news/depots-clandestins-a-bruxelles-une-amende-sur-trois-concerne-des-non-residents',
 '/notes/04-bx1.jpeg','proprete',4),
('Plus de 7 000 taxes pour dépôts clandestins dressées à Bruxelles en 2025',
 'La Libre','4 février 2026','2026-02-04',
 'Record historique : la Ville a émis plus de 7 000 taxes pour dépôts clandestins en 2025, pour un montant dépassant le million d''euros.',
 'https://www.lalibre.be/dernieres-depeches/2026/02/04/plus-de-7000-taxes-pour-depots-clandestins-dressees-a-bruxelles-en-2025-OONRHVCBH5AEBDJRPPATDCFEBE',
 '/notes/05-lalibre2.avif','finances',5),
('Dépôts clandestins : plus de 7 000 taxes émises par la Ville de Bruxelles en 2025',
 'BX1','4 février 2026','2026-02-04',
 'BX1 détaille le bilan annuel de la politique de propreté de la Ville de Bruxelles : moyens renforcés, nouvelles brigades, verbalisations en hausse.',
 'https://bx1.be/categories/news/depots-clandestins-plus-de-7000-taxes-emises-par-la-ville-de-bruxelles-en-2025',
 '/notes/06-bx1b.jpeg','finances',6),
('Une grande opération de nettoyage effectuée sur le boulevard du Midi à Bruxelles',
 'La Libre','17 janvier 2026','2026-01-17',
 'Opération d''envergure menée avec les services de la Ville : le boulevard du Midi a été entièrement nettoyé, et le stationnement des camionnettes désormais interdit sur la berme centrale.',
 'https://www.lalibre.be/dernieres-depeches/2026/01/17/une-grande-operation-de-nettoyage-effectuee-sur-le-boulevard-du-midi-a-bruxelles-24ZZXB63SFE2XGTVGU3ELPOSPY',
 '/notes/07-lalibre3.avif','proprete',7),
('Boulevard du Midi : les camionnettes ne pourront plus stationner sur la berme centrale',
 'BX1','17 janvier 2026','2026-01-17',
 'Fin des stationnements sauvages sur la berme centrale du boulevard du Midi. Une mesure annoncée par l''échevin pour mettre fin aux points noirs de propreté.',
 'https://bx1.be/categories/news/grande-operation-de-nettoyage-sur-le-boulevard-du-midi-les-camionnettes-ne-pourront-plus-stationner-sur-la-berme-centrale',
 '/notes/08-bx1c.png','proprete',8),
('Tourisme des poubelles : plus de 500 personnes verbalisées en huit mois à Bruxelles',
 'RTBF','Décembre 2025','2025-12-01',
 'Premier bilan de la nouvelle politique de lutte contre les dépôts sauvages : plus de 500 verbalisations en seulement huit mois d''application.',
 'https://www.rtbf.be/article/tourisme-des-poubelles-plus-de-500-personnes-verbalisees-en-huit-mois-a-bruxelles-11625508',
 '/notes/09-rtbf2.jpeg','proprete',9),
('De plus en plus de rats dans les parcs bruxellois : la Ville de Bruxelles multiplie les actions',
 'RTBF','Avril 2025','2025-04-01',
 'Face à la prolifération des rongeurs dans les parcs publics, la Ville intensifie ses opérations de dératisation et installe de nouveaux dispositifs de piégeage.',
 'https://www.rtbf.be/article/de-plus-en-plus-de-rats-dans-les-parcs-bruxellois-la-ville-de-bruxelles-multiplie-les-actions-11530818',
 '/notes/10-rtbf3.jpeg','deratisation',10),
('Trois nouvelles toilettes intelligentes installées par la Ville de Bruxelles',
 'BX1','Octobre 2025','2025-10-01',
 'La Ville de Bruxelles remplace ses toilettes publiques vétustes par des modèles autonettoyants de nouvelle génération. Où les trouver en pratique ?',
 'https://bx1.be/categories/news/la-ville-de-bruxelles-remplace-ses-toilettes-publiques-vetustes-par-des-modeles-autonettoyants',
 '/notes/11-bx1d.jpeg','toilettes',11),
('La Ville de Bruxelles sensibilise à la propreté pour le World Cleanup Day',
 'La Libre','Septembre 2025','2025-09-20',
 'Mobilisation citoyenne inédite à l''occasion du World Cleanup Day : habitants, agents et associations se sont rassemblés pour nettoyer les quartiers de la Ville.',
 'https://www.lalibre.be/dernieres-depeches/2025/09/20/la-ville-de-bruxelles-sensibilise-a-la-proprete-pour-le-world-cleanup-day-QLEL3WT7AFBVXLNSRXSNV2CJIA',
 '/notes/12-lalibre4.jpeg','solidarite',12);

-- Bio sections -------------------------------------------------------
insert into public.bio_sections (heading, body_html, position) values
(null,
'<p>Depuis le 1<sup>er</sup> décembre 2024, je suis <strong>échevin des Finances et de la Propreté publique à la Ville de Bruxelles</strong>. J''exerce ce mandat au sein de la majorité conduite par le bourgmestre Philippe Close (PS).</p>',
1),
('Jeunesse et formation',
'<p>J''ai grandi dans un milieu ouvrier et réside à <strong>Neder-Over-Heembeek</strong> depuis 1997. J''ai effectué ma scolarité secondaire à l''Athénée Les Pagodes.</p>
<p>En 2015, j''ai obtenu mon bachelier en sciences politiques à l''<strong>Université libre de Bruxelles (ULB)</strong>, puis en 2017 un master en administration et management public. J''ai également suivi plusieurs formations en gestion publique à la Haute École Francisco Ferrer.</p>
<p>Durant mes études, j''ai effectué des stages au SPF Finances et auprès de Karine Lalieux (PS), alors députée et échevine bruxelloise. Je me suis aussi engagé au sein de la <em>Belgian Youth Diplomacy</em>, qui outille les jeunes pour mieux comprendre l''actualité internationale.</p>',
2),
('Parcours politique',
'<p>De novembre 2017 à août 2019, j''ai été <strong>collaborateur parlementaire</strong> du député bruxellois Mohamed Ouriaghli (PS). En octobre 2018, je me suis présenté pour la première fois aux élections communales à la Ville de Bruxelles. 41<sup>ᵉ</sup> sur la liste PS, j''ai récolté <strong>1 124 voix de préférence</strong>, devenant le 10<sup>ᵉ</sup> élu du parti. Le 3 décembre 2018, j''ai prêté serment comme <strong>conseiller communal</strong>.</p>
<p>Dans le cadre de ce mandat, j''ai siégé aux conseils d''administration de <strong>Vivaqua</strong>, des <strong>Piscines bruxelloises</strong> et du <strong>Logement bruxellois</strong>. Je me suis notamment mobilisé pour le maintien des distributeurs automatiques de billets — notamment à Neder-Over-Heembeek, où un nouveau distributeur a été installé en octobre 2023 — et pour un meilleur encadrement des travaux de voirie.</p>
<p>En mai 2019, je me suis présenté aux élections régionales (59<sup>ᵉ</sup> sur la liste PS), récoltant 2 754 voix. En décembre 2021, j''ai rejoint le cabinet du vice-Premier ministre et ministre de l''Économie <strong>Pierre-Yves Dermagne</strong> comme <strong>conseiller digitalisation</strong>.</p>
<p>En octobre 2024, 13<sup>ᵉ</sup> sur la liste PS-Vooruit aux communales, j''ai obtenu <strong>2 450 voix</strong> — le 4<sup>ᵉ</sup> meilleur score de ma liste et le 6<sup>ᵉ</sup> toutes listes confondues. Fin novembre 2024, l''assemblée générale de la section bruxelloise du PS m''a proposé comme échevin.</p>',
3),
('Mandat en cours',
'<p>Comme échevin de la <strong>Propreté publique</strong>, je porte une politique de <strong>tolérance zéro</strong> contre les dépôts clandestins. En 2024, la Ville de Bruxelles a infligé près de <strong>5 000 amendes</strong> pour ce motif. Début 2025, une action conjointe avec la police a permis d''identifier et sanctionner quatre personnes en quelques heures.</p>
<p>Je mène également un combat contre le <strong>« tourisme des déchets »</strong> : début mars 2025, j''ai révélé qu''un tiers des dépôts clandestins identifiés à Bruxelles provenaient de l''extérieur de la ville. Contrôles renforcés et fermeté entendent mettre un terme à ce phénomène.</p>
<p>Comme échevin des <strong>Finances</strong>, je veille à une gestion rigoureuse et transparente des deniers publics, au service des Bruxelloises et des Bruxellois.</p>',
4),
('En savoir plus',
'<p>&rarr; <a href="https://www.bruxelles.be/anas-ben-abdelmoumen" target="_blank" rel="noopener noreferrer">Page officielle sur bruxelles.be</a><br/>&rarr; <a href="https://www.linkedin.com/in/anbenabd/" target="_blank" rel="noopener noreferrer">Profil LinkedIn</a></p>',
5);

-- Settings
insert into public.settings (key, value) values
('hero', jsonb_build_object('surtitle','ÉCHEVIN DES FINANCES ET DE LA PROPRETÉ PUBLIQUE','title','ANAS BEN ABDELMOUMEN','tagline','VILLE DE BRUXELLES'))
on conflict (key) do update set value = excluded.value;
