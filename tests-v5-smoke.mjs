import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const chunks = Array.from({ length: 7 }, (_, index) =>
  read(`v5-payload/${String(index + 1).padStart(2, "0")}.txt`),
);
const source = zlib.gunzipSync(Buffer.from(chunks.join(""), "base64")).toString("utf8");
const index = read("index.html");
const loader = read("v5-payload/loader.js");
const bridge = read("ux-scroll-v6.js");
const bridgeCss = read("ux-scroll-v6.css");

assert.match(index, /v5-payload\/loader\.js\?v=5\.0\.0/);
assert.match(index, /ux-scroll-v6\.css\?v=6\.0\.0/);
assert.match(index, /ux-scroll-v6\.js\?v=6\.0\.0/);
assert.doesNotMatch(index, /app\.js\?v=4/);
assert.match(loader, /DecompressionStream\("gzip"\)/);
assert.match(source, /Strongly disagree/);
assert.match(source, /Neither agree nor disagree/);
assert.match(source, /Strongly agree/);
assert.match(source, /correctedScore[\s\S]*6 - value/);
assert.match(source, /low: \[1, 2\]/);
assert.match(source, /mid: \[3\]/);
assert.match(source, /high: \[4, 5\]/);
assert.match(source, /storyActsCompleted/);
assert.match(source, /textSpeed/);
assert.match(source, /Show now/);
assert.match(source, /\/ 5/);
assert.doesNotMatch(source, /renderReserve\(/);
assert.doesNotMatch(source, /reserve-options/);

assert.match(bridge, /story-scroll-v6/);
assert.match(bridge, /scroll-question-stage/);
assert.match(bridge, /New passage below/);
assert.match(bridge, /archive/);
assert.match(bridgeCss, /story-runtime-source/);
assert.match(bridgeCss, /entry-signal-track::before/);
assert.match(bridgeCss, /display:\s*none\s*!important/);
assert.match(bridgeCss, /min-height:\s*72vh/);
assert.match(bridgeCss, /scroll-response-choices/);

assert.equal(fs.existsSync(path.join(root, "IMPECCABLE_AUDIT.md")), false);
assert.equal(fs.existsSync(path.join(root, "IMPECCABLE_AUDIT_V5.md")), false);

console.log("Aurora Station scroll UX smoke tests passed.");
