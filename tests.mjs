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

check("the content validates against the five-domain structure", () => {
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

check("the product never claims to be a validated instrument", () => {
  assert.match(data.instrument.status, /not a clinical instrument/i);
  assert.match(data.instrument.statusNote, /not a validated/i);
  assert.match(data.instrument.permission, /commercial/i);
});

check("the experience does not name the instrument, and the credit survives", () => {
  /*
   * The five domains keep their names — those are the behavioural currents —
   * but the instrument itself is not named anywhere the reader reads. The
   * credit for the structure stays, in one place: the instrument record, which
   * the report's colophon and the README render.
   */
  const surfaces = [appSource, resultsSource, indexSource, resultsHtml, stylesSource, coreSource];
  surfaces.forEach((source) => {
    assert.doesNotMatch(source, /BFI-?2/i, "instrument named in source");
    assert.doesNotMatch(source, /\bBig Five\b/i, "Big Five named in source");
    assert.doesNotMatch(source, /\bOCEAN\b/, "OCEAN named in source");
  });

  // Nothing the reader is shown names it either.
  const shown = [
    data.instrument.status,
    data.instrument.statusNote,
    data.assessment.roleNote,
    data.assessment.phaseNote,
    data.assessment.bandNote,
    data.results.disclaimer,
    data.results.relationsNote,
  ].join(" ");
  assert.doesNotMatch(shown, /BFI-?2|\bBig Five\b|\bOCEAN\b/i);

  // The credit itself is intact, and says what was actually borrowed.
  assert.match(data.instrument.attribution, /Soto/);
  assert.match(data.instrument.attribution, /John/);
  assert.match(data.instrument.attribution, /structure/i);
  assert.match(data.instrument.reference, /colby\.edu/);
  assert.match(readme, /Soto/);
  assert.match(readme, /colby\.edu/);
  // And the domains keep their names.
  ["Extraversion", "Agreeableness", "Conscientiousness", "Negative Emotionality", "Open-Mindedness"]
    .forEach((name) => {
      assert.ok(
        core.domainDefinitions(data).some((domain) => domain.name === name),
        `${name} was renamed`,
      );
    });
});

check("every statement is one self-report sentence on the shared stem", () => {
  items.forEach((item) => {
    assert.match(item.statement, /^I am someone who /, `${item.id} does not use the stem`);
    assert.match(item.statement, /\.$/, `${item.id} does not end in a full stop`);
    // Short enough to answer, and no story detail smuggled into the item.
    const words = core.wordCount(item.statement);
    assert.ok(words <= 16, `${item.id} runs to ${words} words`);
  });
  // The prelude's practice statement is set the same way.
  const calibration = data.prelude.steps.find((step) => step.id === "calibration");
  assert.match(calibration.statement, /^I am someone who /);
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
  assert.match(data.assessment.bandNote, /not norms/i);
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

/* ---------------------------------------------------------- Aurora Roles */

check("the five roles map onto the five domains as specified", () => {
  assert.deepEqual(data.assessment.roleOrder, [
    "pathfinder",
    "catalyst",
    "steward",
    "architect",
    "sentinel",
  ]);
  assert.deepEqual(data.assessment.roleMapping, {
    "The Pathfinder": "Open-Mindedness",
    "The Catalyst": "Extraversion",
    "The Steward": "Agreeableness",
    "The Architect": "Conscientiousness",
    "The Sentinel": "6 - Negative Emotionality",
  });

  const expected = {
    pathfinder: { domain: "openMindedness", inverse: false, basis: "Open-Mindedness" },
    catalyst: { domain: "extraversion", inverse: false, basis: "Extraversion" },
    steward: { domain: "agreeableness", inverse: false, basis: "Agreeableness" },
    architect: { domain: "conscientiousness", inverse: false, basis: "Conscientiousness" },
    sentinel: { domain: "negativeEmotionality", inverse: true, basis: "Emotional Stability" },
  };
  Object.entries(expected).forEach(([id, definition]) => {
    const role = data.assessment.roles[id];
    assert.equal(role.domain, definition.domain, `${id} domain`);
    assert.equal(role.inverse, definition.inverse, `${id} inverse`);
    assert.equal(role.basis, definition.basis, `${id} basis`);
    assert.ok(role.contribution, `${id} contribution`);
    assert.match(role.colour, /^#[0-9a-f]{6}$/i, `${id} colour`);
  });
  // Roles are contributions, not types.
  assert.match(data.assessment.roleNote, /not fixed personality types/i);
});

check("Sentinel inverts Negative Emotionality and the others are direct", () => {
  const profile = core.scoreProfile(
    data,
    answerAll((index, item) =>
      item.domain === "negativeEmotionality" ? (item.reverse ? 1 : 5) : 3,
    ),
  );
  const byId = Object.fromEntries(profile.roles.map((role) => [role.id, role.score]));
  const domains = Object.fromEntries(
    profile.domains.map((domain) => [domain.code, domain.score]),
  );
  assert.equal(domains.negativeEmotionality, 5);
  assert.equal(byId.sentinel, 1, "6 - 5");
  assert.equal(byId.steward, domains.agreeableness);
  assert.equal(byId.pathfinder, domains.openMindedness);
  assert.equal(byId.catalyst, domains.extraversion);
  assert.equal(byId.architect, domains.conscientiousness);
  assert.equal(core.roleScoreFor({ inverse: true }, 2), 4);
  assert.equal(core.roleScoreFor({ inverse: false }, 2), 2);
});

check("the facet floor is the lowest supporting facet, inverted for Sentinel", () => {
  const profile = core.scoreProfile(data, answerAll((index) => (index % 5) + 1));
  const facets = Object.fromEntries(
    profile.facets.map((facet) => [facet.name, facet.score]),
  );

  profile.roles.forEach((role) => {
    const names = data.assessment.domains[role.domain].facets;
    const supporting = names.map((name) =>
      role.inverse ? 6 - facets[name] : facets[name],
    );
    assert.equal(role.facetFloor, Math.min(...supporting), `${role.shortName} floor`);
    // The floor can never exceed the role's own score.
    assert.ok(role.facetFloor <= role.score + 1e-9, `${role.shortName} floor above score`);
  });

  const sentinel = profile.roles.find((role) => role.id === "sentinel");
  const neFacets = data.assessment.domains.negativeEmotionality.facets.map(
    (name) => facets[name],
  );
  assert.equal(sentinel.facetFloor, 6 - Math.max(...neFacets));
});

check("profile suitability weights overall, pressure and the facet floor", () => {
  const weights = data.assessment.suitability.weights;
  assert.deepEqual(weights, { overall: 0.6, pressure: 0.25, facetFloor: 0.15 });
  assert.match(
    data.assessment.suitability.formula,
    /0\.60 \* overallRoleScore \+ 0\.25 \* pressureRoleScore \+ 0\.15 \* facetFloor/,
  );

  const profile = core.scoreProfile(data, answerAll((index) => (index % 5) + 1));
  profile.roles.forEach((role) => {
    const expected =
      weights.overall * role.score +
      weights.pressure * role.pressureScore +
      weights.facetFloor * role.facetFloor;
    assert.ok(
      Math.abs(role.profileSuitability - expected) < 1e-9,
      `${role.shortName} ${role.profileSuitability} vs ${expected}`,
    );
    assert.ok(role.profileSuitability >= 1 && role.profileSuitability <= 5);
  });
});

check("a low facet floor pulls suitability below the domain average", () => {
  // One facet of Conscientiousness answered low, the rest high.
  const state = answerAll((index, item) => {
    if (item.domain !== "conscientiousness") {
      return 3;
    }
    const low = item.facet === "Organization";
    return low ? (item.reverse ? 5 : 1) : item.reverse ? 1 : 5;
  });
  const profile = core.scoreProfile(data, state);
  const architect = profile.roles.find((role) => role.id === "architect");
  assert.ok(architect.facetFloor < architect.score, "floor should be the weak facet");
  assert.ok(
    architect.profileSuitability < architect.score,
    "an unsupported component must reduce suitability",
  );
});

check("the recommendation combines suitability, team and mission", () => {
  const profile = core.scoreProfile(data, answerAll((index) => (index % 5) + 1));
  const solo = core.recommendRole(data, profile.roles);
  assert.deepEqual(solo.inputs, {
    profileSuitability: true,
    teamComposition: false,
    missionRequirement: false,
  });
  assert.equal(solo.complete, false, "a solo journey cannot know team or mission");
  assert.ok(solo.leading.primary);

  // Team and mission demand can move the recommendation off the best fit.
  const demand = Object.fromEntries(
    data.assessment.roleOrder.map((id) => [id, id === "pathfinder" ? 5 : 1]),
  );
  const group = core.recommendRole(data, profile.roles, {
    teamComposition: demand,
    missionRequirement: demand,
  });
  assert.equal(group.complete, true);
  assert.equal(group.leading.primary.id, "pathfinder");
  assert.match(
    data.assessment.suitability.recommendedFormula,
    /Profile Suitability \+ Team Composition \+ Mission Requirement/,
  );
});

check("ties are never broken by array order", () => {
  const tied = data.assessment.roleOrder.map((id, index) => ({
    id,
    name: data.assessment.roles[id].name,
    shortName: data.assessment.roles[id].shortName,
    profileSuitability: 4,
    facetFloor: index === 3 ? 5 : 2,
  }));

  const lead = core.leadingRoles(data, tied, "profileSuitability");
  // Architect sits fourth in the array but has the only supported floor.
  assert.equal(lead.ranked[0].id, "architect");

  // Reversing the input must not change the outcome.
  const reversed = core.leadingRoles(data, tied.slice().reverse(), "profileSuitability");
  assert.equal(reversed.ranked[0].id, "architect");
  assert.deepEqual(
    lead.ranked.map((role) => role.id),
    reversed.ranked.map((role) => role.id),
  );
});

check("role scores stay on the 1-5 scale and never total", () => {
  const profile = core.scoreProfile(data, answerAll((index) => (index % 5) + 1));
  assert.equal(profile.roles.length, 5);
  profile.roles.forEach((role) => {
    assert.ok(role.score >= 1 && role.score <= 5, `${role.name} ${role.score}`);
    assert.equal(role.normalised, (role.score - 1) / 4, `${role.name} normalised`);
  });
  ["total", "sum", "percentage", "share"].forEach((key) => {
    assert.equal(key in profile.roles[0], false, `role.${key}`);
  });
});

check("a tie inside the configured tolerance produces a blend of two", () => {
  const tolerance = data.assessment.suitability.tieTolerance;
  assert.equal(tolerance, 0.15);
  const roles = [
    { id: "a", name: "The Steward", shortName: "Steward", score: 4.1 },
    { id: "b", name: "The Architect", shortName: "Architect", score: 4.0 },
    { id: "c", name: "The Sentinel", shortName: "Sentinel", score: 3.2 },
    { id: "d", name: "The Catalyst", shortName: "Catalyst", score: 2.0 },
    { id: "e", name: "The Pathfinder", shortName: "Pathfinder", score: 1.5 },
  ];
  const blend = core.leadingRoles(data, roles);
  assert.equal(blend.isBlend, true);
  assert.equal(blend.label, "Steward + Architect");
  assert.equal(blend.blended.length, 2);

  // A flat profile is a flat profile, not a five-way blend.
  const flat = core.leadingRoles(
    data,
    roles.map((role) => ({ ...role, score: 3 })),
  );
  assert.equal(flat.blended.length, 2);

  // Just outside the tolerance is a single role.
  const single = core.leadingRoles(
    data,
    roles.map((role, index) => ({ ...role, score: index === 0 ? 4.2 : role.score })),
  );
  assert.equal(single.isBlend, false);
});

check("a secondary role is offered only within 0.30", () => {
  const base = [
    { id: "a", name: "The Steward", shortName: "Steward", score: 4.5 },
    { id: "b", name: "The Architect", shortName: "Architect", score: 4.2 },
    { id: "c", name: "The Sentinel", shortName: "Sentinel", score: 2.0 },
  ];
  const close = core.leadingRoles(data, base);
  assert.equal(close.isBlend, false);
  assert.equal(close.secondary.shortName, "Architect");

  const far = core.leadingRoles(data, [
    { id: "a", name: "The Steward", shortName: "Steward", score: 4.5 },
    { id: "b", name: "The Architect", shortName: "Architect", score: 4.0 },
  ]);
  assert.equal(far.secondary, null);
});

/* -------------------------------------------------------- context phases */

check("every act belongs to one phase and phases hold whole acts", () => {
  assert.deepEqual(data.assessment.phaseOrder, ["baseline", "pressure", "recovery"]);
  const seen = new Set();
  core.phaseDefinitions(data).forEach((phase) => {
    assert.ok(phase.acts.length >= 3, `${phase.id} needs three acts`);
    phase.acts.forEach((act) => {
      assert.equal(seen.has(act), false, `act ${act} in two phases`);
      seen.add(act);
    });
  });
  assert.equal(seen.size, 12);

  data.story.acts.forEach((act) => {
    assert.ok(act.contextPhase, `${act.id} has no phase`);
    act.items.forEach((item) => {
      assert.equal(item.contextPhase, act.contextPhase, `${item.id} phase`);
    });
  });
});

check("each phase carries equal representation of the five domains", () => {
  core.phaseDefinitions(data).forEach((phase) => {
    const counts = {};
    items
      .filter((item) => item.contextPhase === phase.id)
      .forEach((item) => {
        counts[item.domain] = (counts[item.domain] || 0) + 1;
      });
    const values = core.DOMAIN_ORDER.map((code) => counts[code]);
    assert.equal(new Set(values).size, 1, `${phase.id} uneven: ${values}`);
    assert.equal(values[0], phase.acts.length, `${phase.id} per domain`);
  });
});

check("phase scores are calculated separately from the full profile", () => {
  const profile = core.scoreProfile(
    data,
    answerAll((index, item) =>
      item.domain === "conscientiousness" && item.contextPhase === "pressure"
        ? item.reverse
          ? 1
          : 5
        : 3,
    ),
  );
  const architect = (phase) =>
    phase.roles.find((role) => role.id === "architect").score;
  assert.equal(architect(profile.phases[0]), 3, "baseline untouched");
  assert.equal(architect(profile.phases[1]), 5, "pressure raised");
  assert.equal(architect(profile.phases[2]), 3, "recovery untouched");
  profile.phases.forEach((phase) => assert.equal(phase.definitive, true));
});

check("phase facets are not reported separately", () => {
  const profile = core.scoreProfile(data, answerAll(() => 4));
  profile.phases.forEach((phase) => {
    assert.equal("facets" in phase, false, `${phase.id} exposes facets`);
  });
  assert.equal(profile.facets.length, 15);
  assert.match(data.assessment.phaseNote, /not separate measurements/i);
});

check("shifts use the 0.25 and 0.50 thresholds", () => {
  assert.equal(core.describeShift(data, 0.24), null);
  assert.equal(core.describeShift(data, -0.24), null);
  assert.equal(core.describeShift(data, 0.25), "subtle");
  assert.equal(core.describeShift(data, 0.49), "subtle");
  assert.equal(core.describeShift(data, 0.5), "notable");
  assert.equal(core.describeShift(data, -1.2), "notable");
});

check("a stable pattern reports no shifts at all", () => {
  const profile = core.scoreProfile(data, answerAll(() => 3));
  const comparison = core.compareRoles(data, profile.phases[0], profile.phases[1]);
  assert.equal(comparison.stable, true);
  assert.deepEqual(comparison.shifts, []);
});

check("the summary describes patterns, never a type or a verdict", () => {
  const profiles = [
    core.scoreProfile(data, answerAll(() => 3)),
    core.scoreProfile(
      data,
      answerAll((index, item) =>
        item.domain === "conscientiousness" && item.contextPhase === "pressure"
          ? item.reverse
            ? 1
            : 5
          : 3,
      ),
    ),
  ];

  profiles.forEach((profile) => {
    const summary = core.summariseProfile(data, profile);
    assert.ok(summary.overall.primary, "no leading role");
    ["consistency", "adaptation", "contribution"].forEach((key) => {
      const words = summary[key].trim().split(/\s+/).length;
      assert.ok(words >= 50 && words <= 90, `${key} is ${words} words`);
      assert.doesNotMatch(summary[key], /\byour type\b/i);
      assert.doesNotMatch(summary[key], /\bstrength|weakness\b/i);
      assert.doesNotMatch(summary[key], /\bsuccessful|unsuccessful\b/i);
      assert.doesNotMatch(summary[key], /\bshould\b/i);
    });
    assert.ok(summary.reflection.endsWith("?"), "reflection is a question");
  });
});

/* ---------------------------------------------------------- aurora state */

check("the aurora enters at its act and deepens to the end of the watch", () => {
  assert.equal(data.story.auroraAct, 9);
  const complete = answerFirst(60);
  const nodes = core.buildNodes(data, complete);

  const actAt = (revealed) => {
    let act = 0;
    for (let index = 0; index < revealed; index += 1) {
      if (nodes[index].actNumber) {
        act = nodes[index].actNumber;
      }
    }
    return act;
  };

  let peak = 0;
  let sawPresent = false;
  for (let revealed = 0; revealed <= nodes.length; revealed += 1) {
    const aurora = core.auroraStateFor(data, complete, nodes, revealed);
    const act = actAt(revealed);
    const closed = nodes.slice(0, revealed).some((node) => node.type === "completion");

    if (act < 9 || closed) {
      assert.equal(aurora.state, "off", `aurora visible at act ${act} (closed ${closed})`);
      assert.equal(aurora.intensity, 0);
    } else {
      assert.equal(aurora.state, "present", `aurora missing at act ${act}`);
      sawPresent = true;
      // Intensity only ever rises while the night runs.
      assert.ok(aurora.intensity >= peak - 1e-9, `intensity fell at act ${act}`);
      peak = Math.max(peak, aurora.intensity);
    }
  }
  assert.equal(sawPresent, true);
  assert.equal(peak, 1, "the aurora reaches full intensity by the last act");

  // Gone once the record closes — dawn is not a dimmed night.
  const ended = core.auroraStateFor(data, complete, nodes, nodes.length);
  assert.deepEqual(ended, { state: "off", intensity: 0 });
});

check("the aurora is absent through onboarding and the early watch", () => {
  assert.deepEqual(core.auroraStateFor(data, core.emptyState(), null, 0), {
    state: "off",
    intensity: 0,
  });
  assert.deepEqual(core.auroraStateFor(data, answerFirst(0), null, 0), {
    state: "off",
    intensity: 0,
  });
  // Forty answers is Act 9, but nothing of it has been revealed yet.
  assert.equal(core.auroraStateFor(data, answerFirst(20), null, 0).state, "off");
});

check("the reader's context phase tracks the story", () => {
  assert.equal(core.contextPhaseFor(data, answerFirst(0)), "baseline");
  assert.equal(core.contextPhaseFor(data, answerFirst(19)), "baseline");
  assert.equal(core.contextPhaseFor(data, answerFirst(20)), "pressure");
  assert.equal(core.contextPhaseFor(data, answerFirst(39)), "pressure");
  assert.equal(core.contextPhaseFor(data, answerFirst(40)), "recovery");
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
    scrollMode: "auto",
  });
});

check("how the story arrives is a preference, and it survives a restart", () => {
  const storage = memoryStorage();
  core.savePreferences({ textSpeed: "slow", soundEnabled: true, scrollMode: "manual" }, storage);
  core.clearJourney(storage);
  assert.equal(core.loadPreferences(storage).scrollMode, "manual");
  // Anything that is not one of the two modes reads as automatic.
  assert.equal(core.sanitisePreferences({ scrollMode: "sideways" }).scrollMode, "auto");
  assert.equal(core.defaultPreferences().scrollMode, "auto");
  ["auto", "manual"].forEach((mode) => {
    assert.equal(core.sanitisePreferences({ scrollMode: mode }).scrollMode, mode);
  });
  // Both are offered, in the prelude, with a note that it can be changed.
  assert.deepEqual(
    data.prelude.reading.options.map((option) => option.id),
    ["auto", "manual"],
  );
  data.prelude.reading.options.forEach((option) => {
    assert.ok(option.name && option.note, option.id);
  });
});

check("a passage is held for as long as it takes to read", () => {
  assert.deepEqual(core.defaultPreferences(), {
    textSpeed: "normal",
    soundEnabled: true,
    scrollMode: "auto",
  });
  assert.equal(core.sanitisePreferences({ textSpeed: "warp" }).textSpeed, "normal");

  const short = "The panel is warm.";
  const long = Array.from({ length: 60 }, () => "word").join(" ");

  // The delay follows the words, not a single constant per passage.
  ["slow", "normal", "fast"].forEach((textSpeed) => {
    const prefs = { textSpeed };
    assert.ok(
      core.revealDelay(prefs, false, long) > core.revealDelay(prefs, false, short) * 2,
      `${textSpeed} does not scale with length`,
    );
    assert.equal(core.revealDelay(prefs, true, long), 0, `${textSpeed} reduced motion`);
  });

  // Slower settings hold everything longer than faster ones.
  assert.ok(core.revealDelay({ textSpeed: "slow" }, false, long) > core.revealDelay({ textSpeed: "normal" }, false, long));
  assert.ok(core.revealDelay({ textSpeed: "normal" }, false, long) > core.revealDelay({ textSpeed: "fast" }, false, long));

  // A sixty-word passage on the slow setting is a readable dwell, not a beat.
  assert.ok(core.revealDelay({ textSpeed: "slow" }, false, long) >= 8000);
  // A short line still lands rather than flashing past.
  assert.ok(core.revealDelay({ textSpeed: "fast" }, false, short) >= 400);

  // An Act closes before the next opens, and the pause follows the pace.
  assert.ok(core.actClosePause({ textSpeed: "slow" }, false) > core.actClosePause({ textSpeed: "fast" }, false));
  assert.equal(core.actClosePause({ textSpeed: "slow" }, true), 0);
  assert.equal(core.wordCount(" one   two  three "), 3);
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
    .map((node) => node.text.replace(/[\u2010-\u2014]/g, "-"));
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
const artworkSource = read("./artwork.js");
const appSource = read("./app.js");
const coreSource = read("./core.js");
const resultsSource = read("./results.js");
const indexSource = read("./index.html");
const resultsHtml = read("./results.html");
const stylesSource = read("./styles.css");
const pdfSource = read("./pdf-export.js");
const audioSource = read("./audio.js");
const readme = read("./README.md");

check("both pages load the modules they need and nothing else", () => {
  [
    "./content/Aurora_Station_Content.js",
    "./core.js",
    "./artwork.js",
    "./pdf-export.js",
    "./audio.js",
    "./app.js",
  ].forEach((module) => assert.ok(indexSource.includes(module), `index ${module}`));
  assert.equal(indexSource.includes("./results.js"), false);

  [
    "./content/Aurora_Station_Content.js",
    "./core.js",
    "./artwork.js",
    "./pdf-export.js",
    "./results.js",
  ].forEach((module) => assert.ok(resultsHtml.includes(module), `results ${module}`));
  assert.equal(resultsHtml.includes("./app.js"), false);
  // The report is silent; the station soundtrack belongs to the night.
  assert.equal(resultsHtml.includes("./audio.js"), false);
  assert.match(indexSource, /id="watch"/);
  assert.match(resultsHtml, /id="report"/);
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
  assert.match(appSource, /function nearBottom/);
  assert.match(appSource, /NEAR_BOTTOM = 260/);
  assert.match(appSource, /function follow/);
  assert.match(appSource, /function markScrolling/);
  assert.match(appSource, /watch\.appendChild/);
  assert.doesNotMatch(appSource, /scrollIntoView/);
  // The watch is cleared only on boot.
  assert.equal((appSource.match(/watch\.replaceChildren\(\)/g) || []).length, 1);
});

check("no continue, submit or next control sits between observations", () => {
  const panel = appSource.slice(
    appSource.indexOf("function buildPanel"),
    appSource.indexOf("function panelFor"),
  );
  assert.match(panel, /class="response"|"response"/);
  assert.match(panel, /"Back"/);
  assert.doesNotMatch(panel, /["'`](Continue|Submit|Confirm|Next)/);
  assert.match(appSource, /SELECTED_HOLD = 300/);
});

check("the response scale is one row of equal cells with no colour ramp", () => {
  assert.match(stylesSource, /grid-template-columns: repeat\(var\(--response-count, 5\), minmax\(0, 1fr\)\)/);
  const block = stylesSource.slice(
    stylesSource.indexOf(".response {"),
    stylesSource.indexOf(".observation-readout"),
  );
  // No connector, no gradient, no per-level colour.
  assert.doesNotMatch(block, /::before|::after/);
  assert.doesNotMatch(block, /gradient/);
  assert.doesNotMatch(stylesSource, /coral|#ff6|signal-cyan/i);
  // Selected state is a single inversion, identical for every value.
  assert.match(block, /\[aria-pressed="true"\]/);
});

check("the previous visual system is gone", () => {
  const sources = [stylesSource, appSource, resultsSource, indexSource, resultsHtml, pdfSource];
  sources.forEach((source) => {
    assert.doesNotMatch(source, /Georgia/, "Georgia");
    assert.doesNotMatch(source, /Courier New/, "Courier New");
    assert.doesNotMatch(source, /--signal-cyan|--signal-aurora|--dawn-ink|--night-line/, "old tokens");
    assert.doesNotMatch(source, /aurora-background|aurora-surge|aurora-rescue/, "old aurora hooks");
    assert.doesNotMatch(source, /result-slide|result-deck|results-dot|results-view/, "old result deck");
  });
  // No hairline rule across the top of the viewport.
  assert.doesNotMatch(stylesSource, /body::before/);
});

check("both exports stay inside the dawn palette", () => {
  // Every page of both PDFs is read after the night, on paper.
  const dawn = new Set([
    "#e6eaeb", "#f1f4f4", "#d3dada", "#c1caca",
    "#14181a", "#262b2d", "#4b5457", "#5c6568",
    // The five behavioural traces, passed in as the accent for a named current.
    "#42b4e6", "#ef5b7a", "#3dcd58", "#ff8a3d", "#9b51e0",
  ]);
  const used = new Set(pdfSource.match(/#[0-9a-f]{6}/gi) || []);
  used.forEach((colour) => {
    assert.ok(dawn.has(colour.toLowerCase()), `${colour} is not a dawn tone`);
  });
  // Washes are ink or paper, never a hue. Neutrals keep their channels close
  // together; the teal and cyan the redesign removed do not.
  (pdfSource.match(/rgba\([^)]*\)/g) || []).forEach((value) => {
    const [red, green, blue] = value
      .slice(5, -1)
      .split(",")
      .slice(0, 3)
      .map((channel) => Number(channel.trim()));
    const spread = Math.max(red, green, blue) - Math.min(red, green, blue);
    assert.ok(spread <= 24, `${value} is a coloured wash`);
  });
  // The cover no longer paints an aurora over the title.
  assert.doesNotMatch(pdfSource, /addColorStop\(0\.24|addColorStop\(0\.74/);
});

check("exactly two families carry the whole design", () => {
  assert.match(stylesSource, /--type-display:/);
  assert.match(stylesSource, /--type-operational:/);
  const families = [...stylesSource.matchAll(/font-family:\s*([^;]+);/g)].map((match) =>
    match[1].trim(),
  );
  assert.ok(families.length > 0);
  families.forEach((value) => {
    assert.ok(
      /var\(--type-display\)|var\(--type-operational\)|inherit/.test(value),
      `unexpected font-family: ${value}`,
    );
  });
});

check("the type scale is the art-directed hierarchy", () => {
  ["--step-plate", "--step-display", "--step-chapter", "--step-section", "--step-body", "--step-mark"].forEach(
    (token) => assert.match(stylesSource, new RegExp(`${token}: clamp\\(`), token),
  );
  // Station-printed marks: operational family, uppercase, tracked, tabular.
  const mark = stylesSource.slice(stylesSource.indexOf(".mark {"), stylesSource.indexOf(".mark-live"));
  assert.match(mark, /font-family: var\(--type-operational\)/);
  assert.match(mark, /text-transform: uppercase/);
  assert.match(mark, /letter-spacing: var\(--track-mark\)/);
  assert.match(mark, /font-variant-numeric: tabular-nums/);
});

check("the layout is editorial rather than a grid of cards", () => {
  // The measure grows with the page instead of sitting at one fixed width.
  assert.match(stylesSource, /--measure: clamp\(/);
  assert.match(stylesSource, /--measure-wide: clamp\(/);
  assert.match(stylesSource, /--tap: 3rem/);
  assert.match(stylesSource, /:focus-visible/);
  assert.match(stylesSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(stylesSource, /@media \(prefers-contrast: more\)/);
  assert.match(stylesSource, /\.skip-link/);
  // Full-bleed act plates with oversized numbering.
  assert.match(stylesSource, /\.act-plate \{/);
  assert.match(stylesSource, /\.act-plate-index/);
  assert.match(stylesSource, /min-height: 9\d+svh|min-height: 100svh/);
  // No card shell language.
  assert.doesNotMatch(stylesSource, /box-shadow:\s*0 \d+px \d+px[^;]*rgba\(0, 0, 0, 0\.[3-9]/);
});

check("the aurora is a narrative event with an intensity", () => {
  assert.match(stylesSource, /\.env-aurora \{/);
  const layer = stylesSource.slice(
    stylesSource.indexOf(".env-aurora {"),
    stylesSource.indexOf('body[data-aurora="present"]'),
  );
  assert.match(layer, /opacity: 0;/);
  assert.match(layer, /visibility: hidden;/);
  assert.match(stylesSource, /body\[data-aurora="present"\] \.env-aurora/);
  assert.match(stylesSource, /--aurora-intensity/);
  assert.match(appSource, /core\.auroraStateFor/);
  assert.match(appSource, /dataset\.aurora/);
  // Reduced motion holds the state and drops the movement.
  const reduced = stylesSource.slice(stylesSource.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(reduced, /\.art-aurora-band/);
  assert.match(reduced, /animation: none/);
});

check("the artwork is drawn in the project, not fetched", () => {
  assert.match(artworkSource, /createElementNS/);
  ["actPlate", "auroraRibbons", "instrumentDial", "coreColumn", "fieldContours", "recorderTrace"].forEach(
    (name) => assert.match(artworkSource, new RegExp(`function ${name}`), name),
  );
  // Deterministic: the same seed always draws the same figure.
  assert.match(artworkSource, /function sequence/);
  assert.doesNotMatch(artworkSource, /Math\.random/);
  // No raster assets and no remote fetches anywhere.
  [artworkSource, appSource, resultsSource, stylesSource, indexSource, resultsHtml].forEach((source) => {
    assert.doesNotMatch(source, /\.(png|jpg|jpeg|webp|avif|gif)\b/i, "raster asset");
    assert.doesNotMatch(source, /https?:\/\/(?!www\.w3\.org|localhost)/, "remote reference");
  });
});

check("the debrief is read one chapter at a time, and loses nothing", () => {
  assert.equal(data.results.chapters.length, 6);
  assert.deepEqual(
    data.results.chapters.map((entry) => entry.id),
    ["role", "shift", "currents", "detail", "relations", "close"],
  );
  // Every chapter is still built and put in the page in one pass; paging only
  // decides which one is shown.
  assert.match(resultsSource, /shell\.replaceChildren\(/);
  [
    "buildRoleChapter",
    "buildShiftChapter",
    "buildCurrentsChapter",
    "buildDetailChapter",
    "buildRelationsChapter",
    "buildCloseChapter",
  ].forEach((name) => assert.match(resultsSource, new RegExp(name), name));
  assert.match(resultsSource, /buildPager\(/);
  // A chapter is addressable and steppable with the browser's own controls.
  assert.match(resultsSource, /popstate/);
  assert.match(resultsSource, /"tablist"/);
  assert.match(resultsSource, /"tabpanel"/);
  assert.match(resultsSource, /aria-selected/);
  ["previous", "next", "position"].forEach((key) =>
    assert.ok(data.results.pager[key], `pager ${key}`),
  );
  // Nothing advances on its own.
  assert.doesNotMatch(resultsSource, /setInterval/);
});

check("a role carries its written copy, not only its score", () => {
  const profile = core.scoreProfile(data, answerAll(() => 4));
  profile.roles.forEach((role) => {
    ["missionFunction", "brings", "watchFor", "actionTitle", "action", "reading", "basis"].forEach(
      (key) => {
        assert.equal(typeof role[key], "string", `${role.id} ${key}`);
        assert.ok(role[key].length > 0, `${role.id} ${key} is empty`);
      },
    );
  });
  // The report prints "{actionTitle} — {action}"; neither half may be missing.
  assert.doesNotMatch(
    profile.roles.map((role) => `${role.actionTitle} — ${role.action}`).join(" "),
    /undefined/,
  );
});

check("the export prints the report, not a summary of it", () => {
  // Everything the page writes out must have somewhere to land in the export.
  [
    "missionFunction",
    "brings",
    "watchFor",
    "actionTitle",
    "notATypeStatement",
    "advantage",
    "overextension",
    "reflection",
    "observations",
    "whyTemplates",
    "instruments",
  ].forEach((key) => assert.match(pdfSource, new RegExp(key), `export is missing ${key}`));
  // Overview, contribution, movement, five currents, relationships,
  // observations, guidance.
  assert.match(pdfSource, /profile\.domains\.length \+ 6/);
  assert.match(pdfSource, /drawProfileRolePage/);
  assert.match(pdfSource, /drawProfileObservationPage/);
});

check("an export names itself by watchkeeper and by night", () => {
  const name = pdf.exportName("report", "Ada Lovelace", Date.UTC(2026, 7, 1, 12));
  assert.match(name, /^Aurora_Station_Observation_Report_Ada_Lovelace_\d{4}-\d{2}-\d{2}\.pdf$/);
  const record = pdf.exportName("record", "Ada Lovelace", Date.UTC(2026, 7, 1, 12));
  assert.match(record, /^Aurora_Station_Night_Watch_Log_Ada_Lovelace_\d{4}-\d{2}-\d{2}\.pdf$/);
  // The two exports are never the same file.
  assert.notEqual(name, record);
  // A missing or unsafe name still produces a usable filename.
  assert.match(pdf.exportName("report", "", 0), /^Aurora_Station_Observation_Report_Watchkeeper_/);
  assert.doesNotMatch(pdf.exportName("record", "../../etc/passwd", 0), /[/\\]/);
});

check("both exports carry document metadata", () => {
  assert.match(pdfSource, /\/Title \(/);
  assert.match(pdfSource, /\/Producer/);
  assert.match(pdfSource, /\/Creator/);
  assert.match(pdfSource, /\/Lang \(en-GB\)/);
  assert.match(pdfSource, /\/Info \$\{infoObject\} 0 R/);
});

check("the watch can be restarted without clearing storage by hand", () => {
  assert.match(indexSource, /id="restart"/);
  assert.match(appSource, /restartControl/);
  assert.match(appSource, /core\.clearJourney\(storage\)/);
  // Restarting asks first, and keeps the reading preferences.
  assert.match(appSource, /window\.confirm\(data\.results\.restartConfirm\)/);
  assert.ok(data.results.restartConfirm);
});

check("the reading centres on a wide page instead of hugging one edge", () => {
  const shell = stylesSource.slice(
    stylesSource.indexOf(".report-shell {"),
    stylesSource.indexOf("}", stylesSource.indexOf(".report-shell {")),
  );
  assert.match(shell, /max-width: calc\(var\(--measure-wide\) \+ var\(--gutter\) \* 2\)/);
  assert.match(shell, /margin-inline: auto/);
  // A full-bleed block reaches the display without escaping the page, so
  // nothing has to be clipped to hide it.
  assert.match(
    stylesSource,
    /padding-inline: max\(var\(--gutter\), calc\(\(100% - var\(--measure\)\) \/ 2\)\)/,
  );
  assert.doesNotMatch(stylesSource, /margin-inline: calc\(50% - 50vw\)/);
  assert.doesNotMatch(stylesSource, /overflow-x: hidden/);
  // The column itself is centred, not pushed against one gutter.
  [".passage {", ".observation {", ".completion {"].forEach((selector) => {
    const block = stylesSource.slice(
      stylesSource.indexOf(selector),
      stylesSource.indexOf("}", stylesSource.indexOf(selector)),
    );
    assert.match(block, /margin: [^;]*auto/, selector);
    assert.doesNotMatch(block, /margin-left: var\(--gutter\)/, selector);
  });
  // The pressure phase still tightens, as a share of the measure.
  assert.match(stylesSource, /max-width: calc\(var\(--measure\) \* 0\.86\)/);
  // The report no longer opens on a share of the viewport.
  assert.doesNotMatch(stylesSource, /min-height: 82svh/);
});

check("the five currents carry the five elements", () => {
  const elements = data.assessment.elements;
  const expected = {
    wood: "pathfinder",
    fire: "catalyst",
    earth: "steward",
    metal: "architect",
    water: "sentinel",
  };
  assert.deepEqual(Object.keys(elements).sort(), Object.keys(expected).sort());
  Object.entries(expected).forEach(([elementId, roleId]) => {
    assert.equal(elements[elementId].role, roleId, elementId);
    assert.ok(elements[elementId].keywords, `${elementId} keywords`);
    assert.ok(elements[elementId].shadow, `${elementId} shadow`);
    assert.ok(data.assessment.roles[roleId].element, `${roleId} element`);
  });
  // Every role carries the deck value plus a tone for each ground.
  core.DOMAIN_ORDER.forEach(() => {});
  Object.values(data.assessment.roles).forEach((role) => {
    ["colour", "colourNight", "colourPaper"].forEach((key) => {
      assert.match(role[key], /^#[0-9a-f]{6}$/, `${role.id} ${key}`);
    });
  });
});

check("a trace is legible on the ground it is drawn on", () => {
  // WCAG relative luminance; a meaningful graphic needs 3:1.
  const lin = (v) => {
    const channel = v / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const ratio = (a, b) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  };

  const night = "#05080b";
  const paper = "#e6eaeb";
  Object.values(data.assessment.roles).forEach((role) => {
    assert.ok(
      ratio(role.colourNight, night) >= 3,
      `${role.id} night ${ratio(role.colourNight, night).toFixed(2)}:1`,
    );
    assert.ok(
      ratio(role.colourPaper, paper) >= 3,
      `${role.id} paper ${ratio(role.colourPaper, paper).toFixed(2)}:1`,
    );
  });
  // The five stay distinguishable from one another on each ground.
  const hues = Object.values(data.assessment.roles).map((role) => role.colour);
  assert.equal(new Set(hues).size, 5);
});

check("the relationships read outward from the leading contribution", () => {
  const cycles = data.assessment.cycles;
  assert.equal(cycles.generating.length, 5);
  // Every element feeds one and is fed by one; the ring closes.
  assert.equal(new Set(cycles.generating).size, 5);
  // Every element checks one and is checked by one.
  const targets = Object.values(cycles.controlling);
  assert.equal(new Set(targets).size, 5);
  assert.equal(new Set(Object.keys(cycles.controlling)).size, 5);
  Object.entries(cycles.controlling).forEach(([from, to]) => {
    assert.notEqual(from, to, `${from} checks itself`);
    // Checking reaches across the ring, never to a neighbour on it.
    const at = cycles.generating.indexOf(from);
    const gap = (cycles.generating.indexOf(to) - at + 5) % 5;
    assert.equal(gap, 2, `${from} -> ${to} is not a reach across the ring`);
  });

  // The deck's two worked examples, in Aurora's own names.
  assert.equal(core.relationsFor(data, "architect").checks, "pathfinder");
  assert.equal(core.relationsFor(data, "sentinel").checks, "catalyst");

  data.assessment.roleOrder.forEach((id) => {
    const relations = core.relationsFor(data, id);
    ["supports", "supportedBy", "checks", "checkedBy"].forEach((key) => {
      assert.ok(data.assessment.roles[relations[key]], `${id} ${key}`);
      assert.notEqual(relations[key], id, `${id} ${key} points at itself`);
    });
    // What you feed and what feeds you are never the same contribution.
    assert.notEqual(relations.supports, relations.supportedBy, id);
    assert.notEqual(relations.checks, relations.checkedBy, id);
  });
});

check("the relationships chapter suggests, and never rates", () => {
  const copy = data.results.relationsCopy;
  ["supports", "supportedBy", "checks", "checkedBy"].forEach((key) => {
    assert.ok(copy[key].includes("{role}"), `${key} template`);
  });
  // No pair score, no cohesion figure, no compatibility rating.
  [resultsSource, pdfSource].forEach((source) => {
    assert.doesNotMatch(source, /cohesion/i);
    assert.doesNotMatch(source, /compatib/i);
  });
  const relationCopy = [
    data.results.relationsIntro,
    data.results.relationsNote,
    ...Object.values(copy),
  ].join(" ");
  // These words may appear only where the copy is denying them, the way the
  // report already denies being a diagnosis.
  [...relationCopy.matchAll(/compatib|rating|\bscore|birth|zodiac|astrolog/gi)].forEach((match) => {
    const lead = relationCopy.slice(Math.max(0, match.index - 44), match.index);
    assert.match(lead, /\b(no|not|never|nothing|none)\b/i, `unqualified "${match[0]}"`);
  });
  // The elements are named as a shape, and the derivation is stated.
  assert.match(data.results.relationsNote, /five elements/i);
  assert.match(data.assessment.cycles.note, /date of birth/i);
  // The export carries the same page.
  assert.match(pdfSource, /drawProfileRelationsPage/);
  assert.match(pdfSource, /profile\.domains\.length \+ 6/);
});

check("a chapter index is a numeral, not a padded number", () => {
  data.results.chapters.forEach((chapter) => {
    assert.match(chapter.index, /^[IVX]+$/, `${chapter.id} index`);
  });
  // Zero-padding a Roman numeral produced "0I" and "0V".
  assert.doesNotMatch(resultsSource, /copy\.index\)\.padStart/);
});

check("the follow brings the open question into view, not the passage above it", () => {
  const block = appSource.slice(
    appSource.indexOf("function follow("),
    appSource.indexOf("function settle("),
  );
  assert.match(block, /\.observation:not\(\.is-closed\)/);
  assert.match(block, /anchor\.offsetTop \+ anchor\.offsetHeight/);
  // Still a follow, never a jump to the end of the document.
  assert.match(block, /if \(target <= window\.scrollY\)/);
});

check("a closed act collapses to its record", () => {
  const block = stylesSource.slice(
    stylesSource.indexOf(".observation.is-closed {"),
    stylesSource.indexOf(".completion {"),
  );
  // Nothing hidden may keep holding height.
  assert.match(block, /\.observation-readout,\s*\.observation\.is-closed \.observation-foot \{\s*display: none;/);
  assert.match(block, /\.observation-head \{\s*margin-bottom: 0;/);
});

check("the prelude statement is set like every other statement", () => {
  const block = stylesSource.slice(
    stylesSource.indexOf(".entry-statement {"),
    stylesSource.indexOf(".entry-frame .scale-anchors"),
  );
  assert.match(block, /font-family: var\(--type-display\)/);
  // It has to clear the scale beneath it.
  assert.match(block, /margin: 2rem 0 1\.75rem/);
  // Every display heading is sentence case.
  [...data.prelude.steps, data.completion, data.results].forEach((step) => {
    if (!step.heading) {
      return;
    }
    assert.notEqual(step.heading, step.heading.toUpperCase(), `${step.heading} is shouted`);
  });
});

check("the soundtrack follows the Act being read", () => {
  // The table of tracks, in the owner's terms.
  const expected = [
    ["station-drift", 1, 3],
    ["system-pressure", 4, 6],
    ["the-silence-between", 7, 8],
    ["under-ice-pulse", 9, 11],
    ["under-the-ice", 12, 12],
  ];
  expected.forEach(([key, from, to]) => {
    for (let act = from; act <= to; act += 1) {
      assert.equal(
        audio.trackForAct(act),
        key,
        `Act ${String(act).padStart(2, "0")} should be ${key}`,
      );
    }
  });
  // Every Act is covered exactly once.
  const covered = new Set();
  expected.forEach(([, from, to]) => {
    for (let act = from; act <= to; act += 1) {
      assert.equal(covered.has(act), false, `Act ${act} is covered twice`);
      covered.add(act);
    }
  });
  assert.equal(covered.size, core.ACT_COUNT);

  // It is resolved from the revealed Act, not from the pending question.
  assert.match(appSource, /function revealedAct\(\)/);
  assert.match(appSource, /audio\.sync\(data, state, core, revealedAct\(\)\)/);
  assert.match(audioSource, /function phaseForState\(data, state, core, actNumber\)/);
  // And it is kept in step whenever the stream advances, not only on an answer.
  assert.match(appSource, /syncSound\(\);\s*\n\s*schedule\(\);/);
});

check("the closed prelude is not rendered", () => {
  /*
   * A `display` declaration on the dialog itself beats the user agent's
   * `dialog:not([open]) { display: none }`, so the prelude stayed on screen
   * after it closed and painted over the whole watch. The layout belongs to
   * the open state only.
   */
  assert.doesNotMatch(stylesSource, /^\.entry \{/m);
  assert.match(stylesSource, /^\.entry\[open\] \{/m);
  const block = stylesSource.slice(
    stylesSource.indexOf(".entry[open] {"),
    stylesSource.indexOf("}", stylesSource.indexOf(".entry[open] {")),
  );
  assert.match(block, /display: grid/);
  assert.match(block, /position: fixed/);
  // Nothing else may lay the dialog out unconditionally either.
  const unconditional = stylesSource.match(/^\.entry[^-[\w][^{]*\{[^}]*display:[^}]*\}/gm) || [];
  assert.deepEqual(unconditional, []);
});

check("the prelude is composed like an Act, not as a card", () => {
  const block = stylesSource.slice(
    stylesSource.indexOf(".entry[open] {"),
    stylesSource.indexOf(".entry-index"),
  );
  // Full viewport, no card shell.
  assert.match(block, /inset: 0/);
  assert.match(block, /max-width: none/);
  assert.match(block, /border: 0/);
  // It scrolls rather than clipping, and the actions stay reachable.
  assert.match(block, /overflow-y: auto/);
  const foot = stylesSource.slice(
    stylesSource.indexOf(".entry-foot {"),
    stylesSource.indexOf("}", stylesSource.indexOf(".entry-foot {")),
  );
  assert.match(foot, /position: sticky/);
  // Drawn ground and an oversized index, from the same artwork system.
  assert.match(appSource, /art\.preludeGround\(\)/);
  assert.match(artworkSource, /function preludeGround\(\)/);
  assert.match(stylesSource, /\.entry-index/);
});

check("the phone controls are reachable and the bar carries the reading", () => {
  const phone = stylesSource.slice(stylesSource.indexOf("@media (max-width: 40rem)"));
  // The control sits at the foot of the screen, not in the far corner.
  assert.match(phone, /\.control-menu \{[^}]*position: fixed/);
  assert.match(phone, /bottom: max\(var\(--gutter\), 1rem\)/);
  // The panel opens upward from it, so it cannot leave the screen either.
  assert.match(phone, /\.controls-panel \{[^}]*position: fixed/);
  // The ticks say the number a second time, so the phone drops them.
  assert.match(phone, /\.sequence-ticks \{\s*display: none;/);
  // A blur on the bar would make it a containing block and trap the button.
  const masthead = stylesSource.slice(
    stylesSource.indexOf(".masthead {"),
    stylesSource.indexOf(".masthead-identity"),
  );
  assert.doesNotMatch(masthead, /^\s*backdrop-filter/m);
  // The button keeps a name once its label is only a glyph.
  assert.match(indexSource, /id="controls-toggle"[\s\S]*?aria-label="Station controls"/);
});

check("the export finds its chapters by name, not by position", () => {
  /*
   * Inserting the relations chapter shifted every index after it, and the
   * closing page went on printing the heading that had moved into slot four.
   * Nothing in the export may address a chapter by its position again.
   */
  assert.doesNotMatch(pdfSource, /results\.chapters\[\d+\]/);
  ["role", "close", "relations"].forEach((id) => {
    assert.match(
      pdfSource,
      new RegExp(`chapters\\.find\\(\\(entry\\) => entry\\.id === "${id}"\\)`),
      `${id} is not looked up by id`,
    );
  });
});

check("the export draws the figures the report opens with", () => {
  // A dial on the contribution page, and the cycle on the relations page.
  assert.match(pdfSource, /function drawInstrumentDial\(/);
  assert.match(pdfSource, /drawInstrumentDial\(\s*context/);
  assert.match(pdfSource, /function drawElementCycle\(/);
  // The movement page carries one rule per contribution with its travel drawn,
  // rather than three stacked rules to compare by eye.
  const phasePage = pdfSource.slice(
    pdfSource.indexOf("function drawProfilePhasePage("),
    pdfSource.indexOf("function drawProfileDomainPage("),
  );
  assert.match(phasePage, /One rule per contribution/);
  assert.doesNotMatch(phasePage, /drawScoreTrack/);
});

check("the reading highlight follows the pointer and nothing else", () => {
  // No renderer-applied class, and no scroll-driven marking.
  assert.doesNotMatch(appSource, /is-marked|markNearestInView|markTimer/);
  assert.doesNotMatch(stylesSource, /is-marked|passage-mark/);
  // A hover state, on pointer devices only.
  assert.match(stylesSource, /@media \(hover: hover\) and \(pointer: fine\)/);
  const opened = stylesSource.indexOf("@media (hover: hover) and (pointer: fine)");
  // To the media query's own closing brace, not a fixed number of characters.
  const block = stylesSource.slice(opened, stylesSource.indexOf("\n}", opened));
  assert.match(block, /\.passage:hover \{\s*background-color:/);
  // Background only: the highlight may never set a text colour.
  assert.doesNotMatch(block, /^\s*color:/m);
});

check("every prelude step fits the screen it is read on", () => {
  // The oversized index is set behind the opening rather than above it.
  const index = stylesSource.slice(
    stylesSource.indexOf(".entry-index"),
    stylesSource.indexOf("}", stylesSource.indexOf(".entry-index")),
  );
  assert.match(index, /position: absolute/);
  // The guidance is three lines now, not five.
  const orientation = data.prelude.steps.find((step) => step.id === "orientation");
  assert.ok(orientation.guidance.length <= 3, `${orientation.guidance.length} guidance lines`);
  // The standing limitation is a note, not a statement.
  const disclaimer = stylesSource.slice(
    stylesSource.indexOf(".entry-disclaimer"),
    stylesSource.indexOf("}", stylesSource.indexOf(".entry-disclaimer")),
  );
  assert.match(disclaimer, /font-size: var\(--step-note\)/);
});

check("hiding an element actually hides it", () => {
  // A display rule on .scale-anchors used to beat the user agent's [hidden],
  // leaving the scale's two anchors on screen with no cells between them.
  assert.match(stylesSource, /\[hidden\] \{\s*display: none !important;\s*\}/);
});

check("the aurora ends as light does, not at a box edge", () => {
  const block = stylesSource.slice(
    stylesSource.indexOf(".env-aurora {"),
    stylesSource.indexOf("body[data-aurora=\"present\"]"),
  );
  assert.match(block, /mask-image/);
  assert.match(block, /-webkit-mask-image/);
});

check("the report carries every required piece of the record", () => {
  const labels = data.results.labels;
  ["missionFunction", "brings", "watchFor", "action", "why", "basis", "advantage", "overextension", "reflection"].forEach(
    (key) => assert.ok(labels[key], `label ${key}`),
  );
  assert.match(data.results.notATypeStatement, /not a fixed personality type/i);
  assert.ok(data.results.disclaimer);

  // Role copy for all five contributions.
  data.assessment.roleOrder.forEach((id) => {
    const role = data.assessment.roles[id];
    ["missionFunction", "brings", "watchFor", "actionTitle", "action"].forEach((key) =>
      assert.ok(role[key], `${id} ${key}`),
    );
  });

  // Advantage, overextension and reflection for every band of every current.
  core.DOMAIN_ORDER.forEach((code) => {
    const guidance = data.assessment.domains[code].guidance;
    ["higher", "balanced", "lower"].forEach((band) => {
      ["advantage", "overextension", "reflection"].forEach((key) => {
        assert.ok(guidance[band][key], `${code} ${band} ${key}`);
      });
    });
    assert.ok(data.assessment.instruments[code].name, `${code} instrument`);
  });
});

check("no scoring mechanics are exposed anywhere in the experience", () => {
  const surfaces = [resultsSource, appSource, indexSource, resultsHtml, pdfSource];
  surfaces.forEach((source) => {
    assert.doesNotMatch(source, /0\.60 \*|0\.25 \*|0\.15 \*/, "weights");
    assert.doesNotMatch(source, /profileSuitability\s*[:=]\s*[^;]*0\./, "suitability formula");
  });
  // The report reads meaning, never mechanism.
  assert.doesNotMatch(resultsSource, /facetFloorLabel|suitabilityLabel/);
  const copy = JSON.stringify(data.results);
  assert.doesNotMatch(copy, /facet floor/i);
  assert.doesNotMatch(copy, /profile suitability/i);
  assert.doesNotMatch(copy, /0\.60|0\.25 \*|weight/i);
});

check("the movement instrument keeps fixed axes and a fixed scale", () => {
  const radar = data.results.radar;
  assert.deepEqual(
    radar.states.map((state) => state.phase),
    ["baseline", "pressure", "recovery"],
  );
  assert.equal(data.assessment.suitability.stableChange, 0.25);
  assert.match(resultsSource, /const order = data\.assessment\.roleOrder/);
  assert.doesNotMatch(resultsSource, /order\.sort\(|\.sort\(\)/);
  assert.doesNotMatch(resultsSource, /rotate/);
  assert.match(resultsSource, /\[2, 3, 4, 5\]\.forEach/);
  // Only the radius travels, so a vertex stays on its own spoke.
  assert.match(resultsSource, /value \+ \(target\[index\] - value\) \* eased/);
  assert.match(resultsSource, /plot-ghost/);
  assert.match(resultsSource, /stillMotion\(\)/);
  assert.match(resultsSource, /reading-tip/);
  assert.doesNotMatch(JSON.stringify(radar), /%|percent/i);
});

check("the report copy stays neutral and non-diagnostic", () => {
  const copy = JSON.stringify(data.results) + JSON.stringify(data.assessment.roles);
  [
    /\bbest role\b/i,
    /\bwinner\b/i,
    /\byou are a\b/i,
    /\bstrengths? and weakness/i,
    /\bpercentile\b/i,
  ].forEach((pattern) => assert.doesNotMatch(copy, pattern, String(pattern)));

  // "Diagnosis" and "personality type" may appear only where they are denied.
  [/.{0,24}diagnos/gi, /.{0,24}personality type/gi].forEach((pattern) => {
    [...copy.matchAll(pattern)].forEach((match) => {
      assert.match(match[0], /\bnot\b[^.]*$/i, `unqualified claim: ${match[0]}`);
    });
  });
  assert.match(data.results.disclaimer, /not a diagnosis/i);
  assert.match(data.results.notATypeStatement, /not a fixed personality type/i);
});

check("the report recalculates and refuses an incomplete watch", () => {
  assert.match(resultsSource, /core\.scoreProfile\(data, state\)/);
  assert.match(resultsSource, /window\.location\.replace\("\.\/index\.html"\)/);
  assert.doesNotMatch(resultsSource, /location\.search/);
  assert.doesNotMatch(resultsSource, /URLSearchParams/);
  assert.match(resultsSource, /restartConfirm/);
  assert.match(resultsSource, /core\.clearJourney/);
});

check("progress reads as an observation sequence, not a percentage", () => {
  assert.match(appSource, /function updateSequence/);
  assert.match(appSource, /sequence-tick/);
  assert.doesNotMatch(appSource, /scaleX\(|percent|%`/);
  assert.ok(data.observation.label);
  assert.ok(data.observation.unitLabel);
  assert.match(stylesSource, /\.sequence-tick/);
});

check("readings are shown out of five on both surfaces", () => {
  assert.match(resultsSource, /\$\{reading\(value\)\} \/ \$\{core\.MAX_RESPONSE\}/);
  assert.match(pdfSource, /role\.score\.toFixed\(1\)\} \/ \$\{profile\.scaleMax\}/);
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
