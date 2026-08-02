# Aurora Station — The Final Watch

**Aurora Station** is a narrative self-reflection experience. Rather than asking participants to describe themselves through abstract labels, it places them inside a shared story and asks how strongly they agree that each statement describes the way they generally tend to think, feel or behave.

The story is one continuous document. Twelve Acts of five statements each build a single scrolling record that grows as you read, and nothing already written is taken away. When all sixty are recorded, a separate Results page reports five domains and fifteen facets.

## Measurement status

Aurora Station is a **narrative self-reflection, not a validated or clinically administered assessment**.

It is built on an established five-domain, fifteen-facet structure: twelve statements per domain, four per facet, an equal number of positively and reverse-keyed statements throughout, and one fixed statement order. The statements themselves are written for Aurora Station. They are not taken from a published instrument, and the readings they produce are for reflection only — there are no norms and no comparison with other people.

### Where the structure comes from

The five-domain, fifteen-facet structure is that of the Big Five Inventory-2 by Christopher J. Soto and Oliver P. John. Aurora Station uses that structure and its keying pattern; the statements are its own. The source is credited here and in the exported report, and is not named inside the experience itself.

- [The Personality Lab at Colby](https://www.colby.edu/academics/departments-and-programs/psychology/research-opportunities/personality-lab/the-bfi-2/)
- [Soto & John, the source paper](https://escholarship.org/content/qt16x6n05t/qt16x6n05t.pdf)

The official resource grants personal and research use free of charge. Confirm separate permission before any commercial use.

The experience is designed to support thoughtful reflection and constructive conversation. It does not seek to identify one ideal personality, assign a fixed type, or determine whether someone is suitable for a role.

## Purpose

Aurora Station explores broad tendencies in how a person may:

- approach unfamiliar ideas and possibilities;
- create energy, direction and social momentum;
- consider people, cooperation and relationships;
- organise work and sustain purposeful action; and
- regulate attention and recover under pressure.

The result is intended to help participants recognise patterns, strengths, trade-offs and useful counterbalances across different situations.

## Assessment principles

### Behaviour in context

Responses are considered through concrete situations rather than isolated personality claims. The same tendency may be helpful in one context and less helpful in another.

### Dimensions, not fixed types

Each result sits on a continuum. Every person uses all five domains to some degree, and no single domain defines the whole person.

### No “best” profile

Higher and lower expressions of a dimension can both be valuable. Each may offer useful strengths while also introducing possible blind spots or trade-offs.

### Patterns matter more than individual answers

A single response should not be interpreted on its own. The profile reflects tendencies that emerge across multiple situations and different forms of pressure.

### One statement at a time

Every statement takes the same form — *I am someone who…* — and asks about a
general tendency rather than about the scene around it. The situation is set by
the passage above it; the statement itself stays short enough to answer without
re-reading, and never gives away what happens next.

### An honest reading, including the middle

The five-point agreement scale runs from 1 (strongly disagree) to 5 (strongly agree), with 3 as a genuine midpoint for statements that truly sit between the two. The aim is not to find a perfect answer, but to give an honest reading of yourself.

Some statements are written in the opposite direction to the trait they measure. Those are reversed when the score is calculated, but never when the story is told: the passage you read always follows the response you actually chose.

### Reflection rather than ranking

Aurora Station does not present population percentiles, competitive rankings or pass/fail outcomes. Results should be read as a personal reflection, not as a comparison with other people.

## The five domains and fifteen facets

| Domain | Reflection focus | Facets |
|---|---|---|
| **Extraversion** | Social engagement, influence and active energy | Sociability · Assertiveness · Energy Level |
| **Agreeableness** | Compassion, respectful interaction and interpersonal trust | Compassion · Respectfulness · Trust |
| **Conscientiousness** | Structure, productive persistence and dependability | Organization · Productiveness · Responsibility |
| **Negative Emotionality** | Frequency and intensity of worry, low mood and emotional reactivity | Anxiety · Depression · Emotional Volatility |
| **Open-Mindedness** | Intellectual, aesthetic and imaginative engagement | Intellectual Curiosity · Aesthetic Sensitivity · Creative Imagination |

Every domain is scored from twelve items and every facet from four, with an equal number of positively and reverse-keyed items in each. Because the keying is balanced, answering the same way to all sixty statements returns 3.0 everywhere — the scale can only describe you if you actually use it.

Negative Emotionality is reported as itself. A higher score means more frequent or more intense worry, low mood and reactivity; it is never quietly flipped into "Emotional Stability".

## How to respond

For the most useful reflection:

- answer according to what you would most likely do, not what appears ideal;
- consider your typical behaviour while allowing for the situation described;
- use the whole scale, and keep 3 for statements you genuinely sit between;
- avoid treating any option as morally better or professionally preferred; and
- complete the experience with reasonable attention rather than over-analysing each choice.

## Interpreting the result

The profile should be treated as a **snapshot of self-reported tendencies within the Aurora Station scenarios**. It may be useful for personal reflection, informal team conversation and identifying behaviours that could complement one another.

Results may vary with experience, role, current circumstances, stress level and how the participant interprets each situation. They should be considered alongside real behaviour, feedback from others and the demands of the relevant context.

## Important limitations

Aurora Station is not a clinically validated or professionally administered psychometric instrument. It does not provide a diagnosis, measure mental health, establish capability, or predict performance with certainty.

The experience and its reports must not be used as the sole or determining basis for:

- recruitment or employee selection;
- promotion, remuneration or performance decisions;
- disciplinary or termination decisions;
- clinical, medical or psychological assessment;
- educational admission or grading;
- legal, insurance or eligibility decisions; or
- any other high-stakes judgement about an individual.

Participants should retain control over whether their result is shared. Any shared profile should be treated as personal and confidential information.

## Non-commercial use disclaimer

Aurora Station is provided as a **non-commercial creative and educational project**. It may be used for personal reflection, learning, demonstration and informal team discussion only where no fee is charged and the experience is not incorporated into a commercial product or service.

The project, story, assessment content, visual identity, reports and associated materials must not be:

- sold, sublicensed or monetised;
- offered as part of a paid workshop, consultancy or assessment service;
- included in a client deliverable or commercial training package;
- used in advertising, lead generation or promotional campaigns;
- rebranded or distributed as a proprietary psychometric product; or
- otherwise used for direct or indirect commercial advantage.

Commercial use, commercial distribution or incorporation into a paid offering requires prior written permission from the project owner.

## Responsible use

Aurora Station is most valuable when used to encourage curiosity rather than judgement. Results should open a conversation about context, contribution and adaptation—not close one with a label.

## Running the project

Aurora Station is a static site with no build step and no dependencies. Open `index.html`, or serve the folder over any static file server, and it runs from `file://` or GitHub Pages alike.

There are two pages: `index.html` carries the Prelude, all twelve Acts and the completion panel; `results.html` is the Watchkeeper Profile. Everything on the Results page is recalculated from your raw responses each time it loads — no score is cached, and an unfinished journey is sent back to the story.

The watch is read by scrolling. The story runs as far as the next unanswered statement and stops there; everything to that point is already on the page, dimmed below the reading line and clearing as you come down to it. The fade reaches its floor around four fifths of the way down the screen rather than at the very bottom edge, so the run-up to the next statement reads as a run-up on a wide display as well as a narrow one. Answering opens the next stretch. Nothing advances on a timer and the page never moves itself, so there is no pace to set and nothing to pause.

The report is read one chapter at a time. All six chapters are built into the page; the pager decides which is shown, puts the chapter in the address bar, and works with the browser's own back and forward buttons. The watch itself can be restarted at any point from the masthead, which clears the record and keeps your sound setting. On a phone the station controls collapse behind a single button.

Both exports are named for the watchkeeper and the night the watch closed, so re-exporting the same record replaces it while a second watch keeps its own file.

Your name and responses stay in the browser. Nothing is sent anywhere, and nothing about you is ever put in a URL. The journey and your reading preferences are kept as two separate records, so restarting clears the journey and keeps your sound setting.

### Project structure

| File | Responsibility |
|---|---|
| `content/Aurora_Station_Content.js` | Acts, items, narrative branches and every piece of report copy. Edit this to change the writing; no rebuild is required. |
| `core.js` | Scoring, state, validation and persistence. No DOM access. |
| `artwork.js` | All artwork, drawn as SVG at runtime — field contours, horizons, recorder traces, instrument dials, aurora ribbons. Deterministic, so a reload never reshuffles a figure. |
| `app.js` | The prelude and the cumulative watch renderer. |
| `results.js` | The dawn observation report. |
| `pdf-export.js` | The night's record and the observation report as PDFs. |
| `audio.js` | Station sound and its preference. |
| `styles.css` | The night and dawn visual systems. |

### Art direction

The visual language is a **polar psychological observatory**: near-black polar night, cold mineral white, one restrained signal light, and colour used only where it means something — a recorded response, an active section, the aurora, a current named in the report. Dawn replaces that entire environment with cold mineral paper and near-black ink: the light after a polar night rather than a warm one.

Two font families carry everything: an editorial display serif for narrative, act titles and the report, and a technical mono for labels, readings, timestamps and responses. There are no raster assets and no external font or script hosts; every figure is drawn in `artwork.js`.

The reading column is centred and its measure grows with the page, so the same document reads as one column on a phone and as a centred page on a laptop rather than a narrow strip against empty ground. Act plates are the exception: they run full-bleed to the edges of the display. The measure still tightens through the degraded stretch, as a share of itself.

The five behavioural currents carry the five elements — Wood, Fire, Earth, Metal and Water — assigned by the tendency each current already reads. The element supplies the colour and the shape of one chapter of the report: which contribution yours tends to feed, which tends to feed yours, and which holds it in check. It is used for that relationship and nothing else. Every reading in the report comes from the sixty recorded responses; no part of it is derived from a date of birth. Each element keeps one hue across the whole product, set light enough to read on the night and deep enough to read on paper.

The aurora is a narrative event, not a background. It is absent through onboarding and the whole early and middle watch, enters at Act 09 when the storm breaks, deepens through the remaining acts, and is gone by the time the report opens.

The night's record opens on a spectrum drawn from the sixty responses in the order they were pressed. It runs edge to edge and carries no axis, no scale, no item numbers and no ruled divisions, so it reads as the trace a recorder left running overnight and was already making before the paper started — a centre line with evenly spaced bands that open where an answer was decisive and breathe back toward the line where it sat on the middle of the scale. It is raw and unkeyed, because the record is a log of the night rather than a reading of it: two watches that score identically still draw different figures, and the same watch always draws its own.

### Checks

```bash
node tests.mjs
```

The same checks run on every push and pull request through `.github/workflows/test.yml`.
