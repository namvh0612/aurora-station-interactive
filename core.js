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
      answers: [],
      reserveChoice: null,
    };
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

    return { answers, reserveChoice };
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
      return { type: "complete" };
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
      answers: safeState.answers.concat(raw),
      reserveChoice: safeState.reserveChoice,
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
      answers: safeState.answers.slice(),
      reserveChoice: optionId,
    };
  }

  function undoLast(data, state) {
    const safeState = sanitiseState(data, state);

    if (
      safeState.answers.length === 55 &&
      safeState.reserveChoice !== null
    ) {
      return {
        answers: safeState.answers.slice(),
        reserveChoice: null,
      };
    }

    if (safeState.answers.length > 0) {
      return {
        answers: safeState.answers.slice(0, -1),
        reserveChoice: safeState.reserveChoice,
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

  function describeElement(result, definition) {
    const interpretation = definition.interpretation;
    if (!interpretation || result.score === null) {
      return "";
    }

    if (result.score >= 4.5) {
      return `A strong pull toward a style that ${interpretation.higher}.`;
    }

    if (result.score >= 3.5) {
      return `A measured lean toward a style that ${interpretation.higher}, while the counter-style still appears when useful.`;
    }

    if (result.score >= 2.5) {
      return `A measured lean toward a style that ${interpretation.lower}, while the opposite style remains available.`;
    }

    return `A strong pull toward a style that ${interpretation.lower}.`;
  }

  function expressionBand(score) {
    if (score >= 4.5) {
      return "Strongly expressed";
    }
    if (score >= 3.5) {
      return "Readily available";
    }
    if (score >= 2.5) {
      return "Context-dependent";
    }
    return "Used selectively";
  }

  function buildProfileNarrative(data, ranked) {
    const primary = ranked[0];
    const secondary = ranked[1];
    const quieter = ranked[ranked.length - 1];
    if (!primary || !secondary || !quieter) {
      return null;
    }

    const primaryDefinition = data.assessment.elements[primary.code];
    const secondaryDefinition = data.assessment.elements[secondary.code];
    const quieterDefinition = data.assessment.elements[quieter.code];
    const titleWords = {
      WO: "Explorer",
      FI: "Catalyst",
      EA: "Connector",
      ME: "Architect",
      WA: "Anchor",
    };

    return {
      title: `The ${titleWords[primary.code]}–${titleWords[secondary.code]}`,
      strapline:
        `${primary.element} leads with ${primaryDefinition.interpretation.lens.toLowerCase()}, ` +
        `supported by ${secondary.element}'s ${secondaryDefinition.interpretation.lens.toLowerCase()}.`,
      summary:
        `You are likely to approach uncertain situations by first drawing on ${primaryDefinition.interpretation.lens.toLowerCase()}, ` +
        `then reinforcing it with ${secondaryDefinition.interpretation.lens.toLowerCase()}. ` +
        `${quieter.element} is not missing; its ${quieterDefinition.interpretation.lens.toLowerCase()} tends to appear when the situation clearly calls for it rather than as your automatic first move.`,
      strengths: [
        `You naturally bring ${primaryDefinition.interpretation.higher}.`,
        `You can support that instinct with ${secondaryDefinition.interpretation.higher}.`,
        `Your responses suggest more than one usable style, rather than a single fixed way of acting.`,
      ],
      pressure:
        `Under pressure, your first move may become more strongly ${primary.element.toLowerCase()}-led. ` +
        `That can create clarity and momentum, but it may also narrow attention before the quieter ${quieter.element.toLowerCase()} perspective has been considered.`,
      watchOut:
        `The useful counterbalance is to pause briefly and ask what ${quieterDefinition.interpretation.lens.toLowerCase()} would add before committing. ` +
        `This is not about suppressing your strongest style; it is about choosing when it should lead.`,
      collaboration:
        `You are likely to contribute best when others recognise your preference for ${primaryDefinition.interpretation.lens.toLowerCase()}. ` +
        `You may work especially well with people who make ${quieterDefinition.interpretation.lens.toLowerCase()} explicit, because they surface information your first instinct may leave implicit.`,
    };
  }

  function analyseProfile(data, state) {
    const assessment = scoreAssessment(data, state);
    const ranked = assessment.elements
      .filter((result) => result.score !== null)
      .slice()
      .sort((left, right) => right.score - left.score);
    const narrative = buildProfileNarrative(data, ranked);
    const overview = narrative
      ? narrative.summary
      : "Complete the journey to reveal your response pattern.";

    return {
      ...assessment,
      overview,
      elements: assessment.elements.map((result) => {
        const definition = data.assessment.elements[result.code];
        return {
          ...result,
          lens: definition.interpretation?.lens || result.trait,
          description: describeElement(result, definition),
          expression: expressionBand(result.score),
          facetDefinitions: definition.interpretation?.facets || {},
        };
      }),
      narrative,
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
    answerCurrent,
    branchForRaw,
    buildPlainStory,
    chooseReserve,
    clearState,
    currentStep,
    emptyState,
    flattenItems,
    loadState,
    analyseProfile,
    sanitiseState,
    saveState,
    scoreAssessment,
    selectedReserve,
    splitParagraphs,
    undoLast,
  };

  globalScope.AuroraCore = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
