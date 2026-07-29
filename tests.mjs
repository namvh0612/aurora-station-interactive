import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
vm.runInNewContext(
  fs.readFileSync("./content/Aurora_Station_Content.js", "utf8"),
  sandbox,
);
const data = sandbox.window.AURORA_STATION_DATA;

await import("./core.js");
await import("./pdf-export.js");
await import("./audio.js");

const core = globalThis.AuroraCore;
const pdf = globalThis.AuroraPdf;
const audio = globalThis.AuroraAudio;

assert.equal(data.contentVersion, "4.0.0-option-b-likert-balanced");
assert.match(data.narrativeDelivery.principle, /story on the surface/i);
assert.match(data.assessment.methodNote, /requires empirical validation/i);
const optionBItems = Object.fromEntries(
  data.story.acts.flatMap((act) => act.items).map((item) => [item.id, item]),
);
assert.match(optionBItems.q01.statement, /organised clearly/i);
assert.match(optionBItems.q02.statement, /written boundary/i);
assert.match(optionBItems.q03.statement, /invite him to speak/i);
assert.match(optionBItems.q14.statement, /uncertainty/i);
assert.match(optionBItems.q30.statement, /regain focus/i);
assert.match(optionBItems.q36.statement, /recover an even tone/i);
assert.match(optionBItems.q53.context, /consequences remain uncertain/i);
assert.match(optionBItems.q56.statement, /shared refuge plan/i);

const visibleItems = data.story.acts.flatMap((act) => act.items);
assert.equal(visibleItems.length, 60);
const wordCount = (value) => String(value).trim().split(/\s+/).filter(Boolean).length;
const heavyNarrativePhrases = /operational boundary|operating envelope|shared ownership|material consequence|cognitive demand|escalation pathway/i;
visibleItems.forEach((item) => {
  assert.ok(wordCount(item.context) <= 45, `Q${item.number} context is too long`);
  assert.ok(wordCount(item.statement) <= 20, `Q${item.number} statement is too long`);
  assert.ok(wordCount(item.convergence) <= 30, `Q${item.number} convergence is too long`);
  ["low", "mid", "high"].forEach((band) => {
    assert.ok(
      wordCount(item.responseBranches[band].transition) <= 40,
      `Q${item.number} ${band} transition is too long`,
    );
  });
  assert.doesNotMatch(`${item.context} ${item.statement}`, heavyNarrativePhrases);
});

function completeUniformJourney(reserveChoice, raw = 4) {
  let journey = core.setPlayerIdentity(data, core.emptyState(), "Test Crew");
  for (let index = 0; index < 55; index += 1) {
    journey = core.answerCurrent(data, journey, raw);
  }
  journey = core.chooseReserve(data, journey, reserveChoice);
  for (let index = 55; index < 60; index += 1) {
    journey = core.answerCurrent(data, journey, raw);
  }
  return { journey, profile: core.analyseProfile(data, journey) };
}

const roleTestRecipes = {
  "The Pathfinder": { six: [4, 20, 21, 31, 38, 41, 53, 60], one: [6, 11, 28, 47] },
  "The Catalyst": { six: [9, 13, 23, 34, 40, 44, 49, 58], one: [2, 19, 29, 55] },
  "The Steward": { six: [3, 14, 18, 26, 33, 37, 48, 56], one: [8, 24, 43, 51] },
  "The Architect": { six: [1, 7, 17, 27, 32, 42, 46, 52], one: [12, 22, 39, 57] },
  "The Sentinel": { six: [5, 10, 15, 25, 30, 45, 54, 59], one: [16, 35, 36, 50] },
};
Object.entries(roleTestRecipes).forEach(([expectedRole, recipe]) => {
  const answers = Array(60).fill(3);
  recipe.six.forEach((question) => { answers[question - 1] = 6; });
  recipe.one.forEach((question) => { answers[question - 1] = 1; });
  const testProfile = core.analyseProfile(data, {
    playerName: "Role Test",
    onboardingComplete: true,
    answers,
    reserveChoice: "safety",
    endingAcknowledged: true,
  });
  assert.equal(testProfile.role.title, expectedRole);
  assert.equal(
    testProfile.role.candidates.find((candidate) => candidate.code === testProfile.role.code).profileSuitability,
    1,
  );
});

let state = core.emptyState();
state = core.setPlayerIdentity(data, state, "  Nam   Vu  ");
assert.equal(state.playerName, "Nam Vu");
assert.equal(state.onboardingComplete, true);

const uniform = completeUniformJourney("bounded");
state = uniform.journey;
assert.equal(core.currentStep(data, state).type, "ending");
assert.equal(audio.phaseForState(data, state, core), null);
const acknowledgedState = core.acknowledgeEnding(data, state);
assert.equal(core.currentStep(data, acknowledgedState).type, "complete");
assert.equal(acknowledgedState.endingAcknowledged, true);

const stateAt59 = {
  playerName: "Test Crew",
  onboardingComplete: true,
  answers: Array(59).fill(4),
  reserveChoice: "bounded",
  endingAcknowledged: false,
};
assert.equal(core.currentStep(data, stateAt59).type, "item");
assert.equal(core.currentStep(data, stateAt59).item.number, 60);
const profile = uniform.profile;
assert.equal(profile.complete, true);
assert.equal(profile.role.title, "The Architect");
assert.equal(profile.role.fit, "Balanced fit");
assert.match(profile.role.basis, /final operational choice was used only as a last tie-break/i);
assert.match(profile.roleModel, /60% overall availability/i);
assert.match(profile.role.definition, /not a fixed personality type/i);

function mockElement(code, element, trait, score, late, facets) {
  return {
    code,
    element,
    trait,
    colour: "#527f89",
    score,
    facets: facets.map(([name, value]) => ({ name, score: value })),
    context: {
      stages: [
        { id: "starting", label: "Starting conditions", score },
        { id: "escalation", label: "Escalation", score },
        { id: "pressure", label: "Late pressure", score: late },
      ],
    },
    overextension: "Potential overextension.",
  };
}


// Exact metric ties use the final narrative choice only after all profile metrics tie.
const exactTieElements = [
  mockElement("WO", "Wood", "Openness", 4, 4, [["Ideas", 4], ["Aesthetics", 4]]),
  mockElement("FI", "Fire", "Extraversion", 4, 4, [["Assertiveness", 4], ["Enthusiasm", 4]]),
  mockElement("EA", "Earth", "Agreeableness", 4, 4, [["Empathy", 4], ["Cooperation", 4]]),
  mockElement("ME", "Metal", "Conscientiousness", 4, 4, [["Orderliness", 4], ["Industriousness", 4]]),
  mockElement("WA", "Water", "Emotional Stability", 4, 4, [["Calmness", 4], ["Resilience", 4]]),
];
assert.equal(core.recommendRole(data, { reserveChoice: "safety" }, exactTieElements).title, "The Steward");
assert.equal(core.recommendRole(data, { reserveChoice: "discovery" }, exactTieElements).title, "The Pathfinder");
assert.equal(core.recommendRole(data, { reserveChoice: "bounded" }, exactTieElements).title, "The Architect");

// Regression profile from the reviewed report must recommend The Sentinel.
const reviewedElements = [
  mockElement("WO", "Wood", "Openness", 3.8, 3.8, [["Ideas", 3.7], ["Aesthetics", 4.0]]),
  mockElement("FI", "Fire", "Extraversion", 3.1, 2.8, [["Assertiveness", 4.0], ["Enthusiasm", 2.2]]),
  mockElement("EA", "Earth", "Agreeableness", 3.5, 3.3, [["Empathy", 2.7], ["Cooperation", 4.3]]),
  mockElement("ME", "Metal", "Conscientiousness", 3.9, 3.0, [["Orderliness", 4.3], ["Industriousness", 3.5]]),
  mockElement("WA", "Water", "Emotional Stability", 4.1, 4.3, [["Calmness", 4.2], ["Resilience", 4.0]]),
];
const reviewedRole = core.recommendRole(
  data,
  { reserveChoice: "discovery" },
  reviewedElements,
);
assert.equal(reviewedRole.title, "The Sentinel");
const sentinelCandidate = reviewedRole.candidates.find((item) => item.code === "WA");
const architectCandidate = reviewedRole.candidates.find((item) => item.code === "ME");
assert.ok(sentinelCandidate.profileSuitability > architectCandidate.profileSuitability);

// A role below the 3.25 solo guardrail is not selected merely because of array order.
const guardrailElements = reviewedElements.map((item) => ({
  ...item,
  score: item.code === "FI" ? 3.2 : item.score,
}));
assert.notEqual(
  core.recommendRole(data, { reserveChoice: "bounded" }, guardrailElements).title,
  "The Catalyst",
);

// Group mode can rebalance a role when team and mission needs are supplied.
const groupRole = core.recommendRole(
  data,
  { reserveChoice: "safety" },
  reviewedElements,
  {
    mode: "group",
    teamComposition: { WO: 1, FI: 0, EA: 0, ME: 0, WA: 0 },
    missionRequirement: { WO: 1, FI: 0.2, EA: 0.2, ME: 0.2, WA: 0.2 },
  },
);
assert.equal(groupRole.title, "The Pathfinder");
assert.equal(groupRole.mode, "group");

assert.equal(profile.elements.length, 5);
assert.equal(profile.elements.reduce((total, item) => total + item.facets.length, 0), 10);
assert.equal(profile.context.stages.length, 3);
assert.equal(profile.context.elements.length, 5);
assert.equal(profile.quality.level, "caution");
assert.ok(
  profile.elements.every(
    (item) =>
      item.expression &&
      item.description &&
      item.potentialAdvantage &&
      item.overextension &&
      item.reflection &&
      item.facetPattern &&
      item.spectrum.lower &&
      item.spectrum.higher &&
      item.context.stages.length === 3,
  ),
);

const storyText = core.buildPlainStory(data, state);
core.flattenItems(data).forEach((item) => {
  assert.equal(storyText.includes(item.statement), false);
});

const storyPdf = JSON.stringify(pdf.buildStoryDefinition(data, state, core));
assert.doesNotMatch(storyPdf, /YOUR AURORA PROFILE/);
assert.equal(storyPdf.includes(data.finalReserve.prompt), false);
assert.match(storyPdf, /"font":"StorySerif"/);
assert.match(storyPdf, /"font":"SystemMono"/);

const progressEvents = [];
const profileDefinition = pdf.buildProfileDefinition(data, state, core, {
  onProgress(page, total) {
    progressEvents.push([page, total]);
  },
});
const profilePdf = JSON.stringify(profileDefinition);
assert.deepEqual(progressEvents, [
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8],
]);
assert.match(profilePdf, /RECOMMENDED AURORA ROLE/);
assert.match(profilePdf, /How the five currents showed up/);
assert.match(profilePdf, /How the pattern moved/);
assert.match(profilePdf, /POTENTIAL ADVANTAGE/);
assert.match(profilePdf, /POSSIBLE OVEREXTENSION/);
assert.match(profilePdf, /FINAL OPERATIONAL CHOICE/);
assert.equal((profilePdf.match(/"pageBreak":"before"/g) || []).length, 7);
assert.doesNotMatch(profilePdf, /PART 1/);

const appSource = fs.readFileSync("./app.js", "utf8");
const audioSource = fs.readFileSync("./audio.js", "utf8");
const auroraSource = fs.readFileSync("./aurora.js", "utf8");
const indexSource = fs.readFileSync("./index.html", "utf8");
const stylesSource = fs.readFileSync("./styles.css", "utf8");
const coreSource = fs.readFileSync("./core.js", "utf8");

assert.doesNotMatch(appSource, /function chevronIcon/);
assert.match(appSource, /function responseNumber/);
assert.match(appSource, /function buildStationEntry/);
assert.match(appSource, /Begin the final watch/);
assert.match(appSource, /Move across 1–6 to preview each response/);
assert.match(appSource, /Before the watch begins/);
assert.match(appSource, /How to answer the watch/);
assert.match(appSource, /Continue to dawn debrief/);
assert.match(appSource, /What the watch leaves behind/);
assert.match(appSource, /core\.acknowledgeEnding/);
assert.match(appSource, /100 \+ index \* 200/);
assert.doesNotMatch(appSource, /button\.title = RESPONSE_LABELS/);
assert.doesNotMatch(appSource, /HOW TO CHOOSE/);
assert.match(appSource, /result-deck/);
assert.match(appSource, /Recommended Aurora Role/);
assert.match(appSource, /How the five currents showed up/);
assert.match(appSource, /How the pattern moved/);
assert.match(appSource, /Current details/);
assert.match(appSource, /Download profile PDF/);
assert.match(appSource, /Download story PDF/);
assert.match(appSource, /pdfExporter\.downloadProfile/);
assert.match(appSource, /pdfExporter\.downloadStory/);
assert.doesNotMatch(appSource, /imageExporter\.downloadProfile/);
assert.doesNotMatch(appSource, /Download high-resolution profile/);
assert.match(appSource, /ArrowLeft/);
assert.match(appSource, /ArrowRight/);
assert.match(appSource, /pointerdown/);
assert.match(appSource, /RESULT_SESSION_KEY/);
assert.match(appSource, /Rendering page/);
assert.match(appSource, /aurora-surge-active/);
assert.match(appSource, /aurora-rescue-contact/);
assert.match(appSource, /aurora-rescue-faint/);
assert.match(appSource, /answeredCount >= 40 && answeredCount < 60/);
assert.match(appSource, /answeredCount >= 58/);
assert.match(appSource, /answeredCount >= 59/);
assert.match(appSource, /surgeActive: auroraSurgeActive/);
assert.match(appSource, /strength: auroraStrength/);
assert.match(appSource, /ensureCurrentItemRendered/);
assert.match(appSource, /question-\$\{item\.number\}/);
assert.equal(appSource.match(/appendParagraphs\(moment, item\.context\);/g)?.length, 1);

assert.doesNotMatch(coreSource, /topProfileScore - result\.score <= 0\.25/);
assert.match(coreSource, /overall\) \* 0\.6/);
assert.match(coreSource, /latePressure\) \* 0\.25/);
assert.match(coreSource, /facetFloor\) \* 0\.15/);
assert.match(coreSource, /metric\.profileSuitability \* 0\.45/);
assert.match(coreSource, /teamNeed \* 0\.3/);
assert.match(coreSource, /missionNeed \* 0\.25/);

assert.doesNotMatch(indexSource, /visuals\.js/);
assert.doesNotMatch(indexSource, /image-export\.js/);
assert.match(indexSource, /audio\.js/);
assert.match(indexSource, /aurora\.js/);
assert.match(indexSource, /id="aurora-canvas"/);
assert.doesNotMatch(indexSource, /vfs_fonts/);
assert.doesNotMatch(indexSource, /pdfmake/i);
assert.doesNotMatch(indexSource, /fonts\.googleapis\.com/);

assert.match(stylesSource, /\.result-deck-viewport/);
assert.match(stylesSource, /\.result-page-indicator/);
assert.match(stylesSource, /\.current-selector/);
assert.match(stylesSource, /\.profile-export-dialog/);
assert.match(stylesSource, /\.bipolar-balanced-range/);
assert.match(stylesSource, /\.movement-graphic/);
assert.match(stylesSource, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(stylesSource, /body\.aurora-surge-active/);
assert.match(stylesSource, /body\.aurora-rescue-contact/);
assert.match(stylesSource, /body\.aurora-rescue-faint/);
assert.match(stylesSource, /height: min\(62vh, 52rem\)/);
assert.match(stylesSource, /aurora-fallback-drift 36s/);
assert.match(stylesSource, /#02070d 72%/);

const pdfSource = fs.readFileSync("./pdf-export.js", "utf8");
assert.match(pdfSource, /function buildImagePdf/);
assert.match(pdfSource, /function canvasToJpegBytes/);
assert.match(pdfSource, /function downloadStoryPdf/);
assert.match(pdfSource, /function layoutStoryPages/);
assert.match(pdfSource, /Personal story/);
assert.match(pdfSource, /y \+= 86/);
assert.match(pdfSource, /EXPORT_PAGE_WIDTH = 2480/);
assert.match(pdfSource, /EXPORT_PAGE_HEIGHT = 3508/);
assert.doesNotMatch(pdfSource.slice(pdfSource.indexOf("async function downloadProfile")), /pdfMake/);
assert.match(auroraSource, /function loadOgl/);
assert.match(auroraSource, /background\.classList\.add\("is-fallback"\)/);

let phaseState = core.emptyState();
assert.equal(audio.phaseForState(data, phaseState, core), "station-drift");
for (let index = 0; index < 40; index += 1) {
  phaseState = core.answerCurrent(data, phaseState, 4);
}
assert.equal(audio.phaseForState(data, phaseState, core), "under-ice-pulse");
for (let index = 40; index < 55; index += 1) {
  phaseState = core.answerCurrent(data, phaseState, 4);
}
phaseState = core.chooseReserve(data, phaseState, "bounded");
assert.equal(audio.phaseForState(data, phaseState, core), "under-the-ice");

assert.match(audioSource, /const DEFAULT_VOLUME = 0\.07/);
assert.match(auroraSource, /surgeActive/);
assert.match(auroraSource, /prefers-reduced-motion: reduce/);
assert.match(auroraSource, /uSpeed \* 3\.25/);
assert.match(auroraSource, /speed: 0\.03/);
assert.match(auroraSource, /ribbonBand/);
assert.match(auroraSource, /point\.x \* 0\.055/);
assert.match(auroraSource, /peak - 0\.62/);
assert.match(auroraSource, /clamp\(finalColour, 0\.0, 0\.88\)/);
assert.match(auroraSource, /intensity: 0\.76/);
assert.match(stylesSource, /#aurora-canvas[\s\S]*?opacity: 0\.86/);
assert.match(stylesSource, /--movement-name-column/);
assert.match(stylesSource, /padding-left: calc\(var\(--movement-name-column\)/);
assert.match(stylesSource, /\.final-record-actions/);
assert.match(stylesSource, /\.result-page-dot \{[\s\S]*?width: 2\.75rem/);
assert.doesNotMatch(
  stylesSource,
  /\*,\s*\*::before,\s*\*::after\s*\{[\s\S]{0,220}0\.01ms/,
);

console.log("Aurora Station checks passed.");
