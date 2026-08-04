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
    data.assessment.spectra.note,
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
    const words = item.statement.trim().split(/\s+/).length;
    assert.ok(words <= 16, `${item.id} runs to ${words} words`);
    // The stem is first person, so a pronoun for the reader is too. Item 35's
    // "their" belongs to the patterns, not to the reader, so it is exempt.
    if (item.bfiItem !== 35) {
      assert.doesNotMatch(
        item.statement,
        /\b(they|their|them|themselves)\b/i,
        `${item.id} speaks about the reader in the third person`,
      );
    }
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
  assert.equal(core.bandForScore(data, 2.5).id, "situational");
  assert.equal(core.bandForScore(data, 3.49).id, "situational");
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


check("every current reads its own domain directly, Water included", () => {
  /*
   * Water was reported as 6 - Negative Emotionality under the name Emotional
   * Stability, so the same measurement pointed one way in the domain chapter
   * and the other way on the instrument, with nothing on the page connecting
   * them. Both ends of the Water line are named instead, and nothing inverts.
   */
  const profile = core.scoreProfile(
    data,
    answerAll((index, item) =>
      item.domain === "negativeEmotionality" ? (item.reverse ? 1 : 5) : 3,
    ),
  );
  const domains = Object.fromEntries(
    profile.domains.map((domain) => [domain.code, domain.score]),
  );
  assert.equal(domains.negativeEmotionality, 5);

  profile.currents.forEach((current) => {
    assert.equal(
      current.score,
      domains[current.domain],
      `${current.name} does not read ${current.domain} directly`,
    );
  });
  const water = profile.currents.find((current) => current.id === "water");
  assert.equal(water.score, 5);
  assert.equal(water.pole.name, water.poles.high.name, "high Water is not the far pole");

  /*
   * The table that carried the inversion is gone outright, along with the
   * weighting that picked a winner out of the five. Nothing sits between the
   * element and the domain any more, so nothing can rename a reading on its
   * way to the page.
   */
  assert.equal(data.assessment.roles, undefined, "the role table is still in the data");
  assert.equal(data.assessment.suitability, undefined, "the suitability weighting survives");
  ["roleScoreFor", "scoreSuitability", "leadingRoles", "recommendRole"].forEach((name) => {
    assert.equal(typeof core[name], "undefined", `core still exports ${name}`);
  });
  const retiredKey = ["r", "o", "l", "e", "s"].join("");
  assert.equal(retiredKey in profile, false, "the profile still carries a role list");
  profile.phases.forEach((phase) => {
    assert.ok(Array.isArray(phase.currents), `${phase.id} has no currents`);
    assert.equal(retiredKey in phase, false, `${phase.id} still carries a role list`);
  });
});

check("no surface still reaches for a list of roles", () => {
  /*
   * Blunt on purpose. The two checks that resolve content paths and summary
   * keys cannot see a read off an object the renderer built itself, and that
   * is exactly how `stateAt.roles` survived the conversion inside the movement
   * instrument — the array was renamed at the point it was built and one of
   * the four reads was left behind, which silently blanked the chart.
   *
   * Nothing in this design has roles, so the word appearing as a property or a
   * binding is the defect itself, whatever the surrounding code looks like.
   * The ARIA attribute is the one legitimate use and is written as a string.
   */
  const retired = new RegExp(`[.\\w]${["r", "o", "l", "e", "s"].join("")}\\b`);
  [
    ["core.js", coreSource],
    ["results.js", resultsSource],
    ["pdf-export.js", pdfSource],
    ["app.js", appSource],
  ].forEach(([file, source]) => {
    const stripped = source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
    assert.doesNotMatch(stripped, retired, `${file} still names a list of roles`);
  });
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
  const metal = (phase) =>
    phase.currents.find((role) => role.id === "metal").score;
  assert.equal(metal(profile.phases[0]), 3, "baseline untouched");
  assert.equal(metal(profile.phases[1]), 5, "pressure raised");
  assert.equal(metal(profile.phases[2]), 3, "recovery untouched");
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
  const comparison = core.compareCurrents(data, profile.phases[0], profile.phases[1]);
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
    /*
     * The summary no longer nominates a leading current. It describes what the
     * night did to the five, and nothing about it ranks them.
     */
    assert.equal("overall" in summary, false, "the summary still names a lead");
    const words = summary.adaptation.trim().split(/\s+/).length;
    assert.ok(words >= 40 && words <= 110, `adaptation is ${words} words`);
    assert.doesNotMatch(summary.adaptation, /\byour type\b/i);
    assert.doesNotMatch(summary.adaptation, /\bstrength|weakness\b/i);
    assert.doesNotMatch(summary.adaptation, /\bsuccessful|unsuccessful\b/i);
    assert.doesNotMatch(summary.adaptation, /\bshould\b/i);
    assert.ok(summary.reflection.endsWith("?"), "reflection is a question");
  });
});

check("the pressure observation names which way the contribution moved", () => {
  /*
   * The shifts are sorted by size and the sign was thrown away, so the largest
   * mover was always described as having "became more visible" — including
   * when it had fallen. Across three thousand simulated watches, half of them
   * had a fall at the top of that list, so half of all reports asserted the
   * opposite of the reader's own responses. `compareCurrents` had been computing
   * the direction all along and the summary never read it.
   */
  const swing = (early, late) =>
    answerAll((index, item) => {
      if (item.domain !== "agreeableness") {
        return 3;
      }
      const want = item.contextPhase === "baseline" ? early : item.contextPhase === "pressure" ? late : 3;
      return item.reverse ? 6 - want : want;
    });

  // 4 -> 5 and 5 -> 4 move without passing the middle, so they are described
  // as movement along the line rather than as a change of end.
  const fell = core.scoreProfile(data, swing(5, 4));
  const rose = core.scoreProfile(data, swing(4, 5));
  const reading = (profile) => {
    const phase = (id) => profile.phases.find((entry) => entry.id === id);
    const steward = (id) => phase(id).currents.find((role) => role.id === "earth").score;
    return steward("pressure") - steward("baseline");
  };

  assert.ok(reading(fell) < 0, "the probe did not make the Steward fall");
  assert.ok(reading(rose) > 0, "the probe did not make the Steward rise");

  const fallText = core.summariseProfile(data, fell).adaptation;
  const riseText = core.summariseProfile(data, rose).adaptation;
  assert.match(fallText, /receded/, "a contribution that fell is described as rising");
  assert.doesNotMatch(fallText, /became more visible/);
  assert.match(riseText, /became more visible/, "a contribution that rose is described as falling");
  assert.doesNotMatch(riseText, /receded/);

  // Both name the two stretches being compared, so the sentence cannot be read
  // against whichever tab of the instrument happens to be open above it.
  [fallText, riseText].forEach((text) => assert.match(text, /routine stretch against the worst/));

  /*
   * A reading that passes the middle of the scale changes which end of the line
   * describes the reader, which is a stronger finding than a distance and is
   * reported as one.
   */
  const crossed = core.summariseProfile(data, core.scoreProfile(data, swing(5, 1))).adaptation;
  assert.match(crossed, /changed ends/, "a crossing is reported as a distance");
  assert.match(crossed, /The Cropland/);
  assert.match(crossed, /The Rampart/);
  assert.doesNotMatch(crossed, /receded|became more visible/);
});

/* ---------------------------------------------------------- aurora state */

check("the aurora enters at its act and deepens to the end of the watch", () => {
  /*
   * The environment follows the number of recorded observations. Because the
   * story never runs past the next unanswered question, the reader cannot get
   * ahead of their own answers, so the count is a true reading of how far into
   * the night they are.
   */
  assert.equal(data.story.auroraAct, 9);

  let peak = 0;
  let sawPresent = false;
  for (let answered = 0; answered <= 60; answered += 1) {
    const aurora = core.auroraStateFor(data, answerFirst(answered));
    const act = Math.min(12, Math.floor(answered / 5) + 1);
    const closed = answered === 60;

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
  assert.deepEqual(core.auroraStateFor(data, answerFirst(60)), { state: "off", intensity: 0 });
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
  core.savePreferences({ soundEnabled: false }, storage);

  assert.equal(core.answeredCount(core.loadState(data, storage)), 12);
  core.clearJourney(storage);
  assert.equal(core.answeredCount(core.loadState(data, storage)), 0);
  assert.equal(core.loadState(data, storage).participant.name, "");
  assert.deepEqual(core.loadPreferences(storage), { soundEnabled: false });
});

check("there is no reading pace to set, and nothing to pause", () => {
  /*
   * Reading is scroll-driven. Nothing advances on a timer, so there is no
   * speed, no pause and no reveal — and no preference for any of them. Sound
   * is the only thing left to remember.
   */
  assert.deepEqual(core.defaultPreferences(), { soundEnabled: true });
  assert.deepEqual(core.sanitisePreferences({ textSpeed: "fast", scrollMode: "manual" }), {
    soundEnabled: true,
  });
  ["revealDelay", "actClosePause", "wordCount"].forEach((name) => {
    assert.equal(core[name], undefined, `core still exports ${name}`);
  });
  [coreSource, appSource].forEach((source) => {
    assert.doesNotMatch(source, /TEXT_SPEEDS|ACT_CLOSE_PAUSE|textSpeed|scrollMode/);
  });
  assert.doesNotMatch(appSource, /setTimeout\([^)]*revealOne|revealTimer/);
  // The controls that steered it are gone from the page.
  ["pace-toggle", "pace-now", "pace-control", "scroll-control", "new-passage"].forEach((id) => {
    assert.doesNotMatch(indexSource, new RegExp(`id="${id}"`), `${id} is still in the page`);
  });
});

check("the story runs to the next question and stops there", () => {
  // The stream itself already gates on an unanswered question; the renderer
  // simply extends to that gate rather than trickling toward it.
  assert.match(appSource, /function extend\(\)/);
  assert.match(appSource, /while \(!idle\(\)\)/);
  assert.doesNotMatch(appSource, /function revealOne\(/);

  const nodes = core.buildNodes(data, answerFirst(3));
  const last = nodes.at(-1);
  assert.equal(last.type, "question");
  assert.equal(last.answered, false);
  // Nothing beyond the gate is in the stream at all, so nothing can be read
  // ahead of the reader's own answers.
  assert.equal(nodes.filter((node) => node.type === "question" && !node.answered).length, 1);
});

check("the page never moves itself", () => {
  // No follow, no scroll target, no indicator that something was missed.
  assert.doesNotMatch(appSource, /function follow\(|function settle\(|nearBottom|markScrolling/);
  // The only scroll the page performs is returning the reader to where they
  // left off, once, on load.
  const scrolls = appSource.match(/window\.scrollTo\([^)]*\)/g) || [];
  assert.equal(scrolls.length, 1, `page scrolls itself ${scrolls.length} times`);
  assert.match(scrolls[0], /top: state\.scrollY/);
  // Legibility is what changes, and it is opacity alone.
  assert.match(appSource, /function focusByScroll\(/);
  assert.match(appSource, /--read/);
  assert.match(stylesSource, /opacity: var\(--read, 1\)/);
  assert.doesNotMatch(stylesSource, /filter: blur\([^)]*\);\s*\n\s*}\s*\n\s*\.passage/);
  // Reached by keyboard is still readable — checked where it is decided.
  assert.match(appSource, /if \(focused && block\.contains\(focused\)\)/);
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

/*
 * The night is one continuous clock from 21:58 to 05:20. The spine of the
 * telling — an act's opening, each convergence, its closing — may only ever
 * move forward. A context is allowed to look back, because remembering the
 * colour of the sky four hours ago is not the same as the story going there.
 */
check("the night's clock only ever moves forward", () => {
  const SPINE = new Set(["body", "convergence", "closing"]);
  // The watch runs past midnight, so anything before noon belongs to the next day.
  const minutes = (stamp) => {
    const [hour, minute] = stamp.split(":").map(Number);
    return (hour < 12 ? hour + 24 : hour) * 60 + minute;
  };
  let previous = 0;
  let last = "start";
  core.buildNodes(data, answerAll((index) => ((index * 7) % 5) + 1)).forEach((node) => {
    if (!SPINE.has(node.type) || !node.text) {
      return;
    }
    (node.text.match(/\b[0-2]\d:[0-5]\d\b/g) || []).forEach((stamp) => {
      assert.ok(
        minutes(stamp) >= previous,
        `the clock runs backwards: ${last} then ${stamp} in "${node.text.slice(0, 60)}"`,
      );
      previous = minutes(stamp);
      last = stamp;
    });
  });
  // And every act's own window has to contain the stamps printed inside it.
  data.story.acts.forEach((act) => {
    const [from, to] = act.time.split(/[–-]/).map((edge) => minutes(edge.trim()));
    const inside = [act.opening, act.closing]
      .concat(act.items.map((item) => item.convergence))
      .join(" ")
      .match(/\b[0-2]\d:[0-5]\d\b/g) || [];
    inside.forEach((stamp) => {
      assert.ok(
        minutes(stamp) >= from && minutes(stamp) <= to,
        `Act ${act.number} is stamped ${act.time} but prints ${stamp}`,
      );
    });
  });
});

check("no act asks for more time than it has", () => {
  /*
   * An act is a bounded scene, and its prose has to fit inside it. Act 12 runs
   * fifty-two minutes and described four hours in the cooling room, a log
   * losing its last two hours, and two half-hourly marks missed out of the two
   * it contains — while also saying most of them went in.
   *
   * Three kinds of "hours" are not elapsed time in the scene and are exempt:
   * the past, a running total carried into it, and what a reserve can buy.
   */
  const spelled = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
    seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, "twenty-two": 22,
  };
  const notElapsed = /hours? (old|ago)|awake for [\w-]+ hours|[\w-]+ hours awake|hours above freezing/i;
  const minutes = (stamp) => {
    const [hour, minute] = stamp.split(":").map(Number);
    return (hour < 12 ? hour + 24 : hour) * 60 + minute;
  };
  data.story.acts.forEach((act) => {
    const [from, to] = act.time.split(/[–-]/).map((edge) => minutes(edge.trim()));
    const span = to - from;
    const text = [act.opening, act.closing]
      .concat(act.items.flatMap((item) => [
        item.context,
        item.convergence,
        ...Object.values(item.narrative || {}),
      ]))
      .filter(Boolean)
      .join("  ");
    [...text.matchAll(/\b([\w-]+)\s+hours?\b/gi)].forEach((match) => {
      const claimed = spelled[match[1].toLowerCase()]
        ?? (/^\d+$/.test(match[1]) ? Number(match[1]) : null);
      if (claimed === null) {
        return;
      }
      const around = text.slice(Math.max(0, match.index - 24), match.index + match[0].length + 20);
      if (notElapsed.test(around)) {
        return;
      }
      assert.ok(
        claimed * 60 <= span,
        `Act ${act.number} runs ${span} minutes but spends "${match[0]}"`,
      );
    });
  });
});

check("the story counts what it says it counts", () => {
  /*
   * The unfinished handover line is quoted in full and also counted in prose.
   * The count was six for a line that has four words in it, which is the kind
   * of thing a reader checks and the author never re-reads.
   */
  const marker = "SECTOR C INTERMITTENT — MONITOR";
  const words = marker.split(/[\s—]+/).filter(Boolean).length;
  const spelled = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const prose = JSON.stringify(data.story);
  assert.ok(prose.includes(marker), "the handover line is no longer quoted");
  [...prose.matchAll(/\b([a-z]+) (?:unfinished )?words\b/g)].forEach((match) => {
    const claimed = spelled.indexOf(match[1]);
    if (claimed >= 0) {
      assert.equal(claimed, words, `the line has ${words} words but is called ${match[1]}`);
    }
  });
});

check("the crew on the page matches the crew in the station", () => {
  /*
   * Mira hands over and drives out at 22:02, and is recalled during Act 3 —
   * she is back on the pad as the generator trips. Before that the station
   * holds two people; after it, three. Five act openings used to have her
   * acting in a room she had left, and Act 4 managed to contradict itself.
   */
  const recall = data.story.acts.find((act) => act.number === 3);
  assert.match(`${recall.opening} ${recall.closing}`, /Mira/);
  assert.match(recall.closing, /comes back onto the pad/);

  const headcount = /two of you|two people remain|the two of us/i;
  data.story.acts.forEach((act) => {
    const text = [act.opening, act.closing]
      .concat(act.items.flatMap((item) => [item.context, item.convergence, ...Object.values(item.narrative || {})]))
      .filter(Boolean)
      .join(" ");
    /*
     * Every act is asserted on, in both directions. An earlier version of this
     * check tested only the nine acts after the recall and left Acts 1 and 3 —
     * the two that actually stage her leaving and returning — with no assertion
     * at all, which is where the risk lives.
     */
    if (act.number > 3) {
      assert.doesNotMatch(text, headcount, `Act ${act.number} still counts two people`);
    } else if (act.number === 2) {
      // The only act she is absent for, so she may not act in it.
      assert.doesNotMatch(text, /\bMira\b(?!'s)/, "Act 2 has Mira in a station she has left");
    } else {
      // Acts 1 and 3 stage the departure and the return; both need her on
      // stage. Act 1 may still say "the three of you" — she has not gone yet.
      assert.match(text, /\bMira\b/, `Act ${act.number} no longer stages Mira`);
    }
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
    // The export has no dash glyph and sets one as a spaced hyphen, taking any
    // spacing the dash already had with it.
    .map((node) => node.text.replace(/[ \t]*[\u2010-\u2014][ \t]*/g, " - "));
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

/*
 * Enough of a 2D context to record what the cover figure draws. Curve knots
 * and dashed rules are kept apart, because the rules are the only straight
 * lines on the page and the only ones allowed to be.
 */
function recordingContext() {
  const knots = [];
  const straight = [];
  const calls = [];
  return {
    globalAlpha: 1,
    lineWidth: 1,
    strokeStyle: "",
    lineJoin: "",
    lineCap: "",
    knots,
    straight,
    calls,
    save() {},
    restore() {},
    beginPath() {},
    stroke() {},
    setLineDash(pattern) {
      calls.push(`setLineDash:${pattern}`);
    },
    moveTo(x, y) {
      knots.push({ x, y, width: this.lineWidth, alpha: this.globalAlpha });
    },
    lineTo(x, y) {
      straight.push({ x, y });
    },
    bezierCurveTo(ax, ay, bx, by, x, y) {
      knots.push({ x, y, width: this.lineWidth, alpha: this.globalAlpha });
    },
    fillText(value) {
      calls.push(`fillText:${value}`);
    },
    fillRect() {},
  };
}

const SPECTRUM_TOP = 1480;
const SPECTRUM_HEIGHT = 800;

function spectrumFor(state) {
  const context = recordingContext();
  pdf.drawResponseSpectrum(context, pdf.responseSeries(state), SPECTRUM_TOP, SPECTRUM_HEIGHT);
  return context;
}

check("the record's cover is drawn from the night it records", () => {
  const context = spectrumFor(answerAll((index) => (index % 5) + 1));

  // Nineteen lines of sixty knots: nine bands either side of the record.
  assert.equal(context.knots.length, 19 * 60);
  // One line carries the record itself and is drawn heaviest.
  const heaviest = Math.max(...context.knots.map((knot) => knot.width));
  assert.equal(context.knots.filter((knot) => knot.width === heaviest).length, 60);

  // It stays inside its band, with room left for the spline to overshoot.
  context.knots.forEach((knot) => {
    assert.ok(knot.y > SPECTRUM_TOP + SPECTRUM_HEIGHT * 0.05, `${knot.y} rides above the band`);
    assert.ok(
      knot.y < SPECTRUM_TOP + SPECTRUM_HEIGHT * 0.95,
      `${knot.y} drops below the band`,
    );
  });

  // Edge to edge: the trace was already running before the paper started.
  const xs = context.knots.map((knot) => knot.x);
  assert.equal(Math.min(...xs), 0);
  assert.equal(Math.max(...xs), 2480);

  // Every band is legible on paper; nothing is left at a vanishing alpha.
  assert.ok(Math.min(...context.knots.map((knot) => knot.alpha)) >= 0.15);
  /*
   * The bands breathe rather than shut. Closed all the way toward the line on
   * a run of middling answers, nineteen strokes packed into a finger's width
   * and printed as a moiré screen.
   */
  const narrowest = spectrumFor(answerAll(() => 3));
  const widths = narrowest.knots.map((knot) => Math.abs(knot.y - (SPECTRUM_TOP + SPECTRUM_HEIGHT / 2)));
  assert.ok(Math.max(...widths) > SPECTRUM_HEIGHT * 0.13, "the bands collapse into a hatch");
  // Bands are evenly spaced, so the figure never reads as a glow round a line.
  const middle = SPECTRUM_TOP + SPECTRUM_HEIGHT / 2;
  const gaps = context.knots
    .filter((knot) => knot.x === context.knots[0].x && knot.y < middle)
    .map((knot) => knot.y)
    .sort((a, b) => a - b)
    .map((y, index, all) => (index ? Number((all[index] - all[index - 1]).toFixed(3)) : null))
    .filter((gap) => gap !== null);
  assert.equal(new Set(gaps).size, 1, `uneven band spacing: ${gaps}`);

  // The same record always draws the same figure.
  assert.deepEqual(spectrumFor(answerAll((index) => (index % 5) + 1)).knots, context.knots);
});

check("the cover figure is a spectrum, not a chart", () => {
  const context = spectrumFor(answerAll(() => 4));
  // No axis, no scale, no item numbers, no ruled grid — nothing to read off,
  // and not one straight line on the whole figure.
  assert.deepEqual(context.calls, []);
  assert.deepEqual(context.straight, []);

  // A record answered entirely on the middle of the scale draws flat, and its
  // bands close toward the line; decisive answers open them.
  const middle = spectrumFor(answerAll(() => 3));
  const centre = SPECTRUM_TOP + SPECTRUM_HEIGHT / 2;
  const heaviest = Math.max(...middle.knots.map((knot) => knot.width));
  const line = middle.knots.filter((knot) => knot.width === heaviest);
  assert.equal(line.length, 60);
  line.forEach((knot) => assert.equal(knot.y, centre));

  const reach = (context_) =>
    Math.max(...context_.knots.map((knot) => Math.abs(knot.y - centre)));
  assert.ok(reach(middle) < reach(spectrumFor(answerAll(() => 5))));
});

check("the cover figure is the raw record and is never scored", () => {
  /*
   * Because the keying is balanced, a watch answered 1 throughout and a watch
   * answered 5 throughout score 3.0 everywhere. If the cover drew a reading
   * rather than a record, the two would be the same figure. They are mirrors.
   */
  const low = answerAll(() => 1);
  const high = answerAll(() => 5);
  const scores = (state) =>
    core.scoreProfile(data, state).domains.map((domain) => domain.score);
  assert.deepEqual(scores(low), scores(high));

  const centre = SPECTRUM_TOP + SPECTRUM_HEIGHT / 2;
  const lowKnots = spectrumFor(low).knots;
  const highKnots = spectrumFor(high).knots;
  assert.notDeepEqual(lowKnots, highKnots);
  // Mirrored as a figure rather than knot for knot: reflecting the page swaps
  // which side of each band is which.
  const spread = (knots, sign) =>
    knots.map((knot) => Number((sign * (knot.y - centre)).toFixed(4))).sort((a, b) => a - b);
  assert.deepEqual(spread(lowKnots, 1), spread(highKnots, -1));

  // And the cover is handed the record, not just a name to print on it.
  assert.match(pdfSource, /function drawStoryCover\(context, data, state, pageCount\)/);
  assert.match(pdfSource, /drawStoryCover\(context, data, safeState, totalPages\)/);
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

/*
 * Every content path the three surfaces read has to exist in the content file.
 *
 * This is here because removing the role tables broke four separate reads that
 * the whole suite passed straight over: the story tinted an item by
 * `assessment.roleOrder`, the report's instrument read `state.roles`, and the
 * export printed `summary.consistency` and `summary.contribution`. None of
 * them are covered by a behavioural check, because nothing here renders a
 * page — so the paths are resolved statically instead.
 *
 * Resolution stops as soon as a segment lands on something that is not a plain
 * object, which is what makes `chapters.find(...)` and `currents[id]` read as
 * paths rather than as missing keys.
 */
check("no surface reads a content path the data does not have", () => {
  const plain = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

  // Comments describe what the code used to do, and are not reads.
  const stripped = (source) =>
    source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");

  let resolved = 0;
  [
    ["app.js", appSource],
    ["results.js", resultsSource],
    ["pdf-export.js", pdfSource],
  ].forEach(([file, source]) => {
    [...stripped(source).matchAll(/\bdata((?:\.[A-Za-z_$][\w$]*)+)/g)].forEach((match) => {
      const path = match[1].slice(1).split(".");
      let node = data;
      path.forEach((key, index) => {
        if (!plain(node)) {
          return;
        }
        assert.ok(
          Object.prototype.hasOwnProperty.call(node, key),
          `${file} reads data.${path.slice(0, index + 1).join(".")}, which the content file does not have`,
        );
        node = node[key];
        resolved += 1;
      });
    });
  });
  assert.ok(resolved > 120, `only ${resolved} content reads were checked`);
});

/*
 * The same problem one level up: the report and the export are both handed the
 * object `summariseProfile` returns, and both used to read keys off it that
 * the roles removal had deleted.
 */
check("both surfaces read only the summary keys core actually returns", () => {
  const profile = core.scoreProfile(data, answerAll((index) => (index % 5) + 1));
  const summary = core.summariseProfile(data, profile);
  const keys = new Set(Object.keys(summary));
  assert.ok(keys.size >= 3, "the summary is empty");

  [
    ["results.js", resultsSource],
    ["pdf-export.js", pdfSource],
  ].forEach(([file, source]) => {
    const stripped = source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
    [...stripped.matchAll(/\bsummary\.([A-Za-z_$][\w$]*)/g)].forEach((match) => {
      assert.ok(keys.has(match[1]), `${file} reads summary.${match[1]}, which core does not return`);
    });
  });
});

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
    ["watch", "shift", "detail", "relations", "calibration", "close"],
  );
  // Every chapter is still built and put in the page in one pass; paging only
  // decides which one is shown.
  assert.match(resultsSource, /shell\.replaceChildren\(/);
  [
    "buildWatchChapter",
    "buildShiftChapter",
    "buildDetailChapter",
    "buildRelationsChapter",
    "buildCalibrationChapter",
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


check("the export prints the report, not a summary of it", () => {
  /*
   * Every block the page writes for a current has to land somewhere in the
   * export, or the download is a lesser document than the screen it came from.
   */
  /*
   * Derived, not listed. An earlier version of this check named the blocks by
   * hand and quietly omitted one — the export shipped without the four
   * relation lines per pole, and this test passed anyway. Whatever the page
   * labels, the export has to label too.
   */
  const onPage = [...new Set([...resultsSource.matchAll(/LABELS\.(\w+)/g)].map((m) => m[1]))];
  assert.ok(onPage.length >= 8, "the page appears to render no labelled blocks");
  const inExport = new Set([...pdfSource.matchAll(/labels\.(\w+)/g)].map((m) => m[1]));
  onPage.forEach((key) => {
    assert.ok(inExport.has(key), `the page writes ${key} and the export never does`);
  });
  ["observations", "notATypeStatement"].forEach((key) =>
    assert.match(pdfSource, new RegExp(key), `export is missing ${key}`),
  );

  // Overview, the night, five currents, calibration, relations, what those
  // relationships cost in excess, the handover.
  assert.match(pdfSource, /profile\.currents\.length \+ 6/);
  [
    "drawProfileCurrentPage",
    "drawProfileCalibrationPage",
    "drawProfileExcessPage",
    "drawProfileHandoverPage",
  ].forEach((name) => assert.match(pdfSource, new RegExp(name), name));
  // The retired contribution page is gone rather than merely unreferenced.
  assert.doesNotMatch(pdfSource, /drawProfileRolePage/);
  // Both ends of every line are drawn, so the export cannot imply a maximum.
  assert.match(pdfSource, /poles\.low\.name/);
  assert.match(pdfSource, /poles\.high\.name/);
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
  /*
   * An element names the current it reads, and nothing sits between them. The
   * colours moved onto the current for the same reason: a second table holding
   * half the identity is what let a reading be renamed on its way to the page.
   */
  const elements = data.assessment.elements;
  const currents = data.assessment.spectra.currents;
  assert.deepEqual(Object.keys(elements).sort(), Object.keys(currents).sort());
  Object.entries(elements).forEach(([elementId, element]) => {
    assert.equal(element.current, elementId, elementId);
    assert.ok(element.keywords, `${elementId} keywords`);
    assert.ok(element.shadow, `${elementId} shadow`);
    assert.ok(currents[elementId], `${elementId} has no current`);
  });
  // Every current carries the deck value plus a tone for each ground.
  Object.values(currents).forEach((current) => {
    ["colour", "colourNight", "colourPaper"].forEach((key) => {
      assert.match(current[key], /^#[0-9a-f]{6}$/, `${current.id} ${key}`);
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
  Object.values(data.assessment.spectra.currents).forEach((role) => {
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
  const hues = Object.values(data.assessment.spectra.currents).map((role) => role.colour);
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
  assert.equal(core.relationsFor(data, "metal").checks, "wood");
  assert.equal(core.relationsFor(data, "water").checks, "fire");

  data.assessment.spectra.order.forEach((id) => {
    const relations = core.relationsFor(data, id);
    ["supports", "supportedBy", "checks", "checkedBy"].forEach((key) => {
      assert.ok(data.assessment.spectra.currents[relations[key]], `${id} ${key}`);
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
    assert.ok(copy[key].includes("{current}"), `${key} template`);
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
});

check("a chapter index is a numeral, not a padded number", () => {
  data.results.chapters.forEach((chapter) => {
    assert.match(chapter.index, /^[IVX]+$/, `${chapter.id} index`);
  });
  // Zero-padding a Roman numeral produced "0I" and "0V".
  assert.doesNotMatch(resultsSource, /copy\.index\)\.padStart/);
});

check("the story dims below the reading line and clears as it is reached", () => {
  const block = appSource.slice(
    appSource.indexOf("function focusByScroll("),
    appSource.indexOf("function rememberScroll("),
  );
  // One frame's work, coalesced, and only ever a custom property.
  assert.match(block, /requestAnimationFrame/);
  assert.match(block, /setProperty\("--read"/);
  assert.doesNotMatch(block, /blur|filter/);
  // Fractions of the viewport, so a phone and a laptop dim over the same share.
  const constant = (name) => Number(appSource.match(new RegExp(`${name} = ([\\d.]+)`))[1]);
  /*
   * The fade has to reach its floor well above the foot of the screen. Spread
   * across everything below the reading line it bottomed out only at the very
   * bottom edge, so the whole visible run-up sat between 0.6 and 1 — a
   * difference too small to see at all on a wide display, where a passage is
   * two lines tall and only ever has one of them in the band.
   */
  const finishesAt = constant("READING_LINE") + constant("FADE_ZONE");
  assert.ok(finishesAt <= 0.85, `the fade only reaches its floor at ${finishesAt} of the screen`);
  // Eased, or most of the fall happens too late in the band to be noticed.
  assert.ok(constant("FADE_CURVE") > 1);
  assert.ok(constant("DIMMEST") <= 0.15);
  /*
   * Flat rather than half an experience, for reduced motion and for more
   * contrast alike — dimming a block to a seventh is the opposite of what the
   * second reader asked their system for. Cleared rather than skipped, so
   * turning the preference on mid-watch lifts a column that is already dim.
   */
  assert.match(appSource, /prefers-reduced-motion: reduce/);
  assert.match(appSource, /function flatReading\(\)[^}]*prefers-contrast: more/s);
  assert.match(block, /if \(flat\) \{\s*block\.style\.removeProperty\("--read"\);/);
  /*
   * Whatever holds focus is lit, and that has to be decided here. `--read` is
   * written as an inline property, so a `:focus-within` rule in the stylesheet
   * can never win it back — it would be dead code that looks like a guarantee.
   */
  assert.match(block, /block\.contains\(focused\)/);
  assert.doesNotMatch(stylesSource, /:focus-within\s*\{\s*--read/);
  // Driven by the reader, and by nothing else.
  assert.match(appSource, /window\.addEventListener\(\s*"scroll"/);
  assert.match(appSource, /"focusin", focusByScroll/);
});

check("nothing the reader reads is animated", () => {
  /*
   * An animation that touches `opacity` outranks a normal declaration for as
   * long as it is filling. An arrival animation on `.passage` therefore pinned
   * the story opaque and `--read` did nothing, while the question panel — which
   * had no animation — dimmed correctly around it. Only the environment may
   * animate, and the whole file is checked rather than the one rule, because
   * the next such animation would break the reading focus just as silently.
   */
  const named = [...stylesSource.matchAll(/animation:\s*([\w-]+)/g)]
    .map((match) => match[1])
    .filter((name) => name !== "none");
  assert.deepEqual([...new Set(named)].sort(), ["aurora-breathe", "env-drift"]);
  assert.doesNotMatch(stylesSource, /passage-arrive|--pace/);

  // The reading focus is a plain declaration on all three reading surfaces.
  assert.match(
    stylesSource,
    /\.passage,\s*\.observation,\s*\.act-plate \{\s*opacity: var\(--read, 1\);/,
  );
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
  assert.match(appSource, /updateEnvironment\(\);\s*\n\s*syncSound\(\);/);
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

check("every export page gets its own number, and the last one is the count", () => {
  /*
   * The page slots are written by hand around a computed total, so a page
   * added or removed silently collides with a neighbour: calibration and the
   * fifth current both claimed slot seven, and every page then printed a count
   * one lower than the file actually had.
   */
  const currents = 5;
  // Read from the export rather than restated, so the two cannot drift apart.
  const total = currents + Number(pdfSource.match(/profile\.currents\.length \+ (\d+)/)[1]);
  const slot = (expression) =>
    Function("pageCount", "index", `"use strict"; return ${expression};`);

  const fixed = [...pdfSource.matchAll(/await capture\(\s*([^,]+?),\s*\(\)/g)].map((match) =>
    match[1].trim(),
  );
  assert.ok(fixed.length >= 4, "the export captures no fixed pages");
  const loop = pdfSource.match(/const pageNumber = (index \+ \d+);/);
  assert.ok(loop, "the per-current loop does not number its pages");

  const numbers = fixed
    .filter((expression) => expression !== "pageNumber")
    .map((expression) => slot(expression)(total, 0));
  for (let index = 0; index < currents; index += 1) {
    numbers.push(slot(loop[1])(total, index));
  }

  assert.equal(new Set(numbers).size, numbers.length, `pages collide: ${numbers.sort((a, b) => a - b)}`);
  assert.equal(numbers.length, total, "the page slots do not add up to the printed count");
  assert.equal(Math.min(...numbers), 1);
  assert.equal(Math.max(...numbers), total, "the last page is not the printed count");
});

check("both ends of every current carry their own writing", () => {
  /*
   * The whole design rests on neither pole being a shortage of the other, so
   * a pole missing its own recognition, misreading or relations would quietly
   * reintroduce a favoured end.
   */
  const currents = Object.values(data.assessment.spectra.currents);
  assert.equal(currents.length, 5);
  const required = ["name", "look", "misread", "supports", "supportedBy", "checks", "checkedBy"];
  currents.forEach((current) => {
    assert.ok(current.axis, `${current.id} has no axis description`);
    assert.ok(current.together, `${current.id} has no undivided reading`);
    ["low", "high"].forEach((end) => {
      required.forEach((key) => {
        assert.ok(current.poles[end][key], `${current.id}.${end} is missing ${key}`);
      });
    });
    // Both ends must also have guidance to draw on, from either band.
    ["lower", "higher"].forEach((band) => {
      const guidance = data.assessment.domains[current.domain].guidance[band];
      ["advantage", "overextension", "reflection"].forEach((key) => {
        assert.ok(guidance[key], `${current.domain}.${band} is missing ${key}`);
      });
    });
    // Every facet of the domain can be named as an outlier in either direction.
    data.assessment.domains[current.domain].facets.forEach((facet) => {
      assert.ok(current.facets[facet], `${current.id} cannot describe ${facet}`);
      assert.ok(current.facets[facet].above, `${facet} has no reading when it runs high`);
      assert.ok(current.facets[facet].below, `${facet} has no reading when it runs low`);
    });
  });
});

check("the report never prints the five readings as one thing", () => {
  /*
   * Five axes with two ends each is thirty-two combinations, and naming them
   * is the difference between a spectrum report and a type indicator. No
   * surface may join the readings into a single label.
   */
  const profile = core.scoreProfile(data, answerAll((index) => (index % 5) + 1));
  assert.equal(profile.currents.length, 5);
  [resultsSource, pdfSource].forEach((source) => {
    assert.doesNotMatch(source, /currents\s*\.\s*map\([^)]*\)\s*\.join\(""\)/, "currents joined into one string");
    assert.doesNotMatch(source, /\btypeCode\b|\btypeString\b|\bacronym\b/i);
  });
  const copy = JSON.stringify(data.results) + JSON.stringify(data.assessment.spectra);
  assert.doesNotMatch(copy, /your type\b/i);
  // Each current is reported on its own, with its own pole and distance.
  profile.currents.forEach((current) => {
    assert.ok(current.pole.name, `${current.id} has no pole`);
    assert.ok(Number.isFinite(current.magnitude), `${current.id} has no distance`);
  });
});

check("firmness and distance are separate readings, and both tile", () => {
  const profile = core.scoreProfile(data, answerAll((index) => (index % 5) + 1));
  profile.currents.forEach((current) => {
    assert.ok(["firm", "mixed", "provisional"].includes(current.firmness.id));
    assert.ok(current.firmness.copy, `${current.id} firmness has no copy`);
  });

  /*
   * Which side of the middle decides the pole, and nothing else. If distance
   * were allowed a say, a pronounced reading and a faint one on the same side
   * would be given different names.
   */
  const definition = core.spectraDefinitions(data).metal;
  [1, 2.4, 2.99].forEach((score) =>
    assert.equal(core.poleFor(definition, score).id, definition.poles.low.id, `${score} is not low`),
  );
  [3.01, 3.6, 5].forEach((score) =>
    assert.equal(core.poleFor(definition, score).id, definition.poles.high.id, `${score} is not high`),
  );
  const labels = data.assessment.spectra.magnitudes;
  assert.deepEqual(
    [0, 0.5, 1.4].map((value) => core.magnitudeLabelFor(data, value)),
    [labels.faint, labels.clear, labels.pronounced],
  );
  assert.deepEqual(
    [-0.1, -0.6, -2].map((value) => core.magnitudeLabelFor(data, value)),
    [labels.faint, labels.clear, labels.pronounced],
    "distance is read the same on both sides of the middle",
  );
});

check("the five currents are switched inside their own section", () => {
  /*
   * Five full pages of writing stacked in one chapter is more than a reader
   * will scroll through to reach the fifth. They are switched rather than
   * stacked — but inside Section III, not promoted to five chapters of their
   * own, because they are one section's worth of material.
   */
  assert.match(resultsSource, /function buildDetailSwitcher/);
  assert.match(resultsSource, /current-rail/);
  assert.match(resultsSource, /"tablist"/);
  // A tablist a keyboard cannot cross is four unreachable panels.
  assert.match(resultsSource, /ArrowRight/);
  assert.match(resultsSource, /aria-controls/);
  // Still six chapters, and the currents are not among them.
  assert.equal(data.results.chapters.length, 6);
  assert.equal(
    data.results.chapters.some((entry) => data.assessment.spectra.order.includes(entry.id)),
    false,
    "a current has been promoted to a chapter",
  );

  /*
   * The standing notice is composed like a section and aligned with them, but
   * it is not one: it carries no numeral and it does not join the pager, which
   * would make it chapter zero.
   */
  assert.match(resultsSource, /"chapter orientation"/);
  assert.match(resultsSource, /node\.id = "orientation"/);
  assert.doesNotMatch(JSON.stringify(data.results.orientation), /section|chapter/i);
  assert.ok(data.results.orientation.eyebrow);
  assert.ok(data.results.orientation.title);
});

check("no end is named for a reading that sits in the middle", () => {
  /*
   * `poleFor` has to answer for every score, so a reading of exactly 3.00 is
   * assigned the high pole and the readout printed "The Wildwood · 0.00 from
   * centre". That names a side the responses did not take. Both surfaces name
   * an end only once the reading has cleared the band the line shades.
   */
  const named = /current\.situational \|\| !current\.pole \? "" : current\.pole\.name/;
  assert.match(resultsSource, named, "the report names a pole unconditionally");
  assert.match(pdfSource, named, "the export names a pole unconditionally");

  // The shaded band is that same distance, so the drawing, the naming and the
  // writing cannot disagree about where the middle ends.
  assert.match(resultsSource, /core\.situationalReach\(data\) \/ span/);
  assert.match(pdfSource, /centreBand: core\.situationalReach\(data\)/);
  assert.match(pdfSource, /settings\.centreBand \/ span/);
  assert.equal(core.situationalReach(data), 0.49);

  // And the readout is written once per surface rather than per page.
  assert.equal((pdfSource.match(/function spectrumReadout/g) || []).length, 1);
  assert.equal((resultsSource.match(/function spectrumReadout/g) || []).length, 1);

  /*
   * The block a page prints follows the same band. A reading of 3.02 is a hair
   * above the centre of a five-point scale; printing the far pole's writing
   * there describes someone the responses did not describe.
   */
  const wood = core.spectraDefinitions(data).wood;
  assert.equal(core.bandedPoleFor(data, wood, 3.02).id, wood.poles.middle.id);
  assert.equal(core.bandedPoleFor(data, wood, 2.98).id, wood.poles.middle.id);
  assert.equal(core.bandedPoleFor(data, wood, 4.2).id, wood.poles.high.id);
  assert.equal(core.bandedPoleFor(data, wood, 1.8).id, wood.poles.low.id);
  /*
   * All three blocks of a line carry the same keys. The middle was added with
   * `look` and `misread` and without the four relation lines, so the relations
   * chapter printed a heading and nothing under it for any current that read
   * as situational — a blank block rather than a visible failure.
   */
  const shared = ["name", "look", "misread", "supports", "supportedBy", "checks", "checkedBy"];
  data.assessment.spectra.order.forEach((id) => {
    const poles = data.assessment.spectra.currents[id].poles;
    ["low", "middle", "high"].forEach((end) => {
      shared.forEach((key) => assert.ok(poles[end][key], `${id}.${end} ${key}`));
    });
    ["held", "arrivedFrom", "leftFor"].forEach((key) =>
      assert.ok(poles.middle[key], `${id}.middle ${key}`),
    );
    assert.match(poles.middle.arrivedFrom, /\{from\}/);
    assert.match(poles.middle.leftFor, /\{to\}/);
    // Three ends, three different readings of the same line.
    assert.equal(new Set(["low", "middle", "high"].map((end) => poles[end].look)).size, 3);
  });
});

check("no chapter or page singles out one of the five", () => {
  /*
   * Three places kept picking the reading furthest from the middle and making
   * it the subject: the cycle figure filled that node and dimmed the edges
   * that did not touch it, the export's relations page set itself from that
   * element's colour and printed its keywords under "Yours", and the export's
   * phase page headlined each stretch with a single pole name. Each is a
   * leading type by another name, in a report whose argument is that there is
   * not one.
   */
  [resultsSource, pdfSource, artworkSource].forEach((source) => {
    assert.doesNotMatch(source, /leadId/, "a figure still takes a lead");
    assert.doesNotMatch(source, /\bconst (lead|primary) =/, "a page still picks one current");
  });
  // The figure takes nodes and nothing else, and each node carries its own
  // reading rather than being told whether it is the chosen one.
  assert.match(artworkSource, /function elementCycle\(nodes\)/);
  assert.match(pdfSource, /function drawElementCycle\(context, centreX, centreY, radius, nodes\)/);
  [resultsSource, pdfSource].forEach((source) => {
    assert.match(source, /filled: distance >= reach/);
  });

  /*
   * And the movement chapter accounts for all five, not only the one that
   * travelled furthest. A line that held is a finding as much as one that
   * swung, and it is only readable as one if it is said.
   */
  const profile = core.scoreProfile(data, answerAll((index) => (index % 5) + 1));
  const movement = core.movementPerCurrent(data, profile);
  assert.equal(movement.length, 5, "the movement chapter drops a current");
  assert.deepEqual(
    movement.map((entry) => entry.id),
    data.assessment.spectra.order,
  );
  movement.forEach((entry) => {
    assert.ok(entry.copy, `${entry.id} has no movement line`);
    assert.doesNotMatch(entry.copy, /\{[a-z]/i, `${entry.id} left a placeholder unfilled`);
  });
  [resultsSource, pdfSource].forEach((source) =>
    assert.match(source, /core\.movementPerCurrent\(data, profile\)/),
  );

  // A reading that never moved still gets a line of its own.
  const still = core.movementPerCurrent(data, core.scoreProfile(data, answerAll(() => 3)));
  assert.equal(still.length, 5);
  still.forEach((entry) => {
    assert.equal(entry.moved, false, `${entry.id} moved on a flat record`);
    assert.ok(entry.copy);
  });
});

check("a relationship is written in both directions, working and overrun", () => {
  /*
   * The cycle only ever described the working direction, which reads as though
   * more feeding were always better and more checking always safer. In the
   * five elements they have the same shape and opposite failures: what you
   * feed without limit drains you, and what you restrain without limit stops
   * working at all. Both are written, for every current.
   */
  data.assessment.spectra.order.forEach((id) => {
    const element = Object.values(data.assessment.elements).find((entry) => entry.current === id);
    assert.ok(element, `${id} has no element`);
    ["feeding", "fed", "checking", "checked"].forEach((key) => {
      assert.ok(element.excess[key], `${id} excess ${key}`);
      assert.ok(element.excess[key].length > 80, `${id} excess ${key} is a stub`);
    });
    // The two directions of one relationship, not the same sentence twice.
    assert.notEqual(element.excess.feeding, element.excess.fed, id);
    assert.notEqual(element.excess.checking, element.excess.checked, id);
  });
  [resultsSource, pdfSource].forEach((source) => {
    assert.match(source, /excess\.feeding/);
    assert.match(source, /excess\.checked/);
  });
  assert.ok(data.results.relationsExcess.intro.length > 120);

  /*
   * The figure answers the question it is next to. Pointing at a current picks
   * out the two edges it is on, and the nodes are reachable by keyboard —
   * a figure a keyboard cannot enter is a figure half the readers do not have.
   */
  assert.match(artworkSource, /data-current/);
  assert.match(artworkSource, /"data-from": from\.id/);
  assert.match(artworkSource, /tabindex: "0"/);
  assert.match(resultsSource, /pointerenter/);
  assert.match(resultsSource, /addEventListener\("focus"/);
  assert.match(stylesSource, /data-focus/);
  assert.ok(data.results.relationsHint, "nothing tells the reader the figure is live");
});

check("an action and a watch-for belong to an end, not to a band", () => {
  /*
   * The band version described The Blade and The Ore with the same sentence,
   * because a band is a third of the scale and an end is a place on it. Every
   * one of the fifteen blocks carries its own.
   */
  const seen = { action: new Set(), watchFor: new Set(), gloss: new Set() };
  data.assessment.spectra.order.forEach((id) => {
    const poles = data.assessment.spectra.currents[id].poles;
    ["low", "middle", "high"].forEach((end) => {
      ["action", "watchFor", "gloss"].forEach((key) => {
        const value = poles[end][key];
        assert.ok(value, `${id}.${end} ${key}`);
        assert.equal(seen[key].has(value), false, `${id}.${end} ${key} is reused`);
        seen[key].add(value);
      });
      // A gloss is a phrase that fits beside a name, not a paragraph.
      assert.ok(poles[end].gloss.length < 60, `${id}.${end} gloss is too long to sit inline`);
    });
  });
  assert.equal(seen.action.size, 15);
  assert.equal(seen.watchFor.size, 15);
  [resultsSource, pdfSource].forEach((source) => {
    assert.match(source, /current\.pole\.watchFor/);
    assert.match(source, /current\.pole\.action/);
    assert.doesNotMatch(
      source,
      /guidance\.overextension/,
      "a band still supplies the watch-for",
    );
  });
});

check("calibration shows the shape it is describing", () => {
  /*
   * Balance, ends and middle are three summaries of one thing: the sixty
   * answers counted onto the five points they were given on. A flat spread, a
   * lean and a pile in the middle can produce the same three sentences, so the
   * shape is drawn as well as described — on both surfaces.
   */
  const style = core.responseStyleFor(data, answerAll((index) => (index % 5) + 1));
  assert.equal(style.distribution.length, 5);
  assert.deepEqual(
    style.distribution.map((entry) => entry.value),
    [1, 2, 3, 4, 5],
  );
  assert.equal(
    style.distribution.reduce((total, entry) => total + entry.count, 0),
    core.ITEM_COUNT,
    "the columns do not account for every answer",
  );
  assert.equal(style.answered, core.ITEM_COUNT);

  // Answering 5 to everything puts every answer in one column and none in the
  // other four, which is the case a summary sentence hides best.
  const flat = core.responseStyleFor(data, answerAll(() => 5));
  assert.deepEqual(
    flat.distribution.map((entry) => entry.count),
    [0, 0, 0, 0, core.ITEM_COUNT],
  );

  [resultsSource, pdfSource].forEach((source) =>
    assert.match(source, /style\.distribution/, "a surface describes without drawing"),
  );
  assert.ok(data.results.calibration.chartNote);
  // Counted, never scored: the columns are answers given, not a total.
  assert.doesNotMatch(JSON.stringify(data.results.calibration), /score|total/i);
});

check("a facet is a line with a name at each end, not a score", () => {
  /*
   * Three facets printed as "4.8 / 5" over a filled bar sat under a bipolar
   * reading claiming the scale had a top. Each is named at both ends instead.
   */
  const profile = core.scoreProfile(data, answerAll((index) => (index % 5) + 1));
  const seen = new Set();
  profile.currents.forEach((current) => {
    assert.equal(current.facets.length, 3, `${current.id} facet count`);
    current.facets.forEach((facet) => {
      assert.ok(facet.poles, `${facet.name} has no ends`);
      assert.ok(facet.poles.low, `${facet.name} low`);
      assert.ok(facet.poles.high, `${facet.name} high`);
      assert.notEqual(facet.poles.low, facet.poles.high, `${facet.name} ends match`);
      [facet.poles.low, facet.poles.high].forEach((name) => {
        assert.equal(seen.has(name), false, `${name} is used for two facet ends`);
        seen.add(name);
      });
    });
  });
  assert.equal(seen.size, 30, "fifteen facets need thirty names");

  // Neither surface still prints a facet out of five.
  [resultsSource, pdfSource].forEach((source) => {
    assert.doesNotMatch(source, /facet\.score\.toFixed\(1\)/, "a facet is scored out of five");
    assert.doesNotMatch(source, /outOf\(facet\.score\)/, "a facet is scored out of five");
  });
});

check("the record says how the scale itself was used", () => {
  const style = core.responseStyleFor(data, answerAll(() => 5));
  assert.ok(style, "response style is not computable from a complete record");
  // Answering 5 to everything is the clearest possible lean.
  assert.equal(style.balance.id, "agree");
  assert.equal(style.ends.id, "frequent");
  assert.equal(style.middle.share, 0);
  const even = core.responseStyleFor(data, answerAll(() => 3));
  assert.equal(even.balance.id, "none");
  assert.equal(even.middle.share, 1);
  assert.equal(even.ends.id, "sparing");
  // Nothing here compares the reader with anybody.
  const copy = JSON.stringify(data.results.calibration);
  assert.doesNotMatch(copy, /percentile|average person|compared with others|norm\b/i);
});

check("the export finds its chapters by name, not by position", () => {
  /*
   * Inserting the relations chapter shifted every index after it, and the
   * closing page went on printing the heading that had moved into slot four.
   * Nothing in the export may address a chapter by its position again — and
   * no chapter it names may have been retired out from under it.
   */
  assert.doesNotMatch(pdfSource, /results\.chapters\[\d+\]/);

  const looked = [
    ...pdfSource.matchAll(/chapters\.find\(\(entry\) => entry\.id === "([\w-]+)"\)/g),
  ].map((match) => match[1]);
  assert.ok(looked.length > 0, "the export addresses no chapter by name at all");
  const known = data.results.chapters.map((entry) => entry.id);
  looked.forEach((id) => {
    assert.ok(known.includes(id), `the export names a chapter "${id}" that no longer exists`);
  });
});

check("the export draws the figures the report opens with", () => {
  // A dial on the contribution page, and the cycle on the relations page.
  assert.match(pdfSource, /function drawInstrumentDial\(/);
  assert.match(pdfSource, /drawInstrumentDial\(\s*context/);
  assert.match(pdfSource, /function drawElementCycle\(/);
  /*
   * The movement page keeps a rule per stretch, so two equal readings cannot
   * land on top of each other and no two labels can collide, and joins the
   * marks down the rows so the shift is drawn rather than inferred.
   */
  const phaseStart = pdfSource.indexOf("function drawProfilePhasePage(");
  const phaseEnd = pdfSource.indexOf("function drawSpectrum(");
  // A boundary that no longer exists slices to the end of the file and makes
  // every assertion below it meaningless, so both ends are checked.
  assert.ok(phaseStart >= 0 && phaseEnd > phaseStart, "the movement page cannot be located");
  const phasePage = pdfSource.slice(phaseStart, phaseEnd);
  assert.match(phasePage, /Three rules per contribution/);
  assert.match(phasePage, /The travel, joined down the rows/);
  assert.doesNotMatch(phasePage, /drawScoreTrack/);
  // The connector is drawn before the marks, so a mark is never covered.
  assert.ok(
    phasePage.indexOf("The travel, joined down the rows") <
      phasePage.lastIndexOf("context.arc(x, centre, 12"),
    "the travel is drawn over the marks",
  );
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
  ["look", "divides", "misread", "firmness", "tryThis", "advantage", "overextension", "reflection"].forEach(
    (key) => assert.ok(labels[key], `label ${key}`),
  );
  assert.match(data.results.notATypeStatement, /not a fixed personality type/i);
  assert.ok(data.results.disclaimer);

  // Writing for both ends of all five currents.
  data.assessment.spectra.order.forEach((id) => {
    const current = data.assessment.spectra.currents[id];
    assert.ok(current.axis, `${id} axis`);
    ["low", "high"].forEach((end) => {
      ["name", "look", "misread"].forEach((key) =>
        assert.ok(current.poles[end][key], `${id}.${end} ${key}`),
      );
    });
  });

  // Advantage, overextension and reflection for every band of every current.
  core.DOMAIN_ORDER.forEach((code) => {
    const guidance = data.assessment.domains[code].guidance;
    ["higher", "situational", "lower"].forEach((band) => {
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
  assert.equal(core.STEADY_CHANGE, 0.25);
  assert.match(resultsSource, /const order = data\.assessment\.spectra\.order/);
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
  const copy = JSON.stringify(data.results) + JSON.stringify(data.assessment.spectra);
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

check("nothing on a current's page is reported out of five", () => {
  /*
   * A current is a line with a name at each end, so it is reported as a pole
   * and a distance from the middle. So are its three facets: they used to be
   * the exception, printed out of five over a filled bar, which put a maximum
   * back on the page directly under a reading that says there is not one.
   *
   * The movement instrument still reads one to five, and says so. That is a
   * chart of three readings of the same night on one fixed scale, which is a
   * different claim from a facet having a top.
   */
  [resultsSource, pdfSource].forEach((source) => {
    assert.doesNotMatch(source, /current\.score\.toFixed\(1\)\} \/ /, "a current is scored out of five");
    assert.doesNotMatch(source, /role\.score\.toFixed\(1\)\} \/ /, "a current is scored out of five");
  });
  // Both surfaces name the pole and the distance instead.
  [resultsSource, pdfSource].forEach((source) => {
    assert.match(source, /current\.pole\.name/);
    assert.match(source, /current\.magnitude/);
  });
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
