(function startAuroraReader() {
  "use strict";

  const data = window.AURORA_STATION_DATA;
  const core = window.AuroraCore;
  const pdfExporter = window.AuroraPdf;
  const audioManager = window.AuroraAudio;
  const storyRoot = document.getElementById("story");
  const progressFill = document.getElementById("progress-fill");
  const progressBar = document.querySelector(".reader-progress");
  const progressLabel = document.getElementById("progress-label");
  const soundToggle = document.getElementById("sound-toggle");
  const liveStatus = document.getElementById("screen-reader-status");
  const RESPONSE_LABELS = Object.freeze([
    "Not at all like how I would respond",
    "Mostly unlike how I would respond",
    "Slightly unlike how I would respond",
    "Slightly like how I would respond",
    "Very much like how I would respond",
    "Exactly how I would respond",
  ]);
  const RESPONSE_DESCRIPTION_DEFAULT =
    "Move across 1–6 to preview each response.";
  const RESULT_SESSION_KEY = "aurora-station-result-deck-v1";
  let interactionLocked = false;
  let entryDialog = null;
  let resultState = loadResultState();
  let state;

  function safeStorage() {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }


  function safeSessionStorage() {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }

  function loadResultState() {
    const fallback = { activePage: 0, activeCurrent: "WO" };
    try {
      const saved = safeSessionStorage()?.getItem(RESULT_SESSION_KEY);
      if (!saved) {
        return fallback;
      }
      const parsed = JSON.parse(saved);
      const activePage = Number.isInteger(parsed.activePage)
        ? Math.max(0, Math.min(3, parsed.activePage))
        : 0;
      const activeCurrent = ["WO", "FI", "EA", "ME", "WA"].includes(
        parsed.activeCurrent,
      )
        ? parsed.activeCurrent
        : "WO";
      return { activePage, activeCurrent };
    } catch {
      return fallback;
    }
  }

  function saveResultState() {
    try {
      safeSessionStorage()?.setItem(
        RESULT_SESSION_KEY,
        JSON.stringify(resultState),
      );
    } catch {
      // Result navigation state is optional.
    }
  }
  function element(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) {
      node.className = className;
    }
    if (text !== undefined && text !== null) {
      node.textContent = text;
    }
    return node;
  }

  function appendParagraphs(parent, text, className) {
    core.splitParagraphs(text).forEach((paragraph) => {
      parent.appendChild(element("p", className || "", paragraph));
    });
  }

  function labelledParagraph(label, text, className) {
    const paragraph = element("p", className || "");
    paragraph.appendChild(element("strong", "", label));
    paragraph.appendChild(document.createTextNode(` ${text}`));
    return paragraph;
  }

  function fileSafeName(value) {
    const safe = String(value || "Watchkeeper")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48);
    return safe || "Watchkeeper";
  }

  function responseNumber(raw) {
    const number = element("span", "response-number", String(raw));
    number.setAttribute("aria-hidden", "true");
    return number;
  }

  function updateResponseDescription(target, raw) {
    if (!target) {
      return;
    }
    if (raw === null || raw === undefined) {
      target.textContent = RESPONSE_DESCRIPTION_DEFAULT;
      delete target.dataset.level;
      return;
    }
    target.textContent = `${raw} · ${RESPONSE_LABELS[raw - 1]}`;
    target.dataset.level = String(raw);
  }

  function selectPreviewSignal(
    raw,
    sourceButton,
    description,
    confirmButton,
  ) {
    const choices = sourceButton.parentElement.querySelectorAll(
      ".entry-signal-choice",
    );
    choices.forEach((choice) => {
      const selected = choice === sourceButton;
      choice.classList.toggle("is-selected", selected);
      choice.setAttribute("aria-pressed", String(selected));
    });

    updateResponseDescription(description, raw);
    confirmButton.disabled = false;
  }

  function buildStationEntry() {
    if (entryDialog) {
      return entryDialog;
    }

    const dialog = element("dialog", "station-entry");
    dialog.setAttribute("aria-labelledby", "station-entry-title");
    dialog.setAttribute("aria-describedby", "station-entry-summary");

    const frame = element("div", "station-entry-frame");
    const header = element("header", "station-entry-header");
    header.appendChild(
      element("p", "entry-kicker", "AURORA STATION · PRELUDE"),
    );
    const stepIndicator = element("p", "entry-step-indicator", "PRELUDE 01 / 02");
    header.appendChild(stepIndicator);
    frame.appendChild(header);

    const title = element("h1", "entry-title", "Before the watch begins");
    title.id = "station-entry-title";
    frame.appendChild(title);

    const summary = element(
      "p",
      "entry-summary",
      "The station log needs a watchkeeper name. It will appear on the final record and on your reflective profile.",
    );
    summary.id = "station-entry-summary";
    frame.appendChild(summary);

    const identityPanel = element("section", "entry-panel identity-panel");
    identityPanel.dataset.entryStep = "identity";
    const identityForm = element("form", "identity-form");
    identityForm.noValidate = true;

    const nameLabel = element("label", "entry-field-label", "WATCHKEEPER NAME");
    nameLabel.htmlFor = "player-name";
    identityForm.appendChild(nameLabel);

    const nameInput = element("input", "entry-name-input");
    nameInput.id = "player-name";
    nameInput.name = "playerName";
    nameInput.type = "text";
    nameInput.autocomplete = "name";
    nameInput.maxLength = 60;
    nameInput.required = true;
    nameInput.placeholder = "Enter your name";
    nameInput.value = state?.playerName || "";
    identityForm.appendChild(nameInput);

    identityForm.appendChild(
      element(
        "p",
        "entry-field-note",
        "Stored only in this browser and used for your final record and report.",
      ),
    );
    const nameError = element(
      "p",
      "entry-field-error",
      "Please enter your name to continue.",
    );
    nameError.id = "player-name-error";
    nameError.hidden = true;
    identityForm.appendChild(nameError);

    const continueButton = element(
      "button",
      "entry-primary",
      "Continue to response guide",
    );
    continueButton.type = "submit";
    identityForm.appendChild(continueButton);
    identityPanel.appendChild(identityForm);
    frame.appendChild(identityPanel);

    const calibrationPanel = element(
      "section",
      "entry-panel calibration-panel",
    );
    calibrationPanel.dataset.entryStep = "calibration";
    calibrationPanel.hidden = true;

    calibrationPanel.appendChild(
      element(
        "p",
        "calibration-prompt",
        "Try the scale once before the first decision. Answer for what you would actually do, not what sounds ideal.",
      ),
    );

    const calibrationAnchors = element("div", "calibration-anchors");
    calibrationAnchors.appendChild(
      element("span", "", "Not how I would respond"),
    );
    calibrationAnchors.appendChild(
      element("span", "", "Exactly how I would respond"),
    );
    calibrationPanel.appendChild(calibrationAnchors);

    const calibrationTuner = element("div", "calibration-tuner");
    calibrationTuner.appendChild(
      element("span", "calibration-tuner-label", "RESPONSE SIGNAL"),
    );
    const calibrationDescription = element(
      "span",
      "response-dynamic entry-response-dynamic",
      RESPONSE_DESCRIPTION_DEFAULT,
    );
    calibrationDescription.setAttribute("aria-live", "polite");
    calibrationTuner.appendChild(calibrationDescription);
    calibrationPanel.appendChild(calibrationTuner);

    const signalTrack = element("div", "entry-signal-track");
    let selectedPreviewRaw = null;

    function restorePreviewDescription() {
      updateResponseDescription(
        calibrationDescription,
        selectedPreviewRaw,
      );
    }

    function resetPreview() {
      selectedPreviewRaw = null;
      updateResponseDescription(calibrationDescription, null);
    }

    const calibrationFooter = element("footer", "entry-footer");
    const backButton = element("button", "entry-secondary", "← Edit name");
    backButton.type = "button";
    const confirmButton = element(
      "button",
      "entry-primary",
      "Begin the final watch",
    );
    confirmButton.type = "button";
    confirmButton.disabled = true;

    RESPONSE_LABELS.forEach((label, index) => {
      const raw = index + 1;
      const button = element("button", "entry-signal-choice");
      button.type = "button";
      button.dataset.level = String(raw);
      button.setAttribute("aria-label", `${raw}. ${label}`);
      button.setAttribute("aria-pressed", "false");
      button.appendChild(responseNumber(raw));
      button.addEventListener("pointerenter", () =>
        updateResponseDescription(calibrationDescription, raw),
      );
      button.addEventListener("pointerleave", restorePreviewDescription);
      button.addEventListener("focus", () =>
        updateResponseDescription(calibrationDescription, raw),
      );
      button.addEventListener("blur", restorePreviewDescription);
      button.addEventListener("click", () => {
        selectedPreviewRaw = raw;
        selectPreviewSignal(
          raw,
          button,
          calibrationDescription,
          confirmButton,
        );
      });
      signalTrack.appendChild(button);
    });
    calibrationPanel.appendChild(signalTrack);

    calibrationFooter.append(backButton, confirmButton);
    calibrationPanel.appendChild(calibrationFooter);
    frame.appendChild(calibrationPanel);

    function showStep(step) {
      const isIdentity = step === "identity";
      identityPanel.hidden = !isIdentity;
      calibrationPanel.hidden = isIdentity;
      stepIndicator.textContent = isIdentity
        ? "PRELUDE 01 / 02"
        : "PRELUDE 02 / 02";
      title.textContent = isIdentity
        ? "Before the watch begins"
        : "How to answer the watch";
      summary.textContent = isIdentity
        ? "The station log needs a watchkeeper name. It will appear on the final record and on your reflective profile."
        : "Each moment asks how closely one response matches what you would actually do. Choose 1 for not like you and 6 for exactly like you.";
      window.requestAnimationFrame(() => {
        (isIdentity ? nameInput : signalTrack.querySelector("button"))?.focus();
      });
    }

    dialog.prepareEntry = () => {
      nameInput.value = state?.playerName || "";
      nameError.hidden = true;
      nameInput.removeAttribute("aria-invalid");
      nameInput.removeAttribute("aria-describedby");
      delete dialog.dataset.pendingName;
      signalTrack.querySelectorAll(".entry-signal-choice").forEach((choice) => {
        choice.classList.remove("is-selected");
        choice.setAttribute("aria-pressed", "false");
      });
      confirmButton.disabled = true;
      resetPreview();
      showStep("identity");
    };

    identityForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const playerName = core.normalisePlayerName(nameInput.value);
      if (!playerName) {
        nameError.hidden = false;
        nameInput.setAttribute("aria-invalid", "true");
        nameInput.setAttribute("aria-describedby", nameError.id);
        nameInput.focus();
        return;
      }

      nameError.hidden = true;
      nameInput.removeAttribute("aria-invalid");
      nameInput.removeAttribute("aria-describedby");
      nameInput.value = playerName;
      dialog.dataset.pendingName = playerName;
      showStep("calibration");
    });

    nameInput.addEventListener("input", () => {
      if (nameInput.value.trim()) {
        nameError.hidden = true;
        nameInput.removeAttribute("aria-invalid");
      }
    });

    backButton.addEventListener("click", () => showStep("identity"));
    confirmButton.addEventListener("click", () => {
      const playerName = dialog.dataset.pendingName || nameInput.value;
      state = core.setPlayerIdentity(data, state, playerName);
      persist();
      document.body.classList.remove("onboarding-open");
      dialog.close();
    });

    dialog.appendChild(frame);
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("onboarding-open");
      announce(`Welcome to the final watch, ${state.playerName}.`);
      window.requestAnimationFrame(() => {
        const storyStart = document.getElementById("story-start");
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        storyStart?.focus?.({ preventScroll: true });
        storyStart?.scrollIntoView?.({ behavior: "auto", block: "start" });
      });
    });

    document.body.appendChild(dialog);
    entryDialog = dialog;
    return dialog;
  }

  function openStationEntry() {
    if (state.onboardingComplete && state.playerName) {
      return;
    }

    const dialog = buildStationEntry();
    dialog.prepareEntry?.();
    document.body.classList.add("onboarding-open");

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      dialog.setAttribute("open", "");
    }

    window.requestAnimationFrame(() => {
      dialog.querySelector("#player-name")?.focus();
    });
  }

  function updateProgress() {
    const answered = state.answers.length;
    const percent = (answered / data.assessment.scoredItemCount) * 100;
    progressFill.style.transform = `scaleX(${percent / 100})`;
    progressBar.setAttribute("aria-valuenow", String(answered));

    if (
      answered === data.assessment.scoredItemCount &&
      !state.endingAcknowledged
    ) {
      progressLabel.textContent = "Final record";
    } else if (answered === data.assessment.scoredItemCount) {
      progressLabel.textContent = "Journey complete";
    } else if (answered === 0) {
      progressLabel.textContent = "The final watch";
    } else {
      progressLabel.textContent = `${answered} of ${data.assessment.scoredItemCount}`;
    }
  }

  function persist() {
    core.saveState(data, state, safeStorage());
  }

  function scrollToCurrent() {
    const currentStep = core.currentStep(data, state);
    const target =
      (currentStep.type === "item"
        ? document.getElementById(`question-${currentStep.item.number}`)
        : null) ||
      document.querySelector("[data-current='true']") ||
      document.getElementById("results");
    if (!target) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: target.id === "final-record" ? "start" : "center",
      });
    });
  }

  function announce(message) {
    liveStatus.textContent = "";
    window.setTimeout(() => {
      liveStatus.textContent = message;
    }, 20);
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function completeSignalTransition(nextState, message) {
    state = nextState;
    persist();
    render();

    const chosenPaths = storyRoot.querySelectorAll(".chosen-path");
    const latestPath = chosenPaths[chosenPaths.length - 1];
    if (latestPath) {
      latestPath.classList.add("signal-arrival");
    }

    announce(message);
    scrollToCurrent();
    window.setTimeout(() => {
      interactionLocked = false;
    }, prefersReducedMotion() ? 0 : 220);
  }

  function commitAnswer(raw, sourceButton) {
    if (interactionLocked) {
      return;
    }

    interactionLocked = true;
    const currentMoment = sourceButton?.closest(".current-moment");
    sourceButton?.classList.add("is-selected");
    currentMoment?.classList.add("is-transmitting");
    announce("Signal locked. The story is responding.");

    const nextState = core.answerCurrent(data, state, raw);
    window.setTimeout(
      () =>
        completeSignalTransition(
          nextState,
          "Choice saved. The story continues.",
        ),
      prefersReducedMotion() ? 0 : 360,
    );
  }

  function commitReserve(optionId, sourceButton) {
    if (interactionLocked) {
      return;
    }

    interactionLocked = true;
    const currentMoment = sourceButton?.closest(".current-moment");
    sourceButton?.classList.add("is-selected");
    currentMoment?.classList.add("is-transmitting");
    announce("Reserve channel locked. The story is responding.");

    const nextState = core.chooseReserve(data, state, optionId);
    window.setTimeout(
      () =>
        completeSignalTransition(
          nextState,
          "Decision saved. The final watch continues.",
        ),
      prefersReducedMotion() ? 0 : 360,
    );
  }

  function continueToDebrief(sourceButton) {
    if (interactionLocked) {
      return;
    }
    interactionLocked = true;
    sourceButton?.classList.add("is-selected");
    announce("The final record is closing. Dawn debrief is opening.");
    state = core.acknowledgeEnding(data, state);
    persist();
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.setTimeout(() => {
      interactionLocked = false;
    }, prefersReducedMotion() ? 0 : 260);
  }

  function goBack() {
    state = core.undoLast(data, state);
    persist();
    render();
    announce("Returned to the previous choice.");
    scrollToCurrent();
  }

  function renderBackButton(parent, label) {
    if (state.answers.length === 0 && !state.reserveChoice) {
      return;
    }

    const button = element("button", "back-button");
    button.type = "button";
    button.setAttribute("aria-label", label || "Return to the previous choice");
    button.title = label || "Return to the previous choice";
    button.textContent = "←";
    button.addEventListener("click", goBack);
    parent.appendChild(button);
  }

  function renderSpectrum(parent) {
    const spectrum = data.assessment.spectrum;
    const group = element("div", "spectrum");
    group.setAttribute("role", "group");
    group.setAttribute(
      "aria-label",
      `${spectrum.leftAnchor} to ${spectrum.rightAnchor}`,
    );

    const anchors = element("div", "spectrum-anchors");
    anchors.appendChild(element("span", "", spectrum.leftAnchor));
    anchors.appendChild(element("span", "", spectrum.rightAnchor));
    group.appendChild(anchors);

    const tuner = element("div", "signal-tuner");
    tuner.appendChild(
      element("span", "signal-tuner-label", "RESPONSE SIGNAL"),
    );
    const dynamicDescription = element(
      "span",
      "response-dynamic",
      RESPONSE_DESCRIPTION_DEFAULT,
    );
    dynamicDescription.setAttribute("aria-live", "polite");
    tuner.appendChild(dynamicDescription);
    group.appendChild(tuner);

    const choices = element("div", "spectrum-choices");
    spectrum.positions.forEach((raw) => {
      const button = element("button", "spectrum-choice");
      button.type = "button";
      button.dataset.level = String(raw);
      button.setAttribute(
        "aria-label",
        `${raw}. ${RESPONSE_LABELS[raw - 1]}`,
      );
      button.appendChild(responseNumber(raw));
      button.addEventListener("pointerenter", () =>
        updateResponseDescription(dynamicDescription, raw),
      );
      button.addEventListener("pointerleave", () =>
        updateResponseDescription(dynamicDescription, null),
      );
      button.addEventListener("focus", () =>
        updateResponseDescription(dynamicDescription, raw),
      );
      button.addEventListener("blur", () =>
        updateResponseDescription(dynamicDescription, null),
      );
      button.addEventListener("click", () => commitAnswer(raw, button));
      choices.appendChild(button);
    });
    group.appendChild(choices);
    parent.appendChild(group);
    renderBackButton(parent);
  }

  function renderCompletedMoment(parent, item, raw) {
    const moment = element("section", "story-moment");
    appendParagraphs(moment, item.context);

    const branch = core.branchForRaw(data, item, raw);
    if (branch) {
      appendParagraphs(moment, branch.transition, "chosen-path");
    }
    appendParagraphs(moment, item.convergence);
    parent.appendChild(moment);
  }

  function renderCurrentMoment(parent, item) {
    const current = element("section", "story-moment current-moment");
    current.dataset.current = "true";
    current.dataset.questionNumber = String(item.number);
    current.id = `question-${item.number}`;
    current.tabIndex = -1;
    appendParagraphs(current, item.context);
    appendParagraphs(current, item.statement, "inner-voice prompt");
    const signalLine = element("div", "signal-line");
    signalLine.setAttribute("aria-hidden", "true");
    current.appendChild(signalLine);
    renderSpectrum(current);
    parent.appendChild(current);
  }

  function renderReserve(parent) {
    const current = element("section", "reserve-decision current-moment");
    current.dataset.current = "true";
    appendParagraphs(current, data.finalReserve.prompt, "reserve-prompt");

    const options = element("div", "reserve-options");
    data.finalReserve.options.forEach((option) => {
      const button = element("button", "reserve-option");
      button.type = "button";
      button.setAttribute("aria-label", `${option.title}. ${option.text}`);
      button.appendChild(element("strong", "", option.title));
      button.appendChild(element("span", "", option.text));
      button.addEventListener("click", () =>
        commitReserve(option.id, button),
      );
      options.appendChild(button);
    });
    current.appendChild(options);
    renderBackButton(current);
    parent.appendChild(current);
  }

  function renderReserveOutcome(parent) {
    const option = core.selectedReserve(data, state);
    if (!option) {
      return;
    }
    appendParagraphs(parent, option.immediate, "chosen-path");
    appendParagraphs(parent, option.act12Opening);
  }

  function renderStoryHeading(parent) {
    const heading = element("header", "book-opening");
    heading.id = "story-start";
    heading.tabIndex = -1;
    heading.appendChild(element("p", "eyebrow", data.story.prologue.title));
    heading.appendChild(element("h1", "", data.title));
    heading.appendChild(element("p", "subtitle", data.subtitle));
    appendParagraphs(heading, data.story.prologue.text);
    parent.appendChild(heading);
  }

  function renderAct(parent, act) {
    const actSection = element("section", "act");
    const heading = element("header", "chapter-heading");
    heading.appendChild(
      element("p", "chapter-number", `Part ${act.number} · ${act.time}`),
    );
    heading.appendChild(element("h2", "", act.title));
    actSection.appendChild(heading);
    appendParagraphs(actSection, act.opening);

    for (const item of act.items) {
      const answerIndex = item.number - 1;
      if (answerIndex < state.answers.length) {
        renderCompletedMoment(
          actSection,
          item,
          state.answers[answerIndex],
        );
        continue;
      }

      renderCurrentMoment(actSection, item);
      parent.appendChild(actSection);
      return false;
    }

    appendParagraphs(actSection, act.closing);
    parent.appendChild(actSection);
    return true;
  }

  function ensureCurrentItemRendered(parent, currentStep) {
    if (
      currentStep.type !== "item" ||
      parent.querySelector("[data-current='true']")
    ) {
      return;
    }

    const item = currentStep.item;
    const act = data.story.acts.find((candidate) =>
      candidate.items.some((candidateItem) => candidateItem.id === item.id),
    );
    const recovery = element("section", "act current-step-recovery");
    recovery.dataset.recoveredCurrentStep = "true";

    if (act) {
      const heading = element("header", "chapter-heading");
      heading.appendChild(
        element("p", "chapter-number", `Part ${act.number} · ${act.time}`),
      );
      heading.appendChild(element("h2", "", act.title));
      recovery.appendChild(heading);
      appendParagraphs(recovery, act.opening);
    }

    renderCurrentMoment(recovery, item);
    parent.appendChild(recovery);
    console.warn(
      `[Aurora Station] Restored missing render for question ${item.number}.`,
    );
  }

  function renderResults(parent) {
    const assessment = core.analyseProfile(data, state);
    const role = assessment.role;
    const pageCount = 4;
    const section = element("section", "results result-deck");
    section.id = "results";
    section.dataset.current = "true";
    section.tabIndex = -1;

    if (!assessment.elements.some((item) => item.code === resultState.activeCurrent)) {
      resultState.activeCurrent = role.code;
    }

    function scoreText(value) {
      return Number.isFinite(value) ? value.toFixed(1) : "—";
    }

    function createSlide(index, eyebrow, title, introduction, className) {
      const slide = element(
        "section",
        `result-slide ${className || ""}`.trim(),
      );
      slide.dataset.resultPage = String(index);
      slide.setAttribute("aria-label", `Result page ${index + 1} of ${pageCount}`);
      const heading = element("header", "result-slide-heading");
      heading.appendChild(element("p", "section-index", eyebrow));
      heading.appendChild(element("h2", "", title));
      if (introduction) {
        heading.appendChild(
          element("p", "section-introduction", introduction),
        );
      }
      slide.appendChild(heading);
      return slide;
    }

    function movementGraphic(result) {
      const namespace = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(namespace, "svg");
      svg.classList.add("movement-graphic");
      svg.setAttribute("viewBox", "0 0 600 70");
      svg.setAttribute("role", "img");
      svg.setAttribute(
        "aria-label",
        `${result.element}: ${result.context.stages
          .map((stage) => `${stage.label} ${scoreText(stage.score)}`)
          .join(", ")}`,
      );
      const points = result.context.stages.map((stage, index) => {
        const x = 100 + index * 200;
        const normalized = Number.isFinite(stage.score)
          ? (stage.score - 1) / 5
          : 0.5;
        const y = 56 - normalized * 42;
        return { x, y, score: stage.score };
      });
      const path = document.createElementNS(namespace, "polyline");
      path.setAttribute(
        "points",
        points.map((point) => `${point.x},${point.y}`).join(" "),
      );
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("vector-effect", "non-scaling-stroke");
      svg.appendChild(path);
      points.forEach((point) => {
        const circle = document.createElementNS(namespace, "circle");
        circle.setAttribute("cx", String(point.x));
        circle.setAttribute("cy", String(point.y));
        circle.setAttribute("r", "4.5");
        circle.setAttribute("fill", "currentColor");
        svg.appendChild(circle);
      });
      return svg;
    }

    function openExportDialog(options) {
      const settings = options || {};
      let dialog = document.querySelector(".profile-export-dialog");
      if (!dialog) {
        dialog = element("dialog", "profile-export-dialog");
        const frame = element("div", "profile-export-frame");
        frame.appendChild(
          element("p", "technical-label", "ASSEMBLING PROFILE"),
        );
        const title = element("h2", "", "Preparing your report");
        title.dataset.exportTitle = "true";
        frame.appendChild(title);
        const status = element(
          "p",
          "profile-export-status",
          "Preparing eight report pages…",
        );
        status.dataset.exportStatus = "true";
        frame.appendChild(status);
        const progress = element("div", "profile-export-progress");
        progress.appendChild(element("span"));
        frame.appendChild(progress);
        dialog.appendChild(frame);
        document.body.appendChild(dialog);
      }
      const title = dialog.querySelector("[data-export-title]");
      const status = dialog.querySelector("[data-export-status]");
      const bar = dialog.querySelector(".profile-export-progress span");
      title.textContent = settings.title || "Preparing your report";
      status.textContent =
        settings.status || "Preparing eight report pages…";
      bar.style.width = "4%";
      if (!dialog.open) {
        dialog.showModal();
      }
      return {
        dialog,
        update(page, total, label) {
          status.textContent = label || `Rendering page ${page} of ${total}`;
          bar.style.width = `${Math.max(4, (page / total) * 88)}%`;
        },
        assembling() {
          status.textContent = "Assembling the PDF…";
          bar.style.width = "94%";
        },
        complete(message) {
          title.textContent = settings.completeTitle || "Profile ready";
          status.textContent =
            message || settings.completeStatus ||
            "Your multi-page PDF has been downloaded.";
          bar.style.width = "100%";
        },
        fail() {
          title.textContent = "Profile not assembled";
          status.textContent =
            "The profile could not be assembled. Your results remain available on screen.";
          bar.style.width = "0%";
        },
      };
    }

    const masthead = element("header", "result-deck-masthead");
    const identity = element("div", "result-deck-identity");
    identity.appendChild(
      element("p", "eyebrow", "DAWN DEBRIEF · FINAL WATCH COMPLETE"),
    );
    identity.appendChild(
      element(
        "p",
        "result-owner",
        `WATCHKEEPER · ${assessment.playerName || "Final watch"}`,
      ),
    );
    masthead.appendChild(identity);

    const utilities = element("div", "result-deck-utilities");
    const storyExportButton = element(
      "button",
      "report-button result-export-button result-export-secondary",
      "Download story PDF",
    );
    storyExportButton.type = "button";
    storyExportButton.addEventListener("click", async () => {
      storyExportButton.disabled = true;
      const progress = openExportDialog({
        title: "Preparing your story",
        status: "Laying out the journey…",
        completeTitle: "Story ready",
      });
      try {
        await pdfExporter.downloadStory(
          data,
          state,
          core,
          `Aurora_Station_Story_${fileSafeName(state.playerName)}.pdf`,
          {
            onProgress(page, total, label) {
              progress.update(page, total, label);
            },
            onAssembling() {
              progress.assembling();
            },
          },
        );
        progress.complete("Your personalised story PDF has been downloaded.");
        announce("Your personalised Aurora Station story has been downloaded.");
        window.setTimeout(() => progress.dialog.close(), 850);
      } catch {
        progress.fail();
        announce("The story PDF could not be created. Please try again.");
      } finally {
        storyExportButton.disabled = false;
      }
    });
    utilities.appendChild(storyExportButton);

    const exportButton = element(
      "button",
      "report-button result-export-button",
      "Download profile PDF",
    );
    exportButton.type = "button";
    exportButton.addEventListener("click", async () => {
      exportButton.disabled = true;
      const progress = openExportDialog({
        title: "Preparing your profile",
        status: "Preparing eight report pages…",
      });
      try {
        await pdfExporter.downloadProfile(
          data,
          state,
          core,
          `Aurora_Station_Profile_${fileSafeName(state.playerName)}.pdf`,
          {
            onProgress(page, total, label) {
              progress.update(page, total, label);
            },
            onAssembling() {
              progress.assembling();
            },
          },
        );
        progress.complete();
        announce("Your multi-page Aurora Station profile has been downloaded.");
        window.setTimeout(() => progress.dialog.close(), 850);
      } catch {
        progress.fail();
        announce("The profile PDF could not be created. Please try again.");
      } finally {
        exportButton.disabled = false;
      }
    });
    utilities.appendChild(exportButton);

    const restartButton = element("button", "restart-button", "Start again");
    restartButton.type = "button";
    restartButton.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Start Aurora Station again? Your current journey will be cleared.",
      );
      if (!confirmed) {
        return;
      }
      core.clearState(safeStorage());
      safeSessionStorage()?.removeItem(RESULT_SESSION_KEY);
      resultState = { activePage: 0, activeCurrent: "WO" };
      state = core.emptyState();
      render();
      openStationEntry();
    });
    utilities.appendChild(restartButton);
    masthead.appendChild(utilities);
    section.appendChild(masthead);

    const shell = element("div", "result-deck-shell");
    const previousButton = element("button", "result-nav result-nav-previous", "←");
    previousButton.type = "button";
    previousButton.setAttribute("aria-label", "Previous result page");
    shell.appendChild(previousButton);

    const viewport = element("div", "result-deck-viewport");
    const track = element("div", "result-deck-track");
    viewport.appendChild(track);
    shell.appendChild(viewport);

    const nextButton = element("button", "result-nav result-nav-next", "→");
    nextButton.type = "button";
    nextButton.setAttribute("aria-label", "Next result page");
    shell.appendChild(nextButton);

    const slides = [];

    const roleSlide = createSlide(
      0,
      "01 · ROLE",
      "Recommended Aurora Role",
      "The contribution your Five-Element profile is best placed to make in this mission.",
      "result-role-slide",
    );
    const roleCard = element("article", "aurora-role-card role-card-paginated");
    roleCard.style.setProperty("--role-colour", role.colour);
    const roleHeader = element("header", "role-card-header");
    const roleHeading = element("div");
    roleHeading.appendChild(
      element("p", "technical-label", "RECOMMENDED AURORA ROLE"),
    );
    roleHeading.appendChild(element("h3", "", role.title));
    roleHeading.appendChild(
      element("p", "role-element", `${role.element} · ${role.trait}`),
    );
    roleHeader.appendChild(roleHeading);
    roleHeader.appendChild(element("span", "role-fit", role.fit));
    roleCard.appendChild(roleHeader);
    roleCard.appendChild(element("p", "role-definition", role.definition));
    const roleLines = element("div", "role-lines");
    [
      ["Mission function", role.function],
      ["What you bring", role.whatYouBring],
      ["Watch for", role.watchFor],
      ["Mission action", `${role.actionTitle} — ${role.action}`],
    ].forEach(([label, copy]) => {
      const item = element("section", "role-line");
      item.appendChild(element("h4", "", label));
      item.appendChild(element("p", "", copy));
      roleLines.appendChild(item);
    });
    roleCard.appendChild(roleLines);
    const why = element("section", "role-why");
    why.appendChild(element("h4", "", "Why this Role"));
    why.appendChild(element("p", "", role.why));
    why.appendChild(element("small", "", role.basis));
    roleCard.appendChild(why);
    roleSlide.appendChild(roleCard);
    slides.push(roleSlide);

    const spectrumSlide = createSlide(
      1,
      "02 · PROFILE",
      "How the five currents showed up",
      "Each current is a bipolar range. Neither end is automatically better, and the shaded centre marks the balanced or context-sensitive range.",
      "result-spectrum-slide",
    );
    const spectrumList = element("div", "current-spectrum-list spectrum-page-list");
    assessment.elements.forEach((result) => {
      const item = element("article", "current-spectrum-item");
      item.style.setProperty("--result-colour", result.colour);
      const header = element("header", "current-spectrum-header");
      const title = element("div");
      const name = element("h3");
      name.appendChild(element("span", "element-marker"));
      name.appendChild(document.createTextNode(result.element));
      title.appendChild(name);
      title.appendChild(element("p", "", `${result.trait} · ${result.lens}`));
      header.appendChild(title);
      header.appendChild(
        element("strong", "current-score", `${scoreText(result.score)} / 6`),
      );
      item.appendChild(header);
      const labels = element("div", "spectrum-end-labels");
      labels.append(
        element("span", "", result.spectrum.lower),
        element("span", "", result.spectrum.higher),
      );
      item.appendChild(labels);
      const bar = element("div", "bipolar-track");
      bar.setAttribute("aria-hidden", "true");
      bar.appendChild(element("span", "bipolar-balanced-range"));
      bar.appendChild(element("span", "bipolar-midpoint"));
      const marker = element("span", "bipolar-marker");
      marker.style.left = `${result.position * 100}%`;
      bar.appendChild(marker);
      item.appendChild(bar);
      const reading = element("div", "spectrum-reading");
      reading.appendChild(element("strong", "", result.expression));
      reading.appendChild(element("p", "", result.description));
      item.appendChild(reading);
      spectrumList.appendChild(item);
    });
    spectrumSlide.appendChild(spectrumList);
    spectrumSlide.appendChild(
      element(
        "p",
        "profile-method-note",
        "These are raw scores within Aurora Station. They are not percentages, population percentiles or rankings between people.",
      ),
    );
    slides.push(spectrumSlide);

    const movementSlide = createSlide(
      2,
      "03 · CONTEXT",
      "How the pattern moved",
      assessment.context.note,
      "result-movement-slide",
    );
    const stageLegend = element("div", "movement-stage-legend");
    assessment.context.stages.forEach((stage) => {
      stageLegend.appendChild(element("span", "", stage.label));
    });
    movementSlide.appendChild(stageLegend);
    const movementList = element("div", "movement-card-list");
    assessment.elements.forEach((result) => {
      const card = element("article", "movement-card");
      card.style.setProperty("--result-colour", result.colour);
      const header = element("header");
      const name = element("h3");
      name.appendChild(element("span", "element-marker"));
      name.appendChild(document.createTextNode(result.element));
      header.appendChild(name);
      const delta = result.context.delta;
      header.appendChild(
        element(
          "strong",
          "movement-delta",
          delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`,
        ),
      );
      card.appendChild(header);
      card.appendChild(movementGraphic(result));
      const values = element("div", "movement-values");
      result.context.stages.forEach((stage) => {
        values.appendChild(element("span", "", scoreText(stage.score)));
      });
      card.appendChild(values);
      card.appendChild(element("p", "movement-label", result.context.label));
      movementList.appendChild(card);
    });
    movementSlide.appendChild(movementList);
    const observations = element("section", "context-observations");
    observations.appendChild(element("h3", "", "Context observations"));
    const observationList = element("ul");
    const movementItems = assessment.elements
      .filter((item) => Number.isFinite(item.context.delta));
    const increased = movementItems
      .filter((item) => item.context.delta > 0)
      .sort((a, b) => b.context.delta - a.context.delta)[0];
    const decreased = movementItems
      .filter((item) => item.context.delta < 0)
      .sort((a, b) => a.context.delta - b.context.delta)[0];
    const stable = movementItems
      .slice()
      .sort((a, b) => Math.abs(a.context.delta) - Math.abs(b.context.delta))[0];
    const observationCopies = [];
    if (increased) {
      observationCopies.push(
        `${increased.element} became most available as pressure rose (${increased.context.delta > 0 ? "+" : ""}${increased.context.delta.toFixed(1)}).`,
      );
    }
    if (decreased) {
      observationCopies.push(
        `${decreased.element} showed the largest reduction by late pressure (${decreased.context.delta.toFixed(1)}).`,
      );
    }
    if (stable && stable !== increased && stable !== decreased) {
      observationCopies.push(
        `${stable.element} remained the most stable current across the three stages.`,
      );
    }
    (observationCopies.length ? observationCopies : [assessment.context.summary])
      .slice(0, 3)
      .forEach((copy) => observationList.appendChild(element("li", "", copy)));
    observations.appendChild(observationList);
    movementSlide.appendChild(observations);
    slides.push(movementSlide);

    const detailsSlide = createSlide(
      3,
      "04 · DETAILS",
      "Current details",
      "Select one current to review its facets, potential advantage, possible overextension and reflection prompt.",
      "result-details-slide",
    );
    const selector = element("div", "current-selector");
    selector.setAttribute("role", "tablist");
    const detailPanel = element("div", "current-detail-panel");
    detailPanel.setAttribute("role", "tabpanel");

    function renderCurrentDetail(code) {
      const result = assessment.elements.find((item) => item.code === code);
      if (!result) {
        return;
      }
      resultState.activeCurrent = code;
      saveResultState();
      selector.querySelectorAll("button").forEach((button) => {
        const selected = button.dataset.currentCode === code;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      detailPanel.replaceChildren();
      detailPanel.style.setProperty("--result-colour", result.colour);
      const header = element("header", "current-detail-header");
      const heading = element("div");
      heading.appendChild(element("h3", "", `${result.element} · ${result.trait}`));
      heading.appendChild(element("p", "", result.expression));
      header.appendChild(heading);
      header.appendChild(
        element("strong", "current-detail-score", `${scoreText(result.score)} / 6`),
      );
      detailPanel.appendChild(header);
      detailPanel.appendChild(element("p", "detail-description", result.description));
      const facets = element("div", "facet-detail-grid");
      result.facets.forEach((facet) => {
        const card = element("article", "facet-detail-card");
        const facetHeader = element("header");
        facetHeader.appendChild(element("h4", "", facet.name));
        facetHeader.appendChild(
          element("strong", "", `${scoreText(facet.score)} / 6`),
        );
        card.appendChild(facetHeader);
        card.appendChild(
          element("p", "", result.facetDefinitions[facet.name] || ""),
        );
        facets.appendChild(card);
      });
      detailPanel.appendChild(facets);
      detailPanel.appendChild(element("p", "facet-pattern-copy", result.facetPattern));
      const analysis = element("div", "element-analysis-grid");
      [
        ["Potential advantage", result.potentialAdvantage],
        ["Possible overextension", result.overextension],
        ["Reflection", result.reflection],
      ].forEach(([label, copy]) => {
        const card = element("article");
        card.appendChild(element("h4", "", label));
        card.appendChild(element("p", "", copy));
        analysis.appendChild(card);
      });
      detailPanel.appendChild(analysis);
    }

    assessment.elements.forEach((result) => {
      const button = element("button", "current-selector-button", result.element);
      button.type = "button";
      button.dataset.currentCode = result.code;
      button.style.setProperty("--result-colour", result.colour);
      button.setAttribute("role", "tab");
      button.addEventListener("click", () => renderCurrentDetail(result.code));
      selector.appendChild(button);
    });
    detailsSlide.appendChild(selector);
    detailsSlide.appendChild(detailPanel);
    const responsible = element("footer", "result-responsibility");
    const quality = element("section");
    quality.appendChild(element("p", "technical-label", "RESPONSE QUALITY"));
    quality.appendChild(element("strong", "", assessment.quality.status));
    quality.appendChild(element("p", "", assessment.quality.summary));
    responsible.appendChild(quality);
    if (assessment.finalChoice) {
      const choice = element("section");
      choice.appendChild(
        element("p", "technical-label", "FINAL OPERATIONAL CHOICE"),
      );
      choice.appendChild(element("strong", "", assessment.finalChoice.title));
      choice.appendChild(element("p", "", assessment.finalChoice.note));
      responsible.appendChild(choice);
    }
    responsible.appendChild(
      element(
        "p",
        "result-disclaimer",
        "Aurora Station is a story-based self-reflection inspired by Big Five dimensions. It is not a diagnosis, fixed personality type, population percentile or employment assessment.",
      ),
    );
    detailsSlide.appendChild(responsible);
    slides.push(detailsSlide);

    slides.forEach((slide) => track.appendChild(slide));
    renderCurrentDetail(resultState.activeCurrent);

    section.appendChild(shell);

    const footerNavigation = element("footer", "result-deck-footer");
    const mobilePrevious = element("button", "result-mobile-nav", "← Previous");
    mobilePrevious.type = "button";
    const indicator = element("div", "result-page-indicator");
    const indicatorText = element("strong", "", "01 / 04");
    const dots = element("div", "result-page-dots");
    slides.forEach((_, index) => {
      const dot = element("button", "result-page-dot");
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to result page ${index + 1}`);
      dot.addEventListener("click", () => setPage(index));
      dots.appendChild(dot);
    });
    indicator.append(indicatorText, dots);
    const mobileNext = element("button", "result-mobile-nav", "Next →");
    mobileNext.type = "button";
    footerNavigation.append(mobilePrevious, indicator, mobileNext);
    section.appendChild(footerNavigation);

    function setPage(index) {
      const nextPage = Math.max(0, Math.min(pageCount - 1, index));
      resultState.activePage = nextPage;
      saveResultState();
      slides.forEach((slide, slideIndex) => {
        const offset = slideIndex - nextPage;
        slide.style.transform = `translateX(${offset * 104}%)`;
        slide.style.opacity = offset === 0 ? "1" : "0";
        const active = offset === 0;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
        slide.inert = !active;
      });
      previousButton.disabled = nextPage === 0;
      nextButton.disabled = nextPage === pageCount - 1;
      mobilePrevious.disabled = nextPage === 0;
      mobileNext.disabled = nextPage === pageCount - 1;
      indicatorText.textContent = `${String(nextPage + 1).padStart(2, "0")} / 04`;
      dots.querySelectorAll(".result-page-dot").forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === nextPage);
        dot.setAttribute("aria-current", dotIndex === nextPage ? "page" : "false");
      });
      viewport.scrollTop = 0;
    }

    previousButton.addEventListener("click", () => setPage(resultState.activePage - 1));
    nextButton.addEventListener("click", () => setPage(resultState.activePage + 1));
    mobilePrevious.addEventListener("click", () => setPage(resultState.activePage - 1));
    mobileNext.addEventListener("click", () => setPage(resultState.activePage + 1));

    section.addEventListener("keydown", (event) => {
      const interactive = event.target.closest(
        "input, textarea, select, [role='tablist']",
      );
      if (interactive) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPage(resultState.activePage - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setPage(resultState.activePage + 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        setPage(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setPage(pageCount - 1);
      }
    });

    let pointerStart = null;
    viewport.addEventListener("pointerdown", (event) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    });
    viewport.addEventListener("pointerup", (event) => {
      if (!pointerStart) {
        return;
      }
      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY)) {
        return;
      }
      setPage(resultState.activePage + (deltaX < 0 ? 1 : -1));
    });
    viewport.addEventListener("pointercancel", () => {
      pointerStart = null;
    });

    setPage(resultState.activePage);
    parent.appendChild(section);
    window.requestAnimationFrame(() => section.focus({ preventScroll: true }));
  }

  function renderEnding(parent) {
    const reserve = core.selectedReserve(data, state);
    const ending = element("section", "ending final-record current-moment");
    ending.dataset.current = "true";
    ending.id = "final-record";
    ending.tabIndex = -1;

    const heading = element("header", "final-record-heading");
    heading.appendChild(element("p", "eyebrow", "THE FINAL RECORD"));
    heading.appendChild(element("h2", "", "What the watch leaves behind"));
    heading.appendChild(
      element(
        "p",
        "final-record-introduction",
        "The rescue closes the emergency, but not every question the night opened.",
      ),
    );
    ending.appendChild(heading);

    appendParagraphs(ending, data.ending.rescue);

    if (reserve) {
      appendParagraphs(
        ending,
        reserve.endingConsequence.rescueState,
        "chosen-path",
      );
      appendParagraphs(ending, reserve.endingConsequence.dataLegacy);
    }

    appendParagraphs(ending, data.ending.shared);

    const actions = element("footer", "final-record-actions");
    const back = element("button", "entry-secondary final-record-back", "← Review final response");
    back.type = "button";
    back.addEventListener("click", goBack);
    const continueButton = element(
      "button",
      "entry-primary final-record-continue",
      "Continue to dawn debrief",
    );
    continueButton.type = "button";
    continueButton.addEventListener("click", () =>
      continueToDebrief(continueButton),
    );
    actions.append(back, continueButton);
    ending.appendChild(actions);
    parent.appendChild(ending);
  }

  function render() {
    storyRoot.replaceChildren();
    const currentStep = core.currentStep(data, state);
    const complete = currentStep.type === "complete";
    const answeredCount = state.answers.length;
    const auroraSurgeActive =
      !complete && answeredCount >= 40 && answeredCount < 60;
    const rescueSignalReceived =
      auroraSurgeActive && answeredCount >= 58;
    const auroraRescueFaint =
      auroraSurgeActive && answeredCount >= 59;
    const auroraStrength = !auroraSurgeActive
      ? 0
      : auroraRescueFaint
        ? 0.28
        : rescueSignalReceived
          ? 0.58
          : 1;
    document.body.classList.toggle("debrief-mode", complete);
    document.body.classList.toggle(
      "aurora-surge-active",
      auroraSurgeActive,
    );
    document.body.classList.toggle(
      "aurora-rescue-contact",
      rescueSignalReceived,
    );
    document.body.classList.toggle(
      "aurora-rescue-faint",
      auroraRescueFaint,
    );
    const audioPhase =
      audioManager?.sync(data, state, core) || "station-drift";
    const visualPhase = complete ? "dawn" : audioPhase;
    document.body.dataset.storyPhase = visualPhase;
    window.dispatchEvent(
      new CustomEvent("aurora-phase-change", {
        detail: {
          phase: visualPhase,
          surgeActive: auroraSurgeActive,
          rescueSignalReceived,
          strength: auroraStrength,
        },
      }),
    );

    if (complete) {
      storyRoot.classList.add("profile-mode");
      renderResults(storyRoot);
      updateProgress();
      return;
    }

    storyRoot.classList.remove("profile-mode");
    renderStoryHeading(storyRoot);

    for (const act of data.story.acts) {
      const firstItemIndex = act.items[0].number - 1;
      if (state.answers.length < firstItemIndex) {
        break;
      }

      const actComplete = renderAct(storyRoot, act);
      if (!actComplete) {
        break;
      }

      if (act.id === data.finalReserve.insertAfterActId) {
        if (!state.reserveChoice) {
          renderReserve(storyRoot);
          break;
        }
        renderReserveOutcome(storyRoot);
      }
    }

    ensureCurrentItemRendered(storyRoot, currentStep);

    if (currentStep.type === "ending") {
      renderEnding(storyRoot);
    }

    updateProgress();
  }

  if (!data || !core || !pdfExporter) {
    storyRoot.textContent =
      "Aurora Station could not load its story data. Keep the content file beside this page and try again.";
    return;
  }

  audioManager?.init({ toggleButton: soundToggle });
  state = core.sanitiseState(data, core.loadState(data, safeStorage()));
  render();
  openStationEntry();
})();
