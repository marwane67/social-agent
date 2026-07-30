# Design QA — Navigation mobile de l’échevin

## Evidence

- Source visual truth:
  - `/Users/marwane/Downloads/Capture d’écran 2026-07-30 à 21.06.46.png`
  - `/Users/marwane/Downloads/Capture d’écran 2026-07-30 à 21.07.00.png`
  - `/Users/marwane/Downloads/Capture d’écran 2026-07-30 à 21.07.32.png`
- Browser-rendered implementation:
  - `/Users/marwane/.codex/visualizations/2026/07/30/019fb46a-5b2d-7d20-853d-5004c2985dac/echevin-mobile-home-393x852.png`
  - `/Users/marwane/.codex/visualizations/2026/07/30/019fb46a-5b2d-7d20-853d-5004c2985dac/echevin-mobile-menu-393x852.png`
  - `/Users/marwane/.codex/visualizations/2026/07/30/019fb46a-5b2d-7d20-853d-5004c2985dac/echevin-mobile-home-320x700.png`
  - `/Users/marwane/.codex/visualizations/2026/07/30/019fb46a-5b2d-7d20-853d-5004c2985dac/echevin-mobile-menu-320x700.png`
- Combined comparison evidence:
  - `/Users/marwane/.codex/visualizations/2026/07/30/019fb46a-5b2d-7d20-853d-5004c2985dac/echevin-mobile-home-comparison.png`
  - `/Users/marwane/.codex/visualizations/2026/07/30/019fb46a-5b2d-7d20-853d-5004c2985dac/echevin-mobile-menu-comparison.png`
- Routes and states: `/echevin`, menu closed and menu open.
- CSS viewports: 393 × 852 and 320 × 700.
- Source pixels: 943 × 2048. The source was downsampled to 393 × 852 for the combined comparisons. The source contains iOS/browser chrome, so app-owned content was judged below that chrome rather than treated as a pixel-perfect viewport match.
- Implementation pixels: 393 × 852 and 320 × 700 at browser density 1.

## Full-view comparison

The revised home keeps the original portrait-first composition, bordered biography card, PS color accents, and social row. The surname now fits fully inside the card at both tested widths. The revised menu keeps the black editorial direction while replacing the oversized wordmark and permanently expanded video subnavigation with a compact, stable primary navigation.

## Focused region comparison

- Hero wordmark: the full `ABDELMOUMEN` bounding box ends at 364.2px inside a 393px viewport and at 295.4px inside a 320px viewport.
- Menu header: at 320px, the responsive logo ends at 199.9px and the close control begins at 258px, leaving clear separation with no overlap.
- Menu overlay: measured at exactly the viewport width; document width remains equal to viewport width in both states.

## Required fidelity surfaces

- Fonts and typography: Montserrat and Anton are preserved. The wordmark now uses responsive optical sizing and remains untruncated. Menu hierarchy is clearer and fits at 320px.
- Spacing and layout rhythm: portrait, card, navigation rows, close control, and search field stay within the viewport. The menu uses consistent 16–20px gutters.
- Colors and visual tokens: black, white, PS red, turquoise, and the existing wordmark gradient remain consistent with the site.
- Image quality and asset fidelity: the supplied portrait and existing social/brand assets are unchanged, with no placeholders introduced.
- Copy and content: all primary destinations remain present. Video subcategories are intentionally removed from the overlay and remain available on the Videos page.

## Interaction checks

- Hamburger opens the modal menu.
- Close control closes it.
- Escape closes it.
- Body and document scrolling lock while open and restore afterward.
- The Actualités item navigates to `/echevin/notes` and closes the overlay.
- No browser console errors were observed.
- No horizontal overflow was detected at 393px or 320px.

## Comparison history

- Earlier P1: `ABDELMOUMEN` exceeded the hero card and created page-level horizontal movement.
  - Fix: responsive wordmark sizing, constrained text container, and viewport-safe overflow behavior.
  - Post-fix evidence: the full surname is visible at 393px and 320px; document width equals viewport width.
- Earlier P1: the open menu inherited the oversized wordmark width, could be shifted sideways, and buried primary navigation under always-visible subcategories.
  - Fix: viewport-bound `100dvw` overlay, responsive compact header, primary-only navigation, scroll lock on both `html` and `body`, and a fixed circular close control.
  - Post-fix evidence: menu width equals viewport width, header elements do not overlap, navigation and close interactions pass.

## Follow-up polish

- P3: a dedicated reduced-motion rule could remove the short menu entrance animation for users who request reduced motion.

final result: passed
