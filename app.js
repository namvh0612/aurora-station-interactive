/*
 * Aurora Station — Journey page.
 *
 * One cumulative document. core.js derives the story as an ordered node
 * stream; this module appends those nodes to #story and never rewrites what is
 * already there. The only element that changes in place is each Act's single
 * reflection panel, which carries that Act's five statements and is then
 * locked into a compact completed state.
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
  const playbackToggle = document.getElementById("playback-toggle");
  const showNowButton = document.getElementById("playback-show-now");
  const speedControl = document.getElementById("speed-control");
  const newPassageButton = document.getElementById("new-passage");
  const liveRegion = document.getElementById("screen-reader-status");

  const NEAR_BOTTOM_MARGIN = 260;
  const SELECTED_STATE_DELAY = 300;
  const FOLLOW_TAIL_MARGIN = 96;
  const USER_SCROLL_QUIET = 900;
  const SCROLL_SAVE_DELAY = 250;

  const RESPONSE_LABELS = core.responseLabels(data);
  const TOTAL_ITEMS = core.ITEM_COUNT;

  const storage = (() => {
    try {
      const probe = window.localStorage;
      probe.getItem(core.JOURNEY_KEY);
      return probe;
    } catch {
      return null;
    }
  })();

  let state = core.loadState(data, storage);
  let preferences = core.loadPreferences(storage);
  let nodes = core.buildNodes(data, state);
  let revealed = clampRevealed(state.narrative.revealedBeatCount.stream);

  let renderedCount = 0;
  let nodesBuiltFor = core.answeredCount(state);
  let revealTimer = 0;
  let scrollSaveTimer = 0;
  let userScrollTimer = 0;
  let userScrolling = false;
  let selectionLocked = false;
  let restoring = false;
  let entryDialog = null;
  const actPanels = new Map();

  function clampRevealed(value) {
    const count = Number(value);
    if (!Number.isFinite(count) || count < 0) {
      return 0;
    }
    return Math.min(Math.floor(count), nodes.length);
  }

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

  function persist() {
    state.narrative.revealedBeatCount = { stream: revealed };
    state.narrative.paused = preferences.paused === true;
    core.saveState(data, state, storage);
  }

  function persistPreferences() {
    core.savePreferences(preferences, storage);
  }

  /* --------------------------------------------------------- scroll rules */

  function isNearBottom() {
    return (
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - NEAR_BOTTOM_MARGIN
    );
  }

  function markUserScrolling() {
    userScrolling = true;
    window.clearTimeout(userScrollTimer);
    userScrollTimer = window.setTimeout(() => {
      userScrolling = false;
    }, USER_SCROLL_QUIET);
  }

  /*
   * A small, gentle follow that keeps the newest beat in view. It never jumps
   * to the absolute bottom, and it stands down entirely while the reader is
   * scrolling for themselves.
   */
  function followNewPassage(node) {
    if (!node || userScrolling) {
      return;
    }
    const bottom = node.offsetTop + node.offsetHeight;
    const target = Math.max(
      0,
      Math.min(
        bottom - window.innerHeight + FOLLOW_TAIL_MARGIN,
        document.documentElement.scrollHeight - window.innerHeight,
      ),
    );
    if (target <= window.scrollY) {
      return;
    }
    window.scrollTo({
      top: target,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  function settleAfterAppend(wasNearBottom, node) {
    if (restoring) {
      return;
    }
    if (wasNearBottom && !userScrolling) {
      newPassageButton.hidden = true;
      followNewPassage(node);
    } else {
      newPassageButton.hidden = false;
    }
  }

  function rememberScroll() {
    window.clearTimeout(scrollSaveTimer);
    scrollSaveTimer = window.setTimeout(() => {
      state.scrollY = Math.round(window.scrollY);
      persist();
    }, SCROLL_SAVE_DELAY);
  }

  /* ---------------------------------------------------------- node markup */

  function appendParagraph(node) {
    const classes = ["passage", `passage-${node.type}`];
    if (node.band) {
      classes.push(`passage-band-${node.band}`);
    }
    const paragraph = element("p", classes.join(" "), node.text);
    if (node.type === "selected") {
      paragraph.dataset.responseBand = node.band || "";
    }
    story.appendChild(paragraph);
    return paragraph;
  }

  function appendActHeading(node) {
    const heading = element("header", "act-heading");
    heading.id = `act-${node.actNumber}`;
    heading.append(
      element(
        "p",
        "technical-label act-kicker",
        `ACT ${String(node.actNumber).padStart(2, "0")} / ${core.ACT_COUNT} · ${node.time}`,
      ),
      element("h2", "act-title", node.title),
    );
    story.appendChild(heading);
    if (!restoring) {
      announce(`Act ${node.actNumber} of ${core.ACT_COUNT}. ${node.title}.`);
    }
    return heading;
  }

  function appendInterludeHeading(node) {
    const heading = element("header", "interlude-heading");
    heading.append(
      element("p", "technical-label", node.eyebrow),
      element("h2", "interlude-title", node.title),
    );
    story.appendChild(heading);
    return heading;
  }

  function appendPrologueHeading(node) {
    const heading = element("header", "prologue-heading");
    heading.append(
      element("p", "technical-label", node.eyebrow),
      element("h1", "story-title", data.title),
      element("p", "prologue-subtitle", node.title),
    );
    story.appendChild(heading);
    return heading;
  }

  /* ------------------------------------------------------ reflection panel */

  function actByNumber(actNumber) {
    return data.story.acts.find((act) => act.number === actNumber);
  }

  function buildActPanel(actNumber) {
    const panel = element("section", "reflection-panel");
    panel.dataset.act = String(actNumber);
    panel.tabIndex = -1;
    panel.setAttribute("aria-label", `Watchkeeper reflection for Act ${actNumber}`);

    const kicker = element("p", "technical-label reflection-kicker", "WATCHKEEPER REFLECTION");
    const counter = element("p", "technical-label reflection-counter", "");
    const statementNumber = element("p", "technical-label reflection-statement-number", "");
    const statement = element("h3", "reflection-statement", "");
    statement.id = `statement-act-${actNumber}`;

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
      button.addEventListener("click", () => selectResponse(actNumber, raw));
      button.addEventListener("keydown", (event) => {
        const step =
          event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) {
          return;
        }
        event.preventDefault();
        buttons[(index + step + buttons.length) % buttons.length].focus();
      });
      choices.appendChild(button);
      return button;
    });

    const signalLabel = element("p", "technical-label response-signal-label", "RESPONSE SIGNAL");
    const readout = element("p", "response-readout", "");

    const footer = element("div", "reflection-footer");
    const back = element("button", "back-button", "← Back");
    back.type = "button";
    back.hidden = true;
    back.addEventListener("click", stepBack);
    footer.appendChild(back);

    panel.append(
      kicker,
      counter,
      statementNumber,
      statement,
      anchors,
      choices,
      signalLabel,
      readout,
      footer,
    );
    panel.refs = {
      kicker,
      counter,
      statementNumber,
      statement,
      anchors,
      choices,
      buttons,
      signalLabel,
      readout,
      footer,
      back,
    };
    return panel;
  }

  function ensureActPanel(actNumber) {
    if (actPanels.has(actNumber)) {
      return actPanels.get(actNumber);
    }
    const wasNearBottom = isNearBottom();
    const panel = buildActPanel(actNumber);
    story.appendChild(panel);
    actPanels.set(actNumber, panel);
    settleAfterAppend(wasNearBottom, panel);
    return panel;
  }

  function showQuestion(node) {
    const panel = ensureActPanel(node.actNumber);
    const refs = panel.refs;
    const item = node.item;

    panel.classList.remove("is-locked");
    refs.counter.textContent = `${String(item.positionInAct).padStart(2, "0")} / ${String(core.ITEMS_PER_ACT).padStart(2, "0")}`;
    refs.statementNumber.textContent = `STATEMENT ${String(item.bfiItem).padStart(2, "0")} / ${TOTAL_ITEMS}`;
    refs.statement.textContent = item.statement;
    refs.readout.textContent = "";
    refs.anchors.hidden = false;
    refs.choices.hidden = false;
    refs.signalLabel.hidden = false;
    refs.readout.hidden = false;

    refs.buttons.forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
      button.disabled = false;
      button.removeAttribute("aria-disabled");
    });

    refs.back.hidden = !core.canGoBack(data, state);
    panel.dataset.statement = String(item.bfiItem);
  }

  function lockActPanel(actNumber) {
    const panel = actPanels.get(actNumber);
    if (!panel || panel.classList.contains("is-locked")) {
      return;
    }
    const refs = panel.refs;
    if (panel.contains(document.activeElement)) {
      panel.focus({ preventScroll: true });
    }

    panel.classList.add("is-locked");
    refs.counter.textContent = `${core.ITEMS_PER_ACT} responses recorded`;
    refs.statementNumber.hidden = true;
    refs.statement.hidden = true;
    refs.anchors.hidden = true;
    refs.choices.hidden = true;
    refs.signalLabel.hidden = true;
    refs.readout.hidden = true;
    refs.back.hidden = true;
    refs.buttons.forEach((button) => {
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
    });
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
        ensureActPanel(node.actNumber);
        if (node.item.positionInAct === core.ITEMS_PER_ACT) {
          lockActPanel(node.actNumber);
        }
        return null;
      }
      case "completion":
        return appendCompletionPanel();
      default:
        return appendParagraph(node);
    }
  }

  function renderRevealedNodes() {
    while (renderedCount < revealed && renderedCount < nodes.length) {
      materialise(nodes[renderedCount]);
      renderedCount += 1;
    }
  }

  /* ---------------------------------------------------------- reveal loop */

  /*
   * Playback rests only when the reader is being asked something. An already
   * answered question node still has to be consumed — on a restored journey it
   * is what rebuilds and locks that Act's panel.
   */
  function isGate(node) {
    return Boolean(node) && node.type === "question" && !node.answered;
  }

  function playbackIdle() {
    const node = nodes[revealed];
    return !node || isGate(node);
  }

  function revealOne() {
    const node = nodes[revealed];
    if (!node || isGate(node)) {
      return null;
    }
    const wasNearBottom = isNearBottom();
    revealed += 1;
    const rendered = materialise(node);
    renderedCount = revealed;
    persist();
    settleAfterAppend(wasNearBottom, rendered);
    return rendered;
  }

  /* Reveal everything already available in the active Act, with no delay. */
  function revealAllAvailable() {
    const wasNearBottom = isNearBottom();
    restoring = true;
    let last = null;
    while (!playbackIdle()) {
      revealed += 1;
      last = materialise(nodes[revealed - 1]) || last;
      renderedCount = revealed;
    }
    restoring = false;
    persist();
    return { wasNearBottom, last };
  }

  function scheduleReveal() {
    window.clearTimeout(revealTimer);
    if (preferences.paused || playbackIdle() || prefersReducedMotion()) {
      updatePlaybackControls();
      return;
    }
    // A recorded response is not a passage, so it costs no reading time.
    const delay =
      nodes[revealed].type === "question" ? 0 : core.revealDelay(preferences, false);
    revealTimer = window.setTimeout(() => {
      revealOne();
      advance();
    }, delay);
    updatePlaybackControls();
  }

  function showEverythingAvailable() {
    window.clearTimeout(revealTimer);
    const result = revealAllAvailable();
    settleAfterAppend(result.wasNearBottom, result.last);
    advance();
  }

  function refreshNodes() {
    nodes = core.buildNodes(data, state);
    nodesBuiltFor = core.answeredCount(state);
    revealed = Math.min(revealed, nodes.length);
  }

  /*
   * The single place that reconciles the recorded responses with what the
   * document shows.
   */
  function advance() {
    if (nodesBuiltFor !== core.answeredCount(state)) {
      refreshNodes();
    }
    renderRevealedNodes();

    if (!preferences.paused && prefersReducedMotion()) {
      const result = revealAllAvailable();
      settleAfterAppend(result.wasNearBottom, result.last);
    }

    const pending = core.pendingQuestion(nodes, revealed);
    if (pending) {
      showQuestion(pending);
    }

    updateProgress();
    updateAtmosphere();
    scheduleReveal();
  }

  /* ---------------------------------------------------------- interaction */

  function selectResponse(actNumber, raw) {
    if (selectionLocked) {
      return;
    }
    const pending = core.pendingQuestion(nodes, revealed);
    if (!pending || pending.actNumber !== actNumber) {
      return;
    }

    selectionLocked = true;
    const refs = actPanels.get(actNumber).refs;
    refs.buttons.forEach((button) => {
      const selected = Number(button.dataset.level) === raw;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    refs.readout.textContent = `${raw} · ${RESPONSE_LABELS[raw - 1]}`;
    refs.back.hidden = true;

    state = core.recordResponse(data, state, pending.item.id, raw);
    revealed += 1;
    persist();

    const answered = core.answeredCount(state);
    announce(
      `${raw}, ${RESPONSE_LABELS[raw - 1]}. ${answered} of ${TOTAL_ITEMS} recorded.`,
    );

    window.setTimeout(
      () => {
        selectionLocked = false;
        advance();
        const next = core.pendingQuestion(nodes, revealed);
        if (next) {
          announce(next.item.statement);
        }
        if (audio) {
          audio.sync(data, state, core);
        }
      },
      prefersReducedMotion() ? 0 : SELECTED_STATE_DELAY,
    );
  }

  function stepBack() {
    if (selectionLocked || !core.canGoBack(data, state)) {
      return;
    }
    const previous = core.previousResponse(data, state);
    state = core.goBack(data, state);
    revealed = Math.max(0, revealed - 1);
    persist();
    advance();

    const pending = core.pendingQuestion(nodes, revealed);
    if (!pending) {
      return;
    }
    // Restore the previous selection so the reader can see it before changing it.
    const refs = actPanels.get(pending.actNumber).refs;
    const chosen = refs.buttons[previous - 1];
    refs.buttons.forEach((button) => {
      const selected = button === chosen;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    refs.readout.textContent = `${previous} · ${RESPONSE_LABELS[previous - 1]}`;
    chosen?.focus({ preventScroll: true });
    announce(`Back to statement ${pending.item.bfiItem}. ${pending.item.statement}`);
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
    const pending = core.pendingQuestion(nodes, revealed);
    if (!pending) {
      return;
    }
    event.preventDefault();
    selectResponse(pending.actNumber, raw);
  }

  /* ------------------------------------------------------ header controls */

  function updateProgress() {
    const answered = core.answeredCount(state);
    progressFill.style.transform = `scaleX(${answered / TOTAL_ITEMS})`;
    progressBar.setAttribute("aria-valuenow", String(answered));
    progressLabel.textContent = answered
      ? answered === TOTAL_ITEMS
        ? "Watch complete"
        : `${answered} of ${TOTAL_ITEMS}`
      : "The final watch";
  }

  function updatePlaybackControls() {
    playbackToggle.querySelector(".tool-label").textContent = preferences.paused
      ? "Resume"
      : "Pause";
    playbackToggle.setAttribute("aria-pressed", String(Boolean(preferences.paused)));
    playbackToggle.setAttribute(
      "aria-label",
      preferences.paused ? "Resume revealing the story" : "Pause revealing the story",
    );
    showNowButton.disabled = playbackIdle();
    document.body.classList.toggle("playback-paused", Boolean(preferences.paused));
    speedControl.querySelectorAll(".speed-choice").forEach((choice) => {
      const active = choice.dataset.speed === preferences.textSpeed;
      choice.classList.toggle("is-selected", active);
      choice.setAttribute("aria-checked", String(active));
      choice.tabIndex = active ? 0 : -1;
    });
  }

  function setTextSpeed(speed) {
    preferences = { ...core.sanitisePreferences({ ...preferences, textSpeed: speed }), paused: preferences.paused };
    persistPreferences();
    scheduleReveal();
    announce(`Text speed ${preferences.textSpeed}.`);
  }

  function togglePlayback() {
    preferences.paused = !preferences.paused;
    persist();
    if (preferences.paused) {
      window.clearTimeout(revealTimer);
      updatePlaybackControls();
      announce("Story paused.");
    } else {
      scheduleReveal();
      announce("Story resumed.");
    }
  }

  function updateAtmosphere() {
    const answered = core.answeredCount(state);
    document.body.classList.toggle(
      "aurora-surge-active",
      answered >= 40 && answered < TOTAL_ITEMS,
    );
    document.body.classList.toggle("aurora-rescue-contact", answered >= 58);
    document.body.classList.toggle("aurora-rescue-faint", answered >= 59);
    const act = actByNumber(Math.min(core.ACT_COUNT, Math.floor(answered / core.ITEMS_PER_ACT) + 1));
    document.body.dataset.storyPhase = act ? act.id : "act-01";
  }

  /* ----------------------------------------------------------- the prelude */

  function buildStationEntry() {
    if (entryDialog) {
      return entryDialog;
    }

    const [identity, calibration, orientation] = data.prelude.steps;
    const dialog = element("dialog", "station-entry");
    dialog.setAttribute("aria-labelledby", "station-entry-heading");

    const frame = element("div", "station-entry-frame");
    const label = element("p", "technical-label entry-label", identity.label);
    const heading = element("h1", "entry-heading", identity.heading);
    heading.id = "station-entry-heading";
    const intro = element("p", "entry-intro", identity.intro);
    frame.append(label, heading, intro);

    /* --- stage 1: identity --- */
    const identityPanel = element("section", "entry-panel");
    const form = element("form", "identity-form");
    form.noValidate = true;

    const nameLabel = element("label", "technical-label entry-field-label", identity.fieldLabel);
    nameLabel.htmlFor = "player-name";
    const nameInput = element("input", "entry-name-input");
    nameInput.id = "player-name";
    nameInput.name = "playerName";
    nameInput.type = "text";
    nameInput.autocomplete = "name";
    nameInput.maxLength = core.MAX_NAME_LENGTH;
    nameInput.required = true;
    nameInput.placeholder = identity.placeholder;

    const nameError = element("p", "entry-field-error", identity.error);
    nameError.id = "player-name-error";
    nameError.hidden = true;

    const identityPrimary = element("button", "entry-primary", identity.primary);
    identityPrimary.type = "submit";

    form.append(
      nameLabel,
      nameInput,
      element("p", "entry-field-note", identity.note),
      nameError,
      identityPrimary,
    );
    identityPanel.appendChild(form);

    /* --- stage 2: one unscored calibration response --- */
    const calibrationPanel = element("section", "entry-panel");
    calibrationPanel.hidden = true;
    calibrationPanel.appendChild(element("p", "entry-intro", calibration.intro));
    calibrationPanel.appendChild(
      element("p", "calibration-statement", calibration.statement),
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
    calibrationChoices.setAttribute("aria-label", calibration.statement);
    const calibrationReadout = element("p", "response-readout", "");
    const calibrationPrimary = element("button", "entry-primary", calibration.primary);
    calibrationPrimary.type = "button";
    calibrationPrimary.disabled = true;

    const calibrationButtons = RESPONSE_LABELS.map((labelText, index) => {
      const raw = index + 1;
      const button = element("button", "response-choice", String(raw));
      button.type = "button";
      button.dataset.level = String(raw);
      button.setAttribute("aria-label", `${raw}. ${labelText}`);
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        calibrationButtons.forEach((item) => {
          const selected = item === button;
          item.classList.toggle("is-selected", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
        calibrationReadout.textContent = `${raw} · ${labelText}`;
        calibrationPrimary.disabled = false;
      });
      calibrationChoices.appendChild(button);
      return button;
    });

    const calibrationBack = element("button", "entry-secondary", calibration.back);
    calibrationBack.type = "button";
    const calibrationFooter = element("footer", "entry-footer");
    calibrationFooter.append(calibrationBack, calibrationPrimary);
    calibrationPanel.append(
      calibrationChoices,
      calibrationReadout,
      element("p", "entry-field-note", calibration.note),
      calibrationFooter,
    );

    /* --- stage 3: orientation --- */
    const orientationPanel = element("section", "entry-panel");
    orientationPanel.hidden = true;
    orientationPanel.appendChild(element("p", "entry-intro", orientation.intro));

    const guidance = element("ul", "orientation-guidance");
    orientation.guidance.forEach((line) => {
      guidance.appendChild(element("li", "", line));
    });
    orientationPanel.append(
      guidance,
      element("p", "orientation-disclaimer", orientation.disclaimer),
    );

    const orientationBack = element("button", "entry-secondary", orientation.back);
    orientationBack.type = "button";
    const beginButton = element("button", "entry-primary", orientation.primary);
    beginButton.type = "button";
    const orientationFooter = element("footer", "entry-footer");
    orientationFooter.append(orientationBack, beginButton);
    orientationPanel.appendChild(orientationFooter);

    frame.append(identityPanel, calibrationPanel, orientationPanel);
    dialog.appendChild(frame);

    const stages = {
      identity: { panel: identityPanel, copy: identity, focus: () => nameInput },
      calibration: {
        panel: calibrationPanel,
        copy: calibration,
        focus: () => calibrationButtons[0],
      },
      orientation: {
        panel: orientationPanel,
        copy: orientation,
        focus: () => beginButton,
      },
    };

    function showStage(name) {
      const stage = stages[name];
      Object.entries(stages).forEach(([key, entry]) => {
        entry.panel.hidden = key !== name;
      });
      label.textContent = stage.copy.label;
      heading.textContent = stage.copy.heading;
      intro.hidden = name !== "identity";
      window.requestAnimationFrame(() => stage.focus()?.focus());
    }

    dialog.prepareEntry = () => {
      nameInput.value = state.participant.name || "";
      nameError.hidden = true;
      nameInput.removeAttribute("aria-invalid");
      delete dialog.dataset.pendingName;
      calibrationButtons.forEach((button) => {
        button.classList.remove("is-selected");
        button.setAttribute("aria-pressed", "false");
      });
      calibrationReadout.textContent = "";
      calibrationPrimary.disabled = true;
      showStage("identity");
    };

    // Enter submits the identity stage.
    form.addEventListener("submit", (event) => {
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
      // The name is saved as soon as it is given.
      state = core.setPlayerName(data, state, playerName);
      persist();
      showStage("calibration");
    });

    nameInput.addEventListener("input", () => {
      if (nameInput.value.trim()) {
        nameError.hidden = true;
        nameInput.removeAttribute("aria-invalid");
      }
    });

    calibrationBack.addEventListener("click", () => showStage("identity"));
    calibrationPrimary.addEventListener("click", () => showStage("orientation"));
    orientationBack.addEventListener("click", () => showStage("calibration"));
    beginButton.addEventListener("click", () => {
      state = core.setPlayerName(
        data,
        state,
        dialog.dataset.pendingName || nameInput.value,
      );
      persist();
      closeStationEntry();
    });

    dialog.addEventListener("cancel", (event) => event.preventDefault());
    document.body.appendChild(dialog);
    entryDialog = dialog;
    return dialog;
  }

  function openStationEntry() {
    if (state.participant.name) {
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
    announce(`Welcome to the final watch, ${state.participant.name}.`);
    advance();
  }

  /* ------------------------------------------------------ completion panel */

  function appendCompletionPanel() {
    const copy = data.completion;
    const panel = element("section", "completion-panel");
    panel.id = "completion";
    panel.tabIndex = -1;
    panel.appendChild(element("h2", "completion-heading", copy.heading));
    copy.lines.forEach((line) => {
      panel.appendChild(element("p", "completion-line", line));
    });

    const actions = element("div", "completion-actions");
    const profileLink = element("a", "primary-action", copy.profileAction);
    profileLink.href = "./results.html";
    actions.appendChild(profileLink);

    if (pdfExporter) {
      const storyButton = element("button", "secondary-action", copy.storyAction);
      storyButton.type = "button";
      storyButton.addEventListener("click", async () => {
        storyButton.disabled = true;
        const original = storyButton.textContent;
        storyButton.textContent = "Preparing…";
        try {
          await pdfExporter.downloadStory(
            data,
            state,
            core,
            `Aurora_Station_Story_${fileSafeName(state.participant.name)}.pdf`,
          );
          announce("Your story PDF has been downloaded.");
        } catch {
          announce("The story PDF could not be created.");
        } finally {
          storyButton.textContent = original;
          storyButton.disabled = false;
        }
      });
      actions.appendChild(storyButton);
    }

    panel.appendChild(actions);
    story.appendChild(panel);
    announce("The watch is complete. Your profile is ready.");
    return panel;
  }

  /* ----------------------------------------------------------------- boot */

  function restoreDocument() {
    restoring = true;
    story.replaceChildren();
    renderedCount = 0;
    actPanels.clear();
    renderRevealedNodes();
    const pending = core.pendingQuestion(nodes, revealed);
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
      const next = order[(order.indexOf(preferences.textSpeed) + step + order.length) % order.length];
      setTextSpeed(next);
      speedControl.querySelector(`[data-speed="${next}"]`).focus();
    });

    newPassageButton.addEventListener("click", () => {
      newPassageButton.hidden = true;
      userScrolling = false;
      const last = story.lastElementChild;
      if (last) {
        followNewPassage(last);
      }
    });

    document.addEventListener("keydown", handleShortcut);

    // Any reader-initiated scrolling suspends auto-follow.
    ["wheel", "touchmove", "pointerdown"].forEach((type) => {
      window.addEventListener(type, markUserScrolling, { passive: true });
    });
    window.addEventListener("keydown", (event) => {
      if (
        ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(
          event.key,
        )
      ) {
        markUserScrolling();
      }
    });

    window.addEventListener(
      "scroll",
      () => {
        if (isNearBottom()) {
          newPassageButton.hidden = true;
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

    const validation = core.validateContent(data);
    if (!validation.valid) {
      console.error("[Aurora Station] content validation failed", validation.problems);
    }

    preferences.paused = state.narrative.paused === true;

    bindControls();
    restoreDocument();
    updateProgress();
    updateAtmosphere();
    updatePlaybackControls();

    if (audio) {
      audio.init({ toggleButton: soundToggle });
      audio.sync(data, state, core);
    }

    if (!state.participant.name) {
      openStationEntry();
    } else {
      window.scrollTo({ top: state.scrollY, left: 0, behavior: "auto" });
      advance();
    }
  }

  boot();
})();
