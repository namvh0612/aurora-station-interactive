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
  const DIVERGENCE_LIMIT = 1;

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

  function poleFor(current, score) {
    return score < CENTRE ? current.poles.low : current.poles.high;
  }

  function magnitudeFor(score) {
    return Number.isFinite(score) ? score - CENTRE : null;
  }

  function magnitudeLabelFor(data, magnitude) {
    const labels = data.assessment.spectra.magnitudes;
    const size = Math.abs(magnitude);
    if (size >= MAGNITUDE_PRONOUNCED) {
      return labels.pronounced;
    }
    return size >= MAGNITUDE_CLEAR ? labels.clear : labels.faint;
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

  function currentsFor(data, domains, state) {
    return Object.values(spectraDefinitions(data))
      .map((current) => {
        const domain = domains.find((entry) => entry.code === current.domain);
        if (!domain) {
          return null;
        }
        const definition = roleDefinitions(data).find(
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
          colour: definition ? definition.colour : null,
          colourNight: definition ? definition.colourNight : null,
          colourPaper: definition ? definition.colourPaper : null,
          score: domain.score,
          normalised: domain.normalised,
          band: domain.band,
          poles: current.poles,
          pole: poleFor(current, domain.score),
          magnitude,
          magnitudeLabel: magnitudeLabelFor(data, magnitude),
          firmness: firmnessFor(data, state, domain.code),
          divergence: divergenceFor(data, domain),
          guidance: data.assessment.domains[domain.code].guidance[domain.band],
          facets: domain.facets,
        };
      })
      .filter(Boolean);
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

    return {
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
        copy: copy.agreementNote.replace("{held}", String(held)),
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

    const phases = scorePhases(data, safe);
    const pressurePhase = phases.find((phase) => phase.id === "pressure");
    const roles = scoreSuitability(
      data,
      scoreRoles(data, domainScores, facetScores),
      pressurePhase ? pressurePhase.roles : [],
    );

    return {
      playerName: safe.participant.name,
      complete: true,
      domains,
      facets: domains.flatMap((domain) => domain.facets),
      currents: currentsFor(data, domains, safe),
      responseStyle: responseStyleFor(data, safe),
      roles,
      phases,
      scaleMin: MIN_RESPONSE,
      scaleMax: MAX_RESPONSE,
    };
  }

  /* ---------------------------------------------------------- Aurora Roles */

  /*
   * The five roles are a narrative reading of the same five domains, kept on
   * the same 1-5 scale. Aegis is the inverse representation of Negative
   * Emotionality, so a higher Aegis means greater steadiness. Nothing here is
   * a share of anything: the roles are independent and never total.
   */
  function roleScoreFor(definition, domainScore) {
    if (!Number.isFinite(domainScore)) {
      return null;
    }
    /*
     * Every current reads its domain directly, Water included. Water used to
     * be reported as 6 - Negative Emotionality under the name Emotional
     * Stability, which meant the same measurement pointed one way in the
     * domain chapter and the other way on the instrument, with nothing on the
     * page connecting them. Both ends of the Water line are named instead.
     */
    return domainScore;
  }

  function roleDefinitions(data) {
    return data.assessment.roleOrder.map((id) => data.assessment.roles[id]);
  }

  /*
   * The five contributions read against each other. Two cycles, both carried in
   * the content file: one where a contribution creates the conditions the next
   * one needs, and one where a contribution restrains another that has run
   * long. This is a reading of relationships, not a compatibility score, and
   * nothing here totals or ranks.
   */
  function elementForRole(data, roleId) {
    return Object.values(data.assessment.elements).find((entry) => entry.role === roleId) || null;
  }

  function relationsFor(data, roleId) {
    const element = elementForRole(data, roleId);
    if (!element) {
      return null;
    }
    const cycles = data.assessment.cycles;
    const ring = cycles.generating;
    const at = ring.indexOf(element.id);
    if (at < 0) {
      return null;
    }

    const roleOf = (elementId) => data.assessment.elements[elementId].role;
    const feeds = ring[(at + 1) % ring.length];
    const fedBy = ring[(at - 1 + ring.length) % ring.length];
    const checks = cycles.controlling[element.id];
    const checkedBy = Object.keys(cycles.controlling).find(
      (key) => cycles.controlling[key] === element.id,
    );

    return {
      element: element.id,
      supports: roleOf(feeds),
      supportedBy: roleOf(fedBy),
      checks: roleOf(checks),
      checkedBy: roleOf(checkedBy),
    };
  }

  function scoreRoles(data, domainScores, facetScores) {
    return roleDefinitions(data).map((definition) => {
      const score = roleScoreFor(definition, domainScores[definition.domain]);
      return {
        id: definition.id,
        name: definition.name,
        shortName: definition.shortName,
        // The element is the identity; the two tones are the same hue set for
        // the ground it is drawn on, so a trace stays legible on both.
        element: definition.element,
        colour: definition.colour,
        colourNight: definition.colourNight,
        colourPaper: definition.colourPaper,
        basis: definition.basis,
        contribution: definition.contribution,
        reading: definition.reading,
        inGroup: definition.inGroup,
        // The report prints these; they must travel with the score.
        missionFunction: definition.missionFunction,
        brings: definition.brings,
        watchFor: definition.watchFor,
        actionTitle: definition.actionTitle,
        action: definition.action,
        domain: definition.domain,
        inverse: definition.inverse,
        score,
        normalised: normalise(score),
        facetFloor: facetScores ? facetFloorFor(data, definition, facetScores) : null,
      };
    });
  }

  /*
   * The lowest supporting facet for a role. A role reads on the same scale as
   * its facets, so an inverse role's supporting facets are inverted too: a
   * high Anxiety facet is a low Sentinel support.
   */
  function facetFloorFor(data, definition, facetScores) {
    const facets = data.assessment.domains[definition.domain].facets;
    const supporting = facets
      .map((facet) => facetScores[facet])
      .filter((value) => Number.isFinite(value));
    return supporting.length ? Math.min(...supporting) : null;
  }

  /*
   * How well the reader's own responses support each role. The facet floor is
   * weighted in so that a strong domain average cannot hide a component the
   * profile does not actually support.
   */
  function scoreSuitability(data, roles, pressureRoles) {
    const weights = data.assessment.suitability.weights;
    const pressureById = Object.fromEntries(
      (pressureRoles || []).map((role) => [role.id, role.score]),
    );

    return roles.map((role) => {
      const pressure = pressureById[role.id];
      const parts = [
        [weights.overall, role.score],
        [weights.pressure, pressure],
        [weights.facetFloor, role.facetFloor],
      ];
      const usable = parts.filter(([, value]) => Number.isFinite(value));
      const totalWeight = usable.reduce((sum, [weight]) => sum + weight, 0);
      const suitability = totalWeight
        ? usable.reduce((sum, [weight, value]) => sum + weight * value, 0) / totalWeight
        : null;

      return {
        ...role,
        pressureScore: Number.isFinite(pressure) ? pressure : null,
        profileSuitability: suitability,
      };
    });
  }

  /*
   * Recommended Role = profile suitability + team composition + mission
   * requirement. A solo journey knows only the first, so the other two are
   * optional inputs and their absence is reported rather than hidden.
   */
  function recommendRole(data, roles, options) {
    const settings = options || {};
    const team = settings.teamComposition || null;
    const mission = settings.missionRequirement || null;

    const scored = roles.map((role) => {
      const teamNeed = Number(team?.[role.id]);
      const missionNeed = Number(mission?.[role.id]);
      const parts = [role.profileSuitability];
      if (Number.isFinite(teamNeed)) {
        parts.push(teamNeed);
      }
      if (Number.isFinite(missionNeed)) {
        parts.push(missionNeed);
      }
      const usable = parts.filter((value) => Number.isFinite(value));
      return {
        ...role,
        teamNeed: Number.isFinite(teamNeed) ? teamNeed : null,
        missionNeed: Number.isFinite(missionNeed) ? missionNeed : null,
        recommendationScore: usable.length
          ? usable.reduce((sum, value) => sum + value, 0) / usable.length
          : null,
      };
    });

    return {
      roles: scored,
      inputs: {
        profileSuitability: true,
        teamComposition: Boolean(team),
        missionRequirement: Boolean(mission),
      },
      complete: Boolean(team && mission),
      leading: leadingRoles(data, scored, "recommendationScore"),
    };
  }

  /*
   * Which role or roles led. Two scores within the blend threshold are read as
   * a blend rather than a winner; a role within the secondary threshold is
   * offered alongside. No role is ever described as better.
   */
  function leadingRoles(data, roles, metric) {
    const key = metric || "score";
    const tolerance = data.assessment.suitability.tieTolerance;
    const secondaryGap = data.assessment.shiftThresholds.secondary;
    const valueOf = (role) => role[key];

    /*
     * Ties are never resolved by array order. Equal leading values fall back to
     * the facet floor, which is the component a role is actually supported by,
     * and then to the name so the result is stable and explainable.
     */
    const ranked = roles
      .filter((role) => Number.isFinite(valueOf(role)))
      .slice()
      .sort((left, right) => {
        const byMetric = valueOf(right) - valueOf(left);
        if (Math.abs(byMetric) > 1e-9) {
          return byMetric;
        }
        const byFloor = (right.facetFloor ?? -Infinity) - (left.facetFloor ?? -Infinity);
        if (Math.abs(byFloor) > 1e-9) {
          return byFloor;
        }
        return left.name.localeCompare(right.name);
      });

    if (!ranked.length) {
      return { primary: null, blended: [], secondary: null, isBlend: false, ranked: [], label: "" };
    }

    // A blend is the top two, never a pile of near-ties: five roles within a
    // tenth of each other is a flat profile, not a five-way blend.
    const top = ranked[0];
    const runnerUp = ranked[1];
    const isBlend =
      Boolean(runnerUp) && valueOf(top) - valueOf(runnerUp) <= tolerance;
    const blended = isBlend ? [top, runnerUp] : [top];
    const secondary =
      !isBlend && runnerUp && valueOf(top) - valueOf(runnerUp) <= secondaryGap
        ? runnerUp
        : null;

    return {
      primary: top,
      blended,
      secondary,
      isBlend,
      ranked,
      metric: key,
      label: blended.map((role) => role.shortName || role.name).join(" + "),
    };
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
        roles: scoreRoles(data, domainScores),
      };
    });
  }

  function phaseByld(profile, id) {
    return profile.phases.find((phase) => phase.id === id) || null;
  }

  /*
   * A shift is the movement of one role between two phases. Anything below the
   * ignore threshold is not interpreted at all.
   */
  function describeShift(data, magnitude) {
    const thresholds = data.assessment.shiftThresholds;
    const size = Math.abs(magnitude);
    if (size < thresholds.ignore) {
      return null;
    }
    return size >= thresholds.notable ? "notable" : "subtle";
  }

  function compareRoles(data, fromPhase, toPhase) {
    const before = Object.fromEntries(fromPhase.roles.map((role) => [role.id, role]));
    const shifts = toPhase.roles
      .map((role) => {
        const previous = before[role.id];
        if (!Number.isFinite(role.score) || !Number.isFinite(previous?.score)) {
          return null;
        }
        const delta = role.score - previous.score;
        const size = describeShift(data, delta);
        return size ? { ...role, delta, size, direction: delta > 0 ? "rose" : "fell" } : null;
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
      const byId = Object.fromEntries(right.roles.map((role) => [role.id, role.score]));
      const gaps = left.roles
        .filter((role) => Number.isFinite(role.score) && Number.isFinite(byId[role.id]))
        .map((role) => Math.abs(role.score - byId[role.id]));
      return gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : null;
    };

    const toBaseline = distance(recovery, baseline);
    const toPressure = distance(recovery, pressure);
    const thresholds = data.assessment.shiftThresholds;

    if (!Number.isFinite(toBaseline) || !Number.isFinite(toPressure)) {
      return null;
    }
    if (Math.abs(toBaseline - toPressure) < thresholds.ignore) {
      return "new-balance";
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
   * The closing summary. Every sentence is conditional, describes a pattern
   * rather than an identity, and never frames a role as a strength or a fault.
   */
  function labelOfCurrents(data, lead) {
    return joinList((lead.blended || [lead.primary]).filter(Boolean).map((role) => nameOfCurrentForRole(data, role.id)));
  }

  function nameOfCurrentForRole(data, roleId) {
    const role = data.assessment.roles[roleId];
    const current = role ? currentForDomain(data, role.domain) : null;
    return current ? current.name : roleId;
  }

  /*
   * Did this current change which end of its line describes the reader between
   * two stretches? Both readings have to be far enough from the middle to mean
   * anything, or a reading sitting on the centre would "cross" on noise.
   */
  function crossingFor(data, fromPhase, toPhase, roleId) {
    const role = data.assessment.roles[roleId];
    const current = role ? currentForDomain(data, role.domain) : null;
    if (!current) {
      return null;
    }
    const at = (phase) => phase.roles.find((entry) => entry.id === roleId);
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

  function summariseProfile(data, profile) {
    if (!profile) {
      return null;
    }
    const copy = data.results.summaryTemplates;
    // The overall lead is the role the profile best supports, not simply the
    // highest raw score.
    const overall = leadingRoles(data, profile.roles, "profileSuitability");
    const baseline = phaseByld(profile, "baseline");
    const pressure = phaseByld(profile, "pressure");
    const recovery = phaseByld(profile, "recovery");
    const startingLead = leadingRoles(data, baseline.roles);
    const pressureLead = leadingRoles(data, pressure.roles);
    const recoveryLead = leadingRoles(data, recovery.roles);

    const consistency =
      startingLead.primary?.id === pressureLead.primary?.id
        ? copy.consistencyAnchored
            .replace("{overall}", labelOfCurrents(data, overall))
            .replace("{reading}", overall.primary.reading)
        : copy.consistencyMoved
            .replace("{starting}", labelOfCurrents(data, startingLead))
            .replace("{pressure}", labelOfCurrents(data, pressureLead));

    const pressureComparison = compareRoles(data, baseline, pressure);
    const returnKind = describeReturn(data, profile);
    const recoveryClause =
      returnKind === "returned"
        ? copy.recoveryReturned
        : returnKind === "retained"
          ? copy.recoveryRetained
          : copy.recoveryNew;

    /*
     * The shifts are sorted by size, so the first is the contribution that
     * moved furthest — which is the finding, whichever way it went. Its
     * direction decides how it is described. Saying "became more visible" of a
     * contribution that fell states the opposite of the reader's own responses,
     * and half of all watches have a fall at the top of this list.
     */
    const largestShift = pressureComparison.shifts[0];
    /*
     * A crossing is a stronger finding than a delta: it changes which end of
     * the line describes the reader, not merely how far along it they sit. It
     * is reported by name when the reading passes the middle of the scale in
     * either direction.
     */
    const crossing = largestShift ? crossingFor(data, baseline, pressure, largestShift.id) : null;
    const adaptation = pressureComparison.stable
      ? copy.adaptationStable
      : crossing
        ? copy.adaptationCrossed
            .replace("{current}", crossing.current.name)
            .replace("{from}", crossing.from.name)
            .replace("{to}", crossing.to.name)
            .replace("{reading}", crossing.to.look)
            .replace("{recoveryClause}", recoveryClause)
        : (largestShift.direction === "rose" ? copy.adaptationShift : copy.adaptationRecede)
            .replace("{pressure}", nameOfCurrentForRole(data, largestShift.id))
            .replace("{reading}", largestShift.reading)
            .replace("{recoveryClause}", recoveryClause);

    const contribution = copy.contribution.replace(
      "{contribution}",
      joinList(overall.blended.map((role) => role.inGroup)),
    );

    return {
      overall,
      starting: startingLead,
      pressure: pressureLead,
      recovery: recoveryLead,
      consistency,
      adaptation,
      contribution,
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
    compareRoles,
    contextPhaseFor,
    currentForDomain,
    currentsFor,
    divergenceFor,
    firmnessFor,
    magnitudeFor,
    magnitudeLabelFor,
    poleFor,
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
    leadingRoles,
    loadPreferences,
    loadState,
    narrativeForRaw,
    normalise,
    normalisePlayerName,
    pendingQuestion,
    phaseDefinitions,
    previousResponse,
    recommendRole,
    recordResponse,
    responseLabels,
    roleDefinitions,
    roleScoreFor,
    scoreSuitability,
    sanitisePreferences,
    sanitiseState,
    savePreferences,
    saveState,
    scoreProfile,
    elementForRole,
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
