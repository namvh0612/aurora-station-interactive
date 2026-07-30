(function attachAuroraCore(globalScope) {
  "use strict";
  const STORAGE_KEY = "aurora-station-journey-v7";
  const SPEED_KEY = "aurora-station-text-speed-v1";

  function splitParagraphs(value) {
    return Array.isArray(value)
      ? value.flatMap(splitParagraphs)
      : String(value || "").split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  }
  function flattenItems(data) {
    return data.story.acts.flatMap((act) => act.items).slice().sort((a, b) => a.number - b.number);
  }
  function prepareData(data) {
    const spectrum = data.assessment.spectrum;
    spectrum.id = "agreement-5";
    spectrum.min = 1;
    spectrum.max = 5;
    spectrum.positions = [1, 2, 3, 4, 5];
    spectrum.leftAnchor = "Strongly disagree";
    spectrum.rightAnchor = "Strongly agree";
    spectrum.bands = { low: [1, 2], mid: [3], high: [4, 5] };
    data.assessment.scoring.reverseKey = "corrected = 6 - raw";
    const actOne = {
      q01: "During an unfamiliar shared watch, I would usually find myself wanting some conversation with the people around me.",
      q02: "If someone beside me appeared unsettled, I would naturally feel concerned about how they were coping.",
      q03: "When several unfinished checks arrive at once, I can lose track of how they fit together.",
      q04: "Even with an unresolved warning on the console, I would usually remain relatively calm.",
      q05: "The station’s cold light, the wind against the walls, and the emptiness of the space would usually leave little impression on me."
    };
    flattenItems(data).forEach((item) => {
      if (actOne[item.id]) item.statement = actOne[item.id];
      item.spectrumId = spectrum.id;
      if (item.assessment) {
        item.assessment.correctedScoreFormula = item.assessment.key === "R" ? "6 - raw" : "raw";
        if (item.assessment.constructContract) item.assessment.constructContract.format = "single-statement Likert 1-5";
      }
      if (item.responseBranches) {
        if (item.responseBranches.low) item.responseBranches.low.responses = [1, 2];
        if (item.responseBranches.mid) item.responseBranches.mid.responses = [3];
        if (item.responseBranches.high) item.responseBranches.high.responses = [4, 5];
      }
    });
    return data;
  }
  function emptyState() {
    return { playerName: "", onboardingComplete: false, answers: [], revealed: {}, endingAcknowledged: false };
  }
  function normalisePlayerName(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 60);
  }
  function sanitiseState(data, candidate) {
    const itemCount = flattenItems(data).length;
    const source = Array.isArray(candidate?.answers) ? candidate.answers : [];
    const answers = [];
    for (const value of source.slice(0, itemCount)) {
      const raw = Number(value);
      if (!Number.isInteger(raw) || raw < 1 || raw > 5) break;
      answers.push(raw);
    }
    const revealed = {};
    data.story.acts.forEach((act) => {
      const count = Number(candidate?.revealed?.[act.id] || 0);
      revealed[act.id] = Math.max(0, Math.min(act.items.length + 1, Number.isFinite(count) ? Math.floor(count) : 0));
    });
    const playerName = normalisePlayerName(candidate?.playerName);
    return {
      playerName,
      onboardingComplete: Boolean(candidate?.onboardingComplete && playerName),
      answers,
      revealed,
      endingAcknowledged: Boolean(candidate?.endingAcknowledged && answers.length === itemCount)
    };
  }
  function loadState(data, storage) {
    try {
      const saved = storage?.getItem(STORAGE_KEY);
      return saved ? sanitiseState(data, JSON.parse(saved)) : emptyState();
    } catch {
      return emptyState();
    }
  }
  function saveState(data, state, storage) {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(sanitiseState(data, state)));
      return true;
    } catch {
      return false;
    }
  }
  function clearState(storage) {
    try {
      storage?.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }
  function setPlayerIdentity(data, state, name) {
    const safe = sanitiseState(data, state);
    const playerName = normalisePlayerName(name);
    return playerName ? { ...safe, playerName, onboardingComplete: true } : safe;
  }
  function branchKeyForRaw(data, raw) {
    return Object.keys(data.assessment.spectrum.bands).find((key) => data.assessment.spectrum.bands[key].includes(raw));
  }
  function branchForRaw(data, item, raw) {
    const key = branchKeyForRaw(data, raw);
    return key ? item.responseBranches?.[key] || null : null;
  }
  function correctedScore(item, raw) {
    return item.assessment?.key === "R" ? 6 - raw : raw;
  }
  function answerAt(data, state, index, rawValue) {
    const safe = sanitiseState(data, state);
    const raw = Number(rawValue);
    if (!Number.isInteger(raw) || raw < 1 || raw > 5 || index < 0 || index >= flattenItems(data).length || index > safe.answers.length) return safe;
    const answers = safe.answers.slice();
    answers[index] = raw;
    answers.length = Math.max(answers.length, index + 1);
    return { ...safe, answers, endingAcknowledged: false };
  }
  function undoWithinAct(data, state) {
    const safe = sanitiseState(data, state);
    if (!safe.answers.length) return safe;
    const actIndex = Math.floor((safe.answers.length - 1) / 5);
    const act = data.story.acts[actIndex];
    if ((safe.revealed[act.id] || 0) > 0) return safe;
    return { ...safe, answers: safe.answers.slice(0, -1) };
  }
  function setRevealed(data, state, actId, count) {
    const safe = sanitiseState(data, state);
    return { ...safe, revealed: { ...safe.revealed, [actId]: count } };
  }
  function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }
  function scoreAssessment(data, state) {
    const safe = sanitiseState(data, state);
    const items = flattenItems(data);
    const buckets = {};
    Object.entries(data.assessment.elements).forEach(([code, definition]) => {
      buckets[code] = {};
      definition.facets.forEach((facet) => { buckets[code][facet] = []; });
    });
    safe.answers.forEach((raw, index) => {
      const item = items[index];
      if (item) buckets[item.assessment.elementCode][item.assessment.facet].push(correctedScore(item, raw));
    });
    const elements = Object.entries(data.assessment.elements).map(([code, definition]) => {
      const facets = definition.facets.map((name) => ({ name, score: mean(buckets[code][name]), answered: buckets[code][name].length }));
      return {
        code,
        element: definition.element,
        trait: definition.trait,
        colour: definition.colour,
        score: mean(facets.map((facet) => facet.score).filter(Number.isFinite)),
        facets
      };
    });
    return { answered: safe.answers.length, complete: safe.answers.length === items.length, elements };
  }
  const spectrumLabels = {
    WO: { lower: "Focused evidence", higher: "Exploration" },
    FI: { lower: "Quiet influence", higher: "Visible direction" },
    EA: { lower: "Firm boundaries", higher: "Human accommodation" },
    ME: { lower: "Adaptive structure", higher: "Systematic structure" },
    WA: { lower: "Threat sensitivity", higher: "Emotional steadiness" }
  };
  function analyseProfile(data, state) {
    const scored = scoreAssessment(data, state);
    const elements = scored.elements.map((result) => {
      const definition = data.assessment.elements[result.code];
      const guide = definition.interpretation?.guide || {};
      const position = Number.isFinite(result.score) ? (result.score - 1) / 4 : 0.5;
      return {
        ...result,
        lens: definition.interpretation?.lens || result.trait,
        description: Number.isFinite(result.score) ? `Your responses placed ${result.element} at ${result.score.toFixed(1)} on the five-point scale.` : "",
        expression: position < 0.375 ? "Lower-pole lean" : position > 0.625 ? "Higher-pole lean" : "Context-sensitive range",
        spectrum: spectrumLabels[result.code],
        position,
        facetDefinitions: definition.interpretation?.facets || {},
        facetPattern: "",
        potentialAdvantage: guide.adaptiveRange || "",
        overextension: guide.higherTradeOff || "",
        reflection: guide.higherBalance || "",
        practicalReading: guide.adaptiveRange || "",
        tradeOff: guide.higherTradeOff || "",
        balancePrompt: guide.higherBalance || "",
        plainMeaning: guide.plainMeaning || "",
        notSameAs: guide.notSameAs || "",
        adaptiveRange: guide.adaptiveRange || "",
        context: { stages: [] }
      };
    });
    const top = elements.filter((item) => Number.isFinite(item.score)).sort((a, b) => b.score - a.score)[0] || elements[0];
    const role = {
      code: top.code,
      element: top.element,
      trait: top.trait,
      colour: top.colour,
      title: "The Watchkeeper",
      fit: "Reflective fit",
      definition: "A narrative contribution based on this journey, not an occupational assessment.",
      function: "Bring your strongest available current into the station’s shared work.",
      whatYouBring: top.practicalReading,
      watchFor: top.tradeOff,
      actionTitle: "BALANCE THE WATCH",
      action: top.balancePrompt,
      why: `${top.element} was the most available current in this journey.`,
      basis: "Based on the five-point self-report profile.",
      mode: "solo"
    };
    return {
      ...scored,
      playerName: sanitiseState(data, state).playerName,
      overview: "A five-current reflection of how you responded across Aurora Station.",
      elements,
      role,
      context: { elements: [], highlights: [], summary: "", note: "" },
      quality: { status: "Suitable for reflection", level: "clear", summary: "Self-report results should be used as reflection, not diagnosis.", metrics: {} },
      finalChoice: null,
      roleModel: "Narrative role based on the strongest available current."
    };
  }
  function selectedReserve(data, state) {
    const raw = sanitiseState(data, state).answers[56];
    if (!raw || !data.finalReserve?.options?.length) return null;
    return data.finalReserve.options[raw <= 2 ? 0 : raw === 3 ? 1 : 2] || null;
  }
  function acknowledgeEnding(data, state) {
    return { ...sanitiseState(data, state), endingAcknowledged: true };
  }

  globalScope.AuroraCore = {
    STORAGE_KEY, SPEED_KEY, prepareData, flattenItems, splitParagraphs, emptyState,
    sanitiseState, normalisePlayerName, loadState, saveState, clearState,
    setPlayerIdentity, branchKeyForRaw, branchForRaw, correctedScore, answerAt,
    undoWithinAct, setRevealed, scoreAssessment, analyseProfile, selectedReserve,
    acknowledgeEnding
  };
})(typeof window !== "undefined" ? window : globalThis);
