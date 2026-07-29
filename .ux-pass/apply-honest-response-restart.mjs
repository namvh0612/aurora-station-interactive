import fs from "node:fs";

function replaceOnce(path, before, after) {
  const source = fs.readFileSync(path, "utf8");
  const first = source.indexOf(before);
  if (first === -1) {
    throw new Error(`Expected source not found in ${path}: ${before.slice(0, 100)}`);
  }
  if (source.indexOf(before, first + before.length) !== -1) {
    throw new Error(`Expected unique source appears more than once in ${path}`);
  }
  fs.writeFileSync(path, source.slice(0, first) + after + source.slice(first + before.length));
}

const contentPath = "content/Aurora_Station_Content.js";
replaceOnce(
  contentPath,
  '"contentVersion": "4.0.0-option-b-likert-balanced"',
  '"contentVersion": "4.1.0-honest-response-onboarding"',
);
replaceOnce(
  contentPath,
  '"statement": "I would recover an even tone before continuing the verification."',
  '"statement": "I would need time before my voice settled during the verification."',
);
replaceOnce(
  contentPath,
  '"statement": "I would recover from the emotional pull and return to the decision criteria."',
  '"statement": "I would remain pulled towards whichever loss felt most immediate."',
);

const indexPath = "index.html";
replaceOnce(
  indexPath,
  `      </button>\n    </header>`,
  `      </button>\n      <button\n        id="restart-watch"\n        class="restart-watch"\n        type="button"\n        aria-haspopup="dialog"\n        aria-label="Restart the watch and clear saved progress"\n        title="Restart the watch"\n        hidden\n      >\n        <span class="restart-icon" aria-hidden="true">↺</span>\n        <span class="restart-label">Restart</span>\n      </button>\n    </header>`,
);

const appPath = "app.js";
replaceOnce(
  appPath,
  `  const soundToggle = document.getElementById("sound-toggle");\n  const liveStatus = document.getElementById("screen-reader-status");`,
  `  const soundToggle = document.getElementById("sound-toggle");\n  const restartButton = document.getElementById("restart-watch");\n  const liveStatus = document.getElementById("screen-reader-status");`,
);
replaceOnce(
  appPath,
  `  let interactionLocked = false;\n  let entryDialog = null;\n  let resultState = loadResultState();`,
  `  let interactionLocked = false;\n  let entryDialog = null;\n  let restartDialog = null;\n  let resultState = loadResultState();`,
);
replaceOnce(
  appPath,
  `    const stepIndicator = element("p", "entry-step-indicator", "PRELUDE 01 / 02");`,
  `    const stepIndicator = element("p", "entry-step-indicator", "PRELUDE 01 / 03");`,
);
replaceOnce(
  appPath,
  `      "Begin the final watch",`,
  `      "Continue",`,
);
replaceOnce(
  appPath,
  `    calibrationPanel.appendChild(calibrationFooter);\n    frame.appendChild(calibrationPanel);\n\n    function showStep(step) {\n      const isIdentity = step === "identity";\n      identityPanel.hidden = !isIdentity;\n      calibrationPanel.hidden = isIdentity;\n      stepIndicator.textContent = isIdentity\n        ? "PRELUDE 01 / 02"\n        : "PRELUDE 02 / 02";\n      title.textContent = isIdentity\n        ? "Before the watch begins"\n        : "How to answer the watch";\n      summary.textContent = isIdentity\n        ? "The station log needs a watchkeeper name. It will appear on the final record and on your reflective profile."\n        : "Each moment asks how closely one response matches what you would actually do. Choose 1 for not like you and 6 for exactly like you.";\n      window.requestAnimationFrame(() => {\n        (isIdentity ? nameInput : signalTrack.querySelector("button"))?.focus();\n      });\n    }`,
  `    calibrationPanel.appendChild(calibrationFooter);\n    frame.appendChild(calibrationPanel);\n\n    const orientationPanel = element(\n      "section",\n      "entry-panel orientation-panel",\n    );\n    orientationPanel.dataset.entryStep = "orientation";\n    orientationPanel.hidden = true;\n\n    orientationPanel.appendChild(\n      element(\n        "p",\n        "orientation-lead",\n        "Every response changes the route the story records. Across the watch, your choices shape your profile, and later decisions shape the ending you reach.",\n      ),\n    );\n\n    const orientationGuidance = element("div", "orientation-guidance");\n    [\n      [\n        "No right or wrong",\n        "Higher is not better. Each point only shows how closely the statement fits you.",\n      ],\n      [\n        "Answer as you are",\n        "Choose what you would realistically do—not what sounds ideal, capable or expected of a duty lead.",\n      ],\n      [\n        "Use the full scale",\n        "Choose 1 when the statement does not resemble you at all. Choose 6 only when it matches exactly; use 2–5 for the space between.",\n      ],\n    ].forEach(([label, copy]) => {\n      const guidanceItem = element("section", "orientation-guidance-item");\n      guidanceItem.appendChild(\n        element("p", "orientation-guidance-label", label),\n      );\n      guidanceItem.appendChild(\n        element("p", "orientation-guidance-copy", copy),\n      );\n      orientationGuidance.appendChild(guidanceItem);\n    });\n    orientationPanel.appendChild(orientationGuidance);\n\n    orientationPanel.appendChild(\n      element(\n        "p",\n        "orientation-disclaimer",\n        "This is a subjective self-report, not a diagnosis or an objective measure of ability. Honest answers produce the most recognisable reflection.",\n      ),\n    );\n\n    const orientationFooter = element("footer", "entry-footer");\n    const orientationBackButton = element(\n      "button",\n      "entry-secondary",\n      "← Review the scale",\n    );\n    orientationBackButton.type = "button";\n    const beginButton = element(\n      "button",\n      "entry-primary",\n      "Begin the final watch",\n    );\n    beginButton.type = "button";\n    orientationFooter.append(orientationBackButton, beginButton);\n    orientationPanel.appendChild(orientationFooter);\n    frame.appendChild(orientationPanel);\n\n    function showStep(step) {\n      const stepConfig = {\n        identity: {\n          indicator: "PRELUDE 01 / 03",\n          title: "Before the watch begins",\n          summary:\n            "The station log needs a watchkeeper name. It will appear on the final record and on your reflective profile.",\n          focus: () => nameInput,\n        },\n        calibration: {\n          indicator: "PRELUDE 02 / 03",\n          title: "How to answer the watch",\n          summary:\n            "Each moment asks how closely one response matches what you would actually do. Choose 1 for not like you and 6 for exactly like you.",\n          focus: () => signalTrack.querySelector("button"),\n        },\n        orientation: {\n          indicator: "PRELUDE 03 / 03",\n          title: "The path changes with you",\n          summary:\n            "There is no answer key. This is a subjective reflection of how you see your likely response in each moment.",\n          focus: () => beginButton,\n        },\n      }[step];\n\n      if (!stepConfig) {\n        return;\n      }\n\n      identityPanel.hidden = step !== "identity";\n      calibrationPanel.hidden = step !== "calibration";\n      orientationPanel.hidden = step !== "orientation";\n      stepIndicator.textContent = stepConfig.indicator;\n      title.textContent = stepConfig.title;\n      summary.textContent = stepConfig.summary;\n      window.requestAnimationFrame(() => stepConfig.focus()?.focus());\n    }`,
);
replaceOnce(
  appPath,
  `    backButton.addEventListener("click", () => showStep("identity"));\n    confirmButton.addEventListener("click", () => {\n      const playerName = dialog.dataset.pendingName || nameInput.value;\n      state = core.setPlayerIdentity(data, state, playerName);\n      persist();\n      document.body.classList.remove("onboarding-open");\n      dialog.close();\n    });`,
  `    backButton.addEventListener("click", () => showStep("identity"));\n    confirmButton.addEventListener("click", () => showStep("orientation"));\n    orientationBackButton.addEventListener("click", () =>\n      showStep("calibration"),\n    );\n    beginButton.addEventListener("click", () => {\n      const playerName = dialog.dataset.pendingName || nameInput.value;\n      state = core.setPlayerIdentity(data, state, playerName);\n      persist();\n      document.body.classList.remove("onboarding-open");\n      dialog.close();\n    });`,
);
replaceOnce(
  appPath,
  `  function updateProgress() {`,
  `  function clearPlayerCache() {\n    const localStorage = safeStorage();\n    core.clearState(localStorage);\n\n    if (localStorage) {\n      try {\n        for (let index = localStorage.length - 1; index >= 0; index -= 1) {\n          const key = localStorage.key(index);\n          if (\n            key?.startsWith("aurora-station-") &&\n            key !== "aurora-station-sound-v1"\n          ) {\n            localStorage.removeItem(key);\n          }\n        }\n      } catch {\n        // The current journey key has already been removed by AuroraCore.\n      }\n    }\n\n    const sessionStorage = safeSessionStorage();\n    if (sessionStorage) {\n      try {\n        for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {\n          const key = sessionStorage.key(index);\n          if (key?.startsWith("aurora-station-")) {\n            sessionStorage.removeItem(key);\n          }\n        }\n      } catch {\n        sessionStorage.removeItem(RESULT_SESSION_KEY);\n      }\n    }\n\n    resultState = { activePage: 0, activeCurrent: "WO" };\n    state = core.emptyState();\n  }\n\n  function buildRestartDialog() {\n    if (restartDialog) {\n      return restartDialog;\n    }\n\n    const dialog = element("dialog", "restart-dialog");\n    dialog.setAttribute("aria-labelledby", "restart-dialog-title");\n    dialog.setAttribute("aria-describedby", "restart-dialog-summary");\n\n    const frame = element("div", "restart-dialog-frame");\n    frame.appendChild(\n      element("p", "restart-dialog-kicker", "WATCH CONTROL"),\n    );\n\n    const title = element("h2", "restart-dialog-title", "Restart the watch?");\n    title.id = "restart-dialog-title";\n    frame.appendChild(title);\n\n    const summary = element(\n      "p",\n      "restart-dialog-summary",\n      "This removes the watchkeeper name, every response, the reserve decision and the saved debrief from this browser.",\n    );\n    summary.id = "restart-dialog-summary";\n    frame.appendChild(summary);\n    frame.appendChild(\n      element(\n        "p",\n        "restart-dialog-note",\n        "This cannot be undone. Your sound preference will remain unchanged.",\n      ),\n    );\n\n    const actions = element("footer", "restart-dialog-actions");\n    const cancelButton = element(\n      "button",\n      "entry-secondary",\n      "Keep current journey",\n    );\n    cancelButton.type = "button";\n    const eraseButton = element(\n      "button",\n      "entry-danger",\n      "Erase and restart",\n    );\n    eraseButton.type = "button";\n    actions.append(cancelButton, eraseButton);\n    frame.appendChild(actions);\n\n    cancelButton.addEventListener("click", () => dialog.close());\n    eraseButton.addEventListener("click", () => {\n      clearPlayerCache();\n      interactionLocked = false;\n      dialog.close();\n      render();\n      window.scrollTo({ top: 0, left: 0, behavior: "auto" });\n      openStationEntry();\n      announce("Journey cleared. Enter a new watchkeeper name to begin again.");\n    });\n\n    dialog.addEventListener("close", () => {\n      document.body.classList.remove("restart-open");\n    });\n\n    document.body.appendChild(dialog);\n    restartDialog = dialog;\n    return dialog;\n  }\n\n  function openRestartDialog() {\n    if (!state.onboardingComplete) {\n      return;\n    }\n\n    const dialog = buildRestartDialog();\n    document.body.classList.add("restart-open");\n    if (typeof dialog.showModal === "function") {\n      if (!dialog.open) {\n        dialog.showModal();\n      }\n    } else {\n      dialog.setAttribute("open", "");\n    }\n    window.requestAnimationFrame(() =>\n      dialog.querySelector(".entry-secondary")?.focus(),\n    );\n  }\n\n  function updateProgress() {`,
);
replaceOnce(
  appPath,
  `  function render() {\n    storyRoot.replaceChildren();`,
  `  function render() {\n    storyRoot.replaceChildren();\n    if (restartButton) {\n      restartButton.hidden = !state.onboardingComplete;\n    }`,
);
replaceOnce(
  appPath,
  `  audioManager?.init({ toggleButton: soundToggle });\n  state = core.sanitiseState(data, core.loadState(data, safeStorage()));`,
  `  audioManager?.init({ toggleButton: soundToggle });\n  restartButton?.addEventListener("click", openRestartDialog);\n  state = core.sanitiseState(data, core.loadState(data, safeStorage()));`,
);

const stylesPath = "styles.css";
replaceOnce(
  stylesPath,
  `  grid-template-columns: auto minmax(5rem, 16rem) auto auto;`,
  `  grid-template-columns: auto minmax(5rem, 16rem) auto auto auto;\n  grid-template-areas: "brand progress label sound restart";`,
);
replaceOnce(
  stylesPath,
  `.reader-brand {\n  color: inherit;`,
  `.reader-brand {\n  grid-area: brand;\n  color: inherit;`,
);
replaceOnce(
  stylesPath,
  `.reader-progress {\n  overflow: hidden;`,
  `.reader-progress {\n  grid-area: progress;\n  overflow: hidden;`,
);
replaceOnce(
  stylesPath,
  `.progress-label {\n  color: var(--story-muted);`,
  `.progress-label {\n  grid-area: label;\n  color: var(--story-muted);`,
);
replaceOnce(
  stylesPath,
  `.sound-toggle {\n  visibility: hidden;`,
  `.sound-toggle {\n  grid-area: sound;\n  visibility: hidden;`,
);
replaceOnce(
  stylesPath,
  `.debrief-mode .sound-toggle:hover,\n.debrief-mode .sound-toggle:focus-visible {\n  border-color: rgba(49, 95, 105, 0.35);\n  color: var(--dawn-ink);\n}\n\n.story {`,
  `.debrief-mode .sound-toggle:hover,\n.debrief-mode .sound-toggle:focus-visible {\n  border-color: rgba(49, 95, 105, 0.35);\n  color: var(--dawn-ink);\n}\n\n.restart-watch {\n  grid-area: restart;\n  display: inline-flex;\n  align-items: center;\n  gap: 0.38rem;\n  min-height: 2.75rem;\n  padding: 0.45rem 0.55rem;\n  border: 1px solid transparent;\n  border-radius: 2px;\n  background: transparent;\n  color: var(--story-muted);\n  cursor: pointer;\n  font-family: var(--technical);\n  font-size: 0.68rem;\n  letter-spacing: 0.04em;\n  transition:\n    border-color 150ms ease,\n    color 150ms ease;\n}\n\n.restart-watch[hidden] {\n  display: none;\n}\n\n.restart-watch:hover,\n.restart-watch:focus-visible {\n  border-color: rgba(98, 216, 232, 0.38);\n  color: var(--story-ink);\n  outline: none;\n}\n\n.restart-icon {\n  display: inline-grid;\n  width: 1rem;\n  place-items: center;\n  font-size: 1rem;\n  line-height: 1;\n}\n\n.debrief-mode .restart-watch {\n  color: var(--dawn-muted);\n}\n\n.debrief-mode .restart-watch:hover,\n.debrief-mode .restart-watch:focus-visible {\n  border-color: rgba(49, 95, 105, 0.35);\n  color: var(--dawn-ink);\n}\n\n.story {`,
);
replaceOnce(
  stylesPath,
  `  .reader-bar {\n    grid-template-columns: auto 1fr auto;\n  }\n\n  .reader-progress {\n    grid-column: 1 / -1;\n    grid-row: 2;\n  }`,
  `  .reader-bar {\n    grid-template-columns: minmax(0, 1fr) auto auto auto;\n    grid-template-areas:\n      "brand label sound restart"\n      "progress progress progress progress";\n    gap: 0.35rem 0.55rem;\n  }\n\n  .reader-progress {\n    grid-area: progress;\n  }`,
);
replaceOnce(
  stylesPath,
  `  .sound-label {\n    position: absolute;`,
  `  .sound-label,\n  .restart-label {\n    position: absolute;`,
);
replaceOnce(
  stylesPath,
  `.calibration-prompt {\n  max-width: 38rem;\n  margin-bottom: 1.15rem;\n  color: #b6c5c9;\n  font-family: var(--serif);\n  font-size: 0.96rem;\n  font-weight: 400;\n  letter-spacing: 0;\n  line-height: 1.62;\n  text-transform: none;\n}\n\n.calibration-anchors {`,
  `.calibration-prompt {\n  max-width: 38rem;\n  margin-bottom: 1.15rem;\n  color: #b6c5c9;\n  font-family: var(--serif);\n  font-size: 0.96rem;\n  font-weight: 400;\n  letter-spacing: 0;\n  line-height: 1.62;\n  text-transform: none;\n}\n\n.orientation-lead {\n  max-width: 36rem;\n  margin: 0 0 1.35rem;\n  color: var(--story-heading);\n  font-size: clamp(1.08rem, 2vw, 1.28rem);\n  line-height: 1.62;\n}\n\n.orientation-guidance {\n  border-top: 1px solid var(--night-line);\n}\n\n.orientation-guidance-item {\n  display: grid;\n  grid-template-columns: minmax(8.5rem, 0.34fr) minmax(0, 1fr);\n  gap: 1.25rem;\n  padding: 1rem 0;\n  border-bottom: 1px solid var(--night-line);\n}\n\n.orientation-guidance-label,\n.orientation-guidance-copy {\n  margin: 0;\n}\n\n.orientation-guidance-label {\n  color: var(--signal-cyan);\n  font-family: var(--technical);\n  font-size: 0.62rem;\n  font-weight: 600;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n}\n\n.orientation-guidance-copy {\n  color: #b6c5c9;\n  font-size: 0.94rem;\n  line-height: 1.58;\n}\n\n.orientation-disclaimer {\n  max-width: 38rem;\n  margin: 1.2rem 0 0;\n  padding-left: 0.9rem;\n  border-left: 2px solid rgba(108, 227, 181, 0.48);\n  color: var(--story-muted);\n  font-family: var(--technical);\n  font-size: 0.65rem;\n  line-height: 1.58;\n}\n\n.calibration-anchors {`,
);
replaceOnce(
  stylesPath,
  `@media print {\n  .station-entry {\n    display: none !important;\n  }\n}\n\n/* Redesigned final debrief */`,
  `body.restart-open {\n  overflow: hidden;\n}\n\n.restart-dialog {\n  z-index: 50;\n  width: min(32rem, calc(100% - 1.25rem));\n  margin: auto;\n  padding: 0;\n  border: 0;\n  background: transparent;\n  color: var(--story-ink);\n}\n\n.restart-dialog::backdrop {\n  background: rgba(2, 8, 13, 0.88);\n  backdrop-filter: blur(7px);\n}\n\n.restart-dialog-frame {\n  padding: clamp(1.4rem, 4vw, 2.2rem);\n  border: 1px solid rgba(98, 216, 232, 0.2);\n  border-top-color: rgba(239, 173, 173, 0.72);\n  background: rgba(6, 19, 29, 0.99);\n  box-shadow: 0 1.5rem 5rem rgba(0, 0, 0, 0.56);\n}\n\n.restart-dialog-kicker {\n  margin: 0;\n  color: #efadad;\n  font-family: var(--technical);\n  font-size: 0.62rem;\n  font-weight: 600;\n  letter-spacing: 0.16em;\n}\n\n.restart-dialog-title {\n  margin: 1rem 0 0.55rem;\n  color: var(--story-heading);\n  font-size: clamp(1.8rem, 5vw, 2.5rem);\n  font-weight: 500;\n  letter-spacing: -0.025em;\n  line-height: 1.08;\n}\n\n.restart-dialog-summary {\n  margin: 0;\n  color: #b6c5c9;\n  font-size: 1rem;\n  line-height: 1.65;\n}\n\n.restart-dialog-note {\n  margin: 0.8rem 0 0;\n  color: var(--story-muted);\n  font-family: var(--technical);\n  font-size: 0.64rem;\n  line-height: 1.52;\n}\n\n.restart-dialog-actions {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 0.65rem;\n  margin-top: 1.6rem;\n  padding-top: 1.15rem;\n  border-top: 1px solid var(--night-line);\n}\n\n.entry-danger {\n  min-height: 2.75rem;\n  padding: 0.65rem 0.9rem;\n  border: 1px solid rgba(239, 173, 173, 0.72);\n  border-radius: 2px;\n  background: rgba(233, 140, 140, 0.08);\n  color: #efadad;\n  cursor: pointer;\n  font-family: var(--technical);\n  font-size: 0.66rem;\n  font-weight: 600;\n  letter-spacing: 0.09em;\n  text-transform: uppercase;\n  transition:\n    background-color 150ms ease,\n    color 150ms ease;\n}\n\n.entry-danger:hover,\n.entry-danger:focus-visible {\n  background: #efadad;\n  color: #251012;\n  outline: none;\n}\n\n@media (max-width: 42rem) {\n  .orientation-guidance-item {\n    grid-template-columns: 1fr;\n    gap: 0.35rem;\n  }\n\n  .restart-dialog {\n    width: calc(100% - 0.75rem);\n  }\n\n  .restart-dialog-actions {\n    align-items: stretch;\n    flex-direction: column-reverse;\n  }\n\n  .restart-dialog-actions .entry-secondary,\n  .restart-dialog-actions .entry-danger {\n    width: 100%;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .restart-watch,\n  .entry-danger {\n    transition: none;\n  }\n}\n\n@media print {\n  .station-entry,\n  .restart-dialog,\n  .restart-watch {\n    display: none !important;\n  }\n}\n\n/* Redesigned final debrief */`,
);

const testsPath = "tests.mjs";
replaceOnce(
  testsPath,
  'assert.equal(data.contentVersion, "4.0.0-option-b-likert-balanced");',
  'assert.equal(data.contentVersion, "4.1.0-honest-response-onboarding");',
);
replaceOnce(
  testsPath,
  `assert.match(optionBItems.q36.statement, /recover an even tone/i);\nassert.match(optionBItems.q53.context, /consequences remain uncertain/i);`,
  `assert.match(optionBItems.q36.statement, /need time before my voice settled/i);\nassert.equal(optionBItems.q36.assessment.key, "R");\nassert.match(optionBItems.q50.statement, /remain pulled towards/i);\nassert.equal(optionBItems.q50.assessment.key, "R");\nassert.match(optionBItems.q53.context, /consequences remain uncertain/i);`,
);
replaceOnce(
  testsPath,
  `assert.match(appSource, /How to answer the watch/);\nassert.match(appSource, /Continue to dawn debrief/);`,
  `assert.match(appSource, /How to answer the watch/);\nassert.match(appSource, /The path changes with you/);\nassert.match(appSource, /There is no answer key/);\nassert.match(appSource, /subjective self-report/);\nassert.match(appSource, /Choose 1 when the statement does not resemble you at all/);\nassert.match(appSource, /PRELUDE 03 \\/ 03/);\nassert.match(appSource, /Erase and restart/);\nassert.match(appSource, /core\\.clearState/);\nassert.match(appSource, /Continue to dawn debrief/);`,
);
replaceOnce(
  testsPath,
  `assert.match(indexSource, /id="aurora-canvas"/);`,
  `assert.match(indexSource, /id="aurora-canvas"/);\nassert.match(indexSource, /id="restart-watch"/);`,
);
replaceOnce(
  testsPath,
  `assert.match(stylesSource, /\.movement-graphic/);`,
  `assert.match(stylesSource, /\\.movement-graphic/);\nassert.match(stylesSource, /\\.orientation-guidance/);\nassert.match(stylesSource, /\\.restart-watch/);\nassert.match(stylesSource, /\\.restart-dialog/);`,
);

console.log("Honest-response onboarding and restart pass applied.");
