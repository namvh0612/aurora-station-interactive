/*
 * Aurora Station core.
 *
 * Owns three logically separate records:
 *   responses   - the watchkeeper name and the 60 raw assessment answers
 *   journey     - how much of the cumulative story has been revealed
 *   preferences - reader settings that survive a restart
 *
 * It also derives the story node stream. The renderer and the PDF exporter
 * both read that same stream, so the page and the exported story can never
 * drift apart.
 */
(function attachAuroraCore(globalScope) {
  "use strict";

  const RESPONSES_KEY = "aurora-station-responses-v1";
  const JOURNEY_KEY = "aurora-station-journey-v1";
  const PREFERENCES_KEY = "aurora-station-preferences-v1";

  const ITEMS_PER_ACT = 5;
  const ITEM_COUNT = 60;
  const MIN_RESPONSE = 1;
  const MAX_RESPONSE = 5;
  const SCALE_MIDPOINT = 3;
  const SCALE_SPAN = MAX_RESPONSE - MIN_RESPONSE;
  const REVERSE_CONSTANT = MIN_RESPONSE + MAX_RESPONSE;

  const TEXT_SPEEDS = {
    slow: 2600,
    normal: 1500,
    fast: 700,
  };

  const RESPONSE_LABELS = [
    "Strongly disagree",
    "Disagree a little",
    "Neither agree nor disagree",
    "Agree a little",
    "Strongly agree",
  ];

  /* ------------------------------------------------------------------ data */

  function flattenItems(data) {
    return data.story.acts
      .flatMap((act) => act.items)
      .slice()
      .sort((left, right) => left.number - right.number);
  }

  function responseLabels(data) {
    const configured = data?.assessment?.spectrum?.responseLabels;
    return Array.isArray(configured) && configured.length === MAX_RESPONSE
      ? configured
      : RESPONSE_LABELS;
  }

  function splitParagraphs(value) {
    return String(value || "")
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function branchKeyForRaw(data, raw) {
    const bands = data.assessment.spectrum.bands;
    return Object.keys(bands).find((key) => bands[key].includes(raw)) || null;
  }

  /*
   * Narrative branches always follow the raw response, including on
   * reverse-keyed items. Reverse scoring is applied separately, in
   * correctedScore, and never changes which passage the reader sees.
   */
  function branchForRaw(data, item, raw) {
    const branchKey = branchKeyForRaw(data, raw);
    return branchKey ? item.responseBranches[branchKey] || null : null;
  }

  function correctedScore(item, raw) {
    return item.assessment.key === "R" ? REVERSE_CONSTANT - raw : raw;
  }

  // Strict on purpose: a stored record should never contain "4" where 4 was
  // meant, and silently coercing it would hide a corrupted save.
  function isValidResponse(value) {
    return (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= MIN_RESPONSE &&
      value <= MAX_RESPONSE
    );
  }

  /* ----------------------------------------------------------- storage I/O */

  function readRecord(storage, key) {
    if (!storage) {
      return null;
    }
    try {
      const saved = storage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  function writeRecord(storage, key, value) {
    if (!storage) {
      return false;
    }
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function removeRecord(storage, key) {
    if (!storage) {
      return false;
    }
    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  /* ---------------------------------------------------------- responses */

  function emptyResponses() {
    return { playerName: "", onboardingComplete: false, answers: [] };
  }

  function normalisePlayerName(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
  }

  function sanitiseState(data, candidate) {
    const itemCount = flattenItems(data).length;
    const source = Array.isArray(candidate?.answers) ? candidate.answers : [];
    const answers = [];

    // Answers are a prefix of the journey: stop at the first invalid entry so
    // a corrupted record can never open a gap in the middle of the story.
    for (const value of source.slice(0, itemCount)) {
      if (!isValidResponse(value)) {
        break;
      }
      answers.push(value);
    }

    const playerName = normalisePlayerName(candidate?.playerName);

    return {
      playerName,
      onboardingComplete: Boolean(candidate?.onboardingComplete && playerName),
      answers,
    };
  }

  function loadResponses(data, storage) {
    const saved = readRecord(storage, RESPONSES_KEY);
    return saved ? sanitiseState(data, saved) : emptyResponses();
  }

  function saveResponses(data, responses, storage) {
    return writeRecord(storage, RESPONSES_KEY, sanitiseState(data, responses));
  }

  function setPlayerIdentity(data, responses, name) {
    const safe = sanitiseState(data, responses);
    const playerName = normalisePlayerName(name);
    return playerName
      ? { ...safe, playerName, onboardingComplete: true }
      : safe;
  }

  function answerAt(data, responses, index, rawValue) {
    const safe = sanitiseState(data, responses);
    const raw = rawValue;

    if (
      !isValidResponse(raw) ||
      index < 0 ||
      index >= flattenItems(data).length ||
      index > safe.answers.length
    ) {
      return safe;
    }

    const answers = safe.answers.slice(0, index);
    answers.push(raw);
    return { ...safe, answers };
  }

  function answerCurrent(data, responses, rawValue) {
    const safe = sanitiseState(data, responses);
    return answerAt(data, safe, safe.answers.length, rawValue);
  }

  /*
   * Back is offered only inside the Act the reader is standing in, and only
   * while that Act still has an unanswered question. Once the fifth response
   * lands the Act's narrative starts revealing and the responses are settled.
   */
  function canStepBack(data, responses) {
    const answered = sanitiseState(data, responses).answers.length;
    return answered > 0 && answered % ITEMS_PER_ACT !== 0;
  }

  function stepBack(data, responses) {
    const safe = sanitiseState(data, responses);
    if (!canStepBack(data, safe)) {
      return safe;
    }
    return { ...safe, answers: safe.answers.slice(0, -1) };
  }

  function currentStep(data, responses) {
    const safe = sanitiseState(data, responses);
    const items = flattenItems(data);

    if (safe.answers.length >= items.length) {
      return { type: "complete" };
    }

    return {
      type: "item",
      item: items[safe.answers.length],
      index: safe.answers.length,
    };
  }

  function actIndexForAnswerCount(answered) {
    return Math.min(
      Math.floor(answered / ITEMS_PER_ACT),
      ITEM_COUNT / ITEMS_PER_ACT - 1,
    );
  }

  /* ------------------------------------------------------------- journey */

  function emptyJourney() {
    return { revealed: 0, scrollY: 0 };
  }

  function sanitiseJourney(candidate, nodeCount) {
    const revealed = Number(candidate?.revealed);
    const scrollY = Number(candidate?.scrollY);
    const limit = Number.isFinite(nodeCount) ? nodeCount : Infinity;
    return {
      revealed: Number.isFinite(revealed)
        ? Math.max(0, Math.min(limit, Math.floor(revealed)))
        : 0,
      scrollY: Number.isFinite(scrollY) ? Math.max(0, Math.floor(scrollY)) : 0,
    };
  }

  function loadJourney(storage, nodeCount) {
    return sanitiseJourney(readRecord(storage, JOURNEY_KEY), nodeCount);
  }

  function saveJourney(journey, storage, nodeCount) {
    return writeRecord(storage, JOURNEY_KEY, sanitiseJourney(journey, nodeCount));
  }

  /* --------------------------------------------------------- preferences */

  function defaultPreferences() {
    return { textSpeed: "normal", paused: false };
  }

  function sanitisePreferences(candidate) {
    const textSpeed = String(candidate?.textSpeed || "");
    return {
      textSpeed: Object.prototype.hasOwnProperty.call(TEXT_SPEEDS, textSpeed)
        ? textSpeed
        : "normal",
      paused: Boolean(candidate?.paused),
    };
  }

  function loadPreferences(storage) {
    return sanitisePreferences(readRecord(storage, PREFERENCES_KEY));
  }

  function savePreferences(preferences, storage) {
    return writeRecord(
      storage,
      PREFERENCES_KEY,
      sanitisePreferences(preferences),
    );
  }

  function revealDelay(preferences) {
    return TEXT_SPEEDS[sanitisePreferences(preferences).textSpeed];
  }

  /*
   * Restart clears the watchkeeper, the answers and the journey. Preferences
   * are deliberately left alone: sound and text speed are how the reader likes
   * to read, not part of the story they are starting again.
   */
  function clearJourneyState(storage) {
    const responsesCleared = removeRecord(storage, RESPONSES_KEY);
    const journeyCleared = removeRecord(storage, JOURNEY_KEY);
    return responsesCleared && journeyCleared;
  }

  /* --------------------------------------------------------- final reserve */

  function reserveOption(data, id) {
    return data.finalReserve.options.find((option) => option.id === id) || null;
  }

  /*
   * The last major load is not a separate question — that would be another
   * button in a story that has none. It is derived from the responses already
   * given, and only from the 55 answers that exist before Act 11 closes, so
   * the outcome cannot change underneath Act 12.
   */
  function selectedReserve(data, responses) {
    const safe = sanitiseState(data, responses);
    const decisionPoint = ITEMS_PER_ACT * 11;
    if (safe.answers.length < decisionPoint) {
      return null;
    }

    const scored = scoreAssessment(data, {
      ...safe,
      answers: safe.answers.slice(0, decisionPoint),
    });
    const byCode = Object.fromEntries(
      scored.elements.map((element) => [element.code, element.score]),
    );
    const exploration = byCode.WO;
    const crew = mean(
      [byCode.EA, byCode.WA].filter((value) => Number.isFinite(value)),
    );
    const margin = Number(data.finalReserve.margin) || 0.4;

    if (!Number.isFinite(exploration) || !Number.isFinite(crew)) {
      return reserveOption(data, "bounded");
    }
    if (exploration - crew >= margin) {
      return reserveOption(data, "discovery");
    }
    if (crew - exploration >= margin) {
      return reserveOption(data, "safety");
    }
    return reserveOption(data, "bounded");
  }

  /* ----------------------------------------------------------- node stream */

  function bodyNodes(key, value, type, extra) {
    return splitParagraphs(value).map((text, index) => ({
      key: `${key}-${index}`,
      type: type || "body",
      text,
      ...(extra || {}),
    }));
  }

  /*
   * The whole story as one ordered list of nodes. Narrative nodes are revealed
   * on the playback timer; question nodes are gates that wait for the reader.
   * The list is generated up to and including the first unanswered question,
   * which keeps it a pure function of the answers recorded so far.
   */
  function buildNodes(data, responses) {
    const safe = sanitiseState(data, responses);
    const answers = safe.answers;
    const nodes = [];

    nodes.push({
      key: "prologue-heading",
      type: "prologue-heading",
      title: data.story.prologue.title,
      eyebrow: data.subtitle,
    });
    nodes.push(...bodyNodes("prologue", data.story.prologue.text, "body"));

    for (const act of data.story.acts) {
      const actStart = (act.number - 1) * ITEMS_PER_ACT;
      if (answers.length < actStart) {
        return nodes;
      }

      nodes.push({
        key: `${act.id}-heading`,
        type: "act-heading",
        actId: act.id,
        actNumber: act.number,
        title: act.title,
        time: act.time,
      });
      nodes.push(
        ...bodyNodes(`${act.id}-opening`, act.opening, "body", {
          actId: act.id,
        }),
      );

      for (let offset = 0; offset < act.items.length; offset += 1) {
        const item = act.items[offset];
        const index = actStart + offset;
        nodes.push({
          key: `question-${item.number}`,
          type: "question",
          actId: act.id,
          item,
          index,
          offset,
          answered: index < answers.length,
          raw: index < answers.length ? answers[index] : null,
        });
        if (index >= answers.length) {
          return nodes;
        }
      }

      // All five responses are in, so the Act's personalised passages exist.
      for (let offset = 0; offset < act.items.length; offset += 1) {
        const item = act.items[offset];
        const raw = answers[actStart + offset];
        const branchKey = branchKeyForRaw(data, raw);
        const branch = branchForRaw(data, item, raw);
        const shared = { actId: act.id, itemNumber: item.number };

        nodes.push(
          ...bodyNodes(`q${item.number}-context`, item.context, "context", shared),
        );
        if (branch) {
          nodes.push(
            ...bodyNodes(`q${item.number}-chosen`, branch.transition, "chosen", {
              ...shared,
              band: branchKey,
              raw,
            }),
          );
        }
        nodes.push(
          ...bodyNodes(
            `q${item.number}-convergence`,
            item.convergence,
            "convergence",
            shared,
          ),
        );
      }

      nodes.push(
        ...bodyNodes(`${act.id}-closing`, act.closing, "closing", {
          actId: act.id,
        }),
      );

      if (act.id === data.finalReserve.insertAfterActId) {
        const reserve = selectedReserve(data, safe);
        if (!reserve) {
          return nodes;
        }
        nodes.push({
          key: "reserve-heading",
          type: "interlude-heading",
          title: reserve.title,
          eyebrow: "THE FINAL RESERVE",
          note: data.finalReserve.note,
        });
        nodes.push(
          ...bodyNodes("reserve-immediate", reserve.immediate, "chosen", {
            band: "reserve",
          }),
        );
        nodes.push(...bodyNodes("reserve-opening", reserve.act12Opening, "body"));
      }
    }

    if (answers.length < ITEM_COUNT) {
      return nodes;
    }

    const reserve = selectedReserve(data, safe);
    nodes.push({
      key: "ending-heading",
      type: "interlude-heading",
      title: "What remained unresolved",
      eyebrow: "THE FINAL RECORD",
    });
    nodes.push(...bodyNodes("ending-rescue", data.ending.rescue, "body"));
    if (reserve) {
      nodes.push(
        ...bodyNodes(
          "ending-consequence",
          reserve.endingConsequence.rescueState,
          "chosen",
          { band: "reserve" },
        ),
      );
      nodes.push(
        ...bodyNodes(
          "ending-legacy",
          reserve.endingConsequence.dataLegacy,
          "body",
        ),
      );
    }
    nodes.push(...bodyNodes("ending-shared", data.ending.shared, "ending"));
    nodes.push({ key: "results", type: "results" });

    return nodes;
  }

  function pendingQuestion(nodes, revealed) {
    const node = nodes[revealed];
    return node && node.type === "question" && !node.answered ? node : null;
  }

  function buildPlainStory(data, responses) {
    return buildNodes(data, responses)
      .map((node) => {
        if (node.type === "question") {
          return node.answered ? "" : `${node.item.context}\n\n${node.item.statement}`;
        }
        if (node.type === "results") {
          return "";
        }
        if (node.type === "prologue-heading" || node.type === "interlude-heading") {
          return node.title;
        }
        if (node.type === "act-heading") {
          return `${node.title}\n\n${node.time}`;
        }
        return node.text;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  /* -------------------------------------------------------------- scoring */

  function mean(values) {
    const usable = values.filter((value) => Number.isFinite(value));
    if (!usable.length) {
      return null;
    }
    return usable.reduce((sum, value) => sum + value, 0) / usable.length;
  }

  function normalisePosition(score) {
    if (!Number.isFinite(score)) {
      return 0.5;
    }
    return Math.max(0, Math.min(1, (score - MIN_RESPONSE) / SCALE_SPAN));
  }

  function scoreAssessment(data, responses) {
    const safe = sanitiseState(data, responses);
    const items = flattenItems(data);
    const buckets = {};

    Object.entries(data.assessment.elements).forEach(([code, definition]) => {
      buckets[code] = {};
      definition.facets.forEach((facet) => {
        buckets[code][facet] = [];
      });
    });

    safe.answers.forEach((raw, index) => {
      const item = items[index];
      if (!item) {
        return;
      }
      buckets[item.assessment.elementCode][item.assessment.facet].push(
        correctedScore(item, raw),
      );
    });

    const elements = Object.entries(data.assessment.elements).map(
      ([code, definition]) => {
        const facets = definition.facets.map((name) => ({
          name,
          score: mean(buckets[code][name]),
          answered: buckets[code][name].length,
        }));

        return {
          code,
          element: definition.element,
          trait: definition.trait,
          colour: definition.colour,
          score: mean(facets.map((facet) => facet.score)),
          facets,
        };
      },
    );

    return {
      answered: safe.answers.length,
      complete: safe.answers.length === items.length,
      facetCount: elements.reduce((total, item) => total + item.facets.length, 0),
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

  // Band edges are the six-point thresholds re-expressed on the five-point
  // scale, so the proportion of the range each band covers is unchanged.
  const BAND_EDGES = {
    clearLower: 2.2,
    moderateLower: 2.8,
    balanced: 3.2,
    moderateHigher: 3.8,
  };

  function scoreBand(score) {
    if (!Number.isFinite(score)) {
      return { id: "unavailable", label: "Not available", side: "balanced" };
    }
    if (score <= BAND_EDGES.clearLower) {
      return { id: "clear-lower", label: "Clear lower-pole lean", side: "lower" };
    }
    if (score <= BAND_EDGES.moderateLower) {
      return {
        id: "moderate-lower",
        label: "Moderate lower-pole lean",
        side: "lower",
      };
    }
    if (score <= BAND_EDGES.balanced) {
      return {
        id: "balanced",
        label: "Balanced or context-sensitive",
        side: "balanced",
      };
    }
    if (score <= BAND_EDGES.moderateHigher) {
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
    if (!interpretation || !Number.isFinite(result.score)) {
      return "";
    }

    if (band.side === "balanced") {
      return (
        `Your responses moved between ${SPECTRUM_LABELS[result.code].lower.toLowerCase()} ` +
        `and ${SPECTRUM_LABELS[result.code].higher.toLowerCase()}, suggesting that context ` +
        "influenced which end of this range became more useful."
      );
    }

    const direction =
      band.side === "higher" ? interpretation.higher : interpretation.lower;
    const strength = band.id.startsWith("clear") ? "a clear" : "a moderate";
    return `Your responses showed ${strength} lean toward a style that ${direction}.`;
  }

  const FACET_ALIGNED_GAP = 0.32;
  const FACET_PRONOUNCED_GAP = 0.64;

  function describeFacetPattern(result, guide) {
    const available = result.facets.filter((facet) =>
      Number.isFinite(facet.score),
    );
    if (available.length < 2 || !guide) {
      return "";
    }

    const sorted = available
      .slice()
      .sort((left, right) => right.score - left.score);
    const leading = sorted[0];
    const quieter = sorted[sorted.length - 1];
    const difference = leading.score - quieter.score;
    const focusFor = (facet) =>
      guide.facetFocus?.[facet.name] || facet.name.toLowerCase();

    if (difference < FACET_ALIGNED_GAP) {
      const focuses = available.map(focusFor);
      const list =
        focuses.length === 2
          ? `${focuses[0]} and ${focuses[1]}`
          : `${focuses.slice(0, -1).join(", ")} and ${focuses.at(-1)}`;
      return (
        `The facets were broadly aligned: ${list} appeared at a similar level ` +
        "across the station scenarios."
      );
    }

    const emphasis =
      difference >= FACET_PRONOUNCED_GAP ? "a pronounced" : "a noticeable";
    return (
      `There was ${emphasis} difference between the facets. ${leading.name} came ` +
      `forward more consistently than ${quieter.name}; ${focusFor(leading)} was more ` +
      "readily available in this journey."
    );
  }

  function stageForItem(item) {
    return PROFILE_STAGES.find(
      (stage) => item.number >= stage.from && item.number <= stage.to,
    );
  }

  const MOVEMENT_NOTICEABLE = 0.28;
  const MOVEMENT_PRONOUNCED = 0.6;

  function scoreContextMovement(data, responses) {
    const safe = sanitiseState(data, responses);
    const items = flattenItems(data);
    const buckets = {};

    PROFILE_STAGES.forEach((stage) => {
      buckets[stage.id] = {};
      Object.keys(data.assessment.elements).forEach((code) => {
        buckets[stage.id][code] = [];
      });
    });

    safe.answers.forEach((raw, index) => {
      const item = items[index];
      const stage = item && stageForItem(item);
      if (!stage) {
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
      const delta =
        Number.isFinite(start) && Number.isFinite(finish) ? finish - start : null;

      let label = "Broadly stable";
      if (delta !== null && Math.abs(delta) >= MOVEMENT_PRONOUNCED) {
        label = delta > 0 ? "Pronounced increase" : "Pronounced decrease";
      } else if (delta !== null && Math.abs(delta) >= MOVEMENT_NOTICEABLE) {
        label = delta > 0 ? "Noticeable increase" : "Noticeable decrease";
      }

      return { code, stages, delta, label };
    });

    const highlights = elements
      .filter(
        (item) => item.delta !== null && Math.abs(item.delta) >= MOVEMENT_NOTICEABLE,
      )
      .slice()
      .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
      .slice(0, 3)
      .map((item) => {
        const element = data.assessment.elements[item.code].element;
        const direction =
          item.delta > 0 ? "became more available" : "became less available";
        return `${element} ${direction} from the opening conditions to late pressure (${
          item.delta > 0 ? "+" : ""
        }${item.delta.toFixed(1)}).`;
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

  const LOW_VARIATION_DEVIATION = 0.52;

  function responseQuality(data, responses) {
    const values = sanitiseState(data, responses).answers;
    if (!values.length) {
      return {
        status: "Not available",
        level: "unavailable",
        summary: "Complete the journey to review response variation.",
        metrics: {},
      };
    }

    const average = mean(values);
    const deviation = Math.sqrt(
      mean(values.map((value) => (value - average) ** 2)) || 0,
    );
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

    const dominantRate = Math.max(...counts.values()) / values.length;
    const flags = [];
    if (dominantRate >= 0.75) {
      flags.push("one response level was used for most items");
    }
    if (deviation < LOW_VARIATION_DEVIATION) {
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
        "Your responses used the five-point range with enough variation to support a differentiated reflective profile. This remains a self-report, not a diagnostic assessment.",
      metrics: { deviation, dominantRate, longestRun },
    };
  }

  function missionWeightsForState(data, responses) {
    const reserve = selectedReserve(data, responses);
    return (
      (reserve && MISSION_WEIGHTS[reserve.id]) || {
        WO: 0.5,
        FI: 0.5,
        EA: 0.5,
        ME: 0.5,
        WA: 0.5,
      }
    );
  }

  function roleMetric(result) {
    const overall = Number(result.score);
    const latePressure = Number(result.context?.stages?.[2]?.score);
    const facetScores = result.facets
      .map((facet) => Number(facet.score))
      .filter(Number.isFinite);
    const facetFloor = facetScores.length ? Math.min(...facetScores) : overall;

    return {
      overall,
      latePressure,
      facetFloor,
      profileSuitability:
        normalisePosition(overall) * 0.6 +
        normalisePosition(latePressure) * 0.25 +
        normalisePosition(facetFloor) * 0.15,
    };
  }

  // The solo guardrail keeps a role that the profile barely supports from
  // being recommended: 2.8 of 5 is the five-point equivalent of the previous
  // 3.25 of 6 threshold.
  const ROLE_GUARDRAIL = 2.8;

  function recommendRole(data, responses, elements, options) {
    const settings = options || {};
    const teamWeights = settings.teamComposition || null;
    const missionWeights = settings.missionRequirement || null;
    const groupMode = Boolean(
      teamWeights || missionWeights || settings.mode === "group",
    );
    const allowStretchRoles = Boolean(settings.allowStretchRoles);
    const tieWeights = missionWeightsForState(data, responses);

    const candidates = elements
      .filter((result) => Number.isFinite(result.score))
      .map((result) => {
        const metric = roleMetric(result);
        const teamNeed = Number(teamWeights?.[result.code] ?? 0.5);
        const missionNeed = Number(missionWeights?.[result.code] ?? 0.5);

        return {
          code: result.code,
          finalScore: groupMode
            ? metric.profileSuitability * 0.45 + teamNeed * 0.3 + missionNeed * 0.25
            : metric.profileSuitability,
          profileSuitability: metric.profileSuitability,
          overall: metric.overall,
          latePressure: metric.latePressure,
          facetFloor: metric.facetFloor,
          teamNeed,
          missionNeed,
          stretch: metric.overall < ROLE_GUARDRAIL,
        };
      });

    let selectable = candidates.filter(
      (candidate) => !candidate.stretch || (groupMode && allowStretchRoles),
    );
    if (!selectable.length) {
      selectable = candidates.slice();
    }

    const epsilon = 0.000001;
    selectable.sort((left, right) => {
      const comparisons = [
        right.finalScore - left.finalScore,
        ...(groupMode
          ? [right.teamNeed - left.teamNeed, right.missionNeed - left.missionNeed]
          : []),
        right.overall - left.overall,
        right.latePressure - left.latePressure,
        right.facetFloor - left.facetFloor,
      ];
      const decisive = comparisons.find(
        (difference) => Math.abs(difference) > epsilon,
      );
      if (decisive !== undefined) {
        return decisive;
      }
      // The derived narrative outcome breaks a tie only when every profile
      // metric is exactly matched.
      return (
        Number(tieWeights[right.code] ?? 0.5) -
        Number(tieWeights[left.code] ?? 0.5)
      );
    });

    const selected = selectable[0];
    const runnerUp = selectable[1] || null;
    const scoreGap = runnerUp ? selected.finalScore - runnerUp.finalScore : 1;
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
        "This recommendation was selected from closely matched contributions using overall availability, late-pressure availability and facet balance. The night's derived outcome was used only as a last tie-break.";
    } else {
      basis =
        "This solo recommendation is led by your profile: overall availability, late-pressure availability and the lowest facet score.";
    }

    const closeFitText =
      closeFits.length === 0
        ? ""
        : closeFits.length === 1
          ? closeFits[0]
          : `${closeFits.slice(0, -1).join(", ")}, and ${closeFits.at(-1)}`;

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
      why:
        `${result.element} produced the strongest eligible profile suitability ` +
        `(${selected.profileSuitability.toFixed(2)}) after combining overall availability, ` +
        "late-pressure availability and facet balance." +
        (closeFitText ? ` ${closeFitText} remained close alternatives.` : ""),
      scoreGap,
      definition:
        "Your Aurora Role is the contribution your Five-Element profile is best placed to make in this mission. It is not a fixed personality type.",
      candidates,
      mode: groupMode ? "group" : "solo",
    };
  }

  function finalChoiceSummary(data, responses) {
    const reserve = selectedReserve(data, responses);
    if (!reserve) {
      return null;
    }
    return {
      id: reserve.id,
      title: reserve.title,
      text: reserve.text,
      note: data.finalReserve.note,
    };
  }

  function analyseProfile(data, responses, options) {
    const safe = sanitiseState(data, responses);
    const assessment = scoreAssessment(data, safe);
    const context = scoreContextMovement(data, safe);
    const contextByCode = Object.fromEntries(
      context.elements.map((item) => [item.code, item]),
    );

    const elements = assessment.elements.map((result) => {
      const definition = data.assessment.elements[result.code];
      const guide = definition.interpretation?.guide;
      const band = scoreBand(result.score);
      const side =
        band.side === "balanced"
          ? result.score >= SCALE_MIDPOINT
            ? "higher"
            : "lower"
          : band.side;
      const spectrum = SPECTRUM_LABELS[result.code];

      const potentialAdvantage =
        band.side === "balanced"
          ? guide?.adaptiveRange || ""
          : guide?.[`${side}Use`] || "";
      const overextension =
        band.side === "balanced"
          ? "Access to both ends of the range can become hesitation when the situation needs a clear and explicit choice."
          : guide?.[`${side}TradeOff`] || "";
      const reflection =
        band.side === "balanced"
          ? `Which end of the ${spectrum.lower.toLowerCase()}–${spectrum.higher.toLowerCase()} range does the current situation require you to make more explicit?`
          : guide?.[`${side}Balance`] || "";

      return {
        ...result,
        scaleMax: MAX_RESPONSE,
        lens: definition.interpretation?.lens || result.trait,
        description: describeElement(result, definition, band),
        expression: band.label,
        band,
        spectrum,
        position: normalisePosition(result.score),
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

    const role = recommendRole(data, safe, elements, options);

    return {
      ...assessment,
      playerName: safe.playerName,
      scaleMax: MAX_RESPONSE,
      overview:
        "Like an aurora, this profile is a spectrum of several colours rather than a single type. " +
        "The five currents below show how you responded across Aurora Station; the recommended role translates that pattern into one practical contribution for this mission.",
      elements,
      role,
      context,
      quality: responseQuality(data, safe),
      finalChoice: finalChoiceSummary(data, safe),
      roleModel:
        role.mode === "group"
          ? "Recommended Role = 45% profile suitability + 30% team composition need + 25% mission requirement."
          : "Solo Role = 60% overall availability + 25% late-pressure availability + 15% facet floor.",
    };
  }

  const api = {
    RESPONSES_KEY,
    JOURNEY_KEY,
    PREFERENCES_KEY,
    TEXT_SPEEDS,
    ITEMS_PER_ACT,
    ITEM_COUNT,
    MIN_RESPONSE,
    MAX_RESPONSE,
    actIndexForAnswerCount,
    analyseProfile,
    answerAt,
    answerCurrent,
    branchForRaw,
    branchKeyForRaw,
    buildNodes,
    buildPlainStory,
    canStepBack,
    clearJourneyState,
    correctedScore,
    currentStep,
    defaultPreferences,
    emptyJourney,
    emptyResponses,
    // Retained for callers that still speak the older single-state vocabulary.
    emptyState: emptyResponses,
    flattenItems,
    loadJourney,
    loadPreferences,
    loadResponses,
    normalisePlayerName,
    normalisePosition,
    pendingQuestion,
    recommendRole,
    responseLabels,
    revealDelay,
    saveJourney,
    savePreferences,
    saveResponses,
    scoreBand,
    sanitiseJourney,
    sanitisePreferences,
    sanitiseState,
    scoreAssessment,
    selectedReserve,
    setPlayerIdentity,
    splitParagraphs,
    stepBack,
  };

  globalScope.AuroraCore = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
