# Aurora Station — The Final Watch

**Aurora Station** is a narrative self-reflection experience inspired by the **Big Five personality framework**. Rather than asking participants to describe themselves through abstract labels, it places them inside a shared story and asks how strongly they agree that each statement describes the way they generally tend to be.

The story is one continuous document. Twelve Acts of five statements each build a single scrolling record that grows as you read, and nothing already written is taken away.

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

Each result sits on a continuum. Every person uses all five dimensions to some degree, and no single Element defines the whole person.

### No “best” profile

Higher and lower expressions of a dimension can both be valuable. Each may offer useful strengths while also introducing possible blind spots or trade-offs.

### Patterns matter more than individual answers

A single response should not be interpreted on its own. The profile reflects tendencies that emerge across multiple situations and different forms of pressure.

### An honest reading, including the middle

The five-point agreement scale runs from 1 (strongly disagree) to 5 (strongly agree), with 3 as a genuine midpoint for statements that truly sit between the two. The aim is not to find a perfect answer, but to give an honest reading of yourself.

Some statements are written in the opposite direction to the trait they measure. Those are reversed when the score is calculated, but never when the story is told: the passage you read always follows the response you actually chose.

### Reflection rather than ranking

Aurora Station does not present population percentiles, competitive rankings or pass/fail outcomes. Results should be read as a personal reflection, not as a comparison with other people.

## The Five Elements

The Five Elements are narrative names for broad Big Five dimensions:

| Element | Big Five foundation | Reflection lens |
|---|---|---|
| **Wood** | Openness | Exploration, ideas, patterns and sensory attention |
| **Fire** | Extraversion | Visible energy, expression and direction |
| **Earth** | Agreeableness | Empathy, cooperation and human connection |
| **Metal** | Conscientiousness | Structure, standards and sustained action |
| **Water** | Emotional Stability | Calmness, recovery and regulation under pressure |

These names are storytelling devices. They are not elemental personality types, identity labels or exclusive categories.

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

Progress is kept in the browser only, in three separate records: your responses, how far the story has been revealed, and your reading preferences. Restarting the watch clears the first two and keeps the third, so sound and text speed survive.

### Project structure

| File | Responsibility |
|---|---|
| `content/Aurora_Station_Content.js` | All story, statement and interpretation content. Edit this to change the writing; no rebuild is required. |
| `core.js` | State, scoring and the derived story node stream. No DOM access. |
| `app.js` | The single `#story` renderer: reveals passages, runs the reflection panel and draws the results. |
| `pdf-export.js` | Canvas-rendered story and profile PDFs, built from the same node stream the page shows. |
| `audio.js` | The background soundtrack and its per-Act phases. |
| `styles.css` | The reading theme and every layout. |

### Checks

```bash
node tests.mjs
```

The same checks run on every push and pull request through `.github/workflows/test.yml`.
