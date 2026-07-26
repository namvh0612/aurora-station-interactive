(function startAuroraReader() {
  "use strict";

  const data = window.AURORA_STATION_DATA;
  const core = window.AuroraCore;
  const pdfExporter = window.AuroraPdf;
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

  function updateProgress() {
    const answered = state.answers.length;
    const percent = (answered / data.assessment.scoredItemCount) * 100;
    progressFill.style.width = `${percent}%`;
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

  function commitAnswer(raw) {
    if (interactionLocked) {
      return;
    }
    interactionLocked = true;
    state = core.answerCurrent(data, state, raw);
    persist();
    render();
    announce("Choice saved. The story continues.");
    scrollToCurrent();
    window.setTimeout(() => {
      interactionLocked = false;
    }, 180);
  }

  function commitReserve(optionId) {
    if (interactionLocked) {
      return;
    }
    interactionLocked = true;
    state = core.chooseReserve(data, state, optionId);
    persist();
    render();
    announce("Decision saved. The final watch continues.");
    scrollToCurrent();
    window.setTimeout(() => {
      interactionLocked = false;
    }, 180);
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
    const responseSymbols = ["○", "◔", "◑", "◕", "●", "✦"];
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

    const choices = element("div", "spectrum-choices");
    spectrum.positions.forEach((raw) => {
      const button = element("button", "spectrum-choice");
      button.type = "button";
      button.setAttribute("aria-label", responseLabels[raw - 1]);
      button.title = responseLabels[raw - 1];
      button.appendChild(
        element("span", `spectrum-symbol level-${raw}`, responseSymbols[raw - 1]),
      );
      button.addEventListener("click", () => commitAnswer(raw));
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
      button.addEventListener("click", () => commitReserve(option.id));
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
    hero.appendChild(element("p", "eyebrow", "Your Aurora profile"));
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
    profileTab.setAttribute("aria-selected", "true");
    elementsTab.setAttribute("aria-selected", "false");
    tabs.append(profileTab, elementsTab);
    section.appendChild(tabs);

    const profilePanel = element("div", "result-panel");
    profilePanel.setAttribute("role", "tabpanel");
    const insightGrid = element("div", "insight-grid");
    const insightContent = [
      ["Natural strengths", narrative?.strengths || []],
      ["Under pressure", narrative?.pressure || ""],
      ["A useful counterbalance", narrative?.watchOut || ""],
      ["Working with others", narrative?.collaboration || ""],
    ];
    insightContent.forEach(([title, content]) => {
      const card = element("section", "insight-card");
      card.appendChild(element("h2", "", title));
      if (Array.isArray(content)) {
        const list = element("ul");
        content.forEach((line) => list.appendChild(element("li", "", line)));
        card.appendChild(list);
      } else {
        card.appendChild(element("p", "", content));
      }
      insightGrid.appendChild(card);
    });
    profilePanel.appendChild(insightGrid);

    const pattern = element("section", "element-pattern");
    pattern.appendChild(element("h2", "", "How your five currents showed up"));
    pattern.appendChild(
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
      heading.appendChild(element("h3", "", result.element));
      heading.appendChild(
        element("p", "", `${result.trait} · ${result.lens}`),
      );
      row.appendChild(heading);
      row.appendChild(element("strong", "", result.expression));
      row.appendChild(element("p", "pattern-description", result.description));
      patternList.appendChild(row);
    });
    pattern.appendChild(patternList);
    profilePanel.appendChild(pattern);

    const elementsPanel = element("div", "result-panel", "");
    elementsPanel.hidden = true;
    elementsPanel.setAttribute("role", "tabpanel");
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
      item.appendChild(
        element("h3", "", `${result.element} · ${result.lens}`),
      );
      item.appendChild(
        element("p", "", `Big Five foundation: ${result.trait}.`),
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

    function activatePanel(showProfile) {
      profilePanel.hidden = !showProfile;
      elementsPanel.hidden = showProfile;
      profileTab.classList.toggle("active", showProfile);
      elementsTab.classList.toggle("active", !showProfile);
      profileTab.setAttribute("aria-selected", String(showProfile));
      elementsTab.setAttribute("aria-selected", String(!showProfile));
    }

    profileTab.addEventListener("click", () => activatePanel(true));
    elementsTab.addEventListener("click", () => activatePanel(false));
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
        await pdfExporter.downloadProfile(
          data,
          state,
          core,
          "Aurora_Station_Profile.pdf",
        );
        announce("Your personal profile has been downloaded.");
      } catch {
        announce("The profile PDF could not be created. Please try again.");
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

    if (core.currentStep(data, state).type === "complete") {
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

  if (!data || !core || !pdfExporter) {
    storyRoot.textContent =
      "Aurora Station could not load its story data. Keep the content file beside this page and try again.";
    return;
  }

  state = core.sanitiseState(data, core.loadState(data, safeStorage()));
  render();
})();
