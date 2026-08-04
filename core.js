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

  /*
   * There is no reveal pacing. The story up to the next unanswered question is
   * present, and the reader draws it into focus by scrolling. Nothing advances
   * on a timer, so there is no speed to choose, nothing to pause, and nothing
   * that can move the page while the reader is reading it.
   */

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
      complain(item.bfiItem === index + 1, `${item.id} is out of item order`);
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
    return { soundEnabled: true };
  }

  function sanitisePreferences(candidate) {
    return { soundEnabled: candidate?.soundEnabled !== false };
  }

  function loadPreferences(storage) {
    return sanitisePreferences(readRecord(storage, PREFERENCES_KEY));
  }

  function savePreferences(preferences, storage) {
    return writeRecord(storage, PREFERENCES_KEY, sanitisePreferences(preferences));
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
  /* ------------------------------------------------------------- spectra */

  /*
   * A current is one line with a name at each end. Two independent readings
   * come off it: which pole the position falls on, and how far from the middle
   * it sits. They are kept apart deliberately — folding distance into the pole
   * name is what made an earlier version read as more-is-better.
   */
  const CENTRE = (MIN_RESPONSE + MAX_RESPONSE) / 2;
  /* Below this a reading is called steady rather than given a number. */
  const STEADY_CHANGE = 0.25;
  const MAGNITUDE_CLEAR = 0.5;
  const MAGNITUDE_PRONOUNCED = 1;
  /*
   * Firmness is the spread of a domain's twelve keyed answers, and says
   * nothing about anyone else. Below 0.8 most answers sit within a point of
   * their own mean; above 1.2 they are routinely two points apart, and the
   * mean is then an average of genuinely different answers rather than a
   * description of one tendency. Display rules, not norms.
   */
  const FIRM_LIMIT = 0.8;
  const PROVISIONAL_LIMIT = 1.2;
  /* One full point between a domain's highest and lowest facet. Below that the
   * difference is inside what a four-statement facet can resolve. */
  /*
   * How far apart the three facets can sit before the domain average stops
   * describing all of them.
   *
   * This was a whole scale point, which is a quarter of the width of the drawn
   * line — so a page could show one mark plainly to the right of the other two
   * and print "all three sit at much the same place" underneath it. The
   * threshold has to be tight enough that the sentence and the picture agree.
   */
  const DIVERGENCE_LIMIT = 0.6;

  function spectraDefinitions(data) {
    return data.assessment.spectra.currents;
  }

  function currentForDomain(data, domainCode) {
    return (
      Object.values(spectraDefinitions(data)).find(
        (entry) => entry.domain === domainCode,
      ) || null
    );
  }

  /*
   * Which end of a line a reading is nearer. Answers for every score, so a
   * reading of exactly 3.00 gets an answer too — which is why nothing that
   * writes to the page uses this on its own.
   */
  function poleFor(current, score) {
    return score < CENTRE ? current.poles.low : current.poles.high;
  }

  /*
   * The block a reading is described by.
   *
   * A hair off the middle is still a side. The band used to decide this was a
   * fifth of the scale wide, so a reading at 3.4 was called balanced and given
   * writing about being able to go either way — when the responses had in fact
   * leaned, and would have leaned the same way again. Any distance from the
   * centre names an end; how far it leaned is carried by the intensity, not by
   * withholding the name.
   *
   * Dead centre is the one reading with no side to name, and it gets the
   * middle block. That is rare and it is the only case the middle describes.
   */
  function bandedPoleFor(data, current, score) {
    if (!Number.isFinite(score)) {
      return null;
    }
    return score === CENTRE ? current.poles.middle || poleFor(current, score) : poleFor(current, score);
  }

  /*
   * How far from the middle, as a word. A reading is always named at an end,
   * so the degree has to be said rather than implied by which end got named —
   * "slightly toward discipline" and "strongly toward discipline" are the same
   * side and not the same finding.
   */
  function intensityFor(data, magnitude) {
    const words = data.assessment.spectra.intensities;
    const size = Math.abs(magnitude);
    if (!Number.isFinite(size) || size === 0) {
      return words.balanced;
    }
    if (size >= 1.5) {
      return words.strong;
    }
    if (size >= 0.9) {
      return words.clear;
    }
    return size >= 0.4 ? words.moderate : words.slight;
  }

  /* Half the width of the situational band, in scale points. */
  function situationalReach(data) {
    const bands = data.assessment.interpretationBands;
    const situational = bands.find((band) => band.id === "situational");
    return situational ? Number((situational.max - CENTRE).toFixed(2)) : MAGNITUDE_CLEAR;
  }

  /*
   * How a current arrived at the middle, which is the difference between a
   * range held all night and a range pressure produced. Read from the routine
   * stretch against the worst of it: moving inward is readiness, moving
   * outward is pressure picking a side.
   */
  function middleMovementFor(data, profile, currentId) {
    const current = data.assessment.spectra.currents[currentId];
    const baseline = phaseByld(profile, "baseline");
    const pressure = phaseByld(profile, "pressure");
    const middle = current && current.poles.middle;
    if (!middle || !baseline || !pressure) {
      return null;
    }
    const at = (phase) => phase.currents.find((entry) => entry.id === currentId);
    const from = at(baseline);
    const to = at(pressure);
    if (!from || !to || !Number.isFinite(from.score) || !Number.isFinite(to.score)) {
      return null;
    }
    const wasMiddle = bandForScore(data, from.score).id === "situational";
    const isMiddle = bandForScore(data, to.score).id === "situational";
    if (wasMiddle && isMiddle) {
      return { kind: "held", copy: middle.held };
    }
    if (isMiddle) {
      return {
        kind: "arrivedFrom",
        copy: middle.arrivedFrom.replace("{from}", poleFor(current, from.score).name),
      };
    }
    if (wasMiddle) {
      return {
        kind: "leftFor",
        copy: middle.leftFor.replace("{to}", poleFor(current, to.score).name),
      };
    }
    return { kind: "held", copy: middle.held };
  }

  function magnitudeFor(score) {
    return Number.isFinite(score) ? score - CENTRE : null;
  }

  /*
   * A count the reader takes in as prose, spelled. Measurements — a distance
   * from centre, a page number — stay as figures; it is mixing the two inside
   * one phrase that reads as a slip, as "15 of fifteen facets held together"
   * and "3 of the five moved" both did.
   */
  const NUMBER_WORDS = [
    "none", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  ];

  function spellNumber(value) {
    return NUMBER_WORDS[value] || String(value);
  }

  function spread(values) {
    if (values.length < 2) {
      return 0;
    }
    const average = mean(values);
    const variance =
      values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  function firmnessFor(data, state, domainCode) {
    const keyed = flattenItems(data)
      .filter((item) => item.domain === domainCode)
      .map((item) => getKeyedScore(state.assessment.answers[item.id], item.reverse))
      .filter((value) => Number.isFinite(value));
    if (!keyed.length) {
      return null;
    }
    const deviation = spread(keyed);
    const id =
      deviation < FIRM_LIMIT ? "firm" : deviation > PROVISIONAL_LIMIT ? "provisional" : "mixed";
    return { id, deviation, copy: data.assessment.spectra.firmness[id] };
  }

  /*
   * A domain of 2.92 built from facets of 2.50, 4.00 and 2.25 is a different
   * person from one built from three readings of 2.9, and the average alone
   * cannot tell them apart. Where the facets diverge, the outlier is the one
   * furthest from the mean of the other two.
   */
  function divergenceFor(data, domain) {
    const current = currentForDomain(data, domain.code);
    const scores = domain.facets.map((facet) => facet.score);
    const gap = Math.max(...scores) - Math.min(...scores);
    if (!current || gap < DIVERGENCE_LIMIT) {
      return { diverges: false, spread: gap, copy: current ? current.together : null };
    }
    let outlier = domain.facets[0];
    let widest = -Infinity;
    domain.facets.forEach((facet) => {
      const others = domain.facets.filter((entry) => entry.name !== facet.name);
      const distance = Math.abs(facet.score - mean(others.map((entry) => entry.score)));
      if (distance > widest) {
        widest = distance;
        outlier = facet;
      }
    });
    const others = domain.facets.filter((entry) => entry.name !== outlier.name);
    const direction = outlier.score > mean(others.map((entry) => entry.score)) ? "above" : "below";
    return {
      diverges: true,
      spread: gap,
      facet: outlier.name,
      direction,
      copy: current.facets[outlier.name][direction],
    };
  }

  /*
   * The cycle decides which current feeds and checks which; the pole decides
   * how that lands. Resolved in a second pass because a current cannot point
   * at its neighbours until all five exist.
   */
  function linkCurrents(data, currents) {
    currents.forEach((current) => {
      const relations = relationsFor(data, current.id);
      if (!relations) {
        return;
      }
      const at = (currentId) => currents.find((entry) => entry.id === currentId) || null;
      current.relations = {
        supports: at(relations.supports),
        supportedBy: at(relations.supportedBy),
        checks: at(relations.checks),
        checkedBy: at(relations.checkedBy),
      };
    });
    return currents;
  }

  function currentsFor(data, domains, state) {
    const built = Object.values(spectraDefinitions(data))
      .map((current) => {
        const domain = domains.find((entry) => entry.code === current.domain);
        if (!domain) {
          return null;
        }
        const definition = currentDefinitions(data).find(
          (entry) => entry.domain === current.domain,
        );
        const magnitude = magnitudeFor(domain.score);
        return {
          id: current.id,
          name: current.name,
          axis: current.axis,
          domain: domain.code,
          domainName: domain.name,
          element: current.id,
          colour: current.colour,
          colourNight: current.colourNight,
          colourPaper: current.colourPaper,
          score: domain.score,
          normalised: domain.normalised,
          band: domain.band,
          poles: current.poles,
          pole: bandedPoleFor(data, current, domain.score),
          nearer: poleFor(current, domain.score),
          /*
           * Whether the middle block is the one describing this reading — not
           * whether the score falls in the display band. The two used to be
           * the same rule and are not any more: the band is a fifth of the
           * scale wide and only dead centre has no side to name.
           */
          situational: bandedPoleFor(data, current, domain.score) === current.poles.middle,
          magnitude,
          firmness: firmnessFor(data, state, domain.code),
          divergence: divergenceFor(data, domain),
          guidance: data.assessment.domains[domain.code].guidance[domain.band],
          /*
           * A facet is a line too, with a name at each end. Carrying only a
           * number left three of them on every page reading as a score out of
           * five, which is the one thing a bipolar reading is not.
           */
          facets: domain.facets.map((facet) => ({
            ...facet,
            poles: current.facets[facet.name] || null,
          })),
        };
      })
      .filter(Boolean);
    return linkCurrents(data, built);
  }

  /*
   * How the scale itself was used. Because every domain carries six forward
   * and six reverse statements, a reader with no answering habit centres on
   * the middle of the scale; a lean away from it is acquiescence rather than
   * tendency. None of this compares the reader with anybody.
   */
  const BALANCE_MILD = 0.2;
  const ENDS_SPARING = 0.15;
  const ENDS_FREQUENT = 0.5;
  const MIDDLE_HEAVY = 0.35;
  const FACET_AGREEMENT_LIMIT = 1;

  function responseStyleFor(data, state) {
    const items = flattenItems(data);
    const raw = items
      .map((item) => state.assessment.answers[item.id])
      .filter((value) => Number.isFinite(value));
    if (raw.length < items.length) {
      return null;
    }
    const copy = data.results.calibration;
    const average = mean(raw);
    const lean = average - CENTRE;
    const balanceId =
      Math.abs(lean) < BALANCE_MILD ? "none" : lean > 0 ? "agree" : "disagree";
    const endShare = raw.filter((value) => value === MIN_RESPONSE || value === MAX_RESPONSE).length / raw.length;
    const endsId =
      endShare < ENDS_SPARING ? "sparing" : endShare > ENDS_FREQUENT ? "frequent" : "usual";
    const middleShare = raw.filter((value) => value === CENTRE).length / raw.length;

    const byFacet = {};
    items.forEach((item) => {
      (byFacet[item.facet] = byFacet[item.facet] || []).push(
        getKeyedScore(state.assessment.answers[item.id], item.reverse),
      );
    });
    const facetNames = Object.keys(byFacet);
    const held = facetNames.filter((name) => spread(byFacet[name]) < FACET_AGREEMENT_LIMIT).length;

    /*
     * The sixty raw answers counted onto the five points of the scale. Every
     * other reading in this section is a summary of this one, and the shape it
     * summarises is worth showing: a flat spread, a lean and a pile in the
     * middle are three different ways of answering that the same three
     * sentences would otherwise describe.
     */
    const distribution = [];
    for (let value = MIN_RESPONSE; value <= MAX_RESPONSE; value += 1) {
      const count = raw.filter((entry) => entry === value).length;
      distribution.push({ value, count, share: count / raw.length });
    }

    return {
      distribution,
      answered: raw.length,
      balance: { value: average, lean, id: balanceId, copy: copy.balance[balanceId] },
      ends: { share: endShare, id: endsId, copy: copy.ends[endsId] },
      middle: {
        share: middleShare,
        heavy: middleShare > MIDDLE_HEAVY,
        copy: middleShare > MIDDLE_HEAVY ? copy.middleNote : null,
      },
      agreement: {
        held,
        total: facetNames.length,
        /*
         * "15 of fifteen facets held together" mixed a numeral with a word in
         * one phrase, and both ends of the range read better said outright.
         */
        copy:
          held === facetNames.length
            ? copy.agreementAll
            : held === 0
              ? copy.agreementNone
              : copy.agreementNote.replace("{held}", spellNumber(held)),
      },
    };
  }

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

    const domainScores = Object.fromEntries(
      domains.map((domain) => [domain.code, domain.score]),
    );
    const facetScores = Object.fromEntries(
      domains.flatMap((domain) => domain.facets.map((facet) => [facet.name, facet.score])),
    );

    /*
     * No current is singled out. The old profile ranked the five by a
     * suitability weighting and named a winner, which is the type this design
     * exists to remove: five separate readings, none of them a lead.
     */
    const phases = scorePhases(data, safe);

    return {
      playerName: safe.participant.name,
      complete: true,
      domains,
      facets: domains.flatMap((domain) => domain.facets),
      currents: currentsFor(data, domains, safe),
      responseStyle: responseStyleFor(data, safe),
      phases,
      scaleMin: MIN_RESPONSE,
      scaleMax: MAX_RESPONSE,
    };
  }

  /* ------------------------------------------------------- the five currents */

  /*
   * Five currents on the same 1-5 scale, each reading its own domain and
   * nothing else. There is no separate table of names sitting between the
   * element and the domain any more: that is what allowed one current to be
   * reported under a name its own line did not carry, and Water to be turned
   * upside down and called something else on the way past.
   */
  function currentDefinitions(data) {
    return data.assessment.spectra.order.map((id) => data.assessment.spectra.currents[id]);
  }

  /*
   * The five currents read against each other. Two cycles, both carried in the
   * content file: one where a current creates the conditions the next one
   * needs, and one where a current restrains another that has run long. This
   * is a reading of relationships, not a compatibility score, and nothing here
   * totals or ranks.
   *
   * The cycle is keyed on the element, and the element names the current it
   * reads — one hop, not two. It used to route through a role table sitting
   * between the two, which is what let one current be reported under a
   * different name from the one its own line carried.
   */
  function elementForCurrent(data, currentId) {
    return (
      Object.values(data.assessment.elements).find((entry) => entry.current === currentId) || null
    );
  }

  function relationsFor(data, currentId) {
    const element = elementForCurrent(data, currentId);
    if (!element) {
      return null;
    }
    const cycles = data.assessment.cycles;
    const ring = cycles.generating;
    const at = ring.indexOf(element.id);
    if (at < 0) {
      return null;
    }

    const currentOf = (elementId) => data.assessment.elements[elementId].current;
    const feeds = ring[(at + 1) % ring.length];
    const fedBy = ring[(at - 1 + ring.length) % ring.length];
    const checks = cycles.controlling[element.id];
    const checkedBy = Object.keys(cycles.controlling).find(
      (key) => cycles.controlling[key] === element.id,
    );

    return {
      element: element.id,
      supports: currentOf(feeds),
      supportedBy: currentOf(fedBy),
      checks: currentOf(checks),
      checkedBy: currentOf(checkedBy),
    };
  }

  function scoreCurrents(data, domainScores, facetScores) {
    return currentDefinitions(data).map((definition) => {
      const score = domainScores[definition.domain];
      const reading = Number.isFinite(score) ? score : null;
      const banded = reading === null ? null : bandedPoleFor(data, definition, reading);
      return {
        id: definition.id,
        name: definition.name,
        axis: definition.axis,
        // The element is the identity; the two tones are the same hue set for
        // the ground it is drawn on, so a trace stays legible on both.
        element: definition.id,
        colour: definition.colour,
        colourNight: definition.colourNight,
        colourPaper: definition.colourPaper,
        domain: definition.domain,
        poles: definition.poles,
        /*
         * `pole` is the block the page prints — the middle one inside the
         * situational band. `nearer` is which end it leans toward, which the
         * relation lines still need because a relationship is directional even
         * when the reading is not pronounced.
         */
        pole: banded,
        nearer: reading === null ? null : poleFor(definition, reading),
        situational: banded !== null && banded === definition.poles.middle,
        magnitude: magnitudeFor(reading),
        score: reading,
        normalised: normalise(reading),
        facetFloor: facetScores ? facetFloorFor(data, definition, facetScores) : null,
      };
    });
  }

  /*
   * The lowest supporting facet of a current. A current reads on the same
   * scale as its three facets, so the floor is simply the weakest of them.
   */
  function facetFloorFor(data, definition, facetScores) {
    const facets = data.assessment.domains[definition.domain].facets;
    const supporting = facets
      .map((facet) => facetScores[facet])
      .filter((value) => Number.isFinite(value));
    return supporting.length ? Math.min(...supporting) : null;
  }




  /* -------------------------------------------------------- context phases */

  function phaseDefinitions(data) {
    return data.assessment.phaseOrder.map((id) => data.assessment.phases[id]);
  }

  function scorePhases(data, state) {
    const safe = sanitiseState(data, state);
    const items = flattenItems(data);

    return phaseDefinitions(data).map((phase) => {
      const domainValues = {};
      items
        .filter((item) => item.contextPhase === phase.id)
        .forEach((item) => {
          const raw = safe.assessment.answers[item.id];
          if (!isValidResponse(raw)) {
            return;
          }
          (domainValues[item.domain] = domainValues[item.domain] || []).push(
            getKeyedScore(raw, item.reverse),
          );
        });

      const domainScores = Object.fromEntries(
        DOMAIN_ORDER.map((code) => [code, mean(domainValues[code] || [])]),
      );

      return {
        id: phase.id,
        label: phase.label,
        shortLabel: phase.shortLabel,
        window: phase.window,
        description: phase.description,
        acts: phase.acts.slice(),
        // Phase results are only definitive once the phase holds three Acts.
        definitive: phase.acts.length >= 3,
        domainScores,
        currents: scoreCurrents(data, domainScores),
      };
    });
  }

  function phaseByld(profile, id) {
    return profile.phases.find((phase) => phase.id === id) || null;
  }

  /*
   * A shift is the movement of one current between two phases. Anything below
   * the ignore threshold is not interpreted at all.
   */
  function describeShift(data, magnitude) {
    const thresholds = data.assessment.shiftThresholds;
    const size = Math.abs(magnitude);
    if (size < thresholds.ignore) {
      return null;
    }
    return size >= thresholds.notable ? "notable" : "subtle";
  }

  function compareCurrents(data, fromPhase, toPhase) {
    const before = Object.fromEntries(fromPhase.currents.map((entry) => [entry.id, entry]));
    const shifts = toPhase.currents
      .map((entry) => {
        const previous = before[entry.id];
        if (!Number.isFinite(entry.score) || !Number.isFinite(previous?.score)) {
          return null;
        }
        const delta = entry.score - previous.score;
        const size = describeShift(data, delta);
        return size ? { ...entry, delta, size, direction: delta > 0 ? "rose" : "fell" } : null;
      })
      .filter(Boolean)
      .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));

    return { shifts, stable: shifts.length === 0 };
  }

  /* Where the recovery pattern sits relative to the start and the worst of it. */
  function describeReturn(data, profile) {
    const baseline = phaseByld(profile, "baseline");
    const pressure = phaseByld(profile, "pressure");
    const recovery = phaseByld(profile, "recovery");
    if (!baseline || !pressure || !recovery) {
      return null;
    }

    const distance = (left, right) => {
      const byId = Object.fromEntries(right.currents.map((entry) => [entry.id, entry.score]));
      const gaps = left.currents
        .filter((entry) => Number.isFinite(entry.score) && Number.isFinite(byId[entry.id]))
        .map((entry) => Math.abs(entry.score - byId[entry.id]));
      return gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : null;
    };

    const toBaseline = distance(recovery, baseline);
    const toPressure = distance(recovery, pressure);
    const thresholds = data.assessment.shiftThresholds;

    if (!Number.isFinite(toBaseline) || !Number.isFinite(toPressure)) {
      return null;
    }
    /*
     * The three answers are the three keys the copy is written under. This
     * returned "new-balance" for the equidistant case while the copy was
     * filed under "new", so a record that settled between its two earlier
     * readings — which is common — had its recovery sentence silently drop out
     * of the report rather than fail visibly.
     */
    if (Math.abs(toBaseline - toPressure) < thresholds.ignore) {
      return "new";
    }
    return toBaseline < toPressure ? "returned" : "retained";
  }

  /* --------------------------------------------------------- aurora state */

  /*
   * The aurora is a narrative event. It is absent through onboarding and the
   * whole early and middle watch. It enters at the Act where the sky opens and
   * deepens through the rest of the night, and it is gone by the debrief —
   * dawn is not a version of the night with the lights turned down.
   */
  function auroraStateFor(data, state) {
    const auroraAct = data.story.auroraAct;
    const safe = sanitiseState(data, state);
    if (!safe.participant.name) {
      return { state: "off", intensity: 0 };
    }

    /*
     * The environment follows the number of recorded observations. Because the
     * story only ever runs as far as the next unanswered question, the reader
     * cannot get ahead of their own answers, so the count is a true reading of
     * how far into the night they are.
     */
    const answered = answeredCount(safe);

    // Once the record closes, the station is in daylight.
    if (answered >= ITEM_COUNT) {
      return { state: "off", intensity: 0 };
    }

    const reached = Math.min(ACT_COUNT, Math.floor(answered / ITEMS_PER_ACT) + 1);
    if (reached < auroraAct) {
      return { state: "off", intensity: 0 };
    }

    // Intensity rises across the remaining Acts rather than switching on.
    const remaining = Math.max(1, ACT_COUNT - auroraAct);
    const progress = Math.min(1, (reached - auroraAct) / remaining);
    return { state: "present", intensity: Number(progress.toFixed(3)) };
  }

  function actNumberFor(data, actId) {
    const act = data.story.acts.find((entry) => entry.id === actId);
    return act ? act.number : 0;
  }

  function contextPhaseFor(data, state) {
    const safe = sanitiseState(data, state);
    const act = Math.min(
      ACT_COUNT,
      Math.floor(answeredCount(safe) / ITEMS_PER_ACT) + 1,
    );
    const entry = data.story.acts.find((candidate) => candidate.number === act);
    return entry ? entry.contextPhase : "baseline";
  }

  /* ------------------------------------------------------ narrative summary */

  function joinList(values) {
    if (values.length <= 1) {
      return values[0] || "";
    }
    return `${values.slice(0, -1).join(", ")} and ${values.at(-1)}`;
  }



  /*
   * Did this current change which end of its line describes the reader between
   * two stretches? Both readings have to be far enough from the middle to mean
   * anything, or a reading sitting on the centre would "cross" on noise.
   */
  function crossingFor(data, fromPhase, toPhase, currentId) {
    const current = data.assessment.spectra.currents[currentId] || null;
    if (!current) {
      return null;
    }
    const at = (phase) => phase.currents.find((entry) => entry.id === currentId);
    const before = at(fromPhase);
    const after = at(toPhase);
    if (!before || !after) {
      return null;
    }
    const from = magnitudeFor(before.score);
    const to = magnitudeFor(after.score);
    const floor = data.assessment.shiftThresholds.ignore;
    if (Math.sign(from) === Math.sign(to) || Math.abs(from) < floor || Math.abs(to) < floor) {
      return null;
    }
    return { current, from: poleFor(current, before.score), to: poleFor(current, after.score) };
  }

  /*
   * One line per current across the three stretches, including the ones that
   * did not move.
   *
   * The movement chapter reported only the reading that travelled furthest,
   * which left four of the five unaccounted for on a page whose whole subject
   * is what the night did to them. A line that held is a finding as much as a
   * line that swung, and it is only readable as one if it is said.
   */
  function movementPerCurrent(data, profile) {
    const copy = data.results.movementCopy;
    const baseline = phaseByld(profile, "baseline");
    const pressure = phaseByld(profile, "pressure");
    const recovery = phaseByld(profile, "recovery");
    if (!baseline || !pressure || !recovery) {
      return [];
    }
    const floor = data.assessment.shiftThresholds.ignore;

    /*
     * Two sentences per line: where you began, and what the night did to it.
     * Both name a side and how far it leaned, because "toward discipline" and
     * "strongly toward discipline" are the same side and not the same finding.
     *
     * Dead centre is the one reading with no side, and it is written as being
     * balanced between the two rather than given a name of its own — a third
     * name at the middle of a two-ended line reads as a third type.
     */
    return profile.currents.map((current) => {
      const at = (phase) => phase.currents.find((entry) => entry.id === current.id);
      const from = at(baseline);
      const under = at(pressure);
      const after = at(recovery);
      const definition = data.assessment.spectra.currents[current.id];
      const block = (score) => bandedPoleFor(data, definition, score);
      const centred = (score) => score === CENTRE;
      const words = (score) => ({
        name: block(score).name,
        gloss: block(score).gloss,
        intensity: intensityFor(data, magnitudeFor(score)),
      });
      const fill = (template, values) =>
        Object.keys(values).reduce(
          (text, key) => text.split(`{${key}}`).join(values[key]),
          template,
        );

      const ends = { low: definition.poles.low.name, high: definition.poles.high.name };
      const start = words(from.score);
      const pressed = words(under.score);
      const ended = words(after.score);

      const opening = centred(from.score)
        ? fill(copy.openBalanced, ends)
        : fill(copy.open, {
            from: start.name,
            fromGloss: start.gloss,
            fromIntensity: start.intensity,
          });

      const delta = under.score - from.score;
      if (Math.abs(delta) < floor) {
        return {
          id: current.id,
          name: current.name,
          colourPaper: current.colourPaper,
          moved: false,
          copy: `${opening} ${copy.heldSteady}`,
        };
      }

      /*
       * Where it ended, judged against where it was rather than by distance
       * alone. "Settled somewhere else again" was true of every reading that
       * neither returned nor stayed, which makes it a category, not a finding.
       */
      const sameSide = (left, right) =>
        centred(left) === centred(right) && block(left) === block(right);
      const landed = sameSide(after.score, under.score)
        ? copy.stayed
        : sameSide(after.score, from.score)
          ? copy.returned
          : centred(after.score)
            ? fill(copy.settledBalanced, ends)
            : fill(copy.settled, {
                after: ended.name,
                afterGloss: ended.gloss,
                afterIntensity: ended.intensity,
              });

      /*
       * Four ways a night can move a line: it crossed, it went further the way
       * it already leaned, it eased back without crossing, or it came to rest
       * evenly between the two.
       */
      const template = centred(under.score)
        ? copy.toBalance
        : centred(from.score)
          ? copy.crossedFromBalance
          : block(from.score) !== block(under.score)
            ? copy.crossed
            : Math.abs(under.score - CENTRE) > Math.abs(from.score - CENTRE)
              ? copy.deepened
              : copy.eased;

      return {
        id: current.id,
        name: current.name,
        colourPaper: current.colourPaper,
        moved: true,
        copy: `${opening} ${fill(template, {
          from: start.name,
          fromGloss: start.gloss,
          fromIntensity: start.intensity,
          to: pressed.name,
          toGloss: pressed.gloss,
          toIntensity: pressed.intensity,
          recoveryClause: landed,
        })}`,
      };
    });
  }

  /*
   * One sentence over the five lines: how many the night moved.
   *
   * This used to be a paragraph naming the reading that travelled furthest and
   * saying it "became more visible" or "receded furthest" — the vocabulary of a
   * scale with a top, printed directly above five lines that say a reading is a
   * position between two named ends. On a bipolar line a falling score is not a
   * receding tendency, it is a move toward the other end, so the paragraph
   * routinely contradicted the line under it. It also ended with the same
   * sentence about recovery that the next paragraph then repeated.
   *
   * The five lines carry the findings. This says how many there are.
   */
  function movementLede(data, profile) {
    const copy = data.results.shiftLede;
    const moved = movementPerCurrent(data, profile).filter((entry) => entry.moved).length;
    if (moved === 0) {
      return copy.none;
    }
    if (moved === profile.currents.length) {
      return copy.all;
    }
    // Spelled out. "3 of the five moved" mixes a numeral with a word in one
    // phrase, which is the same fault the facet count had.
    const word = spellNumber(moved);
    return (moved === 1 ? copy.one : copy.some).replace(
      "{count}",
      word.charAt(0).toUpperCase() + word.slice(1),
    );
  }

  function summariseProfile(data, profile) {
    if (!profile) {
      return null;
    }
    return {
      adaptation: movementLede(data, profile),
      recovery: describeReturn(data, profile),
      reflection: data.results.reflectionPrompt,
    };
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
    DOMAIN_ORDER,
    answeredCount,
    auroraStateFor,
    bandForScore,
    buildNodes,
    canGoBack,
    clearJourney,
    CENTRE,
    MAGNITUDE_CLEAR,
    STEADY_CHANGE,
    DIVERGENCE_LIMIT,
    compareCurrents,
    contextPhaseFor,
    currentForDomain,
    currentsFor,
    divergenceFor,
    firmnessFor,
    magnitudeFor,

    poleFor,
    bandedPoleFor,
    situationalReach,
    intensityFor,
    middleMovementFor,
    movementPerCurrent,
    responseStyleFor,
    spectraDefinitions,
    currentItem,
    defaultPreferences,
    describeReturn,
    describeShift,
    domainDefinitions,
    emptyState,
    facetFloorFor,
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
    phaseDefinitions,
    previousResponse,
    recordResponse,
    responseLabels,
    currentDefinitions,
    sanitisePreferences,
    sanitiseState,
    savePreferences,
    saveState,
    scoreProfile,
    elementForCurrent,
    relationsFor,
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
