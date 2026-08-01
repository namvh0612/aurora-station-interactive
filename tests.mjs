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
  assert.match(data.assessment.phaseNote, /not official BFI-2 scores/i);
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

check("the aurora is off everywhere except its own act", () => {
  assert.equal(data.story.auroraAct, 9);
  const complete = answerFirst(60);
  const nodes = core.buildNodes(data, complete);
  const states = new Map();
  for (let revealed = 0; revealed <= nodes.length; revealed += 1) {
    const value = core.auroraStateFor(data, complete, nodes, revealed);
    if (!states.has(value)) {
      states.set(value, []);
    }
    states.get(value).push(revealed);
  }

  assert.deepEqual([...states.keys()].sort(), ["burst", "fading", "off"]);

  const actAt = (revealed) => {
    let act = 0;
    for (let index = 0; index < revealed; index += 1) {
      if (nodes[index].actNumber) {
        act = nodes[index].actNumber;
      }
    }
    return act;
  };

  states.get("burst").forEach((revealed) => {
    assert.equal(actAt(revealed), 9, `burst outside act 9 at ${revealed}`);
  });
  states.get("fading").forEach((revealed) => {
    assert.equal(actAt(revealed), 9, `fading outside act 9 at ${revealed}`);
  });
  // The fade comes after the burst and the sky is dark again by the rescue.
  assert.ok(Math.min(...states.get("fading")) > Math.max(...states.get("burst")));
  assert.equal(core.auroraStateFor(data, complete, nodes, nodes.length), "off");
});

check("the aurora is off through the prelude and an unstarted watch", () => {
  assert.equal(core.auroraStateFor(data, core.emptyState(), null, 0), "off");
  assert.equal(core.auroraStateFor(data, answerFirst(0), null, 0), "off");
  assert.equal(core.auroraStateFor(data, answerFirst(20), null, 200), "off");
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

check("exactly two font families are used, and no monospace", () => {
  assert.match(stylesSource, /--font-serif:/);
  assert.match(stylesSource, /--font-sans:/);
  // No third family, and nothing falls back to a monospace stack.
  [stylesSource, pdfSource].forEach((source) => {
    assert.doesNotMatch(source, /monospace/i, "monospace stack");
    assert.doesNotMatch(source, /ui-monospace|Courier|Cascadia|IBM Plex Mono|SF Mono/i);
  });
  const families = [...stylesSource.matchAll(/font-family:\s*([^;]+);/g)].map((match) =>
    match[1].trim(),
  );
  assert.ok(families.length > 0);
  families.forEach((value) => {
    assert.ok(
      /var\(--font-serif\)|var\(--font-sans\)/.test(value),
      `unexpected font-family: ${value}`,
    );
  });
});

check("the typography scale matches the specified hierarchy", () => {
  assert.match(stylesSource, /--text-hero: clamp\(2\.5rem, 6vw, 5rem\)/);
  assert.match(stylesSource, /--text-act: clamp\(2rem, 4vw, 3\.5rem\)/);
  assert.match(stylesSource, /--text-section: clamp\(1\.5rem, 3vw, 2\.25rem\)/);
  assert.match(stylesSource, /--text-body: clamp\(/);
  assert.match(stylesSource, /--text-ui: clamp\(/);
  assert.match(stylesSource, /--text-meta: clamp\(/);
  // Metadata is the sans in uppercase with tracking and tabular numerals.
  const metaBlock = stylesSource.slice(
    stylesSource.indexOf(".meta {"),
    stylesSource.indexOf(".numeric {"),
  );
  assert.match(metaBlock, /font-family: var\(--font-sans\)/);
  assert.match(metaBlock, /text-transform: uppercase/);
  assert.match(metaBlock, /letter-spacing: var\(--tracking-meta\)/);
  assert.match(metaBlock, /font-variant-numeric: tabular-nums/);
});

check("the stylesheet honours the layout and accessibility rules", () => {
  assert.match(stylesSource, /--page-max: 1180px/);
  // Narrative measure sits in the 720-820px band.
  const measure = Number(stylesSource.match(/--measure: (\d+)px/)[1]);
  assert.ok(measure >= 720 && measure <= 820, `measure is ${measure}px`);
  assert.match(stylesSource, /--tap: 3rem/);
  assert.match(stylesSource, /:focus-visible/);
  assert.match(stylesSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(stylesSource, /@media \(prefers-contrast: more\)/);
  assert.match(stylesSource, /\.skip-link/);
  // Bars use one colour per domain or role, never a red-to-green gradient.
  assert.match(stylesSource, /background: var\(--domain-colour, var\(--dawn-ink\)\)/);
  assert.match(stylesSource, /background: var\(--role-colour, var\(--dawn-ink\)\)/);
  assert.doesNotMatch(stylesSource, /linear-gradient\([^)]*red[^)]*green/i);
});

check("the aurora is a state, not a permanent background", () => {
  assert.match(stylesSource, /\.sky-ribbon \{/);
  // Hidden by default; only the burst and fade states reveal it.
  const ribbon = stylesSource.slice(
    stylesSource.indexOf(".sky-ribbon {"),
    stylesSource.indexOf(".sky-ribbon::before"),
  );
  assert.match(ribbon, /opacity: 0;/);
  assert.match(ribbon, /visibility: hidden;/);
  assert.match(stylesSource, /body\[data-aurora="burst"\] \.sky-ribbon/);
  assert.match(stylesSource, /body\[data-aurora="fading"\] \.sky-ribbon/);
  assert.doesNotMatch(stylesSource, /aurora-surge-active|aurora-rescue/);
  // Reduced motion swaps movement for opacity rather than removing the state.
  const reduced = stylesSource.slice(
    stylesSource.indexOf("@media (prefers-reduced-motion: reduce)"),
  );
  assert.match(reduced, /\.sky-ribbon \{\s*transition: opacity/);
  assert.match(appSource, /data-aurora|dataset\.aurora/);
  assert.match(appSource, /core\.auroraStateFor/);
});

check("the results page offers six navigable views", () => {
  assert.equal(data.results.views.length, 6);
  assert.deepEqual(
    data.results.views.map((view) => view.id),
    ["complete", "roles", "pressure", "recovery", "detail", "summary"],
  );
  data.results.views.forEach((view) => {
    assert.ok(view.hash, `${view.id} hash`);
    assert.ok(view.label, `${view.id} label`);
    assert.ok(view.shortLabel, `${view.id} short label`);
  });
  assert.match(resultsSource, /function showView/);
  assert.match(resultsSource, /ArrowLeft/);
  assert.match(resultsSource, /ArrowRight/);
  assert.match(resultsSource, /popstate/);
  assert.match(resultsSource, /touchstart/);
  assert.match(resultsSource, /pageLabelTemplate/);
  assert.match(resultsSource, /results-dot/);
  // Navigation is never automatic.
  assert.doesNotMatch(resultsSource, /setInterval/);
  // Transition sits in the 220-300ms band and drops out under reduced motion.
  const duration = Number(stylesSource.match(/--transition-view: (\d+)ms/)[1]);
  assert.ok(duration >= 220 && duration <= 300, `transition is ${duration}ms`);
  assert.match(stylesSource.slice(stylesSource.indexOf("@media (prefers-reduced-motion")), /\.results-view \{?[\s\S]{0,80}animation: none/);
});

check("the radar offers three states on a fixed scale with fixed axes", () => {
  const radar = data.results.radar;
  assert.deepEqual(
    radar.states.map((state) => state.label),
    ["Starting", "Under Pressure", "After Pressure"],
  );
  assert.deepEqual(
    radar.states.map((state) => state.phase),
    ["baseline", "pressure", "recovery"],
  );
  assert.equal(data.assessment.suitability.stableChange, 0.25);

  // Fixed positions: the axis order comes straight from the role order and is
  // never sorted or rotated at render time.
  assert.match(resultsSource, /const order = data\.assessment\.roleOrder/);
  assert.doesNotMatch(resultsSource, /order\.slice\(\)\.sort|order\.sort\(/);
  assert.doesNotMatch(resultsSource, /rotate/);

  // Rings are whole scale points, so the chart cannot imply a zero origin.
  assert.match(resultsSource, /\[2, 3, 4, 5\]\.forEach/);
  assert.match(resultsSource, /core\.MIN_RESPONSE\) \/ \(core\.MAX_RESPONSE - core\.MIN_RESPONSE\)/);

  // Only the radius is interpolated, so a vertex can only move along its axis.
  assert.match(resultsSource, /value \+ \(target\[index\] - value\) \* eased/);
  assert.match(resultsSource, /radar-ghost/);
  assert.match(resultsSource, /prefersReducedMotion\(\)/);
  assert.match(resultsSource, /radar-tooltip/);
  assert.match(resultsSource, /radar-table/);
  assert.match(resultsSource, /stableLabel/);
  // No percentages anywhere in the radar copy.
  assert.doesNotMatch(JSON.stringify(radar), /%|percent/i);
  assert.match(radar.note, /does not show your personality changing/i);
});

check("the results copy stays neutral and non-diagnostic", () => {
  const copy = JSON.stringify(data.results);
  [
    /\bbest role\b/i,
    /\bwinner\b/i,
    /\byou are a\b/i,
    /\bpersonality type\b/i,
    /\bstrengths? and weakness/i,
    /\bpercentile\b/i,
  ].forEach((pattern) => assert.doesNotMatch(copy, pattern, String(pattern)));

  // "Diagnosis" may appear only where the copy is denying one.
  [...copy.matchAll(/.{0,24}diagnos/gi)].forEach((match) => {
    assert.match(match[0], /\bnot\b[^.]*$/i, `unqualified diagnostic claim: ${match[0]}`);
  });
  assert.match(
    data.results.views.find((view) => view.id === "complete").disclaimer,
    /not a diagnosis/i,
  );
  // Conditional voice, not verdicts.
  const pressure = data.results.views.find((view) => view.id === "pressure");
  assert.match(pressure.shiftLeadIn, /your responses suggest/i);
  assert.match(pressure.stableCopy, /suggests/i);
});

check("the results page recalculates and refuses incomplete journeys", () => {
  assert.match(resultsSource, /core\.scoreProfile\(data, state\)/);
  assert.match(resultsSource, /window\.location\.replace\("\.\/index\.html"\)/);
  // Nothing about the reader goes in the URL.
  assert.doesNotMatch(resultsSource, /location\.search/);
  assert.doesNotMatch(resultsSource, /URLSearchParams/);
  assert.match(resultsSource, /outOfFive/);
  assert.match(resultsSource, /restartConfirm/);
  assert.match(resultsSource, /core\.clearJourney/);
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
