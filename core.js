/*
 * Aurora Station core.
 *
 * Scoring, state, validation and persistence. No DOM access.
 *
 * Two systems are kept deliberately separate:
 *   - the narrative branch, which always follows the raw response
 *   - the keyed score, which applies reverse keying
 * Reverse keying must never influence which passage the reader sees.
 */
(function attachAuroraCore(globalScope) {
  "use strict";

  const JOURNEY_KEY = "aurora-station-journey-v2";
  const PREFERENCES_KEY = "aurora-station-preferences-v1";
  const SCHEMA_VERSION = 2;

  const ITEMS_PER_ACT = 5;
  const ACT_COUNT = 12;
  const ITEM_COUNT = ITEMS_PER_ACT * ACT_COUNT;
  const ITEMS_PER_DOMAIN = 12;
  const ITEMS_PER_FACET = 4;
  const MIN_RESPONSE = 1;
  const MAX_RESPONSE = 5;
  const REVERSE_CONSTANT = MIN_RESPONSE + MAX_RESPONSE;
  const MAX_NAME_LENGTH = 40;

  // Reveal pacing. All delays are configurable constants.
  const TEXT_SPEEDS = {
    slow: 2400,
    normal: 1200,
    fast: 500,
  };
  const REDUCED_MOTION_DELAY = 0;

  const DOMAIN_ORDER = [
    "extraversion",
    "agreeableness",
    "conscientiousness",
    "negativeEmotionality",
    "openMindedness",
  ];

  const PHASES = ["prelude", "questions", "reveal", "complete"];

  /* ------------------------------------------------------------------ data */

  function flattenItems(data) {
    return data.story.acts
      .flatMap((act) => act.items)
      .slice()
      .sort((left, right) => left.bfiItem - right.bfiItem);
  }

  function responseLabels(data) {
    return data.assessment.spectrum.responseLabels;
  }

  function domainDefinitions(data) {
    return DOMAIN_ORDER.map((code) => data.assessment.domains[code]);
  }

  function splitParagraphs(value) {
    return String(value || "")
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  /*
   * Narrative selection. Raw response only — a reverse-keyed item still shows
   * the high branch when the reader agrees with it.
   */
  function getNarrativeBand(rawResponse) {
    if (rawResponse <= 2) {
      return "low";
    }
    if (rawResponse === 3) {
      return "mid";
    }
    return "high";
  }

  function narrativeForRaw(item, rawResponse) {
    return item.narrative[getNarrativeBand(rawResponse)] || "";
  }

  /* Scoring. Reverse keying applies here and nowhere else. */
  function getKeyedScore(rawResponse, reverse) {
    return reverse ? REVERSE_CONSTANT - rawResponse : rawResponse;
  }

  function isValidResponse(value) {
    return (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= MIN_RESPONSE &&
      value <= MAX_RESPONSE
    );
  }

  /* ------------------------------------------------------------ validation */

  /*
   * Structural validation of the content file. Nothing is inferred from
   * visible text: every item declares its own scoring metadata.
   */
  function validateContent(data) {
    const problems = [];
    const complain = (condition, message) => {
      if (!condition) {
        problems.push(message);
      }
    };

    const acts = data.story.acts;
    complain(acts.length === ACT_COUNT, `expected ${ACT_COUNT} acts, found ${acts.length}`);

    const items = flattenItems(data);
    complain(items.length === ITEM_COUNT, `expected ${ITEM_COUNT} items, found ${items.length}`);

    const seenIds = new Set();
    const domainCounts = {};
    const domainReverse = {};
    const facetCounts = {};
    const facetReverse = {};

    acts.forEach((act) => {
      complain(
        act.items.length === ITEMS_PER_ACT,
        `${act.id} has ${act.items.length} items, expected ${ITEMS_PER_ACT}`,
      );
      act.items.forEach((item, index) => {
        complain(item.act === act.number, `${item.id} declares act ${item.act}`);
        complain(
          item.positionInAct === index + 1,
          `${item.id} declares position ${item.positionInAct}`,
        );
      });
    });

    items.forEach((item, index) => {
      complain(!seenIds.has(item.id), `duplicate item id ${item.id}`);
      seenIds.add(item.id);
      complain(item.bfiItem === index + 1, `${item.id} is out of BFI-2 order`);
      complain(
        DOMAIN_ORDER.includes(item.domain),
        `${item.id} has unknown domain ${item.domain}`,
      );
      complain(typeof item.reverse === "boolean", `${item.id} has no keying`);
      complain(Boolean(item.statement), `${item.id} has no statement`);
      ["low", "mid", "high"].forEach((band) => {
        complain(
          Boolean(item.narrative && item.narrative[band]),
          `${item.id} is missing the ${band} branch`,
        );
      });

      const definition = data.assessment.domains[item.domain];
      complain(
        Boolean(definition) && definition.facets.includes(item.facet),
        `${item.id} facet ${item.facet} does not belong to ${item.domain}`,
      );

      domainCounts[item.domain] = (domainCounts[item.domain] || 0) + 1;
      facetCounts[item.facet] = (facetCounts[item.facet] || 0) + 1;
      if (item.reverse) {
        domainReverse[item.domain] = (domainReverse[item.domain] || 0) + 1;
        facetReverse[item.facet] = (facetReverse[item.facet] || 0) + 1;
      }
    });

    DOMAIN_ORDER.forEach((code) => {
      complain(
        domainCounts[code] === ITEMS_PER_DOMAIN,
        `${code} has ${domainCounts[code] || 0} items, expected ${ITEMS_PER_DOMAIN}`,
      );
      complain(
        domainReverse[code] === ITEMS_PER_DOMAIN / 2,
        `${code} has ${domainReverse[code] || 0} reverse items, expected ${ITEMS_PER_DOMAIN / 2}`,
      );
      const facets = data.assessment.domains[code].facets;
      complain(facets.length === 3, `${code} declares ${facets.length} facets, expected 3`);
      facets.forEach((facet) => {
        complain(
          facetCounts[facet] === ITEMS_PER_FACET,
          `${facet} has ${facetCounts[facet] || 0} items, expected ${ITEMS_PER_FACET}`,
        );
        complain(
          facetReverse[facet] === ITEMS_PER_FACET / 2,
          `${facet} has ${facetReverse[facet] || 0} reverse items, expected ${ITEMS_PER_FACET / 2}`,
        );
      });
    });

    return { valid: problems.length === 0, problems };
  }

  /* ------------------------------------------------------------------ state */

  function emptyState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      participant: { name: "" },
      phase: "prelude",
      assessment: {
        answers: {},
        currentAct: 1,
        currentQuestionInAct: 1,
        lockedActs: [],
      },
      narrative: {
        completedActs: [],
        activeRevealAct: null,
        revealedBeatCount: {},
        paused: false,
      },
      completedAt: null,
      scrollY: 0,
    };
  }

  function normalisePlayerName(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_NAME_LENGTH);
  }

  function answeredCount(state) {
    let count = 0;
    while (isValidResponse(state.assessment.answers[`q${pad(count + 1)}`])) {
      count += 1;
    }
    return count;
  }

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function itemIdForNumber(number) {
    return `q${pad(number)}`;
  }

  /*
   * Answers are stored by item id but must remain a gapless prefix: a record
   * with a hole in it is truncated rather than silently scored.
   */
  function sanitiseState(data, candidate) {
    const safe = emptyState();
    if (!candidate || typeof candidate !== "object") {
      return safe;
    }

    safe.participant.name = normalisePlayerName(candidate.participant?.name);

    const source = candidate.assessment?.answers;
    if (source && typeof source === "object") {
      for (let number = 1; number <= ITEM_COUNT; number += 1) {
        const id = itemIdForNumber(number);
        const value = source[id];
        if (!isValidResponse(value)) {
          break;
        }
        safe.assessment.answers[id] = value;
      }
    }

    const answered = answeredCount(safe);
    safe.assessment.currentAct = Math.min(
      ACT_COUNT,
      Math.floor(answered / ITEMS_PER_ACT) + 1,
    );
    safe.assessment.currentQuestionInAct = (answered % ITEMS_PER_ACT) + 1;
    safe.assessment.lockedActs = [];
    for (let act = 1; act <= Math.floor(answered / ITEMS_PER_ACT); act += 1) {
      safe.assessment.lockedActs.push(act);
    }

    const revealed = candidate.narrative?.revealedBeatCount;
    if (revealed && typeof revealed === "object") {
      Object.keys(revealed).forEach((key) => {
        const count = Number(revealed[key]);
        if (Number.isFinite(count) && count >= 0) {
          safe.narrative.revealedBeatCount[key] = Math.floor(count);
        }
      });
    }
    if (Array.isArray(candidate.narrative?.completedActs)) {
      safe.narrative.completedActs = candidate.narrative.completedActs
        .map(Number)
        .filter((act) => Number.isInteger(act) && act >= 1 && act <= ACT_COUNT)
        .filter((act) => safe.assessment.lockedActs.includes(act));
    }
    const activeReveal = Number(candidate.narrative?.activeRevealAct);
    safe.narrative.activeRevealAct =
      Number.isInteger(activeReveal) && activeReveal >= 1 && activeReveal <= ACT_COUNT
        ? activeReveal
        : null;
    safe.narrative.paused = Boolean(candidate.narrative?.paused);

    const scrollY = Number(candidate.scrollY);
    safe.scrollY = Number.isFinite(scrollY) && scrollY > 0 ? Math.floor(scrollY) : 0;

    const completedAt = Number(candidate.completedAt);
    safe.completedAt =
      answered >= ITEM_COUNT && Number.isFinite(completedAt) && completedAt > 0
        ? completedAt
        : null;

    const phase = String(candidate.phase || "");
    safe.phase = PHASES.includes(phase) ? phase : "prelude";
    if (!safe.participant.name) {
      safe.phase = "prelude";
    } else if (answered >= ITEM_COUNT) {
      safe.phase = "complete";
    } else if (safe.phase === "prelude" || safe.phase === "complete") {
      safe.phase = "questions";
    }

    return safe;
  }

  function isComplete(state) {
    return answeredCount(state) >= ITEM_COUNT;
  }

  function setPlayerName(data, state, name) {
    const safe = sanitiseState(data, state);
    const playerName = normalisePlayerName(name);
    if (!playerName) {
      return safe;
    }
    safe.participant.name = playerName;
    safe.phase = isComplete(safe) ? "complete" : "questions";
    return safe;
  }

  function currentItem(data, state) {
    const safe = sanitiseState(data, state);
    const answered = answeredCount(safe);
    return answered >= ITEM_COUNT ? null : flattenItems(data)[answered];
  }

  function recordResponse(data, state, itemId, rawResponse) {
    const safe = sanitiseState(data, state);
    const item = currentItem(data, safe);
    if (!item || item.id !== itemId || !isValidResponse(rawResponse)) {
      return safe;
    }
    safe.assessment.answers[itemId] = rawResponse;
    if (isComplete(safe) && !safe.completedAt) {
      safe.completedAt = Date.now();
    }
    return sanitiseState(data, safe);
  }

  /*
   * Back is offered only inside the Act being answered, and only before that
   * Act's narrative reveal has begun. A locked Act can never be reopened.
   */
  function canGoBack(data, state) {
    const safe = sanitiseState(data, state);
    const answered = answeredCount(safe);
    return answered > 0 && answered % ITEMS_PER_ACT !== 0;
  }

  function goBack(data, state) {
    const safe = sanitiseState(data, state);
    if (!canGoBack(data, safe)) {
      return safe;
    }
    const answered = answeredCount(safe);
    delete safe.assessment.answers[itemIdForNumber(answered)];
    return sanitiseState(data, safe);
  }

  function previousResponse(data, state) {
    const safe = sanitiseState(data, state);
    const answered = answeredCount(safe);
    return answered > 0 ? safe.assessment.answers[itemIdForNumber(answered)] : null;
  }

  /* ----------------------------------------------------------- persistence */

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

  function loadState(data, storage) {
    return sanitiseState(data, readRecord(storage, JOURNEY_KEY));
  }

  function saveState(data, state, storage) {
    return writeRecord(storage, JOURNEY_KEY, sanitiseState(data, state));
  }

  function defaultPreferences() {
    return { textSpeed: "normal", soundEnabled: true };
  }

  function sanitisePreferences(candidate) {
    const textSpeed = String(candidate?.textSpeed || "");
    return {
      textSpeed: Object.prototype.hasOwnProperty.call(TEXT_SPEEDS, textSpeed)
        ? textSpeed
        : "normal",
      soundEnabled: candidate?.soundEnabled !== false,
    };
  }

  function loadPreferences(storage) {
    return sanitisePreferences(readRecord(storage, PREFERENCES_KEY));
  }

  function savePreferences(preferences, storage) {
    return writeRecord(storage, PREFERENCES_KEY, sanitisePreferences(preferences));
  }

  function revealDelay(preferences, reducedMotion) {
    if (reducedMotion) {
      return REDUCED_MOTION_DELAY;
    }
    return TEXT_SPEEDS[sanitisePreferences(preferences).textSpeed];
  }

  /*
   * Restart clears the journey and keeps the reading preferences: sound and
   * text speed are how the reader likes to read, not part of the story.
   */
  function clearJourney(storage) {
    if (!storage) {
      return false;
    }
    try {
      storage.removeItem(JOURNEY_KEY);
      return true;
    } catch {
      return false;
    }
  }

  /* ------------------------------------------------------------ node stream */

  function beats(key, value, type, extra) {
    return splitParagraphs(value).map((text, index) => ({
      key: `${key}-${index}`,
      type: type || "body",
      text,
      ...(extra || {}),
    }));
  }

  /*
   * The story as one ordered list of nodes, derived from the recorded answers.
   * Narrative nodes are revealed on the playback timer; question nodes are
   * gates that wait for the reader. The list stops at the first unanswered
   * question, so it is a pure function of the responses so far.
   */
  function buildNodes(data, state) {
    const safe = sanitiseState(data, state);
    const answers = safe.assessment.answers;
    const nodes = [];

    nodes.push({
      key: "prologue-heading",
      type: "prologue-heading",
      title: data.story.prologue.title,
      eyebrow: data.subtitle,
    });
    nodes.push(...beats("prologue", data.story.prologue.text, "body"));

    for (const act of data.story.acts) {
      const actStart = (act.number - 1) * ITEMS_PER_ACT;
      if (answeredCount(safe) < actStart) {
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
      nodes.push(...beats(`${act.id}-opening`, act.opening, "body", { actId: act.id }));

      for (const item of act.items) {
        const raw = answers[item.id];
        nodes.push({
          key: `question-${item.id}`,
          type: "question",
          actId: act.id,
          actNumber: act.number,
          item,
          answered: isValidResponse(raw),
          raw: isValidResponse(raw) ? raw : null,
        });
        if (!isValidResponse(raw)) {
          return nodes;
        }
      }

      // Every response is in, so the Act's personalised passages exist.
      for (const item of act.items) {
        const raw = answers[item.id];
        const band = getNarrativeBand(raw);
        const shared = { actId: act.id, itemId: item.id };
        nodes.push(...beats(`${item.id}-context`, item.context, "context", shared));
        nodes.push(
          ...beats(`${item.id}-selected`, narrativeForRaw(item, raw), "selected", {
            ...shared,
            band,
            raw,
          }),
        );
        nodes.push(
          ...beats(`${item.id}-convergence`, item.convergence, "convergence", shared),
        );
      }

      nodes.push(...beats(`${act.id}-closing`, act.closing, "closing", { actId: act.id }));
    }

    if (answeredCount(safe) < ITEM_COUNT) {
      return nodes;
    }

    nodes.push({
      key: "ending-heading",
      type: "interlude-heading",
      title: "What remained unresolved",
      eyebrow: "THE FINAL RECORD",
    });
    nodes.push(...beats("ending-rescue", data.ending.rescue, "body"));
    nodes.push(...beats("ending-shared", data.ending.shared, "ending"));
    nodes.push({ key: "completion", type: "completion" });

    return nodes;
  }

  function pendingQuestion(nodes, revealed) {
    const node = nodes[revealed];
    return node && node.type === "question" && !node.answered ? node : null;
  }

  /* --------------------------------------------------------------- scoring */

  function mean(values) {
    const usable = values.filter((value) => Number.isFinite(value));
    return usable.length
      ? usable.reduce((sum, value) => sum + value, 0) / usable.length
      : null;
  }

  function normalise(score) {
    if (!Number.isFinite(score)) {
      return 0.5;
    }
    return Math.max(0, Math.min(1, (score - MIN_RESPONSE) / (MAX_RESPONSE - MIN_RESPONSE)));
  }

  function bandForScore(data, score) {
    const bands = data.assessment.interpretationBands;
    if (!Number.isFinite(score)) {
      return bands[1];
    }
    return bands.find((band) => score <= band.max) || bands[bands.length - 1];
  }

  /*
   * Results are only produced from a complete set of raw responses. Nothing is
   * imputed and no cached score is trusted.
   */
  function scoreProfile(data, state) {
    const safe = sanitiseState(data, state);
    if (!isComplete(safe)) {
      return null;
    }

    const items = flattenItems(data);
    const facetValues = {};
    const domainValues = {};

    items.forEach((item) => {
      const keyed = getKeyedScore(safe.assessment.answers[item.id], item.reverse);
      (facetValues[item.facet] = facetValues[item.facet] || []).push(keyed);
      (domainValues[item.domain] = domainValues[item.domain] || []).push(keyed);
    });

    const domains = domainDefinitions(data).map((definition) => {
      const score = mean(domainValues[definition.code]);
      const band = bandForScore(data, score);
      return {
        code: definition.code,
        name: definition.name,
        colour: definition.colour,
        focus: definition.focus,
        score,
        normalised: normalise(score),
        band: band.id,
        bandLabel: band.label,
        interpretation: definition.interpretation[band.id],
        facets: definition.facets.map((facet) => {
          const facetScore = mean(facetValues[facet]);
          return {
            name: facet,
            domain: definition.code,
            meaning: data.assessment.facets[facet].meaning,
            score: facetScore,
            normalised: normalise(facetScore),
            itemCount: facetValues[facet].length,
          };
        }),
      };
    });

    return {
      playerName: safe.participant.name,
      complete: true,
      domains,
      facets: domains.flatMap((domain) => domain.facets),
      scaleMin: MIN_RESPONSE,
      scaleMax: MAX_RESPONSE,
    };
  }

  const SUMMARY_DISTANCE = 0.5;
  const FACET_CONTRAST = 0.75;

  /*
   * Narrative summary rules. These thresholds are presentation rules, not
   * BFI-2 norms, and no domain is ever described as the reader's "type".
   */
  function summariseProfile(data, profile) {
    if (!profile) {
      return "";
    }
    const copy = data.results.summary;
    const distinctive = profile.domains
      .map((domain) => ({ domain, distance: Math.abs(domain.score - 3) }))
      .filter((entry) => entry.distance >= SUMMARY_DISTANCE)
      .sort((left, right) => right.distance - left.distance)
      .slice(0, 2);

    const sentences = [];
    if (!distinctive.length) {
      sentences.push(copy.balanced);
    } else {
      const phrases = distinctive.map((entry) =>
        (entry.domain.score > 3 ? copy.aboveTemplate : copy.belowTemplate).replace(
          "{domain}",
          entry.domain.name,
        ),
      );
      const highlights =
        phrases.length === 1 ? phrases[0] : `${phrases[0]} and ${phrases[1]}`;
      sentences.push(copy.lead.replace("{highlights}", highlights));
      sentences.push(copy.closing);
    }

    for (const domain of profile.domains) {
      const scored = domain.facets.filter((facet) => Number.isFinite(facet.score));
      if (scored.length < 2) {
        continue;
      }
      const sorted = scored.slice().sort((left, right) => right.score - left.score);
      const high = sorted[0];
      const low = sorted[sorted.length - 1];
      if (high.score - low.score >= FACET_CONTRAST) {
        sentences.push(
          copy.facetTemplate
            .replace("{domain}", domain.name)
            .replace("{high}", high.name)
            .replace("{low}", low.name),
        );
        break;
      }
    }

    return sentences.join(" ");
  }

  const api = {
    JOURNEY_KEY,
    PREFERENCES_KEY,
    SCHEMA_VERSION,
    ACT_COUNT,
    ITEMS_PER_ACT,
    ITEM_COUNT,
    ITEMS_PER_DOMAIN,
    ITEMS_PER_FACET,
    MIN_RESPONSE,
    MAX_RESPONSE,
    MAX_NAME_LENGTH,
    TEXT_SPEEDS,
    DOMAIN_ORDER,
    answeredCount,
    bandForScore,
    buildNodes,
    canGoBack,
    clearJourney,
    currentItem,
    defaultPreferences,
    domainDefinitions,
    emptyState,
    flattenItems,
    getKeyedScore,
    getNarrativeBand,
    goBack,
    isComplete,
    itemIdForNumber,
    loadPreferences,
    loadState,
    narrativeForRaw,
    normalise,
    normalisePlayerName,
    pendingQuestion,
    previousResponse,
    recordResponse,
    responseLabels,
    revealDelay,
    sanitisePreferences,
    sanitiseState,
    savePreferences,
    saveState,
    scoreProfile,
    setPlayerName,
    splitParagraphs,
    summariseProfile,
    validateContent,
  };

  globalScope.AuroraCore = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
