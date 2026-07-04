# guacluv — Brand System

> The logo is an avocado whose pit is a heart. That single idea — *the love is at the core* — drives the whole system.

## Essence
- **Name:** guacluv (always lowercase)
- **Tagline:** Avocados, with love.
- **Promise line:** Ripe on the day you want to eat them.
- **Personality:** warm, playful, a little cheeky, but credible and caring about sourcing.

## Logo
- Primary mark: avocado silhouette (dark-green skin → cream flesh) with a **coral heart pit**, optional leaf + stem.
- Wordmark: rounded, friendly lowercase "guacluv".
- Files: `assets/logo.svg` (mark), `og.svg` (social card). Favicon is an inline SVG data-URI in `index.html`.
- Clear space: keep at least the height of the heart pit clear on all sides. Don't recolour the heart anything but coral.

## Colour palette

| Token | Hex | Use |
|-------|-----|-----|
| Skin (deep) | `#2f5e17` | Headlines on light, brand text |
| Skin | `#3f7a1f` | Logo skin, primary green |
| Leaf | `#8dc63f` | Accents, primary buttons |
| Leaf 2 | `#6faa2b` | Button gradient base, links |
| Flesh | `#dce29a` | Fills, avocado interior |
| Flesh soft | `#eef0c4` | Pills, tinted panels |
| Coral | `#ee5d55` | The heart. CTAs, love accents |
| Coral deep | `#d94a43` | Coral hover |
| Cream | `#f8f5ea` | Light background |
| Ink | `#20300f` | Body text on light |
| Night | `#141a0e` | Dark background |

Coral is precious — reserve it for the heart, love language, and the highest-intent CTA. Green is the workhorse.

## Typography
- **Display:** Baloo 2 (700/800) — rounded, matches the logo's soft lettering.
- **Body:** Inter (400–600).
- Headlines tight (`letter-spacing:-.02em`), generous line length capped ~34ch for leads.

## Voice
- Say: "Never gamble on an avocado again." "Ripe when you are." "Share the luv."
- Avoid: jargon, guilt, over-claiming. Be confident about the guarantee, honest about being a concept venture.
- Emoji used sparingly as brand furniture: 🥑 💚 🌱 🌮.

## UI motifs
- Soft rounded corners (22–30px), gentle avocado-green shadows.
- Floating avocado hero, blurred flesh/coral "blobs" for warmth.
- Light + dark themes both first-class (toggle persists in localStorage).
- Interactive ripeness slider embodies the core promise — let people *feel* "ripe on your day."

## Accessibility
- Maintain AA contrast: ink on cream, white on skin-deep/leaf-2 gradients.
- Coral text only at ≥1rem weight-600 over cream; never coral body text at small sizes.
- All interactive controls keyboard-reachable; form has real labels and focus rings.
