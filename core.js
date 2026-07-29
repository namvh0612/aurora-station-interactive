(function attachAuroraCore(globalScope) {
  "use strict";

  const STORAGE_KEY = "aurora-station-journey-v2";
  function flattenItems(data) {
    return data.story.acts
      .flatMap((act) => act.items)
      .slice()
      .sort((left, right) => left.number - right.number);
  }

  function splitParagraphs(value) {
    return String(value || "")
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function branchKeyForRaw(data, raw) {
    const bands = data.assessment.spectrum.bands;
    return Object.keys(bands).find((key) => bands[key].includes(raw));
  }

  function branchForRaw(data, item, raw) {
    const branchKey = branchKeyForRaw(data, raw);
    return branchKey ? item.responseBranches[branchKey] : null;
  }

  function emptyState() {
    return {
      playerName: "",
      onboardingComplete: false,
      answers: [],
      reserveChoice: null,
      endingAcknowledged: false,
    };
  }

  function normalisePlayerName(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
  }

  function sanitiseState(data, candidate) {
    const itemCount = flattenItems(data).length;
    const reserveIds = new Set(data.finalReserve.options.map((option) => option.id));
    const sourceAnswers = Array.isArray(candidate && candidate.answers)
      ? candidate.answers
      : [];
    const answers = [];

    for (const value of sourceAnswers.slice(0, itemCount)) {
      const raw = Number(value);
      if (!Number.isInteger(raw) || raw < 1 || raw > 6) {
        break;
      }
      answers.push(raw);
    }

    let reserveChoice =
      candidate && reserveIds.has(candidate.reserveChoice)
        ? candidate.reserveChoice
        : null;

    if (answers.length < 55) {
      reserveChoice = null;
    }

    if (answers.length > 55 && !reserveChoice) {
      answers.length = 55;
    }

    const playerName = normalisePlayerName(candidate && candidate.playerName);
    const onboardingComplete = Boolean(
      candidate && candidate.onboardingComplete && playerName,
    );
    const endingAcknowledged = Boolean(
      candidate &&
        candidate.endingAcknowledged &&
        answers.length === itemCount &&
        reserveChoice,
    );

    return {
      playerName,
      onboardingComplete,
      answers,
      reserveChoice,
      endingAcknowledged,
    };
  }

  function setPlayerIdentity(data, state, name) {
    const safeState = sanitiseState(data, state);
    const playerName = normalisePlayerName(name);

    if (!playerName) {
      return safeState;
    }

    return {
      ...safeState,
      playerName,
      onboardingComplete: true,
    };
  }

  function loadState(data, storage) {
    if (!storage) {
      return emptyState();
    }

    try {
      const saved = storage.getItem(STORAGE_KEY);
      return saved ? sanitiseState(data, JSON.parse(saved)) : emptyState();
    } catch {
      return emptyState();
    }
  }

  function saveState(data, state, storage) {
    if (!storage) {
      return false;
    }

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(sanitiseState(data, state)));
      return true;
    } catch {
      return false;
    }
  }

  function clearState(storage) {
    if (!storage) {
      return false;
    }

    try {
      storage.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  function currentStep(data, state) {
    const safeState = sanitiseState(data, state);
    const items = flattenItems(data);

    if (safeState.answers.length === items.length) {
      return safeState.endingAcknowledged
        ? { type: "complete" }
        : { type: "ending" };
    }

    if (safeState.answers.length === 55 && !safeState.reserveChoice) {
      return { type: "reserve" };
    }

    return {
      type: "item",
      item: items[safeState.answers.length],
      index: safeState.answers.length,
    };
  }

  function answerCurrent(data, state, rawValue) {
    const safeState = sanitiseState(data, state);
    const raw = Number(rawValue);
    const step = currentStep(data, safeState);

    if (
      step.type !== "item" ||
      !Number.isInteger(raw) ||
      raw < 1 ||
      raw > 6
    ) {
      return safeState;
    }

    return {
      playerName: safeState.playerName,
      onboardingComplete: safeState.onboardingComplete,
      answers: safeState.answers.concat(raw),
      reserveChoice: safeState.reserveChoice,
      endingAcknowledged: false,
    };
  }

  function chooseReserve(data, state, optionId) {
    const safeState = sanitiseState(data, state);
    const step = currentStep(data, safeState);
    const valid = data.finalReserve.options.some(
      (option) => option.id === optionId,
    );

    if (step.type !== "reserve" || !valid) {
      return safeState;
    }

    return {
      playerName: safeState.playerName,
      onboardingComplete: safeState.onboardingComplete,
      answers: safeState.answers.slice(),
      reserveChoice: optionId,
      endingAcknowledged: false,
    };
  }

  function acknowledgeEnding(data, state) {
    const safeState = sanitiseState(data, state);
    const step = currentStep(data, safeState);
    if (step.type !== "ending") {
      return safeState;
    }
    return {
      ...safeState,
      endingAcknowledged: true,
    };
  }

  function undoLast(data, state) {
    const safeState = sanitiseState(data, state);

    if (safeState.endingAcknowledged) {
      return {
        ...safeState,
        endingAcknowledged: false,
      };
    }

    if (
      safeState.answers.length === 55 &&
      safeState.reserveChoice !== null
    ) {
      return {
        playerName: safeState.playerName,
        onboardingComplete: safeState.onboardingComplete,
        answers: safeState.answers.slice(),
        reserveChoice: null,
        endingAcknowledged: false,
      };
    }

    if (safeState.answers.length > 0) {
      return {
        playerName: safeState.playerName,
        onboardingComplete: safeState.onboardingComplete,
        answers: safeState.answers.slice(0, -1),
        reserveChoice: safeState.reserveChoice,
        endingAcknowledged: false,
      };
    }

    return safeState;
  }

  function selectedReserve(data, state) {
    return (
      data.finalReserve.options.find(
        (option) => option.id === state.reserveChoice,
      ) || null
    );
  }

  function mean(values) {
    if (!values.length) {
      return null;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function scoreAssessment(data, state) {
    const safeState = sanitiseState(data, state);
    const items = flattenItems(data);
    const buckets = {};

    Object.entries(data.assessment.elements).forEach(([code, definition]) => {
      buckets[code] = {};
      definition.facets.forEach((facet) => {
        buckets[code][facet] = [];
      });
    });

    safeState.answers.forEach((raw, index) => {
      const item = items[index];
      if (!item) {
        return;
      }

      const corrected =
        item.assessment.key === "R" ? 7 - raw : raw;
      buckets[item.assessment.elementCode][item.assessment.facet].push(
        corrected,
      );
    });

    const elements = Object.entries(data.assessment.elements).map(
      ([code, definition]) => {
        const facets = definition.facets.map((name) => {
          const values = buckets[code][name];
          return {
            name,
            score: mean(values),
            answered: values.length,
          };
        });
        const completedFacetScores = facets
          .map((facet) => facet.score)
          .filter((value) => value !== null);

        return {
          code,
          element: definition.element,
          trait: definition.trait,
          colour: definition.colour,
          score: mean(completedFacetScores),
          facets,
        };
      },
    );

    return {
      answered: safeState.answers.length,
      complete: safeState.answers.length === items.length,
      elements,
    };
  }

  const PROFILE_STAGES = [
    { id: "starting", label: "Starting conditions", from: 1, to: 20 },
    { id: "escalation", label: "Escalation", from: 21, to: 40 },
    { id: "pressure", label: "Late pressure", from: 41, to: 60 },
  ];

  const SPECTRUM_LABELS = {
    WO: { lower: "Focused evidence", higher: "Exploration" },
    FI: { lower: "Quiet influence", higher: "Visible direction" },
    EA: { lower: "Firm boundaries", higher: "Human accommodation" },
    ME: { lower: "Adaptive structure", higher: "Systematic structure" },
    WA: { lower: "Threat sensitivity", higher: "Emotional steadiness" },
  };

  const ROLE_DEFINITIONS = {
    WO: {
      title: "The Pathfinder",
      function:
        "Keep unexplored possibilities visible before the crew closes on one explanation.",
      bring:
        "Alternative explanations, pattern recognition and room for a route the crew has not yet considered.",
      actionTitle: "OPEN ANOTHER ROUTE",
      action:
        "Name one plausible option, signal or explanation the crew has not yet considered.",
    },
    FI: {
      title: "The Catalyst",
      function:
        "Turn uncertainty into a visible decision and help the crew create forward momentum.",
      bring:
        "Visible direction, shared energy and the momentum required to move from discussion into action.",
      actionTitle: "CALL THE DECISION",
      action:
        "State the decision that is being delayed and identify the next concrete move.",
    },
    EA: {
      title: "The Steward",
      function:
        "Keep people, trust and coordination visible while the crew makes difficult decisions.",
      bring:
        "Awareness of human consequences, unspoken concerns and the conditions needed for workable cooperation.",
      actionTitle: "CREW IMPACT SCAN",
      action:
        "Name one person, stakeholder or human consequence the current plan may have missed.",
    },
    ME: {
      title: "The Architect",
      function:
        "Turn intent into clear boundaries, sequence and reliable follow-through.",
      bring:
        "Clear criteria, operational sequence and the discipline required to carry a decision through safely.",
      actionTitle: "SET THE BOUNDARY",
      action:
        "Define the condition, standard or limit that must hold before the crew proceeds.",
    },
    WA: {
      title: "The Sentinel",
      function:
        "Track unresolved risk, protect stability and clarify what evidence is still needed.",
      bring:
        "Calm observation, risk awareness and a clear view of what remains unresolved before the crew commits.",
      actionTitle: "RISK CHECK",
      action:
        "Identify one unresolved risk and the evidence that would show it is sufficiently controlled.",
    },
  };

  const MISSION_WEIGHTS = {
    safety: { WO: 0.25, FI: 0.4, EA: 1, ME: 0.7, WA: 0.9 },
    discovery: { WO: 1, FI: 0.45, EA: 0.3, ME: 0.55, WA: 0.75 },
    bounded: { WO: 0.55, FI: 0.45, EA: 0.65, ME: 1, WA: 0.85 },
  };

  function correctedScore(item, raw) {
    return item.assessment.key === "R" ? 7 - raw : raw;
  }

  function scoreBand(score) {
    if (score === null) {
      return { id: "unavailable", label: "Not available", side: "balanced" };
    }
    if (score <= 2.49) {
      return { id: "clear-lower", label: "Clear lower-pole lean", side: "lower" };
    }
    if (score <= 3.24) {
      return {
        id: "moderate-lower",
        label: "Moderate lower-pole lean",
        side: "lower",
      };
    }
    if (score <= 3.75) {
      return {
        id: "balanced",
        label: "Balanced or context-sensitive",
        side: "balanced",
      };
    }
    if (score <= 4.5) {
      return {
        id: "moderate-higher",
        label: "Moderate higher-pole lean",
        side: "higher",
      };
    }
    return { id: "clear-higher", label: "Clear higher-pole lean", side: "higher" };
  }

  function describeElement(result, definition, band) {
    const interpretation = definition.interpretation;
    if (!interpretation || result.score === null) {
      return "";
    }

    if (band.side === "balanced") {
      return (
        `Your responses moved between ${SPECTRUM_LABELS[result.code].lower.toLowerCase()} ` +
        `and ${SPECTRUM_LABELS[result.code].higher.toLowerCase()}, suggesting that context ` +
        "influenced which end of this range became more useful."
      );
    }

    const direction = band.side === "higher" ? interpretation.higher : interpretation.lower;
    const strength = band.id.startsWith("clear") ? "a clear" : "a moderate";
    return `Your responses showed ${strength} lean toward a style that ${direction}.`;
  }

  function describeFacetPattern(result, guide) {
    const available = result.facets.filter((facet) => facet.score !== null);
    if (available.length !== 2 || !guide) {
      return "";
    }

    const [first, second] = available;
    const difference = Math.abs(first.score - second.score);
    const firstFocus = guide.facetFocus[first.name] || first.name.toLowerCase();
    const secondFocus = guide.facetFocus[second.name] || second.name.toLowerCase();

    if (difference < 0.4) {
      return (
        `The facets were broadly aligned: ${firstFocus} and ${secondFocus} ` +
        "appeared at a similar level across the station scenarios."
      );
    }

    const leading = first.score > second.score ? first : second;
    const quieter = leading === first ? second : first;
    const leadingFocus = guide.facetFocus[leading.name] || leading.name.toLowerCase();
    const emphasis = difference >= 0.8 ? "a pronounced" : "a noticeable";

    return (
      `There was ${emphasis} difference between the facets. ${leading.name} came ` +
      `forward more consistently than ${quieter.name}; ${leadingFocus} was more ` +
      "readily available in this journey."
    );
  }

  function stageForItem(item) {
    return PROFILE_STAGES.find(
      (stage) => item.number >= stage.from && item.number <= stage.to,
    );
  }

  function scoreContextMovement(data, state) {
    const safeState = sanitiseState(data, state);
    const items = flattenItems(data);
    const buckets = {};

    PROFILE_STAGES.forEach((stage) => {
      buckets[stage.id] = {};
      Object.keys(data.assessment.elements).forEach((code) => {
        buckets[stage.id][code] = [];
      });
    });

    safeState.answers.forEach((raw, index) => {
      const item = items[index];
      const stage = item && stageForItem(item);
      if (!item || !stage) {
        return;
      }
      buckets[stage.id][item.assessment.elementCode].push(
        correctedScore(item, raw),
      );
    });

    const elements = Object.keys(data.assessment.elements).map((code) => {
      const stages = PROFILE_STAGES.map((stage) => ({
        id: stage.id,
        label: stage.label,
        score: mean(buckets[stage.id][code]),
      }));
      const start = stages[0].score;
      const finish = stages[2].score;
      const delta = start === null || finish === null ? null : finish - start;
      let label = "Broadly stable";
      if (delta !== null && Math.abs(delta) >= 0.75) {
        label = delta > 0 ? "Pronounced increase" : "Pronounced decrease";
      } else if (delta !== null && Math.abs(delta) >= 0.35) {
        label = delta > 0 ? "Noticeable increase" : "Noticeable decrease";
      }
      return { code, stages, delta, label };
    });

    const moved = elements
      .filter((item) => item.delta !== null && Math.abs(item.delta) >= 0.35)
      .slice()
      .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));

    const highlights = moved.slice(0, 3).map((item) => {
      const element = data.assessment.elements[item.code].element;
      const direction = item.delta > 0 ? "became more available" : "became less available";
      return `${element} ${direction} from the opening conditions to late pressure (${item.delta > 0 ? "+" : ""}${item.delta.toFixed(1)}).`;
    });

    return {
      stages: PROFILE_STAGES.map((stage) => ({ ...stage })),
      elements,
      highlights,
      summary: highlights.length
        ? highlights.join(" ")
        : "Your five currents remained broadly stable across the three stages of the journey.",
      note:
        "These stage comparisons are exploratory context signals within Aurora Station, not separate validated personality scales.",
    };
  }

  function responseQuality(data, state) {
    const values = sanitiseState(data, state).answers;
    if (!values.length) {
      return {
        status: "Not available",
        level: "unavailable",
        summary: "Complete the journey to review response variation.",
        metrics: {},
      };
    }

    const average = mean(values);
    const variance = mean(values.map((value) => (value - average) ** 2));
    const deviation = Math.sqrt(variance || 0);
    const counts = new Map();
    let longestRun = 1;
    let currentRun = 1;

    values.forEach((value, index) => {
      counts.set(value, (counts.get(value) || 0) + 1);
      if (index > 0) {
        if (value === values[index - 1]) {
          currentRun += 1;
          longestRun = Math.max(longestRun, currentRun);
        } else {
          currentRun = 1;
        }
      }
    });

    const dominantCount = Math.max(...counts.values());
    const dominantRate = dominantCount / values.length;
    const flags = [];
    if (dominantRate >= 0.75) {
      flags.push("one response level was used for most items");
    }
    if (deviation < 0.65) {
      flags.push("responses showed very little variation");
    }
    if (longestRun >= 18) {
      flags.push("a long sequence used the same response");
    }

    if (flags.length) {
      return {
        status: "Interpret with care",
        level: "caution",
        summary:
          `The response pattern may provide less differentiation because ${flags.join(" and ")}. ` +
          "Review the profile as a reflection prompt rather than a precise distinction between currents.",
        metrics: { deviation, dominantRate, longestRun },
      };
    }

    return {
      status: "Suitable for reflection",
      level: "clear",
      summary:
        "Your responses used the six-point range with enough variation to support a differentiated reflective profile. This remains a self-report, not a diagnostic assessment.",
      metrics: { deviation, dominantRate, longestRun },
    };
  }

  function missionWeightsForState(state) {
    return MISSION_WEIGHTS[state.reserveChoice] || {
      WO: 0.5,
      FI: 0.5,
      EA: 0.5,
      ME: 0.5,
      WA: 0.5,
    };
  }

  function normaliseRoleInput(value) {
    if (!Number.isFinite(value)) {
      return 0.5;
    }
    return Math.max(0, Math.min(1, (value - 1) / 5));
  }

  function roleMetric(result) {
    const overall = Number(result.score);
    const latePressure = Number(result.context?.stages?.[2]?.score);
    const facetScores = result.facets
      .map((facet) => Number(facet.score))
      .filter(Number.isFinite);
    const facetFloor = facetScores.length ? Math.min(...facetScores) : overall;
    const profileSuitability =
      normaliseRoleInput(overall) * 0.6 +
      normaliseRoleInput(latePressure) * 0.25 +
      normaliseRoleInput(facetFloor) * 0.15;

    return {
      overall,
      latePressure,
      facetFloor,
      profileSuitability,
    };
  }

  function roleTieWeight(state, code) {
    return Number(missionWeightsForState(state)[code] ?? 0.5);
  }

  function recommendRole(data, state, elements, options) {
    const settings = options || {};
    const teamWeights = settings.teamComposition || null;
    const missionWeights = settings.missionRequirement || null;
    const groupMode = Boolean(teamWeights || missionWeights || settings.mode === "group");
    const allowStretchRoles = Boolean(settings.allowStretchRoles);
    const availableElements = elements.filter(
      (result) => Number.isFinite(result.score),
    );

    const candidates = availableElements.map((result) => {
      const metric = roleMetric(result);
      const teamNeed = Number(teamWeights?.[result.code] ?? 0.5);
      const missionNeed = Number(missionWeights?.[result.code] ?? 0.5);
      const stretch = metric.overall < 3.25;
      const finalScore = groupMode
        ? metric.profileSuitability * 0.45 +
          teamNeed * 0.3 +
          missionNeed * 0.25
        : metric.profileSuitability;

      return {
        code: result.code,
        finalScore,
        profileSuitability: metric.profileSuitability,
        overall: metric.overall,
        latePressure: metric.latePressure,
        facetFloor: metric.facetFloor,
        teamNeed,
        missionNeed,
        stretch,
      };
    });

    let selectable = candidates.filter(
      (candidate) => !candidate.stretch || (groupMode && allowStretchRoles),
    );
    if (!selectable.length) {
      selectable = candidates.slice();
    }

    selectable.sort((left, right) => {
      const finalDifference = right.finalScore - left.finalScore;
      if (Math.abs(finalDifference) > 0.000001) {
        return finalDifference;
      }

      if (groupMode) {
        const teamDifference = right.teamNeed - left.teamNeed;
        if (Math.abs(teamDifference) > 0.000001) {
          return teamDifference;
        }
        const missionDifference = right.missionNeed - left.missionNeed;
        if (Math.abs(missionDifference) > 0.000001) {
          return missionDifference;
        }
      }

      const overallDifference = right.overall - left.overall;
      if (Math.abs(overallDifference) > 0.000001) {
        return overallDifference;
      }
      const pressureDifference = right.latePressure - left.latePressure;
      if (Math.abs(pressureDifference) > 0.000001) {
        return pressureDifference;
      }
      const facetDifference = right.facetFloor - left.facetFloor;
      if (Math.abs(facetDifference) > 0.000001) {
        return facetDifference;
      }

      // A final narrative decision is used only when all profile metrics tie.
      return roleTieWeight(state, right.code) - roleTieWeight(state, left.code);
    });

    const selected = selectable[0];
    const runnerUp = selectable[1] || null;
    const scoreGap = runnerUp
      ? selected.finalScore - runnerUp.finalScore
      : 1;
    const result = elements.find((element) => element.code === selected.code);
    const definition = ROLE_DEFINITIONS[selected.code];

    let fit = "Clear fit";
    if (scoreGap < 0.04) {
      fit = groupMode ? "Mission-based fit" : "Balanced fit";
    } else if (scoreGap < 0.08) {
      fit = "Close fit";
    }

    const closeFits = selectable
      .slice(1)
      .filter((candidate) => selected.finalScore - candidate.finalScore < 0.08)
      .map((candidate) => ROLE_DEFINITIONS[candidate.code].title);

    let basis;
    if (groupMode) {
      basis =
        "This recommendation combines profile suitability, the contribution currently needed by the team and the requirements of this mission.";
    } else if (fit === "Balanced fit") {
      basis =
        "This recommendation was selected from closely matched contributions using overall availability, late-pressure availability and facet balance. Your final operational choice was used only as a last tie-break.";
    } else {
      basis =
        "This solo recommendation is led by your profile: overall availability, late-pressure availability and the lower of the two facet scores.";
    }

    const closeFitText =
      closeFits.length === 0
        ? ""
        : closeFits.length === 1
          ? closeFits[0]
          : `${closeFits.slice(0, -1).join(", ")}, and ${closeFits.at(-1)}`;
    const why =
      `${result.element} produced the strongest eligible profile suitability ` +
      `(${selected.profileSuitability.toFixed(2)}) after combining overall availability, ` +
      "late-pressure availability and facet balance." +
      (closeFitText ? ` ${closeFitText} remained close alternatives.` : "");

    return {
      ...definition,
      code: selected.code,
      element: result.element,
      trait: result.trait,
      colour: result.colour,
      fit,
      profilePattern:
        fit === "Balanced fit" || fit === "Mission-based fit"
          ? "balanced"
          : fit === "Close fit"
            ? "close"
            : "focused",
      eligibleRoleCount: selectable.length,
      closeFits,
      whatYouBring: definition.bring,
      watchFor: result.overextension,
      basis,
      why,
      scoreGap,
      definition:
        "Your Aurora Role is the contribution your Five-Element profile is best placed to make in this mission. It is not a fixed personality type.",
      candidates,
      mode: groupMode ? "group" : "solo",
    };
  }

  function finalChoiceSummary(data, state) {
    const reserve = selectedReserve(data, state);
    if (!reserve) {
      return null;
    }
    return {
      id: reserve.id,
      title: reserve.title,
      text: reserve.text,
      note:
        "This narrative decision is not included in any Five-Element score. In a solo journey, it is used only as a final tie-break when all profile metrics are exactly matched.",
    };
  }

  function analyseProfile(data, state, options) {
    const safeState = sanitiseState(data, state);
    const assessment = scoreAssessment(data, safeState);
    const context = scoreContextMovement(data, safeState);
    const contextByCode = Object.fromEntries(
      context.elements.map((item) => [item.code, item]),
    );

    const elements = assessment.elements.map((result) => {
      const definition = data.assessment.elements[result.code];
      const guide = definition.interpretation?.guide;
      const band = scoreBand(result.score);
      const side = band.side === "balanced" ? (result.score >= 3.5 ? "higher" : "lower") : band.side;
      const spectrum = SPECTRUM_LABELS[result.code];
      const potentialAdvantage = band.side === "balanced"
        ? guide?.adaptiveRange || ""
        : guide?.[`${side}Use`] || "";
      const overextension = band.side === "balanced"
        ? "Access to both ends of the range can become hesitation when the situation needs a clear and explicit choice."
        : guide?.[`${side}TradeOff`] || "";
      const reflection = band.side === "balanced"
        ? `Which end of the ${spectrum.lower.toLowerCase()}–${spectrum.higher.toLowerCase()} range does the current situation require you to make more explicit?`
        : guide?.[`${side}Balance`] || "";

      return {
        ...result,
        lens: definition.interpretation?.lens || result.trait,
        description: describeElement(result, definition, band),
        expression: band.label,
        band,
        spectrum,
        position: result.score === null ? 0.5 : Math.max(0, Math.min(1, (result.score - 1) / 5)),
        facetDefinitions: definition.interpretation?.facets || {},
        facetPattern: describeFacetPattern(result, guide),
        potentialAdvantage,
        overextension,
        reflection,
        practicalReading: potentialAdvantage,
        tradeOff: overextension,
        balancePrompt: reflection,
        plainMeaning: guide?.plainMeaning || "",
        notSameAs: guide?.notSameAs || "",
        adaptiveRange: guide?.adaptiveRange || "",
        context: contextByCode[result.code],
      };
    });

    const role = recommendRole(data, safeState, elements, options);
    const quality = responseQuality(data, safeState);
    const overview =
      "Like an aurora, this profile is a spectrum of several colours rather than a single type. " +
      "The five currents below show how you responded across Aurora Station; the recommended role translates that pattern into one practical contribution for this mission.";

    return {
      ...assessment,
      playerName: safeState.playerName,
      overview,
      elements,
      role,
      context,
      quality,
      finalChoice: finalChoiceSummary(data, safeState),
      roleModel:
        role.mode === "group"
          ? "Recommended Role = 45% profile suitability + 30% team composition need + 25% mission requirement."
          : "Solo Role = 60% overall availability + 25% late-pressure availability + 15% facet floor.",
    };
  }

  function buildPlainStory(data, state) {
    const safeState = sanitiseState(data, state);
    const items = flattenItems(data);
    const sections = [data.title, data.subtitle, data.story.prologue.title];
    sections.push(...splitParagraphs(data.story.prologue.text));

    for (const act of data.story.acts) {
      const firstIndex = act.items[0].number - 1;
      if (safeState.answers.length < firstIndex) {
        break;
      }

      sections.push(act.title, act.time, ...splitParagraphs(act.opening));

      for (const item of act.items) {
        const answerIndex = item.number - 1;
        if (answerIndex >= safeState.answers.length) {
          sections.push(item.context, item.statement);
          return sections.join("\n\n");
        }

        const raw = safeState.answers[answerIndex];
        const branch = branchForRaw(data, item, raw);
        sections.push(item.context);
        if (branch) {
          sections.push(branch.transition);
        }
        sections.push(item.convergence);
      }

      sections.push(...splitParagraphs(act.closing));

      if (act.id === data.finalReserve.insertAfterActId) {
        const reserve = selectedReserve(data, safeState);
        if (!reserve) {
          sections.push(data.finalReserve.prompt);
          return sections.join("\n\n");
        }
        sections.push(reserve.immediate, reserve.act12Opening);
      }
    }

    if (safeState.answers.length === items.length) {
      const reserve = selectedReserve(data, safeState);
      sections.push(...splitParagraphs(data.ending.rescue));
      if (reserve) {
        sections.push(
          reserve.endingConsequence.rescueState,
          reserve.endingConsequence.dataLegacy,
        );
      }
      sections.push(...splitParagraphs(data.ending.shared));
    }

    return sections.join("\n\n");
  }

  const api = {
    STORAGE_KEY,
    acknowledgeEnding,
    answerCurrent,
    branchForRaw,
    buildPlainStory,
    chooseReserve,
    clearState,
    currentStep,
    emptyState,
    flattenItems,
    loadState,
    normalisePlayerName,
    analyseProfile,
    recommendRole,
    sanitiseState,
    saveState,
    scoreAssessment,
    selectedReserve,
    setPlayerIdentity,
    splitParagraphs,
    undoLast,
  };

  globalScope.AuroraCore = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
