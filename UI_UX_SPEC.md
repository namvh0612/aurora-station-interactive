# Aurora Station — Final UI/UX and Scoring Specification

## 1. Product structure

Aurora Station separates two result layers:

- **Five-Element Profile** explains how the participant responded during the journey.
- **Recommended Aurora Role** explains how that profile is best placed to contribute in the current mission.

Only five Aurora Roles are used:

- The Pathfinder
- The Catalyst
- The Steward
- The Architect
- The Sentinel

Required statement:

> Your Aurora Role is the contribution your Five-Element profile is best placed to make in this mission. It is not a fixed personality type.

## 2. Scoring

### 2.1 Item, facet and Element scoring

Reverse-keyed items:

```text
Corrected score = 7 - raw answer
```

Facet score:

```text
Facet score = average of the six corrected items in that facet
```

Element score:

```text
Element score = average of its two facet scores
```

All raw scores remain on the 1–6 scale and are not percentiles.

### 2.2 Normalisation

```text
Normalised score = (raw score - 1) / 5
```

### 2.3 Solo Role suitability

For each Role:

```text
Profile Suitability
= 60% Overall Element availability
+ 25% Late-pressure availability
+ 15% Facet floor
```

Where:

```text
Facet floor = lower score of the two facets
Late pressure = questions 41–60
```

The Role with the highest eligible Profile Suitability is recommended.

A Role with an overall Element score below 3.25 is not eligible in solo mode.

The final operational choice is not added to any Five-Element score and is used only as a final tie-break when all profile metrics are exactly matched.

### 2.4 Group-event Role scoring

When team and mission inputs exist:

```text
Recommended Role Score
= 45% Profile Suitability
+ 30% Team Composition Need
+ 25% Mission Requirement
```

A below-threshold Role may only be used as an explicitly permitted stretch assignment.

### 2.5 Tie handling

The fit badge is based on the final Role-score gap:

| Gap between first and second | Badge |
|---:|---|
| 0.08 or more | Clear fit |
| 0.04–0.079 | Close fit |
| Below 0.04 | Balanced fit / Mission-based fit |

Tie-breaking must never use array order, alphabetical order or an Architect fallback.

## 3. Opening flow

Required sequence:

```text
Name entry
→ Response guide
→ Confirmation
→ Story opening
→ Question 1
```

The user cannot bypass the guide with Escape or an outside click.

## 4. Response scale

- Use six equal cells labelled `1–6`.
- Do not use chevrons or navigation-like symbols.
- Remove native browser tooltips.
- Keep accessible `aria-label` descriptions.
- Show a dynamic one-line explanation below the right anchor and opposite `RESPONSE SIGNAL`.
- Update the line on hover, focus and touch.
- Preserve the selected description after selection.
- Use a visual progression from warm coral at level 1 to bright aurora cyan at level 6.
- Mobile layout may become a 3 × 2 grid.

## 5. Aurora background

Aurora is not continuously visible.

It appears only when the aurora eruption begins in the story, from Act 09 / Question 41 onward, and remains visible through the remaining night sequence.

When active it must:

- be clearly visible;
- show obvious movement;
- use cyan, teal, green, blue, violet and restrained magenta;
- contain multiple ribbons moving at different speeds and directions;
- avoid flashing, hard edges and fixed bright dots;
- preserve text readability with a local soft reading mask;
- remain colourful but nearly static under reduced-motion settings.

Aurora is hidden during onboarding, earlier story phases and the dawn debrief.

## 6. Paginated result deck

The result must not be one continuous long page.

Use four result pages:

1. Recommended Aurora Role
2. Five-Element Spectrum
3. Context Movement
4. Current Details

### 6.1 Navigation

Desktop:

- previous and next buttons fixed to the left and right of the result viewport;
- 48px minimum interaction area;
- disabled at the first and last page.

Mobile:

```text
← Previous     02 / 04     Next →
```

Also support:

- ArrowLeft and ArrowRight;
- Home and End;
- horizontal swipe;
- reduced-motion fade-only transitions.

Persist active page and active Current in session storage.

### 6.2 Page 1 — Recommended Role

Display:

- Role name;
- Element and Big Five domain;
- fit badge;
- required non-type statement;
- Mission function;
- What you bring;
- Watch for;
- Mission action;
- Why this Role.

The Role Card uses the same ivory editorial visual system as the debrief, with a subtle Role-colour accent and aurora wash.

### 6.3 Page 2 — Five-Element Spectrum

Display five bipolar bars.

Each Current includes:

- Element and domain;
- score out of 6;
- two pole labels;
- visible balanced range from 3.25 to 3.75;
- marker;
- interpretation band;
- concise explanation.

Include the note that scores are raw means, not population percentiles.

### 6.4 Page 3 — Context Movement

Display Starting Conditions, Escalation and Late Pressure using three-point movement lines.

Movement labels:

| Absolute change | Interpretation |
|---:|---|
| Below 0.35 | Broadly stable |
| 0.35–0.74 | Noticeable movement |
| 0.75 or more | Pronounced movement |

Show no more than three context observations: largest increase, largest decrease and most stable Current.

### 6.5 Page 4 — Current Details

Use a five-Current selector.

Show one Current at a time with:

- two facet cards;
- facet pattern;
- potential advantage;
- possible overextension;
- reflection prompt.

The same page also contains response quality, final operational choice and the short disclaimer.

## 7. PDF export

Remove the long PNG export.

Provide one primary action:

```text
DOWNLOAD PROFILE PDF
```

The generated PDF contains eight A4 portrait pages:

1. Recommended Aurora Role
2. Five-Element Spectrum
3. Context Movement
4. Wood details
5. Fire details
6. Earth details
7. Metal details
8. Water details, response quality, final choice and disclaimer

Requirements:

- explicit page breaks;
- no cropped footer or disclaimer;
- no navigation controls, hover states or focus rings;
- consistent ivory editorial background, serif headings and monospace metadata;
- participant name in metadata/header;
- page footer `Page n of 8`;
- filename `Aurora_Station_Profile_<Participant_Name>.pdf`;
- an export modal that reports preparation of eight pages and PDF assembly;
- prevent duplicate export clicks while processing.

## 8. Accessibility

- All hover behaviour must have keyboard-focus equivalents.
- Dynamic response text uses `aria-live="polite"`.
- Result pages expose page labels and `aria-hidden` correctly.
- Inactive pages are inert.
- Current selector uses tab semantics.
- Colour is never the sole carrier of meaning.
- Focus indicators remain visible.
- Text contrast meets WCAG AA.

## 9. Acceptance criteria

The build is complete only when:

- the reviewed profile with Water 4.1, Metal 3.9, Wood 3.8, Earth 3.5 and Fire 3.1 returns **The Sentinel** under solo scoring;
- candidate-gate logic is removed;
- final choice does not directly weight solo Role scoring;
- result UI contains exactly four pages;
- keyboard, buttons and swipe can change pages;
- Page 4 retains the selected Current;
- no horizontal overflow occurs on mobile;
- the only profile export is a multi-page PDF;
- the PDF definition contains exactly eight explicit report pages;
- all automated syntax and regression tests pass.

## 17. Aurora sky band and closing fade

- The aurora is not a full-screen colour field.
- The visible auroral ribbons occupy approximately the upper 40% of the viewport.
- The lower 60% resolves into the original dark station background through a soft vertical mask.
- The WebGL canvas and CSS fallback use the same upper-sky mask.
- Aurora motion is deliberately slow: primary ribbons use approximately 28-38 second visual drift cycles, with lower shader speed values than the previous release.
- The aurora becomes active after Question 40, when Act 09 begins.
- It begins to wane at the opening of Act 12, after Question 55.
- It is fully inactive from Question 59 onward, before Ridge reaches the station.
- The story copy must also acknowledge that the solar disturbance and auroral colour have faded before rescue arrival.
- Reduced-motion mode keeps a static upper-sky aurora during the active window and preserves the same fade-out timing.

## 18. Story export

- The result utility area provides two separate actions:
  - `DOWNLOAD STORY PDF`
  - `DOWNLOAD PROFILE PDF`
- Story export contains the participant's realised narrative path, including selected transitions, the final reserve decision and the ending consequences.
- The story PDF is generated locally in the browser as a paginated A4 document and does not depend on pdfMake or an external PDF CDN.
- The story PDF uses a cover page followed by dynamically paginated reading pages.
- Long paragraphs may flow to the following page; text must never be clipped, reduced below the minimum reading size or drawn over another block.

## 19. PDF heading clearance

- The section eyebrow and large page title must use separate vertical zones.
- The title baseline must leave at least one full title ascender height below the eyebrow line.
- This applies to all eight profile pages and all story chapter headings.
- PDF validation must include rendered inspection of pages 1, 2, 4 and 8 at 170 DPI or higher.

## 20. Final-record acknowledgement

- Answering Question 60 must not open the debrief immediately.
- Completion enters an explicit `ending` state before the `complete` state.
- The realised ending must include the rescue text, the consequence of the selected reserve decision and the unresolved shared closing.
- Results remain unavailable until the player selects `Continue to dawn debrief`.
- The final-record view also provides `Review final response`, which returns to the preceding response without deleting the participant identity.
- Progress text reads `Final record` while the ending is awaiting acknowledgement and changes to `Journey complete` only after confirmation.
- On entry, the final record scrolls to its beginning, not to the result deck or the middle of the closing copy.

## 21. Desktop context-movement geometry

- The three stage headings and the three plotted points must derive from the same horizontal geometry.
- The movement layout uses one shared name column, one flexible plot column, one status column and shared gaps.
- SVG stage positions use a fixed internal viewBox with equal stage coordinates and must fill the plot column without preserve-aspect-ratio letterboxing.
- Desktop acceptance tolerance: each stage-heading centre must align with its plotted-point centre within 1 CSS pixel.
- Mobile may stack labels and plot content, but must not create horizontal overflow.

## 22. Prelude visual language

- Name entry and scale calibration are a two-step Prelude within the same world as the story, not a separate product splash screen.
- Use the existing night surface, serif reading typography, thin station rules and restrained technical metadata.
- Avoid oversized marketing-style headings, decorative coordinates, excessive glow and dashboard framing.
- Copy should frame the steps as preparation for the final watch:
  - `Before the watch begins`
  - `How to answer the watch`
- The guide asks for actual likely behaviour rather than an ideal answer.
- Primary actions remain explicit: `Continue to response guide` and `Begin the final watch`.
- Interactive controls must provide at least a 44 × 44 CSS-pixel target.

## 23. Curved auroral ribbons

- During the active aurora window, the effect must read as several atmospheric ribbons rather than one horizontal colour strip.
- WebGL renders at least four bands with separate centre curves, widths, noise, drift rates and colour mixtures.
- Each band uses low-frequency sine displacement plus a restrained diagonal offset so it bends and crosses the sky without becoming a wave graph.
- The overall field remains confined to the upper sky and fades into the dark station surface below.
- The fallback uses at least two overlapping curved arcs at different rotations and vertical positions.
- Motion stays slow and continuous; curvature should be visible in a still frame while movement becomes apparent over several seconds.

## 24. Impeccable quality floor

- Validate accessibility, performance, theming, responsive behaviour and implementation integrity as one bounded inspection pass.
- All navigation, response, Prelude and result-deck controls use visible keyboard focus and a minimum 44 × 44 CSS-pixel target.
- Technical metadata may remain smaller than body text, but essential labels must not fall below approximately 10 CSS pixels at desktop scale.
- Keep the product-specific editorial/technical system even when generic detectors flag cyan-on-dark or Element accent rules; verify whether each finding is intentional before changing it.
- Re-run syntax, regression, desktop geometry, mobile overflow and final-record acknowledgement checks after the audit fixes.

## Final-step reliability and rescue-contact Aurora fade

- A state with 59 saved answers must always render Question 60.
- The audio phase resolver must treat the unacknowledged ending as a valid silent state and must never access a missing item.
- The renderer must assign a stable DOM id to every active question and restore the active question if a render invariant is broken.
- Aurora remains fully visible before rescue radio contact.
- After Question 58 confirms Ridge radio contact, Aurora transitions to approximately 58% strength.
- During Question 60 it remains faint at approximately 28% strength.
- Once Question 60 is answered and the rescue arrival is rendered, Aurora is fully absent.
- Aurora curtains should occupy a broad upper-sky field while the lower page remains dark for reading.
