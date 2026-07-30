(function installAuroraScrollExperience() {
  "use strict";

  const ARCHIVE_KEY = "aurora-station-scroll-archive-v6";
  const LEVEL_LABELS = [
    "Strongly disagree",
    "Disagree a little",
    "Neither agree nor disagree",
    "Agree a little",
    "Strongly agree",
  ];
  const TECHNICAL_TEXT = /^(act|part|statement|question|story|response signal|text speed|slow|normal|fast|pause|resume|show now|continue|the final watch|journey complete|final record)/i;
  const STORY_CONTROL_TEXT = /^(pause|resume|show now|slow|normal|fast|text speed|story\s+\d+|act\s+\d+|question\s+\d+|statement\s+\d+)/i;

  function storage() {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  function normalise(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function create(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function isNearBottom() {
    return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 260;
  }

  function waitForRuntime() {
    const runtime = document.getElementById("story");
    if (!runtime || runtime.dataset.scrollBridgeInstalled === "true") {
      window.setTimeout(waitForRuntime, 80);
      return;
    }
    install(runtime);
  }

  function install(runtime) {
    runtime.dataset.scrollBridgeInstalled = "true";
    runtime.id = "story-runtime";
    runtime.classList.add("story-runtime-source");

    const reader = create("article", "story story-scroll-v6");
    reader.id = "story";
    reader.setAttribute("aria-live", "polite");
    runtime.parentNode.insertBefore(reader, runtime);

    const newPassageButton = create(
      "button",
      "new-passage-button",
      "New passage below ↓",
    );
    newPassageButton.type = "button";
    newPassageButton.hidden = true;
    document.body.appendChild(newPassageButton);

    const bridge = {
      runtime,
      reader,
      acts: new Map(),
      currentActNumber: null,
      currentQuestionNumber: null,
      currentStatement: "",
      seenNarrative: new Set(),
      processing: false,
      pending: false,
      follow: true,
      archive: loadArchive(),
      newPassageButton,
      resultMode: false,
    };

    restoreArchive(bridge);

    newPassageButton.addEventListener("click", () => {
      bridge.follow = true;
      newPassageButton.hidden = true;
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    });

    window.addEventListener(
      "scroll",
      () => {
        bridge.follow = isNearBottom();
        if (bridge.follow) newPassageButton.hidden = true;
      },
      { passive: true },
    );

    const observer = new MutationObserver(() => scheduleProcess(bridge));
    observer.observe(runtime, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    document.addEventListener(
      "click",
      (event) => {
        const restart = event.target.closest(
          "#restart-watch, .restart-button, [data-restart], button",
        );
        if (!restart) return;
        const label = normalise(restart.textContent || restart.getAttribute("aria-label"));
        if (restart.id === "restart-watch" || /start again|restart the watch/i.test(label)) {
          clearArchive();
        }
      },
      true,
    );

    scheduleProcess(bridge);
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function scheduleProcess(bridge) {
    if (bridge.processing) {
      bridge.pending = true;
      return;
    }
    bridge.processing = true;
    window.requestAnimationFrame(() => {
      try {
        processRuntime(bridge);
      } finally {
        bridge.processing = false;
        if (bridge.pending) {
          bridge.pending = false;
          scheduleProcess(bridge);
        }
      }
    });
  }

  function processRuntime(bridge) {
    if (bridge.runtime.querySelector("#results, .result-deck")) {
      showResults(bridge);
      return;
    }

    if (bridge.resultMode) {
      hideResults(bridge);
    }

    const levelButtons = getLevelButtons(bridge.runtime);
    if (levelButtons.length >= 5) {
      processAssessment(bridge, levelButtons.slice(0, 5));
      return;
    }

    processPlayback(bridge);
  }

  function getLevelButtons(root) {
    const candidates = Array.from(
      root.querySelectorAll(
        "button[data-level], button.spectrum-choice, button.entry-signal-choice",
      ),
    );
    const unique = [];
    const levels = new Set();
    candidates.forEach((button) => {
      const raw = Number(button.dataset.level || normalise(button.textContent));
      if (!Number.isInteger(raw) || raw < 1 || raw > 5 || levels.has(raw)) return;
      levels.add(raw);
      unique.push(button);
    });
    return unique.sort(
      (left, right) =>
        Number(left.dataset.level || normalise(left.textContent)) -
        Number(right.dataset.level || normalise(right.textContent)),
    );
  }

  function processAssessment(bridge, runtimeButtons) {
    const snapshot = normalise(bridge.runtime.innerText);
    const meta = parseAssessmentMeta(snapshot);
    if (!meta.actNumber) return;

    if (meta.actNumber === 1 && meta.globalQuestion === 1 && bridge.archive.acts.length > 1) {
      clearArchive();
      bridge.reader.replaceChildren();
      bridge.acts.clear();
      bridge.seenNarrative.clear();
      bridge.archive = emptyArchive();
    }

    let act = bridge.acts.get(meta.actNumber);
    if (!act) {
      act = createAct(bridge, meta);
    } else {
      updateActHeading(act, meta);
    }

    const questionHost = findQuestionHost(bridge.runtime, runtimeButtons);
    const statement = extractStatement(questionHost, snapshot);
    if (!statement) return;

    const opening = extractOpening(bridge.runtime, questionHost, meta, statement);
    if (!act.openingSaved && opening.length) {
      opening.forEach((paragraph) => appendOpeningParagraph(act, paragraph));
      act.openingSaved = true;
      saveActOpening(bridge, meta, opening);
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: Math.max(0, act.section.offsetTop - 70),
          behavior: "auto",
        });
        bridge.follow = false;
      });
    }

    bridge.currentActNumber = meta.actNumber;
    bridge.currentQuestionNumber = meta.globalQuestion;
    bridge.currentStatement = statement;
    renderQuestion(bridge, act, meta, statement, runtimeButtons);
  }

  function parseAssessmentMeta(text) {
    const actMatch = text.match(/ACT\s+(\d{1,2})\s*\/\s*12(?:\s*[·|]\s*([^\n]+))?/i);
    const globalMatch = text.match(/STATEMENT\s+(\d{1,2})\s*\/\s*60/i);
    const localMatch = text.match(/(\d{1,2})\s*\/\s*05/);
    const title = extractTitleFromText(text);
    return {
      actNumber: actMatch ? Number(actMatch[1]) : null,
      actMeta: actMatch ? normalise(actMatch[2]) : "",
      globalQuestion: globalMatch ? Number(globalMatch[1]) : null,
      localQuestion: localMatch ? Number(localMatch[1]) : null,
      title,
    };
  }

  function extractTitleFromText(text) {
    const lines = String(text || "")
      .split(/\n+/)
      .map(normalise)
      .filter(Boolean);
    return (
      lines.find(
        (line) =>
          line.length > 4 &&
          line.length < 80 &&
          !TECHNICAL_TEXT.test(line) &&
          !/strongly agree|strongly disagree/i.test(line),
      ) || ""
    );
  }

  function findQuestionHost(runtime, buttons) {
    let node = buttons[0]?.parentElement || runtime;
    while (node && node !== runtime) {
      const text = normalise(node.textContent);
      const hasAllButtons = buttons.every((button) => node.contains(button));
      const hasStatement = Array.from(
        node.querySelectorAll("p, h1, h2, h3, h4, blockquote"),
      ).some((candidate) => isStatementCandidate(normalise(candidate.textContent)));
      if (hasAllButtons && hasStatement && text.length < 5000) return node;
      node = node.parentElement;
    }
    return runtime;
  }

  function isStatementCandidate(text) {
    return (
      text.length >= 28 &&
      text.length <= 460 &&
      !TECHNICAL_TEXT.test(text) &&
      !/strongly agree|strongly disagree|move across|choose once|back arrow/i.test(text)
    );
  }

  function extractStatement(host, fallbackText) {
    const preferred = host.querySelector(
      ".assessment-statement, .question-statement, .statement-text, .prompt, .inner-voice",
    );
    if (preferred && isStatementCandidate(normalise(preferred.textContent))) {
      return normalise(preferred.textContent);
    }

    const candidates = Array.from(
      host.querySelectorAll("p, h1, h2, h3, h4, blockquote"),
    )
      .map((node) => normalise(node.textContent))
      .filter(isStatementCandidate)
      .sort((left, right) => right.length - left.length);

    if (candidates.length) return candidates[0];

    const lines = String(fallbackText || "")
      .split(/\n+/)
      .map(normalise)
      .filter(isStatementCandidate)
      .sort((left, right) => right.length - left.length);
    return lines[0] || "";
  }

  function extractOpening(runtime, questionHost, meta, statement) {
    const paragraphs = Array.from(runtime.querySelectorAll("p, blockquote"));
    const result = [];
    paragraphs.forEach((node) => {
      if (questionHost.contains(node)) return;
      if (
        node.compareDocumentPosition(questionHost) & Node.DOCUMENT_POSITION_PRECEDING
      ) {
        return;
      }
      const text = normalise(node.textContent);
      if (
        text.length < 32 ||
        text === statement ||
        TECHNICAL_TEXT.test(text) ||
        /strongly agree|strongly disagree|choose once|back arrow|move across/i.test(text)
      ) {
        return;
      }
      if (!result.includes(text)) result.push(text);
    });

    if (!result.length) {
      const all = Array.from(runtime.querySelectorAll("p"))
        .map((node) => normalise(node.textContent))
        .filter(
          (text) =>
            text.length >= 32 &&
            text !== statement &&
            !TECHNICAL_TEXT.test(text) &&
            !/strongly agree|strongly disagree|choose once|back arrow|move across/i.test(text),
        );
      all.slice(0, 2).forEach((text) => {
        if (!result.includes(text)) result.push(text);
      });
    }

    return result.slice(0, 3);
  }

  function createAct(bridge, meta) {
    const section = create("section", "scroll-act");
    section.dataset.actNumber = String(meta.actNumber);

    const opening = create("div", "scroll-act-opening");
    const header = create("header", "scroll-act-header");
    const kicker = create(
      "p",
      "scroll-act-kicker",
      `ACT ${String(meta.actNumber).padStart(2, "0")} / 12${
        meta.actMeta ? ` · ${meta.actMeta}` : ""
      }`,
    );
    const title = create("h2", "scroll-act-title", meta.title || `Act ${meta.actNumber}`);
    header.append(kicker, title);
    const copy = create("div", "scroll-act-copy");
    opening.append(header, copy);

    const question = create("section", "scroll-question-stage");
    question.hidden = true;
    const narrative = create("div", "scroll-act-narrative");
    const controls = create("div", "scroll-playback-controls");
    controls.hidden = true;

    section.append(opening, question, controls, narrative);
    bridge.reader.appendChild(section);

    const act = {
      section,
      opening,
      header,
      title,
      kicker,
      copy,
      question,
      controls,
      narrative,
      openingSaved: false,
      seen: new Set(),
    };
    bridge.acts.set(meta.actNumber, act);
    bridge.archive.acts.push({
      number: meta.actNumber,
      title: meta.title || `Act ${meta.actNumber}`,
      meta: meta.actMeta || "",
      opening: [],
      narrative: [],
    });
    saveArchive(bridge.archive);
    return act;
  }

  function updateActHeading(act, meta) {
    if (meta.title && act.title.textContent !== meta.title) {
      act.title.textContent = meta.title;
    }
    act.kicker.textContent = `ACT ${String(meta.actNumber).padStart(2, "0")} / 12${
      meta.actMeta ? ` · ${meta.actMeta}` : ""
    }`;
  }

  function appendOpeningParagraph(act, text) {
    act.copy.appendChild(create("p", "scroll-story-paragraph", text));
    act.seen.add(text);
  }

  function renderQuestion(bridge, act, meta, statement, runtimeButtons) {
    act.question.hidden = false;
    act.controls.hidden = true;
    act.question.replaceChildren();

    const header = create("header", "scroll-question-header");
    header.appendChild(
      create(
        "p",
        "scroll-question-index",
        `STATEMENT ${String(meta.globalQuestion || 0).padStart(2, "0")} / 60`,
      ),
    );
    header.appendChild(
      create(
        "span",
        "scroll-question-local",
        `${String(meta.localQuestion || 1).padStart(2, "0")} / 05`,
      ),
    );
    act.question.appendChild(header);
    act.question.appendChild(create("p", "scroll-question-statement", statement));

    const scale = create("div", "scroll-response-scale");
    const anchors = create("div", "scroll-response-anchors");
    anchors.append(
      create("span", "", "Strongly disagree"),
      create("span", "", "Strongly agree"),
    );
    scale.appendChild(anchors);

    const signal = create("div", "scroll-response-signal");
    signal.appendChild(create("span", "scroll-response-label", "RESPONSE SIGNAL"));
    const description = create(
      "span",
      "scroll-response-description",
      "Move across 1–5 to preview each response.",
    );
    description.setAttribute("aria-live", "polite");
    signal.appendChild(description);
    scale.appendChild(signal);

    const choices = create("div", "scroll-response-choices");
    runtimeButtons.forEach((runtimeButton, index) => {
      const raw = index + 1;
      const button = create("button", "scroll-response-choice", String(raw));
      button.type = "button";
      button.dataset.level = String(raw);
      button.setAttribute("aria-label", `${raw}. ${LEVEL_LABELS[index]}`);
      const preview = () => {
        description.textContent = `${raw} · ${LEVEL_LABELS[index]}`;
        description.dataset.level = String(raw);
      };
      const reset = () => {
        description.textContent = "Move across 1–5 to preview each response.";
        delete description.dataset.level;
      };
      button.addEventListener("pointerenter", preview);
      button.addEventListener("pointerleave", reset);
      button.addEventListener("focus", preview);
      button.addEventListener("blur", reset);
      button.addEventListener("click", () => {
        if (choices.dataset.locked === "true") return;
        choices.dataset.locked = "true";
        choices.querySelectorAll("button").forEach((choice) => {
          choice.disabled = true;
          choice.classList.toggle("is-selected", choice === button);
        });
        description.textContent = `${raw} · ${LEVEL_LABELS[index]}`;
        const fresh = getLevelButtons(bridge.runtime).find(
          (candidate) => Number(candidate.dataset.level || normalise(candidate.textContent)) === raw,
        );
        fresh?.click();
      });
      choices.appendChild(button);
    });
    scale.appendChild(choices);
    act.question.appendChild(scale);

    const footer = create("footer", "scroll-question-footer");
    const runtimeBack = findRuntimeBackButton(bridge.runtime);
    if (runtimeBack && (meta.localQuestion || 1) > 1) {
      const back = create("button", "scroll-question-back", "← Previous statement");
      back.type = "button";
      back.addEventListener("click", () => runtimeBack.click());
      footer.appendChild(back);
    }
    footer.appendChild(
      create(
        "p",
        "scroll-question-note",
        "Choose once to continue automatically. You can return before the Act story begins.",
      ),
    );
    act.question.appendChild(footer);
  }

  function findRuntimeBackButton(runtime) {
    return (
      runtime.querySelector("button.back-button") ||
      Array.from(runtime.querySelectorAll("button")).find((button) =>
        /previous|return to the previous|back/i.test(
          `${button.getAttribute("aria-label") || ""} ${button.textContent || ""}`,
        ),
      ) ||
      null
    );
  }

  function processPlayback(bridge) {
    if (!bridge.currentActNumber) return;
    const act = bridge.acts.get(bridge.currentActNumber);
    if (!act) return;

    const text = normalise(bridge.runtime.innerText);
    if (!text || /receiving the final watch/i.test(text)) return;

    act.question.hidden = true;
    mirrorPlaybackControls(bridge, act);

    const narrative = extractNarrativeTexts(bridge.runtime, bridge.currentStatement);
    narrative.forEach((paragraph) => {
      if (act.seen.has(paragraph) || bridge.seenNarrative.has(paragraph)) return;
      appendNarrative(bridge, act, paragraph);
    });
  }

  function extractNarrativeTexts(runtime, currentStatement) {
    const candidates = Array.from(
      runtime.querySelectorAll("p, blockquote, .story-copy, .story-beat, .playback-copy"),
    );
    const result = [];
    candidates.forEach((node) => {
      if (node.closest("button, nav, .scroll-playback-controls")) return;
      const text = normalise(node.textContent);
      if (
        text.length < 24 ||
        text === currentStatement ||
        STORY_CONTROL_TEXT.test(text) ||
        /strongly agree|strongly disagree|move across|choose once|back arrow/i.test(text)
      ) {
        return;
      }
      if (!result.includes(text)) result.push(text);
    });

    if (!result.length) {
      String(runtime.innerText || "")
        .split(/\n+/)
        .map(normalise)
        .filter(
          (text) =>
            text.length >= 24 &&
            text !== currentStatement &&
            !STORY_CONTROL_TEXT.test(text) &&
            !/strongly agree|strongly disagree|move across|choose once|back arrow/i.test(text),
        )
        .forEach((text) => {
          if (!result.includes(text)) result.push(text);
        });
    }
    return result;
  }

  function appendNarrative(bridge, act, text) {
    act.seen.add(text);
    bridge.seenNarrative.add(text);
    const paragraph = create("p", "scroll-story-paragraph story-reveal", text);
    act.narrative.appendChild(paragraph);
    saveNarrative(bridge, bridge.currentActNumber, text);

    window.requestAnimationFrame(() => paragraph.classList.add("is-visible"));

    if (bridge.follow || isNearBottom()) {
      bridge.follow = true;
      window.setTimeout(() => {
        paragraph.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "end",
        });
      }, 60);
    } else {
      bridge.newPassageButton.hidden = false;
    }
  }

  function mirrorPlaybackControls(bridge, act) {
    const runtimeButtons = Array.from(bridge.runtime.querySelectorAll("button"));
    const controls = runtimeButtons.filter((button) =>
      /pause|resume|show now|slow|normal|fast/i.test(
        `${button.textContent || ""} ${button.getAttribute("aria-label") || ""}`,
      ),
    );
    if (!controls.length) {
      act.controls.hidden = true;
      return;
    }

    act.controls.hidden = false;
    act.controls.replaceChildren();
    const label = create("span", "scroll-playback-label", "READING CONTROLS");
    act.controls.appendChild(label);

    controls.forEach((runtimeButton) => {
      const text = normalise(runtimeButton.textContent || runtimeButton.getAttribute("aria-label"));
      if (!text || act.controls.querySelector(`[data-control="${cssEscape(text.toLowerCase())}"]`)) return;
      const button = create("button", "scroll-playback-button", text);
      button.type = "button";
      button.dataset.control = text.toLowerCase();
      button.classList.toggle(
        "is-active",
        runtimeButton.classList.contains("is-active") ||
          runtimeButton.getAttribute("aria-pressed") === "true",
      );
      button.addEventListener("click", () => {
        const fresh = Array.from(bridge.runtime.querySelectorAll("button")).find((candidate) =>
          normalise(candidate.textContent || candidate.getAttribute("aria-label")) === text,
        );
        fresh?.click();
      });
      act.controls.appendChild(button);
    });
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(value);
    return String(value).replace(/[^a-z0-9_-]/gi, "-");
  }

  function showResults(bridge) {
    if (bridge.resultMode) return;
    bridge.resultMode = true;
    bridge.reader.hidden = true;
    bridge.reader.id = "story-archive";
    bridge.runtime.id = "story";
    bridge.runtime.classList.remove("story-runtime-source");
    bridge.runtime.classList.add("story-runtime-visible");
    bridge.newPassageButton.hidden = true;
    document.body.classList.add("v6-results-visible");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function hideResults(bridge) {
    bridge.resultMode = false;
    bridge.runtime.id = "story-runtime";
    bridge.runtime.classList.add("story-runtime-source");
    bridge.runtime.classList.remove("story-runtime-visible");
    bridge.reader.id = "story";
    bridge.reader.hidden = false;
    document.body.classList.remove("v6-results-visible");
  }

  function emptyArchive() {
    return { version: 1, acts: [] };
  }

  function loadArchive() {
    try {
      const value = storage()?.getItem(ARCHIVE_KEY);
      if (!value) return emptyArchive();
      const parsed = JSON.parse(value);
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.acts)) {
        return emptyArchive();
      }
      return parsed;
    } catch {
      return emptyArchive();
    }
  }

  function saveArchive(archive) {
    try {
      storage()?.setItem(ARCHIVE_KEY, JSON.stringify(archive));
    } catch {
      // Archive persistence is optional.
    }
  }

  function clearArchive() {
    try {
      storage()?.removeItem(ARCHIVE_KEY);
    } catch {
      // Nothing to clear.
    }
  }

  function restoreArchive(bridge) {
    bridge.archive.acts.forEach((saved) => {
      const meta = {
        actNumber: saved.number,
        title: saved.title,
        actMeta: saved.meta,
      };
      const act = createActFromArchive(bridge, meta);
      (saved.opening || []).forEach((paragraph) => appendOpeningParagraph(act, paragraph));
      act.openingSaved = (saved.opening || []).length > 0;
      (saved.narrative || []).forEach((paragraph) => {
        act.seen.add(paragraph);
        bridge.seenNarrative.add(paragraph);
        const node = create("p", "scroll-story-paragraph is-visible", paragraph);
        act.narrative.appendChild(node);
      });
    });
  }

  function createActFromArchive(bridge, meta) {
    const section = create("section", "scroll-act");
    section.dataset.actNumber = String(meta.actNumber);
    const opening = create("div", "scroll-act-opening");
    const header = create("header", "scroll-act-header");
    const kicker = create(
      "p",
      "scroll-act-kicker",
      `ACT ${String(meta.actNumber).padStart(2, "0")} / 12${
        meta.actMeta ? ` · ${meta.actMeta}` : ""
      }`,
    );
    const title = create("h2", "scroll-act-title", meta.title || `Act ${meta.actNumber}`);
    const copy = create("div", "scroll-act-copy");
    header.append(kicker, title);
    opening.append(header, copy);
    const question = create("section", "scroll-question-stage");
    question.hidden = true;
    const controls = create("div", "scroll-playback-controls");
    controls.hidden = true;
    const narrative = create("div", "scroll-act-narrative");
    section.append(opening, question, controls, narrative);
    bridge.reader.appendChild(section);
    const act = {
      section,
      opening,
      header,
      title,
      kicker,
      copy,
      question,
      controls,
      narrative,
      openingSaved: false,
      seen: new Set(),
    };
    bridge.acts.set(meta.actNumber, act);
    return act;
  }

  function saveActOpening(bridge, meta, opening) {
    let saved = bridge.archive.acts.find((act) => act.number === meta.actNumber);
    if (!saved) {
      saved = {
        number: meta.actNumber,
        title: meta.title || `Act ${meta.actNumber}`,
        meta: meta.actMeta || "",
        opening: [],
        narrative: [],
      };
      bridge.archive.acts.push(saved);
    }
    saved.title = meta.title || saved.title;
    saved.meta = meta.actMeta || saved.meta;
    saved.opening = opening.slice();
    saveArchive(bridge.archive);
  }

  function saveNarrative(bridge, actNumber, text) {
    const saved = bridge.archive.acts.find((act) => act.number === actNumber);
    if (!saved) return;
    if (!saved.narrative.includes(text)) saved.narrative.push(text);
    saveArchive(bridge.archive);
  }

  waitForRuntime();
})();
