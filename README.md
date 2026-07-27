# Aurora Station Interactive

A static, story-based Big Five reflection designed for direct hosting on
GitHub Pages.

## Experience

- Six unnumbered, mirrored chevron choices with accessible response labels.
- Completed moments retain the narrative context and selected action while the
  assessment statement disappears from the reading flow.
- Five low-volume ambient tracks loop across story phases and crossfade at
  narrative boundaries. Playback begins only after the first user interaction
  and can be muted from the reader bar.
- A fixed, non-interactive OGL aurora renders behind the night story with a
  static CSS fallback, capped pixel density and reduced-motion support.
- On completion, the story closes and the interface switches to a separate
  personal profile.
- A radar chart shows the shape of the five response currents without presenting
  percentages or population rankings.
- Profile language explains strengths, pressure response, facet patterns,
  trade-offs and useful counterbalances rather than fixed personality types.
- The completed story downloads as a PDF ebook; the personal profile downloads
  directly as a shareable PNG.

The Five Elements are narrative labels for Big Five dimensions. Results describe
story-based tendencies, not diagnoses or population percentiles.

## Run

Open `index.html` or serve this folder with any static web host. Users do not
need Python, a backend or an installation.

The WebGL layer loads OGL as an ES module from jsDelivr. If WebGL or the CDN is
unavailable, the story remains fully usable with the static aurora fallback.

## Validation

Run:

```sh
node tests.mjs
```

The interface is also checked with:

```sh
npx --yes --package=impeccable impeccable detect --json .
```
