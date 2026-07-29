import fs from "node:fs";

function replaceOnce(path, before, after) {
  const source = fs.readFileSync(path, "utf8");
  const first = source.indexOf(before);
  if (first === -1) {
    throw new Error(`Expected source not found in ${path}: ${before.slice(0, 120)}`);
  }
  if (source.indexOf(before, first + before.length) !== -1) {
    throw new Error(`Expected unique source appears more than once in ${path}`);
  }
  fs.writeFileSync(path, source.slice(0, first) + after + source.slice(first + before.length));
}

const appPath = "app.js";
replaceOnce(appPath, "  let restartRequested = false;\n", "");

replaceOnce(
  appPath,
  `    cancelButton.addEventListener("click", () => dialog.close());
    eraseButton.addEventListener("click", () => {
      clearPlayerCache();
      interactionLocked = false;
      restartRequested = true;
      dialog.close();
    });

    dialog.addEventListener("close", () => {
      document.body.classList.remove("restart-open");

      if (!restartRequested) {
        return;
      }

      restartRequested = false;
      render();
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      // Open the onboarding dialog in a new task, after the restart dialog
      // has fully left the browser top layer and released its backdrop.
      window.setTimeout(() => {
        openStationEntry();
        announce(
          "Journey cleared. Enter a new watchkeeper name to begin again.",
        );
      }, 0);
    });`,
  `    cancelButton.addEventListener("click", () => dialog.close());
    eraseButton.addEventListener("click", () => {
      clearPlayerCache();
      interactionLocked = false;
      document.body.classList.remove("restart-open", "onboarding-open");

      // Reloading the document is deliberate: it guarantees that every
      // modal and backdrop leaves the browser top layer before onboarding
      // starts again. The query marker also bypasses a stale cached page.
      const restartUrl = new URL(window.location.href);
      restartUrl.searchParams.set("restart", String(Date.now()));
      restartUrl.hash = "";

      try {
        window.location.replace(restartUrl.toString());
      } catch {
        window.location.reload();
      }
    });

    dialog.addEventListener("close", () => {
      document.body.classList.remove("restart-open");
    });`,
);

replaceOnce(
  appPath,
  `  function loadResultState() {`,
  `  function clearRestartMarkerFromUrl() {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("restart")) {
        return;
      }

      url.searchParams.delete("restart");
      const cleanUrl = \`${"${url.pathname}${url.search}${url.hash}"}\`;
      window.history.replaceState(null, "", cleanUrl);
    } catch {
      // URL cleanup is cosmetic and must never block the experience.
    }
  }

  function loadResultState() {`,
);

replaceOnce(
  appPath,
  `  state = core.sanitiseState(data, core.loadState(data, safeStorage()));
  render();`,
  `  state = core.sanitiseState(data, core.loadState(data, safeStorage()));
  clearRestartMarkerFromUrl();
  render();`,
);

const indexPath = "index.html";
replaceOnce(
  indexPath,
  `    <script defer src="./app.js"></script>`,
  `    <script defer src="./app.js?v=4.1.1"></script>`,
);

const testsPath = "tests.mjs";
replaceOnce(
  testsPath,
  `assert.match(appSource, /let restartRequested = false/);
const restartDialogSource = appSource.slice(
  appSource.indexOf("function buildRestartDialog"),
  appSource.indexOf("function openRestartDialog"),
);
assert.match(
  restartDialogSource,
  /restartRequested = true;[\\s\\S]*?dialog\\.close\\(\\);/i,
);
assert.match(
  restartDialogSource,
  /dialog\\.addEventListener\\("close"[\\s\\S]*?window\\.setTimeout\\([\\s\\S]*?openStationEntry\\(\\)/i,
);
assert.ok(
  restartDialogSource.indexOf("dialog.close();") <
    restartDialogSource.indexOf("openStationEntry();"),
);`,
  `assert.doesNotMatch(appSource, /restartRequested/);
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
assert.match(indexSource, /app\\.js\\?v=4\\.1\\.1/);`,
);

console.log("Restart full-document reload hotfix applied.");
