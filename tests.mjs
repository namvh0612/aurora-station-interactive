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
vm.runInThisContext(
  fs.readFileSync("./content/Aurora_Station_Content.js", "utf8"),
  { filename: "Aurora_Station_Content.js" },
);
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

/* ------------------------------------------------------------- structure */

check("twelve acts of five questions make sixty items", () => {
  assert.equal(data.assessment.actCount, 12);
  assert.equal(data.story.acts.length, 12);
  data.story.acts.forEach((act) => assert.equal(act.items.length, 5));
  assert.equal(items.length, 60);
  assert.deepEqual(
    items.map((item) => item.number),
    Array.from({ length: 60 }, (_, index) => index + 1),
  );
});

check("every act carries an opening and a closing", () => {
  data.story.acts.forEach((act) => {
    assert.ok(core.splitParagraphs(act.opening).length > 0, `${act.id} opening`);
    assert.ok(core.splitParagraphs(act.closing).length > 0, `${act.id} closing`);
  });
});

check("the spectrum is a five-point agreement scale", () => {
  const spectrum = data.assessment.spectrum;
  assert.equal(spectrum.id, "agreement-5");
  assert.equal(spectrum.min, 1);
  assert.equal(spectrum.max, 5);
  assert.deepEqual(spectrum.positions, [1, 2, 3, 4, 5]);
  assert.equal(spectrum.leftAnchor, "Strongly disagree");
  assert.equal(spectrum.rightAnchor, "Strongly agree");
  assert.deepEqual(spectrum.bands, { low: [1, 2], mid: [3], high: [4, 5] });
  assert.equal(core.responseLabels(data).length, 5);
  assert.match(data.assessment.scoring.reverseKey, /6 - raw/);
  assert.match(data.assessment.methodNote, /five-point/);
  assert.doesNotMatch(JSON.stringify(data.assessment.spectrum), /\b6\b/);
});

check("every item declares the five-point contract and bands", () => {
  items.forEach((item) => {
    assert.equal(item.spectrumId, "agreement-5", `Q${item.number} spectrum`);
    assert.equal(
      item.assessment.constructContract.format,
      "single-statement Likert 1-5",
      `Q${item.number} format`,
    );
    assert.equal(
      item.assessment.correctedScoreFormula,
      item.assessment.key === "R" ? "6 - raw" : "raw",
      `Q${item.number} formula`,
    );
    assert.deepEqual(item.responseBranches.low.responses, [1, 2]);
    assert.deepEqual(item.responseBranches.mid.responses, [3]);
    assert.deepEqual(item.responseBranches.high.responses, [4, 5]);
    ["low", "mid", "high"].forEach((band) => {
      assert.ok(
        item.responseBranches[band].transition.trim(),
        `Q${item.number} ${band} transition`,
      );
    });
  });
});

check("items stay evenly spread across the configured facets", () => {
  const perFacet = new Map();
  items.forEach((item) => {
    const key = `${item.assessment.elementCode}/${item.assessment.facet}`;
    perFacet.set(key, (perFacet.get(key) || 0) + 1);
  });
  const configured = Object.values(data.assessment.elements).flatMap(
    (element) => element.facets.map((facet) => `${element.code}/${facet}`),
  );
  assert.deepEqual([...perFacet.keys()].sort(), configured.slice().sort());
  perFacet.forEach((count, key) => assert.equal(count, 6, key));
});

check("each item's statement matches its declared facet contract", () => {
  items.forEach((item) => {
    assert.equal(
      item.assessment.constructContract.targetFacet,
      item.assessment.facet,
      `Q${item.number} facet contract`,
    );
    assert.equal(
      item.assessment.constructContract.keyDirection,
      item.assessment.key,
      `Q${item.number} key direction`,
    );
  });
});

/* --------------------------------------------------- branching & scoring */

check("narrative branches follow the raw response", () => {
  const item = items[0];
  assert.equal(core.branchKeyForRaw(data, 1), "low");
  assert.equal(core.branchKeyForRaw(data, 2), "low");
  assert.equal(core.branchKeyForRaw(data, 3), "mid");
  assert.equal(core.branchKeyForRaw(data, 4), "high");
  assert.equal(core.branchKeyForRaw(data, 5), "high");
  assert.equal(core.branchForRaw(data, item, 1), item.responseBranches.low);
  assert.equal(core.branchForRaw(data, item, 3), item.responseBranches.mid);
  assert.equal(core.branchForRaw(data, item, 5), item.responseBranches.high);
});

check("reverse-keyed items branch on the raw response, not the corrected one", () => {
  const reversed = items.filter((item) => item.assessment.key === "R");
  assert.ok(reversed.length > 0);
  reversed.forEach((item) => {
    // 5 is agreement, so it must select the high branch even though it scores 1.
    assert.equal(core.branchForRaw(data, item, 5), item.responseBranches.high);
    assert.equal(core.branchForRaw(data, item, 1), item.responseBranches.low);
    assert.equal(core.correctedScore(item, 5), 1);
    assert.equal(core.correctedScore(item, 1), 5);
    assert.equal(core.correctedScore(item, 3), 3);
  });
});

check("positive items score the raw response unchanged", () => {
  items
    .filter((item) => item.assessment.key === "+")
    .forEach((item) => {
      [1, 2, 3, 4, 5].forEach((raw) =>
        assert.equal(core.correctedScore(item, raw), raw),
      );
    });
});

check("charts normalise with (score - 1) / 4", () => {
  assert.equal(core.normalisePosition(1), 0);
  assert.equal(core.normalisePosition(3), 0.5);
  assert.equal(core.normalisePosition(5), 1);
  assert.equal(core.normalisePosition(4), 0.75);
  assert.equal(core.normalisePosition(null), 0.5);
});

/* -------------------------------------------------------- state handling */

function journeyOf(answers, name = "Test Crew") {
  return core.setPlayerIdentity(
    data,
    { ...core.emptyResponses(), answers: answers.slice() },
    name,
  );
}

function completeJourney(pattern) {
  let state = core.setPlayerIdentity(data, core.emptyResponses(), "Test Crew");
  for (let index = 0; index < 60; index += 1) {
    state = core.answerCurrent(data, state, pattern(index));
  }
  return state;
}

check("the watchkeeper name is normalised", () => {
  const state = core.setPlayerIdentity(data, core.emptyResponses(), "  Nam   Vu  ");
  assert.equal(state.playerName, "Nam Vu");
  assert.equal(state.onboardingComplete, true);
  assert.equal(
    core.setPlayerIdentity(data, core.emptyResponses(), "   ").onboardingComplete,
    false,
  );
});

check("responses outside 1-5 are rejected", () => {
  let state = core.setPlayerIdentity(data, core.emptyResponses(), "Test Crew");
  [0, 6, -1, 2.5, "4", null].forEach((value) => {
    assert.equal(core.answerCurrent(data, state, value).answers.length, 0, String(value));
  });
  state = core.answerCurrent(data, state, 4);
  assert.deepEqual(state.answers, [4]);
});

check("a corrupted saved record is truncated at the first bad answer", () => {
  const restored = core.sanitiseState(data, {
    playerName: "Test Crew",
    onboardingComplete: true,
    answers: [4, 2, 99, 5, 1],
  });
  assert.deepEqual(restored.answers, [4, 2]);
});

check("back is offered only inside an act with an unanswered question", () => {
  let state = core.setPlayerIdentity(data, core.emptyResponses(), "Test Crew");
  assert.equal(core.canStepBack(data, state), false);
  for (let index = 1; index <= 5; index += 1) {
    state = core.answerCurrent(data, state, 4);
    assert.equal(
      core.canStepBack(data, state),
      index < 5,
      `after ${index} answers in act 1`,
    );
  }
  // The fifth response starts the Act's narrative, so back is withdrawn and
  // cannot cross into the previous Act.
  assert.equal(core.stepBack(data, state).answers.length, 5);
  state = core.answerCurrent(data, state, 2);
  assert.equal(core.canStepBack(data, state), true);
  assert.deepEqual(core.stepBack(data, state).answers.length, 5);
});

check("stepping back then re-answering replaces the response", () => {
  let state = core.setPlayerIdentity(data, core.emptyResponses(), "Test Crew");
  state = core.answerCurrent(data, state, 4);
  state = core.answerCurrent(data, state, 1);
  state = core.stepBack(data, state);
  assert.deepEqual(state.answers, [4]);
  state = core.answerCurrent(data, state, 5);
  assert.deepEqual(state.answers, [4, 5]);
});

check("preferences survive a restart and journey state does not", () => {
  const store = new Map();
  const storage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };

  core.saveResponses(data, journeyOf([4, 4, 4]), storage);
  core.saveJourney({ revealed: 12, scrollY: 940 }, storage, 400);
  core.savePreferences({ textSpeed: "fast", paused: true }, storage);

  assert.deepEqual(core.loadResponses(data, storage).answers, [4, 4, 4]);
  assert.deepEqual(core.loadJourney(storage, 400), { revealed: 12, scrollY: 940 });

  core.clearJourneyState(storage);

  assert.deepEqual(core.loadResponses(data, storage), core.emptyResponses());
  assert.deepEqual(core.loadJourney(storage, 400), core.emptyJourney());
  assert.deepEqual(core.loadPreferences(storage), {
    textSpeed: "fast",
    paused: true,
  });
  assert.equal(core.RESPONSES_KEY !== core.JOURNEY_KEY, true);
  assert.equal(core.JOURNEY_KEY !== core.PREFERENCES_KEY, true);
});

check("preferences fall back to sane defaults", () => {
  assert.deepEqual(core.sanitisePreferences({ textSpeed: "warp" }), {
    textSpeed: "normal",
    paused: false,
  });
  assert.equal(core.revealDelay({ textSpeed: "slow" }) > core.revealDelay({ textSpeed: "fast" }), true);
});

check("a restored journey pointer is clamped to the node stream", () => {
  assert.deepEqual(core.sanitiseJourney({ revealed: 9999, scrollY: -5 }, 40), {
    revealed: 40,
    scrollY: 0,
  });
});

/* ----------------------------------------------------------- node stream */

check("the stream stops at the first unanswered question", () => {
  const nodes = core.buildNodes(data, core.emptyResponses());
  const last = nodes.at(-1);
  assert.equal(last.type, "question");
  assert.equal(last.index, 0);
  assert.equal(last.answered, false);
  assert.equal(nodes[0].type, "prologue-heading");
  assert.equal(nodes.filter((node) => node.type === "act-heading").length, 1);
  // The Act opening is present before its first question.
  const headingAt = nodes.findIndex((node) => node.type === "act-heading");
  const questionAt = nodes.findIndex((node) => node.type === "question");
  assert.ok(headingAt < questionAt);
  assert.ok(
    nodes
      .slice(headingAt + 1, questionAt)
      .every((node) => node.type === "body"),
  );
});

check("an act's five passages appear only after its fifth response", () => {
  const four = core.buildNodes(data, journeyOf([4, 4, 4, 4]));
  assert.equal(four.filter((node) => node.type === "chosen").length, 0);
  assert.equal(four.at(-1).type, "question");
  assert.equal(four.at(-1).offset, 4);

  const five = core.buildNodes(data, journeyOf([4, 4, 4, 4, 4]));
  const actOne = data.story.acts[0];
  assert.equal(five.filter((node) => node.type === "chosen").length, 5);
  assert.equal(
    five.filter((node) => node.type === "closing").length,
    core.splitParagraphs(actOne.closing).length,
  );

  // Order within Act 1: heading, opening, five questions, then the passages
  // and the closing. Act 2 opens straight afterwards.
  const actOneNodes = five.slice(
    five.findIndex((node) => node.key === "act-01-heading"),
    five.findIndex((node) => node.key === "act-02-heading"),
  );
  const kinds = actOneNodes.map((node) => node.type);
  assert.equal(kinds[0], "act-heading");
  assert.equal(kinds.filter((kind) => kind === "question").length, 5);
  assert.ok(kinds.lastIndexOf("question") < kinds.indexOf("context"));
  assert.ok(kinds.indexOf("context") < kinds.indexOf("closing"));
  assert.equal(kinds.at(-1), "closing");
  assert.equal(five.at(-1).type, "question");
  assert.equal(five.at(-1).offset, 0);
});

check("the revealed prefix only ever grows", () => {
  let previous = [];
  for (let answered = 0; answered <= 60; answered += 1) {
    const nodes = core.buildNodes(
      data,
      journeyOf(Array.from({ length: answered }, (_, index) => (index % 5) + 1)),
    );
    const keys = nodes.map((node) => node.key);
    // Everything except the trailing pending question must be untouched.
    const settled = Math.max(0, previous.length - 1);
    assert.deepEqual(
      keys.slice(0, settled),
      previous.slice(0, settled),
      `stream changed behind the reader at ${answered} answers`,
    );
    previous = keys;
  }
});

check("the chosen passage matches the recorded response", () => {
  const answers = Array.from({ length: 5 }, (_, index) => [1, 3, 5, 2, 4][index]);
  const nodes = core.buildNodes(data, journeyOf(answers));
  const chosen = nodes.filter((node) => node.type === "chosen");
  assert.equal(chosen.length, 5);
  data.story.acts[0].items.forEach((item, offset) => {
    const raw = answers[offset];
    const branch = core.branchForRaw(data, item, raw);
    assert.equal(chosen[offset].text, branch.transition.trim());
    assert.equal(chosen[offset].raw, raw);
    assert.equal(chosen[offset].band, core.branchKeyForRaw(data, raw));
  });
});

check("statements never leak into the narrative", () => {
  const complete = completeJourney((index) => ((index * 7) % 5) + 1);
  const nodes = core.buildNodes(data, complete);
  const prose = nodes
    .filter((node) => node.text)
    .map((node) => node.text)
    .join("\n");
  items.forEach((item) => {
    assert.equal(prose.includes(item.statement), false, `Q${item.number} leaked`);
  });
});

check("a finished journey ends with the record and the results", () => {
  const complete = completeJourney(() => 4);
  const nodes = core.buildNodes(data, complete);
  assert.equal(nodes.at(-1).type, "results");
  assert.equal(nodes.filter((node) => node.type === "question").length, 60);
  assert.equal(nodes.filter((node) => node.type === "act-heading").length, 12);
  assert.equal(
    nodes.filter((node) => node.type === "question" && !node.answered).length,
    0,
  );
  assert.equal(core.pendingQuestion(nodes, nodes.length), null);
  assert.equal(nodes.filter((node) => node.type === "ending").length > 0, true);
});

/* --------------------------------------------------------- final reserve */

check("the final reserve is derived and never asked as a question", () => {
  assert.equal(data.finalReserve.selection, "derived");
  assert.equal(data.finalReserve.scored, false);
  assert.equal(core.selectedReserve(data, journeyOf([4, 4, 4])), null);

  const explorer = core.selectedReserve(
    data,
    journeyOf(
      Array.from({ length: 55 }, (_, index) => {
        const item = items[index];
        if (item.assessment.elementCode === "WO") {
          return item.assessment.key === "R" ? 1 : 5;
        }
        if (["EA", "WA"].includes(item.assessment.elementCode)) {
          return item.assessment.key === "R" ? 5 : 1;
        }
        return 3;
      }),
    ),
  );
  assert.equal(explorer.id, "discovery");

  const protector = core.selectedReserve(
    data,
    journeyOf(
      Array.from({ length: 55 }, (_, index) => {
        const item = items[index];
        if (item.assessment.elementCode === "WO") {
          return item.assessment.key === "R" ? 5 : 1;
        }
        if (["EA", "WA"].includes(item.assessment.elementCode)) {
          return item.assessment.key === "R" ? 1 : 5;
        }
        return 3;
      }),
    ),
  );
  assert.equal(protector.id, "safety");

  assert.equal(core.selectedReserve(data, journeyOf(Array(55).fill(3))).id, "bounded");
});

check("the reserve cannot change once Act 12 has begun", () => {
  const base = Array.from({ length: 55 }, (_, index) => {
    const item = items[index];
    return item.assessment.elementCode === "WO"
      ? item.assessment.key === "R"
        ? 1
        : 5
      : item.assessment.key === "R"
        ? 5
        : 1;
  });
  const atFiftyFive = core.selectedReserve(data, journeyOf(base));
  const atSixty = core.selectedReserve(
    data,
    journeyOf(base.concat([1, 1, 1, 1, 1])),
  );
  assert.equal(atFiftyFive.id, atSixty.id);
});

/* ---------------------------------------------------------------- scoring */

check("uniform responses produce the expected element scores", () => {
  const profile = core.analyseProfile(data, completeJourney(() => 5));
  assert.equal(profile.complete, true);
  assert.equal(profile.elements.length, 5);
  assert.equal(profile.scaleMax, 5);
  profile.elements.forEach((result) => {
    // Two thirds of items are positively keyed, so an all-5 journey lands
    // between the poles rather than at the top.
    assert.ok(result.score > 1 && result.score < 5, `${result.code} ${result.score}`);
    assert.equal(result.position, (result.score - 1) / 4);
    result.facets.forEach((facet) => {
      assert.equal(facet.answered, 6);
      assert.ok(facet.score >= 1 && facet.score <= 5);
    });
  });
});

check("a perfectly neutral journey scores 3 on every element and facet", () => {
  const profile = core.analyseProfile(data, completeJourney(() => 3));
  assert.equal(profile.facetCount, 10);
  profile.elements.forEach((result) => {
    assert.equal(result.score, 3);
    assert.equal(result.position, 0.5);
    assert.equal(result.band.id, "balanced");
    result.facets.forEach((facet) => assert.equal(facet.score, 3));
  });
});

check("reverse scoring is applied to the score, not the story", () => {
  // Agree with everything: reverse items become 1, positive items become 5.
  const state = completeJourney(() => 5);
  const scored = core.scoreAssessment(data, state);
  const orderliness = scored.elements
    .find((element) => element.code === "ME")
    .facets.find((facet) => facet.name === "Orderliness");
  const orderlinessItems = items.filter(
    (item) => item.assessment.facet === "Orderliness",
  );
  const expected =
    orderlinessItems.reduce(
      (total, item) => total + (item.assessment.key === "R" ? 1 : 5),
      0,
    ) / orderlinessItems.length;
  assert.equal(orderliness.score, expected);
});

check("the five domains and the configured facets are all reported", () => {
  const profile = core.analyseProfile(data, completeJourney((index) => (index % 5) + 1));
  assert.deepEqual(
    profile.elements.map((element) => element.code),
    ["WO", "FI", "EA", "ME", "WA"],
  );
  const reported = profile.elements.flatMap((element) =>
    element.facets.map((facet) => facet.name),
  );
  const configured = Object.values(data.assessment.elements).flatMap(
    (element) => element.facets,
  );
  assert.deepEqual(reported, configured);
  assert.equal(profile.facetCount, configured.length);
  profile.elements.forEach((result) => {
    assert.ok(result.expression);
    assert.ok(result.description);
    assert.ok(result.potentialAdvantage);
    assert.ok(result.overextension);
    assert.ok(result.reflection);
    assert.ok(result.facetPattern);
    assert.ok(result.spectrum.lower && result.spectrum.higher);
    assert.equal(result.context.stages.length, 3);
    assert.equal(result.scaleMax, 5);
  });
});

check("band edges sit on the five-point scale", () => {
  [
    [1, "clear-lower"],
    [2.2, "clear-lower"],
    [2.21, "moderate-lower"],
    [2.8, "moderate-lower"],
    [2.81, "balanced"],
    [3, "balanced"],
    [3.2, "balanced"],
    [3.21, "moderate-higher"],
    [3.8, "moderate-higher"],
    [3.81, "clear-higher"],
    [5, "clear-higher"],
  ].forEach(([score, expected]) => {
    assert.equal(core.scoreBand(score).id, expected, `score ${score}`);
  });
  assert.equal(core.scoreBand(null).id, "unavailable");
  // The bands cover the same share of the range as the six-point original.
  assert.equal(
    Number((core.normalisePosition(3.2) - core.normalisePosition(2.8)).toFixed(3)),
    0.1,
  );
});

check("a flat response pattern is flagged for interpretation", () => {
  const flat = core.analyseProfile(data, completeJourney(() => 4));
  assert.equal(flat.quality.level, "caution");
  const varied = core.analyseProfile(
    data,
    completeJourney((index) => [1, 4, 2, 5, 3][index % 5]),
  );
  assert.equal(varied.quality.level, "clear");
  assert.match(varied.quality.summary, /five-point/);
});

check("a role is recommended with a stated basis", () => {
  const profile = core.analyseProfile(data, completeJourney((index) => (index % 5) + 1));
  assert.ok(profile.role.title);
  assert.ok(profile.role.why);
  assert.ok(profile.role.basis);
  assert.equal(profile.role.mode, "solo");
  assert.match(profile.roleModel, /60% overall availability/);
  assert.equal(profile.role.candidates.length, 5);
});

check("group mode rebalances the recommendation", () => {
  const complete = completeJourney((index) => (index % 5) + 1);
  const profile = core.analyseProfile(data, complete);
  const group = core.recommendRole(data, complete, profile.elements, {
    mode: "group",
    teamComposition: { WO: 1, FI: 0, EA: 0, ME: 0, WA: 0 },
    missionRequirement: { WO: 1, FI: 0.2, EA: 0.2, ME: 0.2, WA: 0.2 },
    allowStretchRoles: true,
  });
  assert.equal(group.mode, "group");
  assert.equal(group.title, "The Pathfinder");
});

check("movement is reported across three stages", () => {
  const profile = core.analyseProfile(data, completeJourney((index) => (index < 30 ? 5 : 1)));
  assert.equal(profile.context.stages.length, 3);
  assert.equal(profile.context.elements.length, 5);
  assert.ok(profile.context.highlights.length > 0);
  assert.ok(profile.context.summary);
});

/* -------------------------------------------------------------- exporters */

check("the story PDF carries the same passages as the page", () => {
  const complete = completeJourney((index) => [1, 5, 3, 2, 4][index % 5]);
  const nodes = core.buildNodes(data, complete);
  const blocks = pdf.buildStoryBlocks(data, complete, core);

  const nodeChosen = nodes
    .filter((node) => node.type === "chosen")
    .map((node) => node.text.replace(/[‐-—]/g, "-"));
  const blockChosen = blocks
    .filter((block) => block.type === "chosen")
    .map((block) => block.text);
  assert.deepEqual(blockChosen, nodeChosen);

  assert.equal(blocks[0].type, "chapter");
  assert.equal(
    blocks.filter((block) => block.type === "chapter").length,
    nodes.filter((node) =>
      ["prologue-heading", "act-heading", "interlude-heading"].includes(node.type),
    ).length,
  );
  const storyText = JSON.stringify(blocks);
  items.forEach((item) => {
    assert.equal(storyText.includes(item.statement), false, `Q${item.number} in PDF`);
  });
  assert.equal(storyText.includes("RECOMMENDED AURORA ROLE"), false);
});

check("a different journey produces a different story PDF", () => {
  const low = pdf.buildStoryBlocks(data, completeJourney(() => 1), core);
  const high = pdf.buildStoryBlocks(data, completeJourney(() => 5), core);
  assert.notDeepEqual(low, high);
  assert.equal(low.length > 100, true);
});

check("both exporters refuse an unfinished journey", async () => {
  const partial = journeyOf(Array(30).fill(4));
  await assert.rejects(() =>
    pdf.downloadStory(data, partial, core, "story.pdf"),
  );
  await assert.rejects(() =>
    pdf.downloadProfile(data, partial, core, "profile.pdf"),
  );
});

check("the exporter API exposes only the reachable renderer", () => {
  assert.equal(typeof pdf.downloadStory, "function");
  assert.equal(typeof pdf.downloadProfile, "function");
  assert.equal(typeof pdf.buildStoryBlocks, "function");
  assert.equal("buildProfileDefinition" in pdf, false);
  assert.equal("buildStoryDefinition" in pdf, false);
});

/* ----------------------------------------------------------------- audio */

check("the soundtrack follows the act and stops at the debrief", () => {
  assert.equal(audio.phaseForState(data, core.emptyResponses(), core), "station-drift");
  assert.equal(
    audio.phaseForState(data, journeyOf(Array(40).fill(4)), core),
    "under-ice-pulse",
  );
  assert.equal(
    audio.phaseForState(data, journeyOf(Array(55).fill(4)), core),
    "under-the-ice",
  );
  assert.equal(audio.phaseForState(data, completeJourney(() => 4), core), null);
});

/* --------------------------------------------------------------- sources */

const read = (file) => fs.readFileSync(file, "utf8");
const appSource = read("./app.js");
const coreSource = read("./core.js");
const indexSource = read("./index.html");
const stylesSource = read("./styles.css");
const pdfSource = read("./pdf-export.js");

check("the page loads exactly the five runtime modules", () => {
  [
    "content/Aurora_Station_Content.js",
    "./core.js",
    "./pdf-export.js",
    "./audio.js",
    "./app.js",
  ].forEach((module) => assert.ok(indexSource.includes(module), module));
  assert.equal((indexSource.match(/<script/g) || []).length, 5);
  assert.match(indexSource, /id="story"/);
  assert.match(indexSource, /id="playback-toggle"/);
  assert.match(indexSource, /id="playback-show-now"/);
  assert.match(indexSource, /data-speed="slow"/);
  assert.match(indexSource, /data-speed="normal"/);
  assert.match(indexSource, /data-speed="fast"/);
  assert.match(indexSource, /New passage below/);
});

check("no mirrored runtime, payload loader or dynamic evaluation remains", () => {
  [appSource, coreSource, pdfSource, indexSource, stylesSource].forEach((source) => {
    assert.doesNotMatch(source, /DecompressionStream/);
    assert.doesNotMatch(source, /MutationObserver/);
    assert.doesNotMatch(source, /\batob\s*\(/);
    assert.doesNotMatch(source, /\beval\s*\(/);
    assert.doesNotMatch(source, /new Function\s*\(/);
    assert.doesNotMatch(source, /v5-payload/);
    assert.doesNotMatch(source, /cdn\.jsdelivr|unpkg\.com|fonts\.googleapis/);
    assert.doesNotMatch(source, /pdfMake/i);
  });
  ["app-v7.js", "core-v7.js", "styles-v7.css", "aurora.js", "visuals.js", "image-export.js", "v5-payload"].forEach(
    (path) => assert.equal(fs.existsSync(path), false, `${path} still present`),
  );
});

check("the renderer appends and never rebuilds the revealed document", () => {
  assert.match(appSource, /function advance\(\)/);
  assert.match(appSource, /story\.appendChild/);
  assert.match(appSource, /FOLLOW_THRESHOLD = 260/);
  assert.match(appSource, /function settleAfterAppend/);
  assert.match(appSource, /function revealAllAvailable/);
  assert.match(appSource, /prefersReducedMotion/);
  // The story document is only cleared on boot and on restart.
  assert.equal((appSource.match(/story\.replaceChildren\(\)/g) || []).length, 2);
  assert.doesNotMatch(appSource, /scrollIntoView/);
  assert.doesNotMatch(appSource, /Continue to dawn debrief/);
  assert.doesNotMatch(appSource, /Next Act/);
});

check("no confirmation, submit or narrative-choice control is rendered", () => {
  const panelSource = appSource.slice(
    appSource.indexOf("function buildActPanel"),
    appSource.indexOf("function ensureActPanel"),
  );
  assert.match(panelSource, /response-choice/);
  assert.match(panelSource, /back-button/);
  // No button label in the reading surface may offer to continue, submit,
  // confirm or move to the next Act.
  assert.doesNotMatch(panelSource, /["'`](Continue|Submit|Confirm|Next Act)/);
  const storySurface = appSource.slice(appSource.indexOf("function buildActPanel"));
  assert.doesNotMatch(storySurface, /["'`]Next Act/);
  assert.doesNotMatch(storySurface, /["'`]Continue to /);
});

check("the response buttons have no connector line", () => {
  assert.match(stylesSource, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  const choiceBlock = stylesSource.slice(
    stylesSource.indexOf(".response-choices {"),
    stylesSource.indexOf(".response-readout"),
  );
  assert.doesNotMatch(choiceBlock, /::before|::after/);
  assert.doesNotMatch(stylesSource, /signal-track/);
});

check("the stylesheet honours accessibility requirements", () => {
  assert.match(stylesSource, /--tap: 3rem/);
  assert.match(stylesSource, /:focus-visible/);
  assert.match(stylesSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(stylesSource, /@media \(prefers-contrast: more\)/);
  assert.match(stylesSource, /--serif:/);
  assert.match(stylesSource, /--technical: ui-monospace/);
  assert.match(stylesSource, /\.skip-link/);
});

check("scores are shown out of five everywhere", () => {
  assert.match(appSource, /\$\{value\.toFixed\(1\)\} \/ \$\{core\.MAX_RESPONSE\}/);
  assert.match(pdfSource, /result\.score\.toFixed\(1\)\} \/ \$\{result\.scaleMax\}/);
  assert.match(pdfSource, /facet\.score\.toFixed\(1\)\} \/ \$\{result\.scaleMax\}/);
  assert.match(pdfSource, /\(stage\.score - 1\) \/ 4/);
  assert.doesNotMatch(appSource, /\/ 6/);
});

check("state records stay separate", () => {
  assert.match(coreSource, /RESPONSES_KEY = "aurora-station-responses-v1"/);
  assert.match(coreSource, /JOURNEY_KEY = "aurora-station-journey-v1"/);
  assert.match(coreSource, /PREFERENCES_KEY = "aurora-station-preferences-v1"/);
  const clearBlock = coreSource.slice(
    coreSource.indexOf("function clearJourneyState"),
    coreSource.indexOf("function reserveOption"),
  );
  assert.ok(clearBlock.length > 0);
  assert.match(clearBlock, /RESPONSES_KEY/);
  assert.match(clearBlock, /JOURNEY_KEY/);
  assert.doesNotMatch(clearBlock, /PREFERENCES_KEY/);
});

// GitHub Actions only surfaces annotations to anyone who cannot read the raw
// log, so a failing check reports itself as one as well as printing normally.
function reportFailure(label, error) {
  process.stdout.write(`  FAIL  ${label}\n`);
  if (process.env.GITHUB_ACTIONS) {
    const encode = (value) =>
      String(value).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
    process.stdout.write(
      `::error title=${encode(label)}::${encode(`${error.message}\n${error.stack || ""}`)}\n`,
    );
  }
}

for (const [label, run] of registered) {
  try {
    await run();
  } catch (error) {
    reportFailure(label, error);
    throw error;
  }
  process.stdout.write(`  ok  ${label}\n`);
}

process.stdout.write(`\nAurora Station checks passed (${registered.length}).\n`);
