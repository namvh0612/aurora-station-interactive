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

const core = globalThis.AuroraCore;
const pdf = globalThis.AuroraPdf;
const visuals = globalThis.AuroraVisuals;
const imageExporter = globalThis.AuroraImage;
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
assert.match(storyPdf, /"font":"Roboto"/);
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
assert.match(radar, /font-family="Roboto, Arial, sans-serif"/);
assert.doesNotMatch(radar, /<tspan/);
assert.equal(typeof imageExporter.downloadProfile, "function");

const appSource = fs.readFileSync("./app.js", "utf8");
const indexSource = fs.readFileSync("./index.html", "utf8");
const stylesSource = fs.readFileSync("./styles.css", "utf8");
assert.match(appSource, /function chevronIcon/);
assert.match(appSource, /visuals\.radarSvg/);
assert.match(appSource, /imageExporter\.downloadProfile/);
assert.match(appSource, /Download your story/);
assert.match(appSource, /Download your profile/);
assert.doesNotMatch(appSource, /pdfExporter\.downloadProfile/);
assert.doesNotMatch(appSource, /result-score/);
assert.match(indexSource, /visuals\.js/);
assert.match(indexSource, /image-export\.js/);
assert.match(indexSource, /family=Roboto/);
assert.match(stylesSource, /--serif: Roboto/);
assert.match(stylesSource, /\.spectrum-symbol\.level-1,\s*\n\.spectrum-symbol\.level-6/);

console.log("Aurora Station checks passed.");
