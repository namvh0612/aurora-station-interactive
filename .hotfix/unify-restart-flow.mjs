import fs from "node:fs";

function replaceOnce(source, search, replacement, label) {
  const matches = typeof search === "string"
    ? source.split(search).length - 1
    : [...source.matchAll(new RegExp(search.source, search.flags.includes("g") ? search.flags : `${search.flags}g`))].length;
  if (matches !== 1) {
    throw new Error(`${label}: expected exactly one match, found ${matches}`);
  }
  return source.replace(search, replacement);
}

let app = fs.readFileSync("app.js", "utf8");
let tests = fs.readFileSync("tests.mjs", "utf8");
let index = fs.readFileSync("index.html", "utf8");

app = replaceOnce(
  app,
  "  let restartDialog = null;\n",
  "",
  "remove restart dialog state",
);

app = replaceOnce(
  app,
  /\n  function clearRestartMarkerFromUrl\(\) \{[\s\S]*?\n  \}\n\n  function loadResultState\(\) \{/,
  "\n  function loadResultState() {",
  "remove restart URL marker helper",
);

app = replaceOnce(
  app,
  /\n  function buildRestartDialog\(\) \{[\s\S]*?\n  function updateProgress\(\) \{/,
  `
  function restartJourney() {
    clearPlayerCache();
    interactionLocked = false;
    document.body.classList.remove("restart-open", "onboarding-open");
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    openStationEntry();
    announce("Journey cleared. Enter a new watchkeeper name to begin again.");
  }

  function confirmRestartJourney() {
    const confirmed = window.confirm(
      "Start Aurora Station again? Your watchkeeper name, responses, reserve decision and saved debrief will be cleared.",
    );
    if (!confirmed) {
      return;
    }
    restartJourney();
  }

  function updateProgress() {`,
  "replace custom restart dialog with shared reset",
);

app = replaceOnce(
  app,
  /    const restartButton = element\("button", "restart-button", "Start again"\);\n    restartButton\.type = "button";\n    restartButton\.addEventListener\("click", \(\) => \{[\s\S]*?\n    \}\);/,
  `    const restartButton = element("button", "restart-button", "Start again");
    restartButton.type = "button";
    restartButton.addEventListener("click", confirmRestartJourney);`,
  "route result restart through shared handler",
);

app = replaceOnce(
  app,
  '  restartButton?.addEventListener("click", openRestartDialog);',
  '  restartButton?.addEventListener("click", confirmRestartJourney);',
  "route header restart through shared handler",
);

app = replaceOnce(
  app,
  "  clearRestartMarkerFromUrl();\n",
  "",
  "remove restart marker startup call",
);

const oldTestBlock = `assert.match(appSource, /Erase and restart/);
assert.match(appSource, /core\\.clearState/);
assert.doesNotMatch(appSource, /restartRequested/);
const restartDialogSource = appSource.slice(
  appSource.indexOf("function buildRestartDialog"),
  appSource.indexOf("function openRestartDialog"),
);
assert.match(
  restartDialogSource,
  /clearPlayerCache\\(\\)[\\s\\S]*?searchParams\\.set\\("restart"[\\s\\S]*?window\\.location\\.replace/i,
);
assert.doesNotMatch(restartDialogSource, /openStationEntry\\(\\)/);
assert.doesNotMatch(restartDialogSource, /window\\.setTimeout/);
assert.match(appSource, /function clearRestartMarkerFromUrl/);
assert.match(appSource, /clearRestartMarkerFromUrl\\(\\)/);
assert.match(indexSource, /app\\.js\\?v=4\\.1\\.1/);`;

const newTestBlock = `assert.match(appSource, /Start Aurora Station again\\?/);
assert.match(appSource, /core\\.clearState/);
assert.match(appSource, /function restartJourney/);
assert.match(appSource, /function confirmRestartJourney/);
assert.doesNotMatch(appSource, /function buildRestartDialog/);
assert.doesNotMatch(appSource, /function openRestartDialog/);
assert.doesNotMatch(appSource, /restartDialog/);
assert.doesNotMatch(appSource, /clearRestartMarkerFromUrl/);
assert.doesNotMatch(appSource, /window\\.location\\.replace\\(restartUrl/);
assert.equal(
  (appSource.match(/addEventListener\\("click", confirmRestartJourney\\)/g) || []).length,
  2,
);
const sharedRestartSource = appSource.slice(
  appSource.indexOf("function restartJourney"),
  appSource.indexOf("function updateProgress"),
);
assert.match(
  sharedRestartSource,
  /clearPlayerCache\\(\\)[\\s\\S]*?render\\(\\)[\\s\\S]*?openStationEntry\\(\\)/,
);
assert.match(indexSource, /app\\.js\\?v=4\\.1\\.2/);`;

tests = replaceOnce(tests, oldTestBlock, newTestBlock, "update restart regression tests");
index = replaceOnce(index, "./app.js?v=4.1.1", "./app.js?v=4.1.2", "bump app cache key");

fs.writeFileSync("app.js", app);
fs.writeFileSync("tests.mjs", tests);
fs.writeFileSync("index.html", index);
