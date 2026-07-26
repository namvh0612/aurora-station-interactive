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

const core = globalThis.AuroraCore;
const pdf = globalThis.AuroraPdf;
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
assert.ok(profile.elements.every((item) => item.expression));

const storyText = core.buildPlainStory(data, state);
core.flattenItems(data).forEach((item) => {
  assert.equal(storyText.includes(item.statement), false);
});

const storyPdf = JSON.stringify(pdf.buildStoryDefinition(data, state, core));
assert.doesNotMatch(storyPdf, /YOUR AURORA PROFILE/);
assert.doesNotMatch(storyPdf, /Natural strengths/);
core.flattenItems(data).forEach((item) => {
  assert.equal(storyPdf.includes(item.statement), false);
});

const profilePdf = JSON.stringify(
  pdf.buildProfileDefinition(data, state, core),
);
assert.match(profilePdf, /YOUR AURORA PROFILE/);
assert.match(profilePdf, /Natural strengths/);
assert.match(profilePdf, /Under pressure/);
assert.doesNotMatch(profilePdf, /PART 1/);

const appSource = fs.readFileSync("./app.js", "utf8");
assert.match(appSource, /responseSymbols/);
assert.match(appSource, /Download your story/);
assert.match(appSource, /Download your profile/);
assert.doesNotMatch(appSource, /result-score/);

console.log("Aurora Station checks passed.");
