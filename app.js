/*
 * Aurora Station renderer.
 *
 * One cumulative document. The story is a stream of nodes derived by core.js;
 * this module appends them to #story and never rewrites what is already there.
 * The only element that changes in place is the Act's single reflection panel,
 * which is reused for that Act's five questions and then locked.
 */
(function startAuroraStation() {
  "use strict";

  const data = window.AURORA_STATION_DATA;
  const core = window.AuroraCore;
  const audio = window.AuroraAudio;
  const pdfExporter = window.AuroraPdf;

  const story = document.getElementById("story");
  const progressFill = document.getElementById("progress-fill");
  const progressBar = document.querySelector(".reader-progress");
  const progressLabel = document.getElementById("progress-label");
  const soundToggle = document.getElementById("sound-toggle");
  const restartButton = document.getElementById("restart-watch");
  const playbackToggle = document.getElementById("playback-toggle");
  const showNowButton = document.getElementById("playback-show-now");
  const speedControl = document.getElementById("speed-control");
  const newPassageButton = document.getElementById("new-passage");
  const liveRegion = document.getElementById("screen-reader-status");

  const FOLLOW_THRESHOLD = 260;
  const SELECTED_STATE_DELAY = 460;
  const SCROLL_SAVE_DELAY = 250;

  const RESPONSE_LABELS = core.responseLabels(data);
  const TOTAL_ITEMS = core.ITEM_COUNT;

  const storage = (() => {
    try {
      const probe = window.localStorage;
      probe.getItem(core.RESPONSES_KEY);
      return probe;
    } catch {
      return null;
    }
  })();

  let responses = core.loadResponses(data, storage);
  let preferences = core.loadPreferences(storage);
  let nodes = core.buildNodes(data, responses);
  let journey = core.loadJourney(storage, nodes.length);

  let renderedCount = 0;
  let nodesBuiltFor = responses.answers.length;
  let revealTimer = 0;
  let scrollSaveTimer = 0;
  let selectionLocked = false;
  let restoring = false;
  let entryDialog = null;
  const actPanels = new Map();

  /* ------------------------------------------------------------- helpers */

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  function announce(message) {
    if (!liveRegion || !message) {
      return;
    }
    liveRegion.textContent = "";
    window.setTimeout(() => {
      liveRegion.textContent = message;
    }, 30);
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

  function scoreText(value) {
    return Number.isFinite(value) ? `${value.toFixed(1)} / ${core.MAX_RESPONSE}` : "—";
  }

  function persistResponses() {
    core.saveResponses(data, responses, storage);
  }

  function persistJourney() {
    core.saveJourney(journey, storage, nodes.length);
  }

  function persistPreferences() {
    core.savePreferences(preferences, storage);
  }

  /* --------------------------------------------------------- scroll rules */

  function distanceFromBottom() {
    const viewportBottom = window.scrollY + window.innerHeight;
    return document.documentElement.scrollHeight - viewportBottom;
  }

  function isFollowing() {
    return distanceFromBottom() <= FOLLOW_THRESHOLD;
  }

  function followToBottom() {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  function showNewPassageHint() {
    newPassageButton.hidden = false;
  }

  function hideNewPassageHint() {
    newPassageButton.hidden = true;
  }

  /*
   * Called after anything is added to the document. The reader's position is
   * never taken from them: the page follows only when they were already
   * reading at the bottom, and otherwise a dismissible hint appears.
   */
  function settleAfterAppend(wasFollowing) {
    if (restoring) {
      return;
    }
    if (wasFollowing) {
      hideNewPassageHint();
      followToBottom();
    } else {
      showNewPassageHint();
    }
  }

  function rememberScroll() {
    window.clearTimeout(scrollSaveTimer);
    scrollSaveTimer = window.setTimeout(() => {
      journey.scrollY = Math.round(window.scrollY);
      persistJourney();
    }, SCROLL_SAVE_DELAY);
  }

  /* ---------------------------------------------------------- node markup */

  function appendParagraph(node) {
    const classes = ["passage", `passage-${node.type}`];
    if (node.band) {
      classes.push(`passage-band-${node.band}`);
    }
    const paragraph = element("p", classes.join(" "), node.text);
    if (node.type === "chosen") {
      paragraph.dataset.responseBand = node.band || "";
    }
    story.appendChild(paragraph);
    return paragraph;
  }

  function appendActHeading(node) {
    const heading = element("header", "act-heading");
    heading.id = `act-${node.actNumber}`;
    heading.appendChild(
      element(
        "p",
        "technical-label act-kicker",
        `ACT ${String(node.actNumber).padStart(2, "0")} / 12 · ${node.time}`,
      ),
    );
    heading.appendChild(element("h2", "act-title", node.title));
    story.appendChild(heading);
    if (!restoring) {
      announce(`Act ${node.actNumber} of 12. ${node.title}.`);
    }
    return heading;
  }

  function appendInterludeHeading(node) {
    const heading = element("header", "interlude-heading");
    heading.appendChild(element("p", "technical-label", node.eyebrow));
    heading.appendChild(element("h2", "interlude-title", node.title));
    if (node.note) {
      heading.appendChild(element("p", "interlude-note", node.note));
    }
    story.appendChild(heading);
    return heading;
  }

  function appendPrologueHeading(node) {
    const heading = element("header", "prologue-heading");
    heading.appendChild(element("p", "technical-label", node.eyebrow));
    heading.appendChild(element("h1", "story-title", data.title));
    heading.appendChild(element("p", "prologue-subtitle", node.title));
    story.appendChild(heading);
    return heading;
  }

  /* ------------------------------------------------------ reflection panel */

  function actById(actId) {
    return data.story.acts.find((act) => act.id === actId);
  }

  function buildActPanel(actId) {
    const act = actById(actId);
    const panel = element("section", "reflection-panel");
    panel.dataset.act = actId;
    panel.tabIndex = -1;
    panel.setAttribute("aria-label", `Reflection panel for Act ${act.number}`);

    const kicker = element("p", "technical-label reflection-kicker", "");
    const counter = element("p", "technical-label reflection-counter", "");
    const statement = element("h3", "reflection-statement", "");
    statement.id = `statement-${actId}`;

    const anchors = element("div", "scale-anchors");
    anchors.setAttribute("aria-hidden", "true");
    anchors.append(
      element("span", "", data.assessment.spectrum.leftAnchor),
      element("span", "", data.assessment.spectrum.rightAnchor),
    );

    const choices = element("div", "response-choices");
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-labelledby", statement.id);

    const buttons = RESPONSE_LABELS.map((label, index) => {
      const raw = index + 1;
      const button = element("button", "response-choice", String(raw));
      button.type = "button";
      button.dataset.level = String(raw);
      button.setAttribute("aria-label", `${raw}. ${label}`);
      button.addEventListener("click", () => selectResponse(actId, raw));
      button.addEventListener("keydown", (event) => {
        const step =
          event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) {
          return;
        }
        event.preventDefault();
        const next = buttons[(index + step + buttons.length) % buttons.length];
        next.focus();
      });
      choices.appendChild(button);
      return button;
    });

    const readout = element("p", "response-readout", "");
    readout.setAttribute("aria-hidden", "true");

    const footer = element("div", "reflection-footer");
    const back = element("button", "back-button", "← Previous statement");
    back.type = "button";
    back.hidden = true;
    back.addEventListener("click", () => stepBackOneQuestion());
    const hint = element(
      "p",
      "response-hint",
      "Choose one response. The watch continues on its own.",
    );
    footer.append(back, hint);

    const summary = element("div", "reflection-summary");
    summary.hidden = true;

    panel.append(kicker, counter, statement, anchors, choices, readout, footer, summary);
    panel.refs = { kicker, counter, statement, choices, buttons, readout, back, hint, summary };
    return panel;
  }

  function ensureActPanel(actId) {
    if (actPanels.has(actId)) {
      return actPanels.get(actId);
    }
    const wasFollowing = isFollowing();
    const panel = buildActPanel(actId);
    story.appendChild(panel);
    actPanels.set(actId, panel);
    settleAfterAppend(wasFollowing);
    return panel;
  }

  function showQuestion(node) {
    const panel = ensureActPanel(node.actId);
    const refs = panel.refs;
    const act = actById(node.actId);

    panel.classList.remove("is-locked");
    refs.kicker.textContent = `WATCHKEEPER REFLECTION · ACT ${String(act.number).padStart(2, "0")}`;
    refs.counter.textContent = `STATEMENT ${String(node.index + 1).padStart(2, "0")} / ${TOTAL_ITEMS} · ${node.offset + 1} OF ${core.ITEMS_PER_ACT} IN THIS ACT`;
    refs.statement.textContent = node.item.statement;
    refs.readout.textContent = "";
    refs.hint.hidden = false;
    refs.summary.hidden = true;
    refs.summary.replaceChildren();

    refs.buttons.forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
      button.disabled = false;
      button.removeAttribute("aria-disabled");
    });

    refs.back.hidden = !core.canStepBack(data, responses);
    panel.dataset.question = String(node.index + 1);
  }

  function lockActPanel(actId) {
    const panel = actPanels.get(actId);
    if (!panel || panel.classList.contains("is-locked")) {
      return;
    }
    const act = actById(actId);
    const refs = panel.refs;
    const start = (act.number - 1) * core.ITEMS_PER_ACT;
    const chosen = responses.answers.slice(start, start + core.ITEMS_PER_ACT);

    if (panel.contains(document.activeElement)) {
      panel.focus({ preventScroll: true });
    }

    panel.classList.add("is-locked");
    refs.kicker.textContent = `WATCHKEEPER REFLECTION · ACT ${String(act.number).padStart(2, "0")} · CLOSED`;
    refs.statement.textContent = "Five responses recorded.";
    refs.counter.textContent = `STATEMENTS ${String(start + 1).padStart(2, "0")}–${String(
      start + core.ITEMS_PER_ACT,
    ).padStart(2, "0")} / ${TOTAL_ITEMS}`;
    refs.readout.textContent = "";
    refs.back.hidden = true;
    refs.hint.hidden = true;
    refs.buttons.forEach((button) => {
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });

    refs.summary.replaceChildren();
    chosen.forEach((raw, offset) => {
      const chip = element("span", "reflection-chip");
      chip.append(
        element("span", "reflection-chip-index", String(start + offset + 1)),
        element("span", "reflection-chip-value", String(raw)),
      );
      chip.title = `Statement ${start + offset + 1}: ${raw}. ${RESPONSE_LABELS[raw - 1]}`;
      refs.summary.appendChild(chip);
    });
    refs.summary.hidden = false;
  }

  /* ------------------------------------------------------ materialisation */

  function materialise(node) {
    switch (node.type) {
      case "prologue-heading":
        return appendPrologueHeading(node);
      case "act-heading":
        return appendActHeading(node);
      case "interlude-heading":
        return appendInterludeHeading(node);
      case "question": {
        // The panel already carried this question; revealing it only settles
        // the panel once the Act's fifth response is in.
        ensureActPanel(node.actId);
        if (node.offset === core.ITEMS_PER_ACT - 1) {
          lockActPanel(node.actId);
        }
        return null;
      }
      case "results":
        return appendResults();
      default:
        return appendParagraph(node);
    }
  }

  function renderRevealedNodes() {
    while (renderedCount < journey.revealed && renderedCount < nodes.length) {
      materialise(nodes[renderedCount]);
      renderedCount += 1;
    }
  }

  /* ---------------------------------------------------------- reveal loop */

  function nextNode() {
    return nodes[journey.revealed] || null;
  }

  function playbackIdle() {
    const node = nextNode();
    return !node || node.type === "question";
  }

  function revealOne() {
    const node = nextNode();
    if (!node || node.type === "question") {
      return null;
    }
    const wasFollowing = isFollowing();
    journey.revealed += 1;
    const rendered = materialise(node);
    renderedCount = journey.revealed;
    persistJourney();
    settleAfterAppend(wasFollowing);
    return rendered;
  }

  /* Reveal every passage that is already available, with no delay. */
  function revealAllAvailable() {
    const wasFollowing = isFollowing();
    restoring = true;
    while (!playbackIdle()) {
      journey.revealed += 1;
      materialise(nodes[journey.revealed - 1]);
      renderedCount = journey.revealed;
    }
    restoring = false;
    persistJourney();
    return wasFollowing;
  }

  function scheduleReveal() {
    window.clearTimeout(revealTimer);
    if (preferences.paused || playbackIdle() || prefersReducedMotion()) {
      updatePlaybackControls();
      return;
    }
    revealTimer = window.setTimeout(() => {
      revealOne();
      advance();
    }, core.revealDelay(preferences));
    updatePlaybackControls();
  }

  function showEverythingAvailable() {
    window.clearTimeout(revealTimer);
    settleAfterAppend(revealAllAvailable());
    advance();
  }

  function refreshNodes() {
    nodes = core.buildNodes(data, responses);
    nodesBuiltFor = responses.answers.length;
    if (journey.revealed > nodes.length) {
      journey.revealed = nodes.length;
    }
  }

  /*
   * The single place that reconciles the recorded responses with what the
   * document shows: catch the DOM up, present the pending question if there is
   * one, and keep playback running otherwise.
   */
  function advance() {
    if (nodesBuiltFor !== responses.answers.length) {
      refreshNodes();
    }
    renderRevealedNodes();

    // Readers who ask for reduced motion get the passages at once rather than
    // watching them arrive.
    if (!preferences.paused && prefersReducedMotion()) {
      settleAfterAppend(revealAllAvailable());
    }

    const pending = core.pendingQuestion(nodes, journey.revealed);
    if (pending) {
      showQuestion(pending);
    }

    updateProgress();
    updateAtmosphere();
    scheduleReveal();
  }

  /* ---------------------------------------------------------- interaction */

  function selectResponse(actId, raw) {
    if (selectionLocked) {
      return;
    }
    const pending = core.pendingQuestion(nodes, journey.revealed);
    if (!pending || pending.actId !== actId) {
      return;
    }

    selectionLocked = true;
    const panel = actPanels.get(actId);
    const refs = panel.refs;
    const button = refs.buttons[raw - 1];
    refs.buttons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    refs.readout.textContent = `${raw} · ${RESPONSE_LABELS[raw - 1]}`;
    refs.back.hidden = true;

    responses = core.answerAt(data, responses, pending.index, raw);
    persistResponses();
    journey.revealed += 1;
    persistJourney();

    const answered = responses.answers.length;
    announce(
      answered === TOTAL_ITEMS
        ? `Response ${raw}, ${RESPONSE_LABELS[raw - 1]}. All 60 responses recorded.`
        : `Response ${raw}, ${RESPONSE_LABELS[raw - 1]}. ${answered} of ${TOTAL_ITEMS} recorded.`,
    );

    window.setTimeout(
      () => {
        selectionLocked = false;
        advance();
        const next = core.pendingQuestion(nodes, journey.revealed);
        if (next) {
          announce(next.item.statement);
        }
        if (audio) {
          audio.sync(data, responses, core);
        }
      },
      prefersReducedMotion() ? 0 : SELECTED_STATE_DELAY,
    );
  }

  function stepBackOneQuestion() {
    if (selectionLocked || !core.canStepBack(data, responses)) {
      return;
    }
    const previous = responses.answers[responses.answers.length - 1];
    responses = core.stepBack(data, responses);
    persistResponses();
    journey.revealed = Math.max(0, journey.revealed - 1);
    persistJourney();
    advance();

    const pending = core.pendingQuestion(nodes, journey.revealed);
    if (!pending) {
      return;
    }
    // Re-offer the response the reader is stepping back to, still selected, so
    // they can see what they chose before changing it.
    const panel = actPanels.get(pending.actId);
    const chosen = panel.refs.buttons[previous - 1];
    panel.refs.buttons.forEach((item) => {
      const selected = item === chosen;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    panel.refs.readout.textContent = `${previous} · ${RESPONSE_LABELS[previous - 1]}`;
    chosen?.focus({ preventScroll: true });
    announce(`Returned to statement ${pending.index + 1}. ${pending.item.statement}`);
  }

  function handleShortcut(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable)
    ) {
      return;
    }
    if (document.querySelector("dialog[open]")) {
      return;
    }
    const raw = Number(event.key);
    if (!Number.isInteger(raw) || raw < core.MIN_RESPONSE || raw > core.MAX_RESPONSE) {
      return;
    }
    const pending = core.pendingQuestion(nodes, journey.revealed);
    if (!pending) {
      return;
    }
    event.preventDefault();
    selectResponse(pending.actId, raw);
  }

  /* ------------------------------------------------------ header controls */

  function updateProgress() {
    const answered = responses.answers.length;
    progressFill.style.transform = `scaleX(${answered / TOTAL_ITEMS})`;
    progressBar.setAttribute("aria-valuenow", String(answered));
    progressLabel.textContent = answered
      ? answered === TOTAL_ITEMS
        ? "Journey complete"
        : `${answered} of ${TOTAL_ITEMS}`
      : "The final watch";
    restartButton.hidden = !responses.onboardingComplete;
  }

  function updatePlaybackControls() {
    const idle = playbackIdle();
    playbackToggle.querySelector(".tool-label").textContent = preferences.paused
      ? "Resume"
      : "Pause";
    playbackToggle.setAttribute("aria-pressed", String(preferences.paused));
    playbackToggle.setAttribute(
      "aria-label",
      preferences.paused ? "Resume revealing the story" : "Pause revealing the story",
    );
    // Pause stays available even while the story is waiting on a response, so
    // a reader can settle the next Act's passages before they start arriving.
    showNowButton.disabled = idle;
    document.body.classList.toggle("playback-paused", preferences.paused);
    speedControl.querySelectorAll(".speed-choice").forEach((choice) => {
      const active = choice.dataset.speed === preferences.textSpeed;
      choice.classList.toggle("is-selected", active);
      choice.setAttribute("aria-checked", String(active));
      choice.tabIndex = active ? 0 : -1;
    });
  }

  function setTextSpeed(speed) {
    preferences = core.sanitisePreferences({ ...preferences, textSpeed: speed });
    persistPreferences();
    scheduleReveal();
    announce(`Text speed ${preferences.textSpeed}.`);
  }

  function togglePlayback() {
    preferences = core.sanitisePreferences({
      ...preferences,
      paused: !preferences.paused,
    });
    persistPreferences();
    if (preferences.paused) {
      window.clearTimeout(revealTimer);
      updatePlaybackControls();
      announce("Story paused.");
    } else {
      scheduleReveal();
      announce("Story resumed.");
    }
  }

  /*
   * Aurora Station's sky answers the story: the display grows through the late
   * Acts and fades as the rescue arrives.
   */
  function updateAtmosphere() {
    const answered = responses.answers.length;
    document.body.classList.toggle(
      "aurora-surge-active",
      answered >= 40 && answered < TOTAL_ITEMS,
    );
    document.body.classList.toggle("aurora-rescue-contact", answered >= 58);
    document.body.classList.toggle("aurora-rescue-faint", answered >= 59);
    document.body.classList.toggle(
      "debrief-mode",
      Boolean(document.getElementById("results")),
    );
    const act = data.story.acts[core.actIndexForAnswerCount(answered)];
    document.body.dataset.storyPhase = act ? act.id : "act-01";
  }

  /* ----------------------------------------------------------- the prelude */

  function buildStationEntry() {
    if (entryDialog) {
      return entryDialog;
    }

    const prelude = data.prelude;
    const [identityCopy, calibrationCopy, orientationCopy] = prelude.steps;

    const dialog = element("dialog", "station-entry");
    dialog.setAttribute("aria-labelledby", "station-entry-title");
    dialog.setAttribute("aria-describedby", "station-entry-summary");

    const frame = element("div", "station-entry-frame");
    const header = element("header", "station-entry-header");
    header.appendChild(element("p", "technical-label entry-kicker", prelude.kicker));
    const stepIndicator = element(
      "p",
      "technical-label entry-step-indicator",
      identityCopy.indicator,
    );
    header.appendChild(stepIndicator);
    frame.appendChild(header);

    const title = element("h1", "entry-title", identityCopy.title);
    title.id = "station-entry-title";
    const summary = element("p", "entry-summary", identityCopy.summary);
    summary.id = "station-entry-summary";
    frame.append(title, summary);

    /* --- step 1: identity --- */
    const identityPanel = element("section", "entry-panel");
    const identityForm = element("form", "identity-form");
    identityForm.noValidate = true;

    const nameLabel = element("label", "technical-label entry-field-label", identityCopy.fieldLabel);
    nameLabel.htmlFor = "player-name";
    const nameInput = element("input", "entry-name-input");
    nameInput.id = "player-name";
    nameInput.name = "playerName";
    nameInput.type = "text";
    nameInput.autocomplete = "name";
    nameInput.maxLength = 60;
    nameInput.required = true;
    nameInput.placeholder = identityCopy.placeholder;

    const nameError = element("p", "entry-field-error", identityCopy.error);
    nameError.id = "player-name-error";
    nameError.hidden = true;

    const continueButton = element("button", "entry-primary", identityCopy.primary);
    continueButton.type = "submit";

    identityForm.append(
      nameLabel,
      nameInput,
      element("p", "entry-field-note", identityCopy.note),
      nameError,
      continueButton,
    );
    identityPanel.appendChild(identityForm);

    /* --- step 2: one unscored calibration response --- */
    const calibrationPanel = element("section", "entry-panel");
    calibrationPanel.hidden = true;
    calibrationPanel.append(
      element("p", "calibration-prompt", calibrationCopy.prompt),
      element("p", "calibration-statement", calibrationCopy.statement),
    );

    const calibrationAnchors = element("div", "scale-anchors");
    calibrationAnchors.setAttribute("aria-hidden", "true");
    calibrationAnchors.append(
      element("span", "", data.assessment.spectrum.leftAnchor),
      element("span", "", data.assessment.spectrum.rightAnchor),
    );
    calibrationPanel.appendChild(calibrationAnchors);

    const calibrationChoices = element("div", "response-choices");
    calibrationChoices.setAttribute("role", "group");
    calibrationChoices.setAttribute("aria-label", calibrationCopy.statement);
    const calibrationReadout = element("p", "response-readout", "");
    const confirmButton = element("button", "entry-primary", calibrationCopy.primary);
    confirmButton.type = "button";
    confirmButton.disabled = true;

    const calibrationButtons = RESPONSE_LABELS.map((label, index) => {
      const raw = index + 1;
      const button = element("button", "response-choice", String(raw));
      button.type = "button";
      button.dataset.level = String(raw);
      button.setAttribute("aria-label", `${raw}. ${label}`);
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        calibrationButtons.forEach((item) => {
          const selected = item === button;
          item.classList.toggle("is-selected", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
        calibrationReadout.textContent = `${raw} · ${label}`;
        confirmButton.disabled = false;
      });
      calibrationChoices.appendChild(button);
      return button;
    });

    const calibrationBack = element("button", "entry-secondary", calibrationCopy.back);
    calibrationBack.type = "button";
    const calibrationFooter = element("footer", "entry-footer");
    calibrationFooter.append(calibrationBack, confirmButton);
    calibrationPanel.append(calibrationChoices, calibrationReadout, calibrationFooter);

    /* --- step 3: self-report instructions --- */
    const orientationPanel = element("section", "entry-panel");
    orientationPanel.hidden = true;
    orientationPanel.appendChild(element("p", "orientation-lead", orientationCopy.lead));

    const guidance = element("div", "orientation-guidance");
    orientationCopy.guidance.forEach((entry) => {
      const item = element("section", "orientation-guidance-item");
      item.append(
        element("p", "technical-label orientation-guidance-label", entry.label),
        element("p", "orientation-guidance-copy", entry.copy),
      );
      guidance.appendChild(item);
    });
    orientationPanel.append(
      guidance,
      element("p", "orientation-disclaimer", orientationCopy.disclaimer),
    );

    const orientationBack = element("button", "entry-secondary", orientationCopy.back);
    orientationBack.type = "button";
    const beginButton = element("button", "entry-primary", orientationCopy.primary);
    beginButton.type = "button";
    const orientationFooter = element("footer", "entry-footer");
    orientationFooter.append(orientationBack, beginButton);
    orientationPanel.appendChild(orientationFooter);

    frame.append(identityPanel, calibrationPanel, orientationPanel);
    dialog.appendChild(frame);

    const panels = {
      identity: { panel: identityPanel, copy: identityCopy, focus: () => nameInput },
      calibration: {
        panel: calibrationPanel,
        copy: calibrationCopy,
        focus: () => calibrationButtons[0],
      },
      orientation: {
        panel: orientationPanel,
        copy: orientationCopy,
        focus: () => beginButton,
      },
    };

    function showStep(step) {
      const config = panels[step];
      if (!config) {
        return;
      }
      Object.entries(panels).forEach(([key, entry]) => {
        entry.panel.hidden = key !== step;
      });
      stepIndicator.textContent = config.copy.indicator;
      title.textContent = config.copy.title;
      summary.textContent = config.copy.summary;
      window.requestAnimationFrame(() => config.focus()?.focus());
    }

    dialog.prepareEntry = () => {
      nameInput.value = responses.playerName || "";
      nameError.hidden = true;
      nameInput.removeAttribute("aria-invalid");
      delete dialog.dataset.pendingName;
      calibrationButtons.forEach((button) => {
        button.classList.remove("is-selected");
        button.setAttribute("aria-pressed", "false");
      });
      calibrationReadout.textContent = "";
      confirmButton.disabled = true;
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

    calibrationBack.addEventListener("click", () => showStep("identity"));
    confirmButton.addEventListener("click", () => showStep("orientation"));
    orientationBack.addEventListener("click", () => showStep("calibration"));
    beginButton.addEventListener("click", () => {
      responses = core.setPlayerIdentity(
        data,
        responses,
        dialog.dataset.pendingName || nameInput.value,
      );
      persistResponses();
      closeStationEntry();
    });

    // The prelude has to be completed, so Escape must not dismiss it.
    dialog.addEventListener("cancel", (event) => event.preventDefault());

    document.body.appendChild(dialog);
    entryDialog = dialog;
    return dialog;
  }

  function openStationEntry() {
    if (responses.onboardingComplete && responses.playerName) {
      return;
    }
    const dialog = buildStationEntry();
    dialog.prepareEntry();
    document.body.classList.add("onboarding-open");
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  function closeStationEntry() {
    document.body.classList.remove("onboarding-open");
    if (entryDialog?.open) {
      entryDialog.close();
    }
    announce(`Welcome to the final watch, ${responses.playerName}.`);
    advance();
  }

  /* -------------------------------------------------------------- results */

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

    const points = result.context.stages.map((stage, index) => ({
      x: 100 + index * 200,
      y: 56 - core.normalisePosition(stage.score) * 42,
    }));

    const line = document.createElementNS(namespace, "polyline");
    line.setAttribute("points", points.map((point) => `${point.x},${point.y}`).join(" "));
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(line);

    points.forEach((point) => {
      const dot = document.createElementNS(namespace, "circle");
      dot.setAttribute("cx", String(point.x));
      dot.setAttribute("cy", String(point.y));
      dot.setAttribute("r", "4.5");
      dot.setAttribute("fill", "currentColor");
      svg.appendChild(dot);
    });

    return svg;
  }

  function openExportDialog(settings) {
    let dialog = document.querySelector(".profile-export-dialog");
    if (!dialog) {
      dialog = element("dialog", "profile-export-dialog");
      const frame = element("div", "profile-export-frame");
      const heading = element("h2", "", "Preparing your report");
      heading.dataset.exportTitle = "true";
      const status = element("p", "profile-export-status", "");
      status.dataset.exportStatus = "true";
      const progress = element("div", "profile-export-progress");
      progress.appendChild(element("span"));
      frame.append(
        element("p", "technical-label", "ASSEMBLING REPORT"),
        heading,
        status,
        progress,
      );
      dialog.appendChild(frame);
      document.body.appendChild(dialog);
    }

    const heading = dialog.querySelector("[data-export-title]");
    const status = dialog.querySelector("[data-export-status]");
    const bar = dialog.querySelector(".profile-export-progress span");
    heading.textContent = settings.title;
    status.textContent = settings.status;
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
        heading.textContent = settings.completeTitle;
        status.textContent = message;
        bar.style.width = "100%";
      },
      fail(message) {
        heading.textContent = "Report not assembled";
        status.textContent = message;
        bar.style.width = "0%";
      },
    };
  }

  function exportButton(label, className, settings, run, successMessage) {
    const button = element("button", `report-button ${className}`.trim(), label);
    button.type = "button";
    button.addEventListener("click", async () => {
      button.disabled = true;
      const progress = openExportDialog(settings);
      try {
        await run({
          onProgress(page, total, text) {
            progress.update(page, total, text);
          },
          onAssembling() {
            progress.assembling();
          },
        });
        progress.complete(successMessage);
        announce(successMessage);
        window.setTimeout(() => progress.dialog.close(), 900);
      } catch {
        const failure =
          "The report could not be assembled. Your results remain available on screen.";
        progress.fail(failure);
        announce(failure);
      } finally {
        button.disabled = false;
      }
    });
    return button;
  }

  function resultSection(eyebrow, heading, introduction, className) {
    const section = element("section", `result-section ${className || ""}`.trim());
    section.append(element("p", "technical-label", eyebrow), element("h3", "", heading));
    if (introduction) {
      section.appendChild(element("p", "section-introduction", introduction));
    }
    return section;
  }

  function appendRoleSection(parent, role) {
    const section = resultSection(
      "01 · ROLE",
      "Recommended Aurora Role",
      "The contribution your Five-Element profile is best placed to make in this mission.",
      "result-role",
    );
    const card = element("article", "aurora-role-card");
    card.style.setProperty("--result-colour", role.colour);

    const header = element("header", "role-card-header");
    const identity = element("div");
    identity.append(
      element("h4", "role-title", role.title),
      element("p", "role-element", `${role.element} · ${role.trait}`),
    );
    header.append(identity, element("span", "role-fit", role.fit));
    card.append(header, element("p", "role-definition", role.definition));

    const lines = element("div", "role-lines");
    [
      ["Mission function", role.function],
      ["What you bring", role.whatYouBring],
      ["Watch for", role.watchFor],
      ["Mission action", `${role.actionTitle} — ${role.action}`],
    ].forEach(([label, copy]) => {
      const line = element("section", "role-line");
      line.append(element("h5", "", label), element("p", "", copy));
      lines.appendChild(line);
    });
    card.appendChild(lines);

    const why = element("section", "role-why");
    why.append(
      element("h5", "", "Why this Role"),
      element("p", "", role.why),
      element("small", "", role.basis),
    );
    card.appendChild(why);

    section.appendChild(card);
    parent.appendChild(section);
  }

  function appendCurrentsSection(parent, profile) {
    const section = resultSection(
      "02 · PROFILE",
      "How the five currents showed up",
      "Each current is a bipolar range shown out of 5. Neither end is automatically better, and the shaded centre marks the balanced or context-sensitive range.",
      "result-currents",
    );

    profile.elements.forEach((result) => {
      const item = element("article", "current-item");
      item.style.setProperty("--result-colour", result.colour);

      const header = element("header", "current-header");
      const identity = element("div");
      identity.append(
        element("h4", "current-name", result.element),
        element("p", "current-lens", `${result.trait} · ${result.lens}`),
      );
      header.append(
        identity,
        element("strong", "current-score", scoreText(result.score)),
      );
      item.appendChild(header);

      const labels = element("div", "spectrum-end-labels");
      labels.setAttribute("aria-hidden", "true");
      labels.append(
        element("span", "", result.spectrum.lower),
        element("span", "", result.spectrum.higher),
      );
      item.appendChild(labels);

      const track = element("div", "bipolar-track");
      track.setAttribute("aria-hidden", "true");
      track.append(
        element("span", "bipolar-balanced-range"),
        element("span", "bipolar-midpoint"),
      );
      const marker = element("span", "bipolar-marker");
      marker.style.left = `${result.position * 100}%`;
      track.appendChild(marker);
      item.appendChild(track);

      const reading = element("div", "current-reading");
      reading.append(
        element("strong", "current-expression", result.expression),
        element("p", "", result.description),
        element("p", "current-plain", result.plainMeaning),
      );
      item.appendChild(reading);

      const facets = element("div", "facet-list");
      result.facets.forEach((facet) => {
        const facetItem = element("section", "facet-item");
        facetItem.append(
          element("p", "technical-label facet-name", facet.name),
          element("strong", "facet-score", scoreText(facet.score)),
          element("p", "facet-definition", result.facetDefinitions[facet.name] || ""),
        );
        facets.appendChild(facetItem);
      });
      item.appendChild(facets);

      if (result.facetPattern) {
        item.appendChild(element("p", "facet-pattern", result.facetPattern));
      }

      const guidance = element("div", "current-guidance");
      [
        ["POTENTIAL ADVANTAGE", result.potentialAdvantage],
        ["POSSIBLE OVEREXTENSION", result.overextension],
        ["REFLECTION", result.reflection],
      ].forEach(([label, copy]) => {
        if (!copy) {
          return;
        }
        const block = element("section", "guidance-block");
        block.append(
          element("p", "technical-label", label),
          element("p", "", copy),
        );
        guidance.appendChild(block);
      });
      item.appendChild(guidance);

      section.appendChild(item);
    });

    parent.appendChild(section);
  }

  function appendMovementSection(parent, profile) {
    const section = resultSection(
      "03 · MOVEMENT",
      "How the pattern moved",
      profile.context.note,
      "result-movement",
    );

    profile.elements.forEach((result) => {
      const row = element("section", "movement-row");
      row.style.setProperty("--result-colour", result.colour);
      const header = element("div", "movement-header");
      header.append(
        element("h4", "", result.element),
        element("span", "movement-label", result.context.label),
      );
      row.append(header, movementGraphic(result));

      const stages = element("div", "movement-stages");
      result.context.stages.forEach((stage) => {
        const stageItem = element("span", "movement-stage");
        stageItem.append(
          element("span", "technical-label", stage.label),
          element("strong", "", scoreText(stage.score)),
        );
        stages.appendChild(stageItem);
      });
      row.appendChild(stages);
      section.appendChild(row);
    });

    section.appendChild(element("p", "movement-summary", profile.context.summary));
    parent.appendChild(section);
  }

  function appendRecordSection(parent, profile) {
    const section = resultSection(
      "04 · RECORD",
      "What the watch leaves behind",
      null,
      "result-record",
    );

    if (profile.finalChoice) {
      const block = element("section", "record-block");
      block.append(
        element("p", "technical-label", "FINAL OPERATIONAL OUTCOME"),
        element("h4", "", profile.finalChoice.title),
        element("p", "", profile.finalChoice.text),
        element("small", "", profile.finalChoice.note),
      );
      section.appendChild(block);
    }

    const quality = element("section", "record-block");
    quality.append(
      element("p", "technical-label", "RESPONSE PATTERN"),
      element("h4", "", profile.quality.status),
      element("p", "", profile.quality.summary),
    );
    section.appendChild(quality);

    const method = element("section", "record-block");
    method.append(
      element("p", "technical-label", "METHOD"),
      element("p", "", data.assessment.methodNote),
      element("small", "", profile.roleModel),
    );
    section.appendChild(method);

    parent.appendChild(section);
  }

  function appendResults() {
    const profile = core.analyseProfile(data, responses);
    const section = element("section", "results");
    section.id = "results";
    section.tabIndex = -1;

    const masthead = element("header", "results-masthead");
    masthead.append(
      element("p", "technical-label", "DAWN DEBRIEF · FINAL WATCH COMPLETE"),
      element(
        "h2",
        "results-title",
        `${profile.playerName || "Watchkeeper"}, your five-current reflection`,
      ),
      element("p", "results-overview", profile.overview),
    );
    section.appendChild(masthead);

    appendRoleSection(section, profile.role);
    appendCurrentsSection(section, profile);
    appendMovementSection(section, profile);
    appendRecordSection(section, profile);

    const actions = element("div", "result-actions");
    if (pdfExporter) {
      actions.append(
        exportButton(
          "Download story PDF",
          "report-button-secondary",
          {
            title: "Preparing your story",
            status: "Laying out the journey…",
            completeTitle: "Story ready",
          },
          (hooks) =>
            pdfExporter.downloadStory(
              data,
              responses,
              core,
              `Aurora_Station_Story_${fileSafeName(responses.playerName)}.pdf`,
              hooks,
            ),
          "Your personalised story PDF has been downloaded.",
        ),
        exportButton(
          "Download profile PDF",
          "",
          {
            title: "Preparing your profile",
            status: "Preparing the report pages…",
            completeTitle: "Profile ready",
          },
          (hooks) =>
            pdfExporter.downloadProfile(
              data,
              responses,
              core,
              `Aurora_Station_Profile_${fileSafeName(responses.playerName)}.pdf`,
              hooks,
            ),
          "Your multi-page Aurora Station profile has been downloaded.",
        ),
      );
    }

    const again = element("button", "restart-button", "Start again");
    again.type = "button";
    again.addEventListener("click", confirmRestart);
    actions.appendChild(again);
    section.appendChild(actions);

    story.appendChild(section);
    announce("The dawn debrief is ready at the end of the story.");
    return section;
  }

  /* -------------------------------------------------------------- restart */

  function confirmRestart() {
    const confirmed = window.confirm(
      "Start Aurora Station again? Saved responses and story progress will be cleared. Your sound and text-speed preferences are kept.",
    );
    if (!confirmed) {
      return;
    }
    restartJourney();
  }

  function restartJourney() {
    window.clearTimeout(revealTimer);
    window.clearTimeout(scrollSaveTimer);
    core.clearJourneyState(storage);

    responses = core.emptyResponses();
    journey = core.emptyJourney();
    refreshNodes();
    renderedCount = 0;
    selectionLocked = false;
    actPanels.clear();
    story.replaceChildren();
    hideNewPassageHint();

    document.body.classList.remove(
      "debrief-mode",
      "aurora-surge-active",
      "aurora-rescue-contact",
      "aurora-rescue-faint",
    );
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    updateProgress();
    if (audio) {
      audio.sync(data, responses, core);
    }
    openStationEntry();
  }

  /* ----------------------------------------------------------------- boot */

  function restoreDocument() {
    restoring = true;
    story.replaceChildren();
    renderRevealedNodes();
    const pending = core.pendingQuestion(nodes, journey.revealed);
    if (pending) {
      showQuestion(pending);
    }
    restoring = false;
  }

  function bindControls() {
    playbackToggle.addEventListener("click", togglePlayback);
    showNowButton.addEventListener("click", showEverythingAvailable);
    speedControl.addEventListener("click", (event) => {
      const choice = event.target.closest(".speed-choice");
      if (choice) {
        setTextSpeed(choice.dataset.speed);
      }
    });
    speedControl.addEventListener("keydown", (event) => {
      const step =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;
      if (!step) {
        return;
      }
      event.preventDefault();
      const order = ["slow", "normal", "fast"];
      const index = order.indexOf(preferences.textSpeed);
      const next = order[(index + step + order.length) % order.length];
      setTextSpeed(next);
      speedControl.querySelector(`[data-speed="${next}"]`).focus();
    });

    newPassageButton.addEventListener("click", () => {
      hideNewPassageHint();
      followToBottom();
    });

    restartButton.addEventListener("click", confirmRestart);
    document.addEventListener("keydown", handleShortcut);
    window.addEventListener(
      "scroll",
      () => {
        if (isFollowing()) {
          hideNewPassageHint();
        }
        rememberScroll();
      },
      { passive: true },
    );
  }

  function boot() {
    if (!data || !core) {
      story.replaceChildren(
        element("p", "loading-copy", "Aurora Station could not load its story data."),
      );
      return;
    }

    bindControls();
    restoreDocument();
    updateProgress();
    updateAtmosphere();
    updatePlaybackControls();

    if (audio) {
      audio.init({ toggleButton: soundToggle });
      audio.sync(data, responses, core);
    }

    if (!responses.onboardingComplete) {
      openStationEntry();
    } else {
      window.scrollTo({ top: journey.scrollY, left: 0, behavior: "auto" });
      advance();
    }
  }

  boot();
})();
