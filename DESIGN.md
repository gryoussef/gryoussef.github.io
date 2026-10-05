# Youssef El Jirari design

## Visual direction
A reader exploring an engineer’s personal notebook in daytime should find a calm, spacious surface and a recognizable face. Warm off-white is the primary theme; a charcoal alternative supports evening reading. Restrained orange accents and sage article artwork complement the greenery in the supplied portrait.

## Typography
Manrope, locally hosted under the SIL Open Font License. Bold, tightly spaced display headings contrast with relaxed body text. Article lines stay below 70 characters where possible.

## Colors
CSS uses OKLCH tokens in `static/css/site.css`: warm neutral background, dark olive charcoal text, muted gray-green secondary text, burnt orange accent, and pale sage illustrations. Dark mode redefines the same tokens.

## Layout and components
- Maximum content width: 1120px.
- Desktop homepage: asymmetrical text and portrait columns.
- Portrait: transparent cutout contained within the right-hand column, without background, rounded corners, or fade. On desktop, the photo fills the space above its caption, whose baseline aligns with the social links on the left. Desktop photo is lifted 12px; social links and caption sit 8px lower, preserving their shared baseline. Mobile uses a 3:4 photograph.
- Writing: text-only article rows with reading time and topic links; no publication dates, thumbnails, or raster diagrams.
- Article: readable prose with a sticky desktop table of contents; mobile contents appear above the text.
- Brand wordmark: text-only “eljirari.me” in extra-bold Manrope, with tight optical spacing and an orange domain suffix.
- Navigation remains visible on mobile without a menu drawer.
- Theme choice persists locally and initially follows system preference.

## Interaction
Subtle hover feedback, visible focus rings, a skip link, native anchor navigation, and reduced-motion support. No client-side framework or external font requests.
