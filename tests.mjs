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
await import("./visuals.js");
await import("./image-export.js");
await import("./audio.js");

const core = globalThis.AuroraCore;
const pdf = globalThis.AuroraPdf;
const visuals = globalThis.AuroraVisuals;
const imageExporter = globalThis.AuroraImage;
const audio = globalThis.AuroraAudio;
let state = core.emptyState();

for (let index = 0; index < 55; index += 1) {
  state = core.answerCurrent(data, state, 4);
}
state = core.chooseReserve(data, state, "bounded");
for (let index = 55; index < 60; index += 1) {
  state = core.answerCurrent(data, state, 4);
}

const profile = core.analyseProfile(data, state);
assert.equal(profile.complete, true);
assert.match(profile.narrative.title, /^The /);
assert.equal(profile.narrative.strengths.length, 3);
assert.ok(profile.narrative.rhythm);
assert.ok(
  profile.elements.every(
    (item) =>
      item.expression &&
      item.practicalReading &&
      item.tradeOff &&
      item.balancePrompt &&
      item.facetPattern &&
      item.plainMeaning &&
      item.notSameAs &&
      item.adaptiveRange,
  ),
);

const storyText = core.buildPlainStory(data, state);
core.flattenItems(data).forEach((item) => {
  assert.equal(storyText.includes(item.statement), false);
});

const storyPdf = JSON.stringify(pdf.buildStoryDefinition(data, state, core));
assert.doesNotMatch(storyPdf, /YOUR AURORA PROFILE/);
assert.doesNotMatch(storyPdf, /Natural strengths/);
assert.equal(storyPdf.includes(data.finalReserve.prompt), false);
assert.match(storyPdf, /"font":"StorySerif"/);
assert.match(storyPdf, /"font":"SystemMono"/);
core.flattenItems(data).forEach((item) => {
  assert.equal(storyPdf.includes(item.statement), false);
});

const profilePdf = JSON.stringify(
  pdf.buildProfileDefinition(data, state, core),
);
assert.match(profilePdf, /YOUR AURORA PROFILE/);
assert.match(profilePdf, /Natural strengths/);
assert.match(profilePdf, /Under pressure/);
assert.match(profilePdf, /Possible trade-off/);
assert.doesNotMatch(profilePdf, /PART 1/);

const radar = visuals.radarSvg(profile, { showScores: false });
assert.match(radar, /^<svg/);
assert.match(radar, /font-family="IBM Plex Mono, monospace"/);
assert.doesNotMatch(radar, /<tspan/);
assert.equal(typeof imageExporter.downloadProfile, "function");

const appSource = fs.readFileSync("./app.js", "utf8");
const audioSource = fs.readFileSync("./audio.js", "utf8");
const auroraSource = fs.readFileSync("./aurora.js", "utf8");
const indexSource = fs.readFileSync("./index.html", "utf8");
const stylesSource = fs.readFileSync("./styles.css", "utf8");
assert.match(appSource, /function chevronIcon/);
assert.match(appSource, /is-transmitting/);
assert.match(appSource, /debrief-mode/);
assert.match(appSource, /visuals\.radarSvg/);
assert.match(appSource, /imageExporter\.downloadProfile/);
assert.match(appSource, /audioManager\?\.sync/);
assert.match(appSource, /aurora-phase-change/);
assert.match(appSource, /Download your story/);
assert.match(appSource, /Download your profile/);
assert.doesNotMatch(appSource, /pdfExporter\.downloadProfile/);
assert.doesNotMatch(appSource, /result-score/);
assert.equal(
  appSource.match(/appendParagraphs\(moment, item\.context\);/g)?.length,
  1,
);
assert.match(indexSource, /visuals\.js/);
assert.match(indexSource, /image-export\.js/);
assert.match(indexSource, /audio\.js/);
assert.match(indexSource, /aurora\.js/);
assert.match(indexSource, /id="aurora-canvas"/);
assert.match(indexSource, /id="sound-toggle"/);
assert.match(indexSource, /family=IBM\+Plex\+Mono/);
assert.match(indexSource, /family=Source\+Serif\+4/);
assert.doesNotMatch(indexSource, /vfs_fonts/);
assert.match(stylesSource, /--serif: "Source Serif 4"/);
assert.match(stylesSource, /--technical: "IBM Plex Mono"/);
assert.match(stylesSource, /@keyframes signal-transmit/);
assert.match(stylesSource, /body\.debrief-mode/);
assert.match(
  stylesSource,
  /\.aurora-background\s*\{[\s\S]*position: fixed;[\s\S]*pointer-events: none;/,
);
assert.match(stylesSource, /\.spectrum-symbol\.level-1,\s*\n\.spectrum-symbol\.level-6/);

let phaseState = core.emptyState();
assert.equal(audio.phaseForState(data, phaseState, core), "station-drift");
for (let index = 0; index < 15; index += 1) {
  phaseState = core.answerCurrent(data, phaseState, 4);
}
assert.equal(audio.phaseForState(data, phaseState, core), "system-pressure");
for (let index = 15; index < 30; index += 1) {
  phaseState = core.answerCurrent(data, phaseState, 4);
}
assert.equal(
  audio.phaseForState(data, phaseState, core),
  "the-silence-between",
);
for (let index = 30; index < 40; index += 1) {
  phaseState = core.answerCurrent(data, phaseState, 4);
}
assert.equal(audio.phaseForState(data, phaseState, core), "under-ice-pulse");
for (let index = 40; index < 55; index += 1) {
  phaseState = core.answerCurrent(data, phaseState, 4);
}
assert.equal(audio.phaseForState(data, phaseState, core), "under-ice-pulse");
phaseState = core.chooseReserve(data, phaseState, "bounded");
assert.equal(audio.phaseForState(data, phaseState, core), "under-the-ice");
for (let index = 55; index < 60; index += 1) {
  phaseState = core.answerCurrent(data, phaseState, 4);
}
assert.equal(audio.phaseForState(data, phaseState, core), null);

audio.PHASES.forEach((phase) => {
  const assetPath = phase.src.replace("./", "");
  assert.equal(fs.existsSync(assetPath), true, `${assetPath} is missing`);
  assert.ok(fs.statSync(assetPath).size > 1000, `${assetPath} is empty`);
});
assert.match(audioSource, /const DEFAULT_VOLUME = 0\.07/);
assert.match(audioSource, /audio\.loop = true/);
assert.match(audioSource, /visibilitychange/);
assert.match(auroraSource, /npm\/ogl@1\.0\.11\/\+esm/);
assert.match(auroraSource, /uniform float uTime/);
assert.match(auroraSource, /uniform vec2 uResolution/);
assert.match(auroraSource, /maxPixelRatio: 1\.5/);
assert.match(auroraSource, /webgl: 1/);
assert.match(auroraSource, /uSpeed \* 4\.0/);
assert.match(auroraSource, /gl\.LINK_STATUS/);
assert.match(auroraSource, /prefers-reduced-motion: reduce/);
assert.match(auroraSource, /destroyAurora/);
assert.doesNotMatch(auroraSource, /mousemove|pointermove|click/);
assert.match(stylesSource, /#aurora-canvas[\s\S]*opacity: 0\.66/);
assert.match(
  stylesSource,
  /\.aurora-background\.is-fallback::before[\s\S]*opacity: 0\.48/,
);

console.log("Aurora Station checks passed.");
