/*
 * Aurora Station checks.
 *
 * Run with: node tests.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

// The content file is a classic browser script, so it needs a `window`. It is
// deliberately run in *this* realm rather than a fresh vm context: objects from
// a separate context carry a different Array.prototype, and deepStrictEqual
// treats those as unequal even when the contents match.
globalThis.window = globalThis;
vm.runInThisContext(fs.readFileSync("./content/Aurora_Station_Content.js", "utf8"), {
  filename: "Aurora_Station_Content.js",
});
const data = globalThis.AURORA_STATION_DATA;

await import("./core.js");
await import("./pdf-export.js");
await import("./audio.js");

const core = globalThis.AuroraCore;
const pdf = globalThis.AuroraPdf;
const audio = globalThis.AuroraAudio;

const items = core.flattenItems(data);

// Checks are registered as they are declared and run at the end, so that
// asynchronous ones are awaited rather than left as floating promises.
const registered = [];
const check = (label, run) => {
  registered.push([label, run]);
};

/* --------------------------------------------------------------- helpers */

function startJourney(name = "Test Crew") {
  return core.setPlayerName(data, core.emptyState(), name);
}

function answerAll(pattern) {
  let state = startJourney();
  items.forEach((item, index) => {
    state = core.recordResponse(data, state, item.id, pattern(index, item));
  });
  return state;
}

function answerFirst(count, raw = 4) {
  let state = startJourney();
  items.slice(0, count).forEach((item) => {
    state = core.recordResponse(data, state, item.id, raw);
  });
  return state;
}

function memoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
}

/* ------------------------------------------------------------- structure */

check("the content validates against the BFI-2 structure", () => {
  const result = core.validateContent(data);
  assert.deepEqual(result.problems, []);
  assert.equal(result.valid, true);
});

check("twelve acts of five items make sixty scored items", () => {
  assert.equal(data.story.acts.length, 12);
  assert.equal(items.length, 60);
  data.story.acts.forEach((act) => assert.equal(act.items.length, 5));
  assert.deepEqual(
    items.map((item) => item.bfiItem),
    Array.from({ length: 60 }, (_, index) => index + 1),
  );
});

check("acts hold items in the official domain order", () => {
  const order = [
    "extraversion",
    "agreeableness",
    "conscientiousness",
    "negativeEmotionality",
    "openMindedness",
  ];
  data.story.acts.forEach((act) => {
    assert.deepEqual(
      act.items.map((item) => item.domain),
      order,
      `${act.id} domain order`,
    );
    assert.deepEqual(
      act.items.map((item) => item.bfiItem),
      Array.from({ length: 5 }, (_, index) => (act.number - 1) * 5 + index + 1),
      `${act.id} item numbers`,
    );
  });
});

check("the official domain keys are reproduced exactly", () => {
  const expected = {
    extraversion: [1, 6, -11, -16, 21, -26, -31, -36, 41, 46, -51, 56],
    agreeableness: [2, 7, -12, -17, -22, 27, 32, -37, -42, -47, 52, 57],
    conscientiousness: [-3, -8, 13, 18, -23, -28, 33, 38, 43, -48, 53, -58],
    negativeEmotionality: [-4, -9, 14, 19, -24, -29, 34, 39, -44, -49, 54, 59],
    openMindedness: [-5, 10, 15, 20, -25, -30, 35, 40, -45, -50, -55, 60],
  };
  Object.entries(expected).forEach(([domain, keys]) => {
    const actual = items
      .filter((item) => item.domain === domain)
      .map((item) => (item.reverse ? -item.bfiItem : item.bfiItem));
    assert.deepEqual(actual, keys, domain);
    assert.equal(keys.length, 12, `${domain} item count`);
    assert.equal(keys.filter((key) => key < 0).length, 6, `${domain} reverse count`);
  });
});

check("the official facet keys are reproduced exactly", () => {
  const expected = {
    Sociability: [1, -16, -31, 46],
    Assertiveness: [6, 21, -36, -51],
    "Energy Level": [-11, -26, 41, 56],
    Compassion: [2, -17, 32, -47],
    Respectfulness: [7, -22, -37, 52],
    Trust: [-12, 27, -42, 57],
    Organization: [-3, 18, 33, -48],
    Productiveness: [-8, -23, 38, 53],
    Responsibility: [13, -28, 43, -58],
    Anxiety: [-4, 19, 34, -49],
    Depression: [-9, -24, 39, 54],
    "Emotional Volatility": [14, -29, -44, 59],
    "Intellectual Curiosity": [10, -25, 40, -55],
    "Aesthetic Sensitivity": [-5, 20, 35, -50],
    "Creative Imagination": [15, -30, -45, 60],
  };
  assert.equal(Object.keys(expected).length, 15);
  Object.entries(expected).forEach(([facet, keys]) => {
    const actual = items
      .filter((item) => item.facet === facet)
      .map((item) => (item.reverse ? -item.bfiItem : item.bfiItem));
    assert.deepEqual(actual, keys, facet);
    assert.equal(keys.length, 4, `${facet} item count`);
    assert.equal(keys.filter((key) => key < 0).length, 2, `${facet} reverse count`);
  });
});

check("each domain declares exactly three facets", () => {
  assert.equal(core.DOMAIN_ORDER.length, 5);
  core.DOMAIN_ORDER.forEach((code) => {
    assert.equal(data.assessment.domains[code].facets.length, 3, code);
  });
  assert.equal(Object.keys(data.assessment.facets).length, 15);
});

check("every item declares its own scoring metadata", () => {
  items.forEach((item) => {
    assert.equal(typeof item.bfiItem, "number", `${item.id} bfiItem`);
    assert.equal(typeof item.act, "number", `${item.id} act`);
    assert.equal(typeof item.positionInAct, "number", `${item.id} positionInAct`);
    assert.equal(typeof item.domain, "string", `${item.id} domain`);
    assert.equal(typeof item.facet, "string", `${item.id} facet`);
    assert.equal(typeof item.reverse, "boolean", `${item.id} reverse`);
    assert.ok(item.statement, `${item.id} statement`);
    ["low", "mid", "high"].forEach((band) => {
      assert.ok(item.narrative[band], `${item.id} ${band} branch`);
    });
  });
  assert.equal(new Set(items.map((item) => item.id)).size, 60);
});

check("the response scale uses the official five labels", () => {
  const spectrum = data.assessment.spectrum;
  assert.equal(spectrum.min, 1);
  assert.equal(spectrum.max, 5);
  assert.deepEqual(spectrum.responseLabels, [
    "Disagree strongly",
    "Disagree a little",
    "Neutral; no opinion",
    "Agree a little",
    "Agree strongly",
  ]);
  assert.equal(spectrum.leftAnchor, "Disagree strongly");
  assert.equal(spectrum.rightAnchor, "Agree strongly");
});

check("the product does not claim to be an official BFI-2", () => {
  assert.equal(data.instrument.status, "BFI-2-aligned narrative self-reflection");
  assert.match(data.instrument.statusNote, /not an official or clinically validated/i);
  assert.match(data.instrument.attribution, /Soto/);
  assert.match(data.instrument.attribution, /John/);
  assert.match(data.instrument.reference, /colby\.edu/);
  assert.match(data.instrument.permission, /commercial/i);
});

/* ----------------------------------------------------- narrative mapping */

check("narrative branches follow the raw response", () => {
  assert.equal(core.getNarrativeBand(1), "low");
  assert.equal(core.getNarrativeBand(2), "low");
  assert.equal(core.getNarrativeBand(3), "mid");
  assert.equal(core.getNarrativeBand(4), "high");
  assert.equal(core.getNarrativeBand(5), "high");
});

check("reverse keying never affects narrative selection", () => {
  const reversed = items.filter((item) => item.reverse);
  assert.equal(reversed.length, 30);
  reversed.forEach((item) => {
    assert.equal(core.narrativeForRaw(item, 5), item.narrative.high, `${item.id} high`);
    assert.equal(core.narrativeForRaw(item, 3), item.narrative.mid, `${item.id} mid`);
    assert.equal(core.narrativeForRaw(item, 1), item.narrative.low, `${item.id} low`);
  });
});

/* --------------------------------------------------------------- scoring */

check("reverse scoring uses 6 - raw", () => {
  [1, 2, 3, 4, 5].forEach((raw) => {
    assert.equal(core.getKeyedScore(raw, true), 6 - raw, `reverse ${raw}`);
    assert.equal(core.getKeyedScore(raw, false), raw, `direct ${raw}`);
  });
});

check("all responses of 3 produce domain and facet scores of 3", () => {
  const profile = core.scoreProfile(data, answerAll(() => 3));
  profile.domains.forEach((domain) => {
    assert.equal(domain.score, 3, domain.name);
    domain.facets.forEach((facet) => assert.equal(facet.score, 3, facet.name));
  });
});

check("all responses of 1 produce scores of 3 because keying is balanced", () => {
  const profile = core.scoreProfile(data, answerAll(() => 1));
  profile.domains.forEach((domain) => {
    assert.equal(domain.score, 3, domain.name);
    domain.facets.forEach((facet) => assert.equal(facet.score, 3, facet.name));
  });
});

check("all responses of 5 also produce scores of 3", () => {
  const profile = core.scoreProfile(data, answerAll(() => 5));
  profile.domains.forEach((domain) => {
    assert.equal(domain.score, 3, domain.name);
    domain.facets.forEach((facet) => assert.equal(facet.score, 3, facet.name));
  });
});

check("a domain equals the mean of its three facets", () => {
  const profile = core.scoreProfile(data, answerAll((index) => (index % 5) + 1));
  profile.domains.forEach((domain) => {
    const viaFacets =
      domain.facets.reduce((total, facet) => total + facet.score, 0) / 3;
    assert.ok(Math.abs(domain.score - viaFacets) < 1e-9, `${domain.name} ${domain.score}`);
  });
});

check("fifteen facets are reported with four items each", () => {
  const profile = core.scoreProfile(data, answerAll(() => 4));
  assert.equal(profile.domains.length, 5);
  assert.equal(profile.facets.length, 15);
  profile.facets.forEach((facet) => assert.equal(facet.itemCount, 4, facet.name));
});

check("no overall or total score is produced", () => {
  const profile = core.scoreProfile(data, answerAll(() => 4));
  ["total", "overall", "score", "sum", "average"].forEach((key) => {
    assert.equal(key in profile, false, `profile.${key}`);
  });
});

check("chart normalisation is (score - 1) / 4", () => {
  assert.equal(core.normalise(1), 0);
  assert.equal(core.normalise(3), 0.5);
  assert.equal(core.normalise(4), 0.75);
  assert.equal(core.normalise(5), 1);
  const profile = core.scoreProfile(data, answerAll((index) => (index % 5) + 1));
  profile.domains.forEach((domain) => {
    assert.equal(domain.normalised, (domain.score - 1) / 4, domain.name);
  });
});

check("interpretation bands use the specified edges", () => {
  assert.equal(core.bandForScore(data, 1).id, "lower");
  assert.equal(core.bandForScore(data, 2.49).id, "lower");
  assert.equal(core.bandForScore(data, 2.5).id, "balanced");
  assert.equal(core.bandForScore(data, 3.49).id, "balanced");
  assert.equal(core.bandForScore(data, 3.5).id, "higher");
  assert.equal(core.bandForScore(data, 5).id, "higher");
  assert.match(data.assessment.bandNote, /not official BFI-2 norms/i);
});

check("negative emotionality is scored directly and never inverted", () => {
  const state = answerAll((index, item) =>
    item.domain === "negativeEmotionality" ? (item.reverse ? 1 : 5) : 3,
  );
  const profile = core.scoreProfile(data, state);
  const domain = profile.domains.find((entry) => entry.code === "negativeEmotionality");
  assert.equal(domain.name, "Negative Emotionality");
  assert.equal(domain.score, 5);
  assert.match(
    data.assessment.scoring.negativeEmotionalityRule,
    /Do not silently invert/i,
  );
});

check("results are refused until all sixty items are answered", () => {
  assert.equal(core.scoreProfile(data, answerFirst(59)), null);
  assert.equal(core.scoreProfile(data, answerFirst(0)), null);
  assert.ok(core.scoreProfile(data, answerFirst(60)));
});

check("no response is imputed and invalid values are rejected", () => {
  let state = startJourney();
  [0, 6, -1, 2.5, "4", null, undefined, NaN].forEach((value) => {
    state = core.recordResponse(data, state, "q01", value);
    assert.equal(core.answeredCount(state), 0, `value ${String(value)}`);
  });
  state = core.recordResponse(data, state, "q01", 4);
  assert.equal(core.answeredCount(state), 1);
  // A response out of sequence is ignored.
  assert.equal(core.answeredCount(core.recordResponse(data, state, "q05", 3)), 1);
});

check("the summary never names a type and respects its thresholds", () => {
  const flat = core.summariseProfile(data, core.scoreProfile(data, answerAll(() => 3)));
  assert.match(flat, /midpoint/i);

  const skewed = core.summariseProfile(
    data,
    core.scoreProfile(
      data,
      answerAll((index, item) =>
        item.domain === "extraversion" ? (item.reverse ? 1 : 5) : 3,
      ),
    ),
  );
  assert.match(skewed, /Extraversion/);
  [flat, skewed].forEach((summary) => {
    assert.doesNotMatch(summary, /\btype\b/i);
    assert.doesNotMatch(summary, /\bbetter\b/i);
    assert.doesNotMatch(summary, /strength|weakness/i);
  });
});

/* --------------------------------------------------------- journey state */

check("the journey state uses schema version 2", () => {
  const state = core.emptyState();
  assert.equal(state.schemaVersion, 2);
  assert.deepEqual(Object.keys(state.assessment).sort(), [
    "answers",
    "currentAct",
    "currentQuestionInAct",
    "lockedActs",
  ]);
  assert.deepEqual(Object.keys(state.narrative).sort(), [
    "activeRevealAct",
    "completedActs",
    "paused",
    "revealedBeatCount",
  ]);
  assert.equal(state.phase, "prelude");
});

check("the watchkeeper name is trimmed and capped at forty characters", () => {
  assert.equal(core.MAX_NAME_LENGTH, 40);
  assert.equal(core.normalisePlayerName("  Nam   Vu  "), "Nam Vu");
  assert.equal(core.normalisePlayerName("x".repeat(60)).length, 40);
  assert.equal(core.setPlayerName(data, core.emptyState(), "   ").participant.name, "");
  assert.equal(core.setPlayerName(data, core.emptyState(), "Nam").phase, "questions");
});

check("the act and question pointers follow the answers", () => {
  assert.equal(core.sanitiseState(data, answerFirst(0)).assessment.currentAct, 1);
  assert.equal(answerFirst(3).assessment.currentQuestionInAct, 4);
  assert.equal(answerFirst(5).assessment.currentAct, 2);
  assert.equal(answerFirst(5).assessment.currentQuestionInAct, 1);
  assert.deepEqual(answerFirst(5).assessment.lockedActs, [1]);
  assert.deepEqual(answerFirst(33).assessment.lockedActs, [1, 2, 3, 4, 5, 6]);
  assert.equal(answerFirst(60).phase, "complete");
});

check("a record with a hole in it is truncated rather than scored", () => {
  const state = core.sanitiseState(data, {
    participant: { name: "Test Crew" },
    assessment: { answers: { q01: 4, q02: 2, q04: 5, q05: 1 } },
  });
  assert.equal(core.answeredCount(state), 2);
  assert.equal(core.scoreProfile(data, state), null);
});

check("back works only inside the act being answered", () => {
  let state = startJourney();
  assert.equal(core.canGoBack(data, state), false);
  for (let index = 1; index <= 5; index += 1) {
    state = core.recordResponse(data, state, items[index - 1].id, 4);
    assert.equal(core.canGoBack(data, state), index < 5, `after ${index}`);
  }
  // The act is locked once its fifth response lands.
  assert.equal(core.answeredCount(core.goBack(data, state)), 5);
  assert.deepEqual(state.assessment.lockedActs, [1]);
});

check("back restores the previous value and allows replacement", () => {
  let state = startJourney();
  state = core.recordResponse(data, state, "q01", 4);
  state = core.recordResponse(data, state, "q02", 2);
  assert.equal(core.previousResponse(data, state), 2);
  state = core.goBack(data, state);
  assert.equal(core.answeredCount(state), 1);
  state = core.recordResponse(data, state, "q02", 5);
  assert.equal(state.assessment.answers.q02, 5);
});

check("a completed journey records when it finished", () => {
  const state = answerFirst(60);
  assert.ok(state.completedAt > 0);
  assert.equal(answerFirst(59).completedAt, null);
});

/* ---------------------------------------------------------- persistence */

check("preferences survive a restart and journey data does not", () => {
  const storage = memoryStorage();
  core.saveState(data, answerFirst(12), storage);
  core.savePreferences({ textSpeed: "fast", soundEnabled: false }, storage);

  assert.equal(core.answeredCount(core.loadState(data, storage)), 12);
  core.clearJourney(storage);
  assert.equal(core.answeredCount(core.loadState(data, storage)), 0);
  assert.equal(core.loadState(data, storage).participant.name, "");
  assert.deepEqual(core.loadPreferences(storage), {
    textSpeed: "fast",
    soundEnabled: false,
  });
});

check("preference defaults and reveal delays match the specification", () => {
  assert.deepEqual(core.defaultPreferences(), { textSpeed: "normal", soundEnabled: true });
  assert.deepEqual(core.sanitisePreferences({ textSpeed: "warp" }), {
    textSpeed: "normal",
    soundEnabled: true,
  });
  assert.equal(core.TEXT_SPEEDS.slow, 2400);
  assert.equal(core.TEXT_SPEEDS.normal, 1200);
  assert.equal(core.TEXT_SPEEDS.fast, 500);
  assert.equal(core.revealDelay({ textSpeed: "slow" }, false), 2400);
  assert.equal(core.revealDelay({ textSpeed: "slow" }, true), 0);
});

/* ----------------------------------------------------------- node stream */

check("the stream stops at the first unanswered question", () => {
  const nodes = core.buildNodes(data, startJourney());
  const last = nodes.at(-1);
  assert.equal(last.type, "question");
  assert.equal(last.answered, false);
  assert.equal(nodes[0].type, "prologue-heading");

  const headingAt = nodes.findIndex((node) => node.type === "act-heading");
  const questionAt = nodes.findIndex((node) => node.type === "question");
  assert.ok(headingAt < questionAt, "act opening precedes its questions");
  assert.ok(
    nodes.slice(headingAt + 1, questionAt).every((node) => node.type === "body"),
  );
});

check("an act's passages appear only after its fifth response", () => {
  assert.equal(
    core.buildNodes(data, answerFirst(4)).filter((node) => node.type === "selected").length,
    0,
  );
  const nodes = core.buildNodes(data, answerFirst(5));
  const actOne = nodes.slice(
    nodes.findIndex((node) => node.key === "act-01-heading"),
    nodes.findIndex((node) => node.key === "act-02-heading"),
  );
  const kinds = actOne.map((node) => node.type);
  assert.equal(kinds[0], "act-heading");
  assert.equal(kinds.filter((kind) => kind === "question").length, 5);
  assert.ok(kinds.lastIndexOf("question") < kinds.indexOf("context"));
  assert.ok(kinds.indexOf("context") < kinds.indexOf("closing"));
  assert.equal(kinds.at(-1), "closing");
  // Act 2's first question is the next gate.
  assert.equal(nodes.at(-1).type, "question");
  assert.equal(nodes.at(-1).item.positionInAct, 1);
});

check("the revealed prefix only ever grows", () => {
  let previous = [];
  for (let answered = 0; answered <= 60; answered += 1) {
    const keys = core.buildNodes(data, answerFirst(answered, 4)).map((node) => node.key);
    const settled = Math.max(0, previous.length - 1);
    assert.deepEqual(
      keys.slice(0, settled),
      previous.slice(0, settled),
      `stream changed behind the reader at ${answered}`,
    );
    previous = keys;
  }
});

check("selected passages match the recorded responses", () => {
  const answers = [1, 3, 5, 2, 4];
  let state = startJourney();
  items.slice(0, 5).forEach((item, index) => {
    state = core.recordResponse(data, state, item.id, answers[index]);
  });
  const selected = core.buildNodes(data, state).filter((node) => node.type === "selected");
  assert.equal(selected.length, 5);
  items.slice(0, 5).forEach((item, index) => {
    assert.equal(selected[index].text, core.narrativeForRaw(item, answers[index]).trim());
    assert.equal(selected[index].band, core.getNarrativeBand(answers[index]));
  });
});

check("statements never leak into the narrative", () => {
  const prose = core
    .buildNodes(data, answerAll((index) => ((index * 7) % 5) + 1))
    .filter((node) => node.text)
    .map((node) => node.text)
    .join("\n");
  items.forEach((item) => {
    assert.equal(prose.includes(item.statement), false, `${item.id} leaked`);
  });
});

check("a finished journey ends with the completion panel", () => {
  const nodes = core.buildNodes(data, answerFirst(60));
  assert.equal(nodes.at(-1).type, "completion");
  assert.equal(nodes.filter((node) => node.type === "question").length, 60);
  assert.equal(nodes.filter((node) => node.type === "act-heading").length, 12);
  assert.equal(nodes.filter((node) => node.type === "selected").length, 60);
  assert.equal(core.pendingQuestion(nodes, nodes.length), null);
});

/* -------------------------------------------------------------- exporters */

check("the story PDF carries exactly the on-screen branches", () => {
  const state = answerAll((index) => [1, 5, 3, 2, 4][index % 5]);
  const fromNodes = core
    .buildNodes(data, state)
    .filter((node) => node.type === "selected")
    .map((node) => node.text.replace(/[‐-—]/g, "-"));
  const fromBlocks = pdf
    .buildStoryBlocks(data, state, core)
    .filter((block) => block.type === "chosen")
    .map((block) => block.text);
  assert.deepEqual(fromBlocks, fromNodes);
  assert.equal(fromBlocks.length, 60);

  const serialised = JSON.stringify(pdf.buildStoryBlocks(data, state, core));
  items.forEach((item) => {
    assert.equal(serialised.includes(item.statement), false, `${item.id} in PDF`);
  });
});

check("a different journey produces a different story PDF", () => {
  const low = pdf.buildStoryBlocks(data, answerAll(() => 1), core);
  const high = pdf.buildStoryBlocks(data, answerAll(() => 5), core);
  assert.notDeepEqual(low, high);
  assert.ok(low.length > 100);
});

check("both exporters refuse an incomplete journey", async () => {
  const partial = answerFirst(30);
  await assert.rejects(() => pdf.downloadStory(data, partial, core, "story.pdf"));
  await assert.rejects(() => pdf.downloadProfile(data, partial, core, "profile.pdf"));
});

/* ----------------------------------------------------------------- audio */

check("the soundtrack follows the act and stops at the debrief", () => {
  assert.equal(audio.phaseForState(data, core.emptyState(), core), "station-drift");
  assert.equal(audio.phaseForState(data, answerFirst(40), core), "under-ice-pulse");
  assert.equal(audio.phaseForState(data, answerFirst(55), core), "under-the-ice");
  assert.equal(audio.phaseForState(data, answerFirst(60), core), null);
});

/* --------------------------------------------------------------- sources */

const read = (file) => fs.readFileSync(file, "utf8");
const appSource = read("./app.js");
const coreSource = read("./core.js");
const resultsSource = read("./results.js");
const indexSource = read("./index.html");
const resultsHtml = read("./results.html");
const stylesSource = read("./styles.css");
const pdfSource = read("./pdf-export.js");

check("both pages load the specified modules", () => {
  [
    "./content/Aurora_Station_Content.js",
    "./core.js",
    "./pdf-export.js",
    "./audio.js",
    "./app.js",
  ].forEach((module) => assert.ok(indexSource.includes(module), `index ${module}`));
  assert.equal(indexSource.includes("./results.js"), false);

  [
    "./content/Aurora_Station_Content.js",
    "./core.js",
    "./pdf-export.js",
    "./audio.js",
    "./results.js",
  ].forEach((module) => assert.ok(resultsHtml.includes(module), `results ${module}`));
  assert.equal(resultsHtml.includes("./app.js"), false);
  assert.match(indexSource, /id="story"/);
  assert.match(resultsHtml, /id="results"/);
});

check("no hidden runtime, payload loader or dynamic evaluation remains", () => {
  [appSource, coreSource, resultsSource, pdfSource, indexSource, resultsHtml, stylesSource].forEach(
    (source) => {
      assert.doesNotMatch(source, /DecompressionStream/);
      assert.doesNotMatch(source, /MutationObserver/);
      assert.doesNotMatch(source, /\batob\s*\(/);
      assert.doesNotMatch(source, /\beval\s*\(/);
      assert.doesNotMatch(source, /new Function\s*\(/);
      assert.doesNotMatch(source, /v5-payload/);
      assert.doesNotMatch(source, /cdn\.jsdelivr|unpkg\.com|fonts\.googleapis/);
      assert.doesNotMatch(source, /pdfMake/i);
    },
  );
  ["app-v7.js", "core-v7.js", "aurora.js", "visuals.js", "image-export.js", "v5-payload"].forEach(
    (path) => assert.equal(fs.existsSync(path), false, `${path} still present`),
  );
});

check("the renderer appends and never force-scrolls", () => {
  assert.match(appSource, /function isNearBottom/);
  assert.match(appSource, /NEAR_BOTTOM_MARGIN = 260/);
  assert.match(appSource, /function followNewPassage/);
  assert.match(appSource, /function markUserScrolling/);
  assert.match(appSource, /story\.appendChild/);
  assert.doesNotMatch(appSource, /scrollIntoView/);
  // The story document is cleared only on boot.
  assert.equal((appSource.match(/story\.replaceChildren\(\)/g) || []).length, 1);
});

check("no continue, submit or next control sits between items", () => {
  const panelSource = appSource.slice(
    appSource.indexOf("function buildActPanel"),
    appSource.indexOf("function ensureActPanel"),
  );
  assert.match(panelSource, /response-choice/);
  assert.match(panelSource, /back-button/);
  assert.doesNotMatch(panelSource, /["'`](Continue|Submit|Confirm|Next)/);
  assert.equal(appSource.includes("SELECTED_STATE_DELAY = 300"), true);
});

check("the response scale keeps five buttons on one row with no connector", () => {
  assert.match(stylesSource, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  const block = stylesSource.slice(
    stylesSource.indexOf(".response-choices {"),
    stylesSource.indexOf(".response-signal-label"),
  );
  assert.doesNotMatch(block, /::before|::after/);
  assert.match(stylesSource, /--response-height: 3\.375rem/);
});

check("the stylesheet honours the layout and accessibility rules", () => {
  assert.match(stylesSource, /--page-max: 1180px/);
  assert.match(stylesSource, /--narrative-max: 760px/);
  assert.match(stylesSource, /--serif:/);
  assert.match(stylesSource, /--sans:/);
  assert.match(stylesSource, /--technical: ui-monospace/);
  assert.match(stylesSource, /--tap: 3rem/);
  assert.match(stylesSource, /:focus-visible/);
  assert.match(stylesSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(stylesSource, /@media \(prefers-contrast: more\)/);
  assert.match(stylesSource, /\.skip-link/);
  // Facet bars use one domain colour, never a red-to-green gradient.
  assert.match(stylesSource, /background: var\(--domain-colour, var\(--dawn-ink\)\)/);
});

check("the results page recalculates and refuses incomplete journeys", () => {
  assert.match(resultsSource, /core\.scoreProfile\(data, state\)/);
  assert.match(resultsSource, /window\.location\.replace\("\.\/index\.html"\)/);
  // Nothing about the reader goes in the URL.
  assert.doesNotMatch(resultsSource, /location\.search/);
  assert.doesNotMatch(resultsSource, /URLSearchParams/);
  assert.match(resultsSource, /outOfFive/);
  assert.match(resultsSource, /confirmRestart/);
});

check("scores are shown out of five on both surfaces", () => {
  assert.match(resultsSource, /\$\{scoreText\(value\)\} \/ \$\{core\.MAX_RESPONSE\}/);
  assert.match(pdfSource, /domain\.score\.toFixed\(1\)\} \/ \$\{profile\.scaleMax\}/);
  assert.match(pdfSource, /facet\.score\.toFixed\(1\)\} \/ \$\{profile\.scaleMax\}/);
});

for (const [label, run] of registered) {
  try {
    await run();
  } catch (error) {
    process.stdout.write(`  FAIL  ${label}\n`);
    if (process.env.GITHUB_ACTIONS) {
      const encode = (value) =>
        String(value).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
      process.stdout.write(
        `::error title=${encode(label)}::${encode(`${error.message}\n${error.stack || ""}`)}\n`,
      );
    }
    throw error;
  }
  process.stdout.write(`  ok  ${label}\n`);
}

process.stdout.write(`\nAurora Station checks passed (${registered.length}).\n`);
