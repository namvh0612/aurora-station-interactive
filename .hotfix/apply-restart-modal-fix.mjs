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
  fs.writeFileSync(
    path,
    source.slice(0, first) + after + source.slice(first + before.length),
  );
}

const appPath = "app.js";
replaceOnce(
  appPath,
  `  let interactionLocked = false;\n  let entryDialog = null;\n  let restartDialog = null;\n  let resultState = loadResultState();`,
  `  let interactionLocked = false;\n  let entryDialog = null;\n  let restartDialog = null;\n  let restartRequested = false;\n  let resultState = loadResultState();`,
);

replaceOnce(
  appPath,
  `    eraseButton.addEventListener("click", () => {\n      clearPlayerCache();\n      interactionLocked = false;\n      dialog.close();\n      render();\n      window.scrollTo({ top: 0, left: 0, behavior: "auto" });\n      openStationEntry();\n      announce("Journey cleared. Enter a new watchkeeper name to begin again.");\n    });\n\n    dialog.addEventListener("close", () => {\n      document.body.classList.remove("restart-open");\n    });`,
  `    eraseButton.addEventListener("click", () => {\n      clearPlayerCache();\n      interactionLocked = false;\n      restartRequested = true;\n      dialog.close();\n    });\n\n    dialog.addEventListener("close", () => {\n      document.body.classList.remove("restart-open");\n\n      if (!restartRequested) {\n        return;\n      }\n\n      restartRequested = false;\n      render();\n      window.scrollTo({ top: 0, left: 0, behavior: "auto" });\n\n      // Open the onboarding dialog in a new task, after the restart dialog\n      // has fully left the browser top layer and released its backdrop.\n      window.setTimeout(() => {\n        openStationEntry();\n        announce(\n          "Journey cleared. Enter a new watchkeeper name to begin again.",\n        );\n      }, 0);\n    });`,
);

const testsPath = "tests.mjs";
replaceOnce(
  testsPath,
  `assert.match(appSource, /Erase and restart/);\nassert.match(appSource, /core\\.clearState/);`,
  `assert.match(appSource, /Erase and restart/);\nassert.match(appSource, /core\\.clearState/);\nassert.match(appSource, /let restartRequested = false/);\nconst restartDialogSource = appSource.slice(\n  appSource.indexOf("function buildRestartDialog"),\n  appSource.indexOf("function openRestartDialog"),\n);\nassert.match(\n  restartDialogSource,\n  /restartRequested = true;[\\s\\S]*?dialog\\.close\\(\\);/i,\n);\nassert.match(\n  restartDialogSource,\n  /dialog\\.addEventListener\\("close"[\\s\\S]*?window\\.setTimeout\\([\\s\\S]*?openStationEntry\\(\\)/i,\n);\nassert.ok(\n  restartDialogSource.indexOf("dialog.close();") <\n    restartDialogSource.indexOf("openStationEntry();"),\n);`,
);

console.log("Restart modal lifecycle hotfix applied.");
