(function startAuroraReader() {
  "use strict";

  const data = window.AURORA_STATION_DATA;
  const core = window.AuroraCore;
  const pdfExporter = window.AuroraPdf;
  const visuals = window.AuroraVisuals;
  const imageExporter = window.AuroraImage;
  const storyRoot = document.getElementById("story");
  const progressFill = document.getElementById("progress-fill");
  const progressBar = document.querySelector(".reader-progress");
  const progressLabel = document.getElementById("progress-label");
  const liveStatus = document.getElementById("screen-reader-status");
  let interactionLocked = false;
  let state;

  function safeStorage() {
    try {
      return window.localStorage;
    } catch {
      return null;
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

  function chevronIcon(raw) {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    const direction = raw <= 3 ? "left" : "right";
    const count = raw <= 3 ? 4 - raw : raw - 3;
    const spacing = 10;
    const start = 24 - ((count - 1) * spacing) / 2;

    svg.setAttribute("viewBox", "0 0 48 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.classList.add(
      "spectrum-symbol",
      `level-${raw}`,
      `direction-${direction}`,
    );

    for (let index = 0; index < count; index += 1) {
      const centre = start + index * spacing;
      const path = document.createElementNS(namespace, "path");
      path.setAttribute(
        "d",
        direction === "left"
          ? `M ${centre + 3.5} 5 L ${centre - 3.5} 12 L ${centre + 3.5} 19`
          : `M ${centre - 3.5} 5 L ${centre + 3.5} 12 L ${centre - 3.5} 19`,
      );
      svg.appendChild(path);
    }

    return svg;
  }

  function updateProgress() {
    const answered = state.answers.length;
    const percent = (answered / data.assessment.scoredItemCount) * 100;
    progressFill.style.transform = `scaleX(${percent / 100})`;
    progressBar.setAttribute("aria-valuenow", String(answered));

    if (answered === data.assessment.scoredItemCount) {
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
    const target =
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
        block: "center",
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
    const responseLabels = [
      "Not at all like how I would respond",
      "Mostly unlike how I would respond",
      "Slightly unlike how I would respond",
      "Slightly like how I would respond",
      "Mostly like how I would respond",
      "Very much like how I would respond",
    ];
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
    tuner.setAttribute("aria-hidden", "true");
    tuner.appendChild(element("span", "", "RESPONSE SIGNAL"));
    tuner.appendChild(element("span", "", "CHOOSE A POSITION"));
    group.appendChild(tuner);

    const choices = element("div", "spectrum-choices");
    spectrum.positions.forEach((raw) => {
      const button = element("button", "spectrum-choice");
      button.type = "button";
      button.setAttribute("aria-label", responseLabels[raw - 1]);
      button.title = responseLabels[raw - 1];
      button.appendChild(chevronIcon(raw));
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

  function renderResults(parent) {
    const assessment = core.analyseProfile(data, state);
    const narrative = assessment.narrative;
    const section = element("section", "results profile-page");
    section.id = "results";
    section.dataset.current = "true";

    const hero = element("header", "profile-hero");
    hero.appendChild(
      element("p", "eyebrow", "Dawn debrief · Final watch complete"),
    );
    hero.appendChild(
      element("h1", "", narrative ? narrative.title : "Your response pattern"),
    );
    hero.appendChild(
      element("p", "profile-strapline", narrative ? narrative.strapline : ""),
    );
    hero.appendChild(element("p", "profile-overview", assessment.overview));
    section.appendChild(hero);

    const tabs = element("div", "result-tabs");
    tabs.setAttribute("role", "tablist");
    const profileTab = element("button", "result-tab active", "Your profile");
    const elementsTab = element("button", "result-tab", "The five elements");
    profileTab.type = "button";
    elementsTab.type = "button";
    profileTab.setAttribute("role", "tab");
    elementsTab.setAttribute("role", "tab");
    profileTab.id = "profile-tab";
    elementsTab.id = "elements-tab";
    profileTab.setAttribute("aria-controls", "profile-panel");
    elementsTab.setAttribute("aria-controls", "elements-panel");
    profileTab.setAttribute("aria-selected", "true");
    elementsTab.setAttribute("aria-selected", "false");
    profileTab.tabIndex = 0;
    elementsTab.tabIndex = -1;
    tabs.append(profileTab, elementsTab);
    section.appendChild(tabs);

    const profilePanel = element("div", "result-panel");
    profilePanel.id = "profile-panel";
    profilePanel.setAttribute("role", "tabpanel");
    profilePanel.setAttribute("aria-labelledby", "profile-tab");

    const chartFigure = element("figure", "radar-figure profile-radar");
    const chartHeading = element("header", "radar-heading");
    chartHeading.appendChild(element("p", "technical-label", "SIGNAL MAP"));
    chartHeading.appendChild(element("h2", "", "Your response shape"));
    chartFigure.appendChild(chartHeading);
    const chart = element("div", "radar-chart");
    chart.innerHTML = visuals.radarSvg(assessment, { showScores: false });
    chartFigure.appendChild(chart);
    chartFigure.appendChild(
      element(
        "figcaption",
        "",
        "A point farther from the centre means that response style appeared more consistently in this journey. The shape is not a percentage, ranking or comparison with other people.",
      ),
    );
    profilePanel.appendChild(chartFigure);

    if (narrative?.rhythm) {
      const rhythm = element("section", "debrief-section decision-rhythm");
      rhythm.appendChild(element("p", "section-index", "01"));
      const rhythmCopy = element("div");
      rhythmCopy.appendChild(element("h2", "", "Your decision rhythm"));
      rhythmCopy.appendChild(element("p", "", narrative.rhythm));
      rhythm.appendChild(rhythmCopy);
      profilePanel.appendChild(rhythm);
    }

    const insightLedger = element("section", "insight-ledger");
    insightLedger.appendChild(element("p", "section-index", "02"));
    const insightContentRoot = element("div", "insight-ledger-content");
    insightContentRoot.appendChild(element("h2", "", "Reading the pattern"));
    const insightGrid = element("div", "insight-grid");
    const insightContent = [
      ["Natural strengths", narrative?.strengths || []],
      ["Under pressure", narrative?.pressure || ""],
      ["A useful counterbalance", narrative?.watchOut || ""],
      ["Working with others", narrative?.collaboration || ""],
    ];
    insightContent.forEach(([title, content]) => {
      const insight = element("section", "insight-item");
      insight.appendChild(element("h3", "", title));
      if (Array.isArray(content)) {
        const list = element("ul");
        content.forEach((line) => list.appendChild(element("li", "", line)));
        insight.appendChild(list);
      } else {
        insight.appendChild(element("p", "", content));
      }
      insightGrid.appendChild(insight);
    });
    insightContentRoot.appendChild(insightGrid);
    insightLedger.appendChild(insightContentRoot);
    profilePanel.appendChild(insightLedger);

    const pattern = element("section", "debrief-section element-pattern");
    pattern.appendChild(element("p", "section-index", "03"));
    const patternContent = element("div");
    patternContent.appendChild(
      element("h2", "", "How your five currents showed up"),
    );
    patternContent.appendChild(
      element(
        "p",
        "",
        "These labels describe which response styles came forward most readily. They are not percentages or fixed categories.",
      ),
    );
    const patternList = element("div", "pattern-list");
    assessment.elements.forEach((result) => {
      const row = element("article", "pattern-row");
      row.style.setProperty("--result-colour", result.colour);
      const heading = element("div");
      const namedElement = element("h3", "");
      namedElement.appendChild(element("span", "element-marker"));
      namedElement.appendChild(document.createTextNode(result.element));
      heading.appendChild(namedElement);
      heading.appendChild(
        element("p", "", `${result.trait} · ${result.lens}`),
      );
      row.appendChild(heading);
      row.appendChild(element("strong", "", result.expression));
      row.appendChild(element("p", "pattern-description", result.description));
      const details = element("div", "pattern-details");
      [
        ["In practice:", result.practicalReading],
        ["Within this element:", result.facetPattern],
        ["Possible trade-off:", result.tradeOff],
        ["Useful balance:", result.balancePrompt],
      ].forEach(([label, text]) => {
        details.appendChild(labelledParagraph(label, text));
      });
      row.appendChild(details);
      patternList.appendChild(row);
    });
    patternContent.appendChild(patternList);
    pattern.appendChild(patternContent);
    profilePanel.appendChild(pattern);

    const elementsPanel = element("div", "result-panel", "");
    elementsPanel.id = "elements-panel";
    elementsPanel.hidden = true;
    elementsPanel.setAttribute("role", "tabpanel");
    elementsPanel.setAttribute("aria-labelledby", "elements-tab");
    elementsPanel.appendChild(
      element("h2", "", "Understanding the five elements"),
    );
    elementsPanel.appendChild(
      element(
        "p",
        "elements-intro",
        "The elements are narrative names for five broad Big Five dimensions. Every person uses all five. Context determines which one is most useful.",
      ),
    );
    const definitionList = element("div", "definition-list");
    assessment.elements.forEach((result) => {
      const item = element("article", "definition-item");
      item.style.setProperty("--result-colour", result.colour);
      const definitionHeading = element("h3");
      definitionHeading.appendChild(element("span", "element-marker"));
      definitionHeading.appendChild(
        document.createTextNode(`${result.element} · ${result.lens}`),
      );
      item.appendChild(definitionHeading);
      item.appendChild(
        labelledParagraph(
          "Big Five foundation:",
          `${result.trait}.`,
          "element-foundation",
        ),
      );
      item.appendChild(element("p", "", result.plainMeaning));
      item.appendChild(
        labelledParagraph("Not the same as:", result.notSameAs),
      );
      item.appendChild(
        labelledParagraph("Both ends can work:", result.adaptiveRange),
      );
      result.facets.forEach((facet) => {
        item.appendChild(
          element(
            "p",
            "definition-facet",
            `${facet.name}: ${result.facetDefinitions[facet.name] || ""}`,
          ),
        );
      });
      definitionList.appendChild(item);
    });
    elementsPanel.appendChild(definitionList);
    elementsPanel.appendChild(
      element(
        "p",
        "results-note",
        "Reverse-keyed statements are corrected before the two facets are combined. This story-based profile describes response tendencies in Aurora Station; it is not a diagnosis or a population percentile.",
      ),
    );

    function activatePanel(showProfile, moveFocus) {
      profilePanel.hidden = !showProfile;
      elementsPanel.hidden = showProfile;
      profileTab.classList.toggle("active", showProfile);
      elementsTab.classList.toggle("active", !showProfile);
      profileTab.setAttribute("aria-selected", String(showProfile));
      elementsTab.setAttribute("aria-selected", String(!showProfile));
      profileTab.tabIndex = showProfile ? 0 : -1;
      elementsTab.tabIndex = showProfile ? -1 : 0;
      if (moveFocus) {
        (showProfile ? profileTab : elementsTab).focus();
      }
    }

    profileTab.addEventListener("click", () => activatePanel(true));
    elementsTab.addEventListener("click", () => activatePanel(false));
    [profileTab, elementsTab].forEach((tab) => {
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
          return;
        }
        event.preventDefault();
        const showProfile =
          event.key === "ArrowLeft" || event.key === "Home";
        activatePanel(showProfile, true);
      });
    });
    section.append(profilePanel, elementsPanel);

    const actions = element("div", "completion-actions");
    const ebookButton = element(
      "button",
      "print-button",
      "Download your story",
    );
    ebookButton.type = "button";
    ebookButton.addEventListener("click", async () => {
      ebookButton.disabled = true;
      ebookButton.textContent = "Building your ebook…";
      try {
        await pdfExporter.downloadStory(
          data,
          state,
          core,
          "Aurora_Station_Journey.pdf",
        );
        announce("Your Aurora Station ebook has been downloaded.");
      } catch {
        announce("The PDF could not be created. Please try again.");
      } finally {
        ebookButton.disabled = false;
        ebookButton.textContent = "Download your story";
      }
    });
    actions.appendChild(ebookButton);

    const reportButton = element(
      "button",
      "report-button",
      "Download your profile",
    );
    reportButton.type = "button";
    reportButton.addEventListener("click", async () => {
      reportButton.disabled = true;
      reportButton.textContent = "Building your profile…";
      try {
        await imageExporter.downloadProfile(
          assessment,
          visuals,
          "Aurora_Station_Profile.png",
        );
        announce("Your personal profile image has been downloaded.");
      } catch {
        announce("The profile image could not be created. Please try again.");
      } finally {
        reportButton.disabled = false;
        reportButton.textContent = "Download your profile";
      }
    });
    actions.appendChild(reportButton);

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
      state = core.emptyState();
      render();
      document.getElementById("story-start").scrollIntoView({
        behavior: "smooth",
      });
    });
    actions.appendChild(restartButton);
    section.appendChild(actions);
    parent.appendChild(section);
  }

  function renderEnding(parent) {
    const reserve = core.selectedReserve(data, state);
    const ending = element("section", "ending");
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
    parent.appendChild(ending);
  }

  function render() {
    storyRoot.replaceChildren();
    const complete = core.currentStep(data, state).type === "complete";
    document.body.classList.toggle("debrief-mode", complete);

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

    updateProgress();
  }

  if (!data || !core || !pdfExporter || !visuals || !imageExporter) {
    storyRoot.textContent =
      "Aurora Station could not load its story data. Keep the content file beside this page and try again.";
    return;
  }

  state = core.sanitiseState(data, core.loadState(data, safeStorage()));
  render();
})();
