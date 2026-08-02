/*
 * Aurora Station — the watch.
 *
 * One cumulative document. core.js derives the story as an ordered node stream;
 * this module appends those nodes and never rewrites what is already on the
 * page. The composition changes as the night degrades — the reading column
 * tightens, the drawings gain density, the aurora arrives — but the way a
 * response is given never changes.
 */
(function runAuroraStation() {
  "use strict";

  const data = window.AURORA_STATION_DATA;
  const core = window.AuroraCore;
  const art = window.AuroraArtwork;
  const audio = window.AuroraAudio;
  const pdf = window.AuroraPdf;

  const watch = document.getElementById("watch");
  const stationMark = document.getElementById("station-mark");
  const actMark = document.getElementById("act-mark");
  const sequence = document.getElementById("sequence");
  const sequenceLabel = document.getElementById("sequence-label");
  const sequenceTicks = document.getElementById("sequence-ticks");
  const soundToggle = document.getElementById("sound-toggle");
  const restartControl = document.getElementById("restart");
  const controlsToggle = document.getElementById("controls-toggle");
  const controlsPanel = document.getElementById("controls-panel");
  const masthead = document.querySelector(".masthead");
  const announcer = document.getElementById("announcer");
  const auroraLayer = document.getElementById("env-aurora");

  const SELECTED_HOLD = 300;
  const SCROLL_SAVE = 250;
  // Where the reading line sits, how far below it the story fades out, and how
  // faint it is allowed to get. All fractions of the viewport, so a phone and a
  // laptop dim over the same share of the screen.
  const READING_LINE = 0.58;
  const FADE_ZONE = 0.42;
  const DIMMEST = 0.14;

  const LABELS = core.responseLabels(data);
  const TOTAL = core.ITEM_COUNT;
  const OBS = data.observation;

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
  let prefs = core.loadPreferences(storage);
  let nodes = core.buildNodes(data, state);
  let revealed = clamp(state.narrative.revealedBeatCount.stream);

  let rendered = 0;
  let builtFor = core.answeredCount(state);
  let scrollTimer = 0;
  let locked = false;
  let restoring = false;
  let focusFrame = 0;
  let entry = null;
  let markedAct = 0;
  const panels = new Map();

  function clamp(value) {
    const count = Number(value);
    if (!Number.isFinite(count) || count < 0) {
      return 0;
    }
    return Math.min(Math.floor(count), nodes.length);
  }

  /* ------------------------------------------------------------- helpers */

  function stillMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined && text !== null) {
      node.textContent = text;
    }
    return node;
  }

  function say(message) {
    if (!announcer || !message) {
      return;
    }
    announcer.textContent = "";
    window.setTimeout(() => {
      announcer.textContent = message;
    }, 30);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }


  function actFor(number) {
    return data.story.acts.find((act) => act.number === number);
  }

  /* The behavioural trace an item belongs to, used only as a hairline. */
  function traceForItem(itemId) {
    const item = core.flattenItems(data).find((entry) => entry.id === itemId);
    if (!item) {
      return "var(--signal)";
    }
    const roleId = data.assessment.roleOrder.find(
      (id) => data.assessment.roles[id].domain === item.domain,
    );
    return roleId ? data.assessment.roles[roleId].colourNight : "var(--signal)";
  }

  function persist() {
    state.narrative.revealedBeatCount = { stream: revealed };
    core.saveState(data, state, storage);
  }

  /* ------------------------------------------------------- reading focus */

  /*
   * The page never moves itself. What changes is legibility: a passage the
   * reader has reached is fully lit, and everything below the reading line
   * dims toward the foot of the screen, so the story clears as they come down
   * to it and the run-up to the next question reads as a run-up.
   *
   * Opacity only — it stays on the compositor, so this costs nothing per
   * frame. Anything focused is exempt, or a reader working by keyboard would
   * be answering a question they cannot see.
   */
  function focusByScroll() {
    /*
     * Cancel and re-request rather than guarding with a flag. A flag cleared
     * inside the callback wedges for good if the callback never runs — a
     * background tab drops frames — and the reading would stay wherever it was
     * left. This coalesces a burst of scroll events just as well and cannot
     * get stuck.
     */
    window.cancelAnimationFrame(focusFrame);
    focusFrame = window.requestAnimationFrame(() => {
      focusFrame = 0;
      if (stillMotion()) {
        return;
      }
      const height = window.innerHeight;
      const line = height * READING_LINE;
      const fade = height * FADE_ZONE;
      watch.querySelectorAll(".passage, .observation, .act-plate").forEach((block) => {
        const top = block.getBoundingClientRect().top;
        let read = 1;
        if (top > line) {
          read = Math.max(DIMMEST, 1 - (top - line) / fade);
        }
        block.style.setProperty("--read", read.toFixed(3));
      });
    });
  }

  function rememberScroll() {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      state.scrollY = Math.round(window.scrollY);
      persist();
    }, SCROLL_SAVE);
  }

  /* ------------------------------------------------------------- drawing */

  function appendPassage(node) {
    const classes = ["passage", `passage-${node.type}`];
    const paragraph = el("p", classes.join(" "), node.text);
    if (node.type === "selected") {
      // A recorded response carries the trace of the current it belongs to.
      paragraph.style.setProperty("--trace", traceForItem(node.itemId));
      paragraph.dataset.band = node.band || "";
    }
    watch.appendChild(paragraph);
    return paragraph;
  }

  /*
   * The full-bleed Act opening: an oversized number, the operational
   * timestamp, and the drawing behind them.
   */
  function appendActPlate(node) {
    const act = actFor(node.actNumber);
    const plate = el("section", "act-plate");
    plate.id = `act-${node.actNumber}`;
    plate.dataset.phase = act.contextPhase;

    const figure = el("div", "act-plate-figure");
    if (art) {
      figure.appendChild(
        art.actPlate(node.actNumber, act.contextPhase, {
          window: act.contextPhase !== "baseline",
        }),
      );
    }
    plate.appendChild(figure);

    plate.appendChild(el("p", "act-plate-index", pad(node.actNumber)));
    const meta = el("div", "act-plate-meta");
    meta.append(
      el("p", "mark", `${OBS.actLabel} ${pad(node.actNumber)} ${OBS.ofLabel} ${core.ACT_COUNT}`),
      el("p", "mark", node.time),
      el("p", "mark", OBS.phaseLabels[act.contextPhase]),
    );
    plate.append(meta, el("h2", "act-plate-title", node.title));

    watch.appendChild(plate);
    if (!restoring) {
      say(`Act ${node.actNumber} of ${core.ACT_COUNT}. ${node.title}.`);
    }
    return plate;
  }

  function appendInterlude(node) {
    const section = el("section", "interlude");
    section.append(el("p", "mark", node.eyebrow), el("h2", "interlude-title", node.title));
    watch.appendChild(section);
    return section;
  }

  function appendPrologue(node) {
    const section = el("section", "prologue");
    section.append(
      el("p", "mark prologue-mark", `${OBS.stationLabel} · ${OBS.watchLabel}`),
      el("h1", "prologue-title", data.title),
      el("p", "prologue-sub", node.title),
    );
    watch.appendChild(section);
    return section;
  }

  /* -------------------------------------------------- the observation panel */

  function buildPanel(actNumber) {
    const panel = el("section", "observation");
    panel.dataset.act = String(actNumber);
    panel.tabIndex = -1;
    panel.setAttribute("aria-label", `Observation panel, Act ${actNumber}`);

    const head = el("div", "observation-head");
    const kicker = el("p", "mark", OBS.label);
    const counter = el("p", "mark", "");
    head.append(kicker, counter);

    const statement = el("h3", "observation-statement", "");
    statement.id = `observation-${actNumber}`;

    const anchors = el("div", "scale-anchors");
    anchors.setAttribute("aria-hidden", "true");
    anchors.append(
      el("p", "mark", data.assessment.spectrum.leftAnchor),
      el("p", "mark", data.assessment.spectrum.rightAnchor),
    );

    const responses = el("div", "responses");
    responses.style.setProperty("--response-count", String(LABELS.length));
    responses.setAttribute("role", "group");
    responses.setAttribute("aria-labelledby", statement.id);

    const buttons = LABELS.map((label, index) => {
      const value = index + 1;
      const button = el("button", "response", String(value));
      button.type = "button";
      button.dataset.value = String(value);
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `${value}. ${label}`);
      button.addEventListener("click", () => record(actNumber, value));
      button.addEventListener("keydown", (event) => {
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) {
          return;
        }
        event.preventDefault();
        buttons[(index + step + buttons.length) % buttons.length].focus();
      });
      responses.appendChild(button);
      return button;
    });

    const readout = el("p", "mark mark-live observation-readout", "");
    const foot = el("div", "observation-foot");
    const back = el("button", "control", "Back");
    back.type = "button";
    back.hidden = true;
    back.addEventListener("click", stepBack);
    foot.appendChild(back);

    panel.append(head, statement, anchors, responses, readout, foot);
    panel.refs = { kicker, counter, statement, anchors, responses, buttons, readout, foot, back };
    return panel;
  }

  function panelFor(actNumber) {
    if (panels.has(actNumber)) {
      return panels.get(actNumber);
    }
    const panel = buildPanel(actNumber);
    watch.appendChild(panel);
    panels.set(actNumber, panel);
    return panel;
  }

  function showQuestion(node) {
    const panel = panelFor(node.actNumber);
    const refs = panel.refs;
    const item = node.item;

    panel.classList.remove("is-closed");
    refs.kicker.textContent = OBS.label;
    refs.counter.textContent = `${OBS.unitLabel} ${pad(item.bfiItem)} ${OBS.ofLabel} ${TOTAL} · ${pad(item.positionInAct)} ${OBS.ofLabel} ${pad(core.ITEMS_PER_ACT)}`;
    refs.statement.textContent = item.statement;
    refs.statement.hidden = false;
    refs.anchors.hidden = false;
    refs.readout.textContent = "";
    refs.readout.hidden = false;

    refs.buttons.forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.disabled = false;
    });
    refs.back.hidden = !core.canGoBack(data, state);
  }

  function closePanel(actNumber) {
    const panel = panels.get(actNumber);
    if (!panel || panel.classList.contains("is-closed")) {
      return;
    }
    const refs = panel.refs;
    if (panel.contains(document.activeElement)) {
      panel.focus({ preventScroll: true });
    }
    panel.classList.add("is-closed");
    refs.counter.textContent = `${core.ITEMS_PER_ACT} ${OBS.unitLabel} RECORDED`;
    refs.statement.hidden = true;
    refs.anchors.hidden = true;
    refs.readout.hidden = true;
    refs.back.hidden = true;
    refs.buttons.forEach((button) => {
      button.disabled = true;
    });
  }

  /* ---------------------------------------------------------- completion */

  function appendCompletion() {
    const results = data.results;
    const panel = el("section", "completion");
    panel.id = "completion";
    panel.tabIndex = -1;
    panel.append(
      el("p", "mark", OBS.completeLabel),
      el("h2", "completion-title", results.openingTitle),
      el("p", "completion-line", results.openingBridge),
    );

    const actions = el("div", "completion-actions");
    const open = el("a", "action", results.actions.profilePdf ? "Open the report" : "Open");
    open.href = "./results.html";
    actions.appendChild(open);

    if (pdf) {
      const story = el("button", "action action-quiet", results.actions.storyPdf);
      story.type = "button";
      story.addEventListener("click", async () => {
        story.disabled = true;
        const original = story.textContent;
        story.textContent = "Preparing";
        try {
          await pdf.downloadStory(data, state, core);
          say("The night's record has been downloaded.");
        } catch {
          say("The record could not be prepared.");
        } finally {
          story.textContent = original;
          story.disabled = false;
        }
      });
      actions.appendChild(story);
    }

    panel.appendChild(actions);
    watch.appendChild(panel);
    say("The watch is complete. The observation report is ready.");
    return panel;
  }

  /* ------------------------------------------------------- materialisation */

  function place(node) {
    switch (node.type) {
      case "prologue-heading":
        return appendPrologue(node);
      case "act-heading":
        return appendActPlate(node);
      case "interlude-heading":
        return appendInterlude(node);
      case "question": {
        panelFor(node.actNumber);
        if (node.item.positionInAct === core.ITEMS_PER_ACT) {
          closePanel(node.actNumber);
        }
        return null;
      }
      case "completion":
        return appendCompletion();
      default:
        return appendPassage(node);
    }
  }

  function catchUp() {
    while (rendered < revealed && rendered < nodes.length) {
      place(nodes[rendered]);
      rendered += 1;
    }
  }

  /* ------------------------------------------------------------- the stream */

  function isGate(node) {
    return Boolean(node) && node.type === "question" && !node.answered;
  }

  function idle() {
    const node = nodes[revealed];
    return !node || isGate(node);
  }

  /*
   * The story runs as far as the next unanswered question and stops there.
   * Everything to that point is on the page; the reader draws it into focus by
   * scrolling. Answering opens the next stretch, and the same thing happens
   * again.
   */
  function extend() {
    restoring = true;
    while (!idle()) {
      revealed += 1;
      place(nodes[revealed - 1]);
      rendered = revealed;
    }
    restoring = false;
    persist();
    focusByScroll();
  }

  function refresh() {
    nodes = core.buildNodes(data, state);
    builtFor = core.answeredCount(state);
    revealed = Math.min(revealed, nodes.length);
  }

  function advance() {
    if (builtFor !== core.answeredCount(state)) {
      refresh();
    }
    catchUp();
    extend();

    const pending = core.pendingQuestion(nodes, revealed);
    if (pending) {
      showQuestion(pending);
    }

    updateSequence();
    updateEnvironment();
    syncSound();
    updateControls();
  }

  /* ---------------------------------------------------------- interaction */

  function record(actNumber, value) {
    if (locked) {
      return;
    }
    const pending = core.pendingQuestion(nodes, revealed);
    if (!pending || pending.actNumber !== actNumber) {
      return;
    }

    locked = true;
    const refs = panels.get(actNumber).refs;
    refs.buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.value) === value));
    });
    refs.readout.textContent = `${value} · ${LABELS[value - 1]}`;
    refs.back.hidden = true;

    state = core.recordResponse(data, state, pending.item.id, value);
    revealed += 1;
    persist();

    const answered = core.answeredCount(state);
    say(`${value}, ${LABELS[value - 1]}. ${answered} of ${TOTAL} recorded.`);

    window.setTimeout(
      () => {
        locked = false;
        advance();
        const next = core.pendingQuestion(nodes, revealed);
        if (next) {
          say(next.item.statement);
        }
        syncSound();
      },
      stillMotion() ? 0 : SELECTED_HOLD,
    );
  }

  function stepBack() {
    if (locked || !core.canGoBack(data, state)) {
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
    const refs = panels.get(pending.actNumber).refs;
    const chosen = refs.buttons[previous - 1];
    refs.buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button === chosen));
    });
    refs.readout.textContent = `${previous} · ${LABELS[previous - 1]}`;
    chosen?.focus({ preventScroll: true });
    say(`Back to observation ${pending.item.bfiItem}. ${pending.item.statement}`);
  }

  function shortcut(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
    ) {
      return;
    }
    if (document.querySelector("dialog[open]")) {
      return;
    }
    const value = Number(event.key);
    if (!Number.isInteger(value) || value < core.MIN_RESPONSE || value > core.MAX_RESPONSE) {
      return;
    }
    const pending = core.pendingQuestion(nodes, revealed);
    if (!pending) {
      return;
    }
    event.preventDefault();
    record(pending.actNumber, value);
  }

  /*
   * The soundtrack follows the Act that has been revealed, so a track begins
   * when its first Act opens and the change is heard on the Act boundary
   * rather than whenever a question happens to be answered.
   */
  function revealedAct() {
    let reached = 0;
    for (let index = 0; index < revealed && index < nodes.length; index += 1) {
      const number = nodes[index].actNumber || 0;
      if (number > reached) {
        reached = number;
      }
    }
    return reached;
  }

  function syncSound() {
    if (!audio) {
      return;
    }
    audio.sync(data, state, core, revealedAct());
  }

  /* ------------------------------------------------------------ the shell */

  /*
   * The masthead names the Act being read, not the Act being answered. Once
   * the watch is long enough to scroll back through, those stop being the same
   * thing, and the reader trusts what is in front of them.
   */
  function actInView() {
    const plates = watch.querySelectorAll(".act-plate");
    let seen = 0;
    plates.forEach((plate) => {
      // The last plate whose opening has passed the top third of the viewport.
      if (plate.getBoundingClientRect().top <= window.innerHeight / 3) {
        seen = Number(plate.id.replace("act-", "")) || seen;
      }
    });
    return seen;
  }

  function markActInView() {
    if (!state.participant.name) {
      return;
    }
    const number = actInView();
    if (!number || number === markedAct) {
      return;
    }
    markedAct = number;
    const act = actFor(number);
    actMark.textContent = `${OBS.actLabel} ${pad(number)} · ${OBS.phaseLabels[act.contextPhase]}`;
  }

  /* Progress reads as a sequence of observations, not a filling bar. */
  function updateSequence() {
    const answered = core.answeredCount(state);
    if (!sequenceTicks.childElementCount) {
      for (let index = 0; index < core.ACT_COUNT; index += 1) {
        sequenceTicks.appendChild(el("span", "sequence-tick"));
      }
    }
    const currentAct = Math.min(core.ACT_COUNT, Math.floor(answered / core.ITEMS_PER_ACT) + 1);
    [...sequenceTicks.children].forEach((tick, index) => {
      const act = index + 1;
      tick.dataset.state =
        act < currentAct || answered === TOTAL
          ? "recorded"
          : act === currentAct
            ? "active"
            : "pending";
    });

    sequenceLabel.textContent =
      answered === TOTAL
        ? OBS.completeLabel
        : `${OBS.unitLabel} ${pad(answered)} ${OBS.ofLabel} ${TOTAL}`;
    sequence.setAttribute(
      "aria-label",
      answered === TOTAL
        ? "Observation sequence complete"
        : `Observation sequence, ${answered} of ${TOTAL} recorded`,
    );

    const act = actFor(currentAct);
    markedAct = currentAct;
    actMark.textContent = state.participant.name
      ? `${OBS.actLabel} ${pad(currentAct)} · ${OBS.phaseLabels[act.contextPhase]}`
      : OBS.watchLabel;
    stationMark.textContent = state.participant.name
      ? state.participant.name.toUpperCase()
      : OBS.stationLabel;
    markActInView();
  }

  /*
   * The environment answers the story: the reading column tightens with the
   * phase, and the aurora enters only at its Act and deepens from there.
   */
  function updateEnvironment() {
    const phase = core.contextPhaseFor(data, state);
    watch.dataset.phase = phase;

    const aurora = core.auroraStateFor(data, state, nodes, revealed);
    document.body.dataset.aurora = aurora.state;
    document.body.style.setProperty("--aurora-intensity", String(aurora.intensity));

    if (aurora.state === "present" && art && !auroraLayer.childElementCount) {
      auroraLayer.appendChild(art.auroraRibbons(4));
    }
  }

  /*
   * On a phone the seven controls do not fit beside the sequence, and a rail
   * that scrolls sideways hides six of them behind a gesture nobody is told
   * about. They collapse behind one button instead. Above the phone
   * breakpoint the panel is display: contents, so the controls sit in the bar
   * exactly as before and this button is not rendered at all.
   */
  function controlsOpen() {
    return masthead.classList.contains("is-open");
  }

  function setControls(open) {
    masthead.classList.toggle("is-open", open);
    controlsToggle.setAttribute("aria-expanded", String(open));
    if (open) {
      controlsPanel.querySelector("button:not([tabindex='-1'])")?.focus();
    }
  }

  function closeControls(returnFocus) {
    if (!controlsOpen()) {
      return;
    }
    setControls(false);
    if (returnFocus) {
      controlsToggle.focus();
    }
  }

  function updateControls() {
    controlsToggle.setAttribute("aria-label", "Station controls");
  }

  /* ------------------------------------------------------------ the entry */

  function buildEntry() {
    if (entry) {
      return entry;
    }
    const [identity, calibration, orientation] = data.prelude.steps;
    const dialog = el("dialog", "entry");
    dialog.setAttribute("aria-labelledby", "entry-title");

    // The prelude is composed like an Act opening, not like a dialog card:
    // a drawn ground, an oversized index, then the reading column.
    const figure = el("div", "entry-figure");
    if (art) {
      figure.appendChild(art.preludeGround());
    }
    dialog.appendChild(figure);

    const frame = el("div", "entry-frame");
    const head = el("div", "entry-head");
    const label = el("p", "mark", identity.label);
    const station = el("p", "mark", OBS.stationLabel);
    head.append(label, station);

    const index = el("p", "entry-index", "01");
    const title = el("h1", "entry-title", identity.heading);
    title.id = "entry-title";
    const body = el("p", "entry-body", identity.intro);
    frame.append(head, index, title, body);

    /* --- the watchkeeper --- */
    const identityPanel = el("section");
    const form = el("form");
    form.noValidate = true;
    const field = el("label", "mark entry-field", identity.fieldLabel);
    field.htmlFor = "watchkeeper";
    const input = el("input", "entry-input");
    input.id = "watchkeeper";
    input.type = "text";
    input.autocomplete = "name";
    input.maxLength = core.MAX_NAME_LENGTH;
    input.required = true;
    input.placeholder = identity.placeholder;
    const error = el("p", "entry-error", identity.error);
    error.id = "watchkeeper-error";
    error.hidden = true;
    const identityNext = el("button", "action", identity.primary);
    identityNext.type = "submit";
    const identityFoot = el("div", "entry-foot");
    identityFoot.appendChild(identityNext);
    form.append(field, input, el("p", "entry-note", identity.note), error, identityFoot);
    identityPanel.appendChild(form);

    /* --- one calibration reading, not scored --- */
    const calibrationPanel = el("section");
    calibrationPanel.hidden = true;
    calibrationPanel.append(
      el("p", "entry-body", calibration.intro),
      el("p", "entry-statement", calibration.statement),
    );
    const calibrationAnchors = el("div", "scale-anchors");
    calibrationAnchors.setAttribute("aria-hidden", "true");
    calibrationAnchors.append(
      el("p", "mark", data.assessment.spectrum.leftAnchor),
      el("p", "mark", data.assessment.spectrum.rightAnchor),
    );
    const calibrationScale = el("div", "responses");
    calibrationScale.style.setProperty("--response-count", String(LABELS.length));
    calibrationScale.setAttribute("role", "group");
    calibrationScale.setAttribute("aria-label", calibration.statement);
    const calibrationNext = el("button", "action", calibration.primary);
    calibrationNext.type = "button";
    calibrationNext.disabled = true;
    const calibrationRead = el("p", "mark mark-live observation-readout", "");

    const calibrationButtons = LABELS.map((labelText, index) => {
      const value = index + 1;
      const button = el("button", "response", String(value));
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `${value}. ${labelText}`);
      button.addEventListener("click", () => {
        calibrationButtons.forEach((other) =>
          other.setAttribute("aria-pressed", String(other === button)),
        );
        calibrationRead.textContent = `${value} · ${labelText}`;
        calibrationNext.disabled = false;
      });
      calibrationScale.appendChild(button);
      return button;
    });

    const calibrationBack = el("button", "control", calibration.back);
    calibrationBack.type = "button";
    const calibrationFoot = el("div", "entry-foot");
    calibrationFoot.append(calibrationBack, calibrationNext);
    calibrationPanel.append(
      calibrationAnchors,
      calibrationScale,
      calibrationRead,
      el("p", "entry-note", calibration.note),
      calibrationFoot,
    );

    /* --- how to answer, shown once --- */
    const orientationPanel = el("section");
    orientationPanel.hidden = true;
    orientationPanel.appendChild(el("p", "entry-body", orientation.intro));
    const list = el("ul", "entry-list");
    orientation.guidance.forEach((line) => list.appendChild(el("li", "", line)));
    orientationPanel.append(list, el("p", "entry-disclaimer", orientation.disclaimer));
    const orientationBack = el("button", "control", orientation.back);
    orientationBack.type = "button";
    const begin = el("button", "action", orientation.primary);
    begin.type = "button";
    const orientationFoot = el("div", "entry-foot");
    orientationFoot.append(orientationBack, begin);
    orientationPanel.appendChild(orientationFoot);

    frame.append(identityPanel, calibrationPanel, orientationPanel);
    dialog.appendChild(frame);

    const stages = {
      identity: { panel: identityPanel, copy: identity, focus: () => input },
      calibration: { panel: calibrationPanel, copy: calibration, focus: () => calibrationButtons[0] },
      orientation: { panel: orientationPanel, copy: orientation, focus: () => begin },
    };

    function stage(name) {
      const current = stages[name];
      Object.entries(stages).forEach(([key, value]) => {
        value.panel.hidden = key !== name;
      });
      label.textContent = current.copy.label;
      index.textContent = pad(Object.keys(stages).indexOf(name) + 1);
      title.textContent = current.copy.heading;
      body.hidden = name !== "identity";
      frame.scrollTop = 0;
      window.requestAnimationFrame(() => current.focus()?.focus());
    }

    dialog.prepare = () => {
      input.value = state.participant.name || "";
      error.hidden = true;
      input.removeAttribute("aria-invalid");
      calibrationButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
      calibrationRead.textContent = "";
      calibrationNext.disabled = true;
      stage("identity");
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = core.normalisePlayerName(input.value);
      if (!name) {
        error.hidden = false;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", error.id);
        input.focus();
        return;
      }
      error.hidden = true;
      input.removeAttribute("aria-invalid");
      input.value = name;
      state = core.setPlayerName(data, state, name);
      persist();
      stage("calibration");
    });

    input.addEventListener("input", () => {
      if (input.value.trim()) {
        error.hidden = true;
        input.removeAttribute("aria-invalid");
      }
    });

    calibrationBack.addEventListener("click", () => stage("identity"));
    calibrationNext.addEventListener("click", () => stage("orientation"));
    orientationBack.addEventListener("click", () => stage("calibration"));
    begin.addEventListener("click", () => {
      state = core.setPlayerName(data, state, input.value);
      persist();
      closeEntry();
    });

    // The watch cannot begin until the instructions have been seen.
    dialog.addEventListener("cancel", (event) => event.preventDefault());
    document.body.appendChild(dialog);
    entry = dialog;
    return dialog;
  }

  function openEntry() {
    if (state.participant.name) {
      return;
    }
    const dialog = buildEntry();
    dialog.prepare();
    document.body.classList.add("is-sealed");
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  function closeEntry() {
    document.body.classList.remove("is-sealed");
    if (entry?.open) {
      entry.close();
    }
    say(`The watch is yours, ${state.participant.name}.`);
    advance();
  }

  /* ----------------------------------------------------------------- boot */

  function restore() {
    restoring = true;
    watch.replaceChildren();
    rendered = 0;
    panels.clear();
    catchUp();
    const pending = core.pendingQuestion(nodes, revealed);
    if (pending) {
      showQuestion(pending);
    }
    restoring = false;
  }

  function bind() {
    controlsToggle.addEventListener("click", () => setControls(!controlsOpen()));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeControls(true);
      }
    });
    document.addEventListener("pointerdown", (event) => {
      if (controlsOpen() && !masthead.contains(event.target)) {
        closeControls(false);
      }
    });

    restartControl.addEventListener("click", () => {
      // The watch is long, and abandoning it should not mean clearing storage
      // by hand. Reading preferences survive; the record does not.
      if (!window.confirm(data.results.restartConfirm)) {
        return;
      }
      core.clearJourney(storage);
      window.location.reload();
    });
    document.addEventListener("keydown", shortcut);
    window.addEventListener(
      "scroll",
      () => {
        focusByScroll();
        markActInView();
        rememberScroll();
      },
      { passive: true },
    );
    window.addEventListener("resize", focusByScroll, { passive: true });
    // A block reached by keyboard has to be readable even though the reader
    // never scrolled to it.
    watch.addEventListener("focusin", focusByScroll);
  }

  function boot() {
    if (!data || !core) {
      watch.replaceChildren(el("p", "loading-note", "Aurora Station could not load its record."));
      return;
    }

    const validation = core.validateContent(data);
    if (!validation.valid) {
      console.error("[Aurora Station] content validation failed", validation.problems);
    }

    if (art) {
      document.body.appendChild(art.grainOverlay());
    }

    bind();
    restore();
    updateSequence();
    updateEnvironment();
    updateControls();

    if (audio) {
      audio.init({ toggleButton: soundToggle });
      syncSound();
    }

    if (!state.participant.name) {
      openEntry();
    } else {
      window.scrollTo({ top: state.scrollY, left: 0, behavior: "auto" });
      advance();
    }
  }

  boot();
})();
