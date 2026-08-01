# Aurora Station — The Final Watch

**Aurora Station** is a narrative self-reflection experience built on the structure of the **Big Five Inventory-2 (BFI-2)**. Rather than asking participants to describe themselves through abstract labels, it places them inside a shared story and asks how strongly they agree that each statement describes the way they generally tend to think, feel or behave.

The story is one continuous document. Twelve Acts of five statements each build a single scrolling record that grows as you read, and nothing already written is taken away. When all sixty are recorded, a separate Results page reports five domains and fifteen facets.

## Measurement status

Aurora Station is a **BFI-2-aligned narrative self-reflection**, not an official or clinically validated BFI-2 assessment.

It reproduces the BFI-2 *structure* exactly — the official item order, domain keys and facet assignment, twelve items per domain, four per facet, and an equal number of positively and reverse-keyed items throughout. It does **not** use the official item wording: every statement is rewritten into an Aurora Station scenario. Scenario adaptation changes the validated instrument, so the results here are for reflection only.

The BFI-2 items are copyright Oliver P. John and Christopher J. Soto. The official resource grants personal and research use; separate permission is required before any commercial use.

- [The BFI-2 at the Colby Personality Lab](https://www.colby.edu/academics/departments-and-programs/psychology/research-opportunities/personality-lab/the-bfi-2/)
- [Soto & John, the BFI-2 paper](https://escholarship.org/content/qt16x6n05t/qt16x6n05t.pdf)

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

The report is read one chapter at a time. All five chapters are built into the page; the pager decides which is shown, puts the chapter in the address bar, and works with the browser's own back and forward buttons. The watch itself can be restarted at any point from the masthead, which clears the record and keeps your sound and reading-pace settings.

Both exports are named for the watchkeeper and the night the watch closed, so re-exporting the same record replaces it while a second watch keeps its own file.

Your name and responses stay in the browser. Nothing is sent anywhere, and nothing about you is ever put in a URL. The journey and your reading preferences are kept as two separate records, so restarting clears the journey and keeps sound and text speed.

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

The aurora is a narrative event, not a background. It is absent through onboarding and the whole early and middle watch, enters at Act 09 when the storm breaks, deepens through the remaining acts, and is gone by the time the report opens.

### Checks

```bash
node tests.mjs
```

The same checks run on every push and pull request through `.github/workflows/test.yml`.
