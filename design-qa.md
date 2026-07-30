# Design QA — Footer et hamburger mobile

## Evidence

- Source visual truth: `/Users/marwane/Downloads/Capture d’écran 2026-07-30 à 21.40.28.png`
- Browser-rendered implementation: `/Users/marwane/.codex/visualizations/2026/07/30/019fb46a-5b2d-7d20-853d-5004c2985dac/echevin-mobile-footer-fixed-393x852.png`
- Route: `/echevin`
- State: page descendue jusqu’au footer, menu fermé puis ouvert depuis le bas de la page.
- CSS viewport: 393 × 852.
- Source pixels: 1206 × 230. La référence est un recadrage du bloc de navigation à supprimer.
- Implementation pixels: 393 × 852 à une densité navigateur de 1.
- Full-view comparison evidence: la référence et la capture corrigée ont été ouvertes ensemble dans la même entrée de comparaison.
- Focused region comparison: le footer visible dans la capture corrigée ne contient plus la navigation « Actualités / Vidéos / Bio / FAQ / Médias / Page officielle ».

## Findings

- Aucun écart P0, P1 ou P2 restant dans le périmètre demandé.
- La navigation du footer est absente à 393 px et reste affichée à 1280 px.
- Le hamburger conserve une position mesurée à 12 px du haut et 12 px de la droite avant et après un défilement de 1 500 px, puis au bas de la page.

## Required fidelity surfaces

- Fonts and typography: les polices du footer, du logo et des crédits sont inchangées; seule la navigation mobile ciblée est masquée.
- Spacing and layout rhythm: la suppression de la navigation referme proprement l’espace dans le footer; le logo, les réseaux sociaux, les partenaires et les crédits restent alignés.
- Colors and visual tokens: le rouge PS, le blanc et les couleurs des logos restent inchangés.
- Image quality and asset fidelity: les logos PS, BXL et les autres actifs existants sont conservés sans modification.
- Copy and content: seul le bloc de liens montré dans la référence est retiré sur téléphone. Le contenu reste présent sur PC.

## Interaction checks

- Hamburger visible et fixe pendant le défilement.
- Menu ouvert avec succès depuis le bas de la page.
- Menu plein écran correctement borné au viewport.
- Scroll de la page verrouillé pendant l’ouverture du menu.
- Fermeture du menu fonctionnelle.
- Navigation du footer masquée à 393 px.
- Navigation du footer et navigation principale visibles à 1280 px.
- Aucun débordement horizontal.
- Aucune erreur ou alerte dans la console.

## Comparison history

- P1 initial: la navigation de footer montrée dans la référence restait visible sur téléphone.
  - Fix: masquage de `.ec-footer__nav` uniquement au breakpoint téléphone.
  - Post-fix: `display: none` à 393 px; la capture du footer confirme sa disparition.
- P1 initial: le bouton hamburger utilisait un positionnement absolu et quittait l’écran pendant le défilement.
  - Fix: passage de `.ec-nav-wrap` en position fixe, avec prise en compte des zones sûres du téléphone.
  - Post-fix: position stable à 12 px du haut et de la droite à plusieurs profondeurs de défilement; ouverture du menu validée au bas de la page.

## Follow-up polish

- Aucun suivi nécessaire pour cette demande.

final result: passed
