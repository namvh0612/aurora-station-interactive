/*
 * Aurora Station — the dawn observation report.
 *
 * One continuous document, ruled and numbered like a filed record. Everything
 * is recalculated from the raw responses on load: no cached score is trusted,
 * nothing is imputed, and an incomplete watch is returned to the story.
 *
 * The report never shows how a number was produced. Weights, floors and
 * formulas stay inside core.js; this page reads out only what they mean.
 */
(function readAuroraReport() {
  "use strict";

  const data = window.AURORA_STATION_DATA;
  const core = window.AuroraCore;
  const art = window.AuroraArtwork;
  const pdf = window.AuroraPdf;

  const shell = document.getElementById("report");
  const announcer = document.getElementById("announcer");

  const storage = (() => {
    try {
      const probe = window.localStorage;
      probe.getItem(core.JOURNEY_KEY);
      return probe;
    } catch {
      return null;
    }
  })();

  let profile = null;
  let state = null;
  let summary = null;

  const COPY = data.results;
  const LABELS = COPY.labels;

  /* ------------------------------------------------------------- helpers */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined && text !== null) {
      node.textContent = text;
    }
    return node;
  }

  function say(message) {
    if (!announcer || !message) {
      return;
    }
    announcer.textContent = "";
    window.setTimeout(() => {
      announcer.textContent = message;
    }, 30);
  }

  function stillMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function reading(value) {
    return Number.isFinite(value) ? value.toFixed(1) : "—";
  }

  function outOf(value) {
    return `${reading(value)} / ${core.MAX_RESPONSE}`;
  }

  function signed(value) {
    return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}`;
  }


  function completedOn() {
    const stamp = Number(state.completedAt);
    const date = Number.isFinite(stamp) && stamp > 0 ? new Date(stamp) : new Date();
    return date
      .toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
      .toUpperCase();
  }

  function chapter(id) {
    return COPY.chapters.find((entry) => entry.id === id);
  }

  function section(id) {
    const copy = chapter(id);
    const node = el("section", "chapter");
    node.id = `chapter-${id}`;
    const head = el("div", "chapter-head");
    head.append(el("p", "mark", copy.eyebrow), el("h2", "chapter-title", copy.title));
    node.appendChild(head);
    const body = el("div", "chapter-body");
    node.appendChild(body);
    return { node, body };
  }

  /* ------------------------------------------------------------- spectra */

  function currentById(id) {
    return profile.currents.find((entry) => entry.id === id) || null;
  }

  /*
   * The share of the line a reading has to leave before it describes an end.
   * Read from the situational band the content file defines, so the shaded
   * middle of the drawing is the same width as the rule that decides whether
   * an end gets named and which block of writing gets printed.
   */
  function centreBand() {
    const span = profile.scaleMax - profile.scaleMin;
    return (core.situationalReach(data) / span) * 100;
  }

  /*
   * Where a reading sits on its line, as a percentage. The line runs the whole
   * scale, so the middle of the scale is the middle of the line.
   */
  function placeOn(score) {
    const span = profile.scaleMax - profile.scaleMin;
    return Math.max(0, Math.min(100, ((score - profile.scaleMin) / span) * 100));
  }

  /*
   * The readout: which end the reading is nearer, how far from the middle it
   * sits, and how firmly that reads. It belongs under the current's name
   * rather than under the line, so the eye takes the name and the finding
   * together and the line below is left to be a line.
   *
   * Inside the middle band no end is named. Naming one there would put "The
   * Wildwood" against a distance of 0.04, which claims a side the responses
   * did not take.
   */
  function poleNameFor(current) {
    return current.situational || !current.pole ? "" : current.pole.name;
  }

  function spectrumReadout(current) {
    const node = el("p", "spectrum-readout");
    const distance = Math.abs(current.magnitude);
    const named = poleNameFor(current);
    node.textContent = `${named ? `${named} · ` : ""}${distance.toFixed(2)} ${LABELS.fromCentre} · ${current.magnitudeLabel}`;
    return node;
  }

  /*
   * One line with a name at each end and a mark where the reading falls. The
   * mark carries distance from the middle rather than a score out of five,
   * because a spectrum has no top — so the middle is shaded rather than
   * ticked, and the two names sit under the ends they belong to.
   */
  function spectrumLine(current, options) {
    const settings = options || {};
    const line = el("div", "spectrum");
    line.style.setProperty("--trace", current.colourPaper);
    line.style.setProperty("--band", `${centreBand().toFixed(2)}%`);

    const track = el("div", "spectrum-track");
    const mark = el("span", "spectrum-mark");
    mark.style.setProperty("--at", `${placeOn(current.score).toFixed(2)}%`);
    track.append(el("span", "spectrum-centre"), mark);

    /*
     * The name, and under it two words for what the name means. A reader
     * meeting "The Gold" for the first time should not have to hold the
     * metaphor in their head to know which way the line runs.
     */
    const endName = (pole, className) => {
      const node = el("div", className);
      node.append(el("p", "spectrum-pole", pole.name), el("p", "spectrum-tag", pole.tag || ""));
      return node;
    };
    const ends = el("div", "spectrum-ends");
    ends.append(
      endName(current.poles.low, "spectrum-end"),
      el(
        "p",
        "spectrum-firmness",
        settings.firmness && current.firmness ? current.firmness.id : "",
      ),
      endName(current.poles.high, "spectrum-end spectrum-end-high"),
    );

    line.append(track, ends);
    return line;
  }

  /* --------------------------------------------------------- I: the watch */

  function buildWatchChapter() {
    const { node, body } = section("watch");
    body.appendChild(el("p", "chapter-intro", data.assessment.spectra.note));

    const board = el("div", "constellation");
    profile.currents.forEach((current) => {
      const row = el("article", "constellation-row");
      row.style.setProperty("--trace", current.colourPaper);
      const head = el("div", "constellation-head");
      head.append(
        el("h3", "current-title", current.name.toUpperCase()),
        el("p", "mark mark-sentence", current.axis),
        spectrumReadout(current),
      );
      row.append(head, spectrumLine(current, { firmness: true }));
      board.appendChild(row);
    });
    body.appendChild(board);
    body.appendChild(el("p", "record-statement", COPY.notATypeStatement));
    return node;
  }


  /* ------------------------------------------------- II: what the night moved */

  const PLOT_SIZE = 420;
  const PLOT_CENTRE = PLOT_SIZE / 2;
  const PLOT_RADIUS = 132;
  const PLOT_TRAVEL = 640;

  function plotPoint(index, count, ratio) {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      x: PLOT_CENTRE + Math.cos(angle) * PLOT_RADIUS * ratio,
      y: PLOT_CENTRE + Math.sin(angle) * PLOT_RADIUS * ratio,
    };
  }

  function plotPoints(ratios) {
    return ratios
      .map((ratio, index) => {
        const point = plotPoint(index, ratios.length, ratio);
        return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
      })
      .join(" ");
  }

  /*
   * The movement instrument. Five fixed axes, one fixed 1-to-5 scale, three
   * readings of the same night. Only the distance along each axis changes, so
   * a vertex can never travel anywhere but its own spoke.
   */
  function buildInstrument() {
    const ns = "http://www.w3.org/2000/svg";
    const copy = COPY.radar;
    const order = data.assessment.spectra.order;
    const steady = core.STEADY_CHANGE;

    const states = copy.states.map((entry) => {
      const phase = profile.phases.find((candidate) => candidate.id === entry.phase);
      return {
        ...entry,
        currents: order.map((id) => phase.currents.find((entry) => entry.id === id)),
      };
    });

    const wrap = el("div", "instrument");

    const switcher = el("div", "instrument-states");
    switcher.setAttribute("role", "tablist");
    switcher.setAttribute("aria-label", copy.heading);

    const plot = document.createElementNS(ns, "svg");
    plot.setAttribute("viewBox", `-30 -16 ${PLOT_SIZE + 60} ${PLOT_SIZE + 36}`);
    plot.setAttribute("class", "plot");
    plot.setAttribute("role", "img");

    // Rings are whole scale points; the centre is a reading of one, not zero.
    [2, 3, 4, 5].forEach((value) => {
      const ratio = (value - core.MIN_RESPONSE) / (core.MAX_RESPONSE - core.MIN_RESPONSE);
      const ring = document.createElementNS(ns, "polygon");
      ring.setAttribute("points", plotPoints(order.map(() => ratio)));
      ring.setAttribute("class", value === core.MAX_RESPONSE ? "plot-ring plot-ring-outer" : "plot-ring");
      plot.appendChild(ring);

      const tick = document.createElementNS(ns, "text");
      const top = plotPoint(0, order.length, ratio);
      tick.setAttribute("x", (top.x + 5).toFixed(1));
      tick.setAttribute("y", (top.y + 4).toFixed(1));
      tick.setAttribute("class", "plot-scale");
      tick.textContent = String(value);
      plot.appendChild(tick);
    });

    order.forEach((id, index) => {
      const outer = plotPoint(index, order.length, 1);
      const spoke = document.createElementNS(ns, "line");
      spoke.setAttribute("x1", String(PLOT_CENTRE));
      spoke.setAttribute("y1", String(PLOT_CENTRE));
      spoke.setAttribute("x2", outer.x.toFixed(1));
      spoke.setAttribute("y2", outer.y.toFixed(1));
      spoke.setAttribute("class", "plot-spoke");
      plot.appendChild(spoke);
    });

    const ghost = document.createElementNS(ns, "polygon");
    ghost.setAttribute("class", "plot-ghost");
    ghost.setAttribute("points", plotPoints(order.map(() => 0)));
    plot.appendChild(ghost);

    const shape = document.createElementNS(ns, "polygon");
    shape.setAttribute("class", "plot-shape");
    plot.appendChild(shape);

    const nodes = order.map((id, index) => {
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("r", "5.5");
      dot.setAttribute("class", "plot-node");
      dot.setAttribute("fill", data.assessment.spectra.currents[id].colourPaper);
      plot.appendChild(dot);
      return { id, index, node: dot };
    });

    order.forEach((id, index) => {
      const label = document.createElementNS(ns, "text");
      const anchor = plotPoint(index, order.length, 1.2);
      label.setAttribute("x", anchor.x.toFixed(1));
      label.setAttribute("y", anchor.y.toFixed(1));
      label.setAttribute("class", "plot-label");
      label.setAttribute(
        "text-anchor",
        Math.abs(anchor.x - PLOT_CENTRE) < 12 ? "middle" : anchor.x > PLOT_CENTRE ? "start" : "end",
      );
      label.textContent = data.assessment.spectra.currents[id].name.toUpperCase();
      plot.appendChild(label);
    });

    /* The readings, which are also the accessible table of the instrument. */
    const list = el("ul", "reading-list");
    const rows = {};
    order.forEach((id) => {
      const line = data.assessment.spectra.currents[id];
      const item = el("li");
      const row = el("button", "reading");
      row.type = "button";
      const tipId = `reading-${id}`;
      row.setAttribute("aria-describedby", tipId);

      const swatch = el("span", "reading-swatch");
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.setProperty("--trace", line.colourPaper);
      const name = el("span", "reading-name", line.name);
      const value = el("span", "reading-value", "—");
      const change = el("span", "reading-change", "");
      const tip = el("span", "reading-tip");
      tip.id = tipId;
      tip.setAttribute("role", "tooltip");

      row.append(swatch, name, value, change, tip);
      item.appendChild(row);
      list.appendChild(item);
      rows[id] = { value, change, tip };
    });

    let active = 0;
    let frame = 0;
    let plotted = states[0].currents.map((entry) => entry.normalised);

    const describe = (delta) => {
      if (delta === null) {
        return { text: "—", spoken: "first reading", steady: true };
      }
      if (Math.abs(delta) < steady) {
        return { text: copy.stableLabel, spoken: copy.stableLabel, steady: true };
      }
      return {
        text: signed(delta),
        spoken: `${delta > 0 ? "up" : "down"} ${Math.abs(delta).toFixed(2)}`,
        steady: false,
      };
    };

    const paint = (ratios) => {
      shape.setAttribute("points", plotPoints(ratios));
      nodes.forEach((entry, index) => {
        const point = plotPoint(index, ratios.length, ratios[index]);
        entry.node.setAttribute("cx", point.x.toFixed(1));
        entry.node.setAttribute("cy", point.y.toFixed(1));
      });
    };

    const travel = (target) => {
      window.cancelAnimationFrame(frame);
      if (stillMotion()) {
        plotted = target.slice();
        paint(plotted);
        return;
      }
      const from = plotted.slice();
      const began = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - began) / PLOT_TRAVEL);
        const eased = 1 - Math.pow(1 - progress, 3);
        plotted = from.map((value, index) => value + (target[index] - value) * eased);
        paint(plotted);
        if (progress < 1) {
          frame = window.requestAnimationFrame(step);
        }
      };
      frame = window.requestAnimationFrame(step);
    };

    const show = (index, options) => {
      const settings = options || {};
      active = Math.max(0, Math.min(index, states.length - 1));
      const stateAt = states[active];
      const earlier = active > 0 ? states[active - 1] : null;

      switcher.querySelectorAll(".instrument-state").forEach((button, position) => {
        const selected = position === active;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
      });

      ghost.setAttribute(
        "points",
        earlier
          ? plotPoints(earlier.currents.map((entry) => entry.normalised))
          : plotPoints(stateAt.currents.map(() => 0)),
      );
      ghost.style.opacity = earlier ? "1" : "0";

      stateAt.currents.forEach((entry, index) => {
        const before = earlier ? earlier.currents[index].score : null;
        const delta = before === null ? null : entry.score - before;
        const change = describe(delta);
        const row = rows[entry.id];
        row.value.textContent = outOf(entry.score);
        row.change.textContent = change.text;
        row.change.dataset.steady = String(change.steady);
        const named = entry.name;
        row.tip.textContent = earlier
          ? `${named}: ${reading(entry.score)} of ${core.MAX_RESPONSE}, ${change.spoken} from ${earlier.label} (${reading(before)}).`
          : `${named}: ${reading(entry.score)} of ${core.MAX_RESPONSE} at ${stateAt.label}.`;
      });

      plot.setAttribute(
        "aria-label",
        `${copy.heading}. ${stateAt.label}. Each current reads from one to five. ${stateAt.currents
          .map((entry) => `${entry.name} ${reading(entry.score)}`)
          .join(". ")}.`,
      );

      travel(stateAt.currents.map((entry) => entry.normalised));
      if (settings.announce) {
        say(
          `${stateAt.label}. ${stateAt.currents.map((entry) => `${entry.name} ${reading(entry.score)}`).join(", ")}.`,
        );
      }
    };

    states.forEach((entry, index) => {
      const button = el("button", "instrument-state", entry.label);
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(index === 0));
      button.tabIndex = index === 0 ? 0 : -1;
      button.addEventListener("click", () => show(index, { announce: true }));
      button.addEventListener("keydown", (event) => {
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) {
          return;
        }
        event.preventDefault();
        const next = (index + step + states.length) % states.length;
        show(next, { announce: true });
        switcher.querySelectorAll(".instrument-state")[next].focus();
      });
      switcher.appendChild(button);
    });

    const plotWrap = el("div", "instrument-plot");
    plotWrap.append(plot, list);
    wrap.append(switcher, plotWrap, el("p", "mark mark-sentence", copy.note));

    paint(plotted);
    show(0);
    return wrap;
  }

  function buildShiftChapter() {
    const { node, body } = section("shift");
    body.appendChild(el("p", "chapter-intro", COPY.shiftIntro));
    body.appendChild(buildInstrument());

    // The observations worth keeping: what rose, what fell, what held.
    const baseline = profile.phases[0];
    const pressure = profile.phases[1];
    const recovery = profile.phases[2];
    const intoPressure = core.compareCurrents(data, baseline, pressure);
    const outOfPressure = core.compareCurrents(data, pressure, recovery);

    const notes = el("div", "chapter-body");
    notes.appendChild(el("p", "mark", LABELS.observations));

    const observations = [];
    if (intoPressure.stable && outOfPressure.stable) {
      observations.push(COPY.shiftStableCopy);
    } else {
      observations.push(summary.adaptation);
    }
    const returned = core.describeReturn(data, profile);
    if (returned && COPY.returnCopy[returned]) {
      observations.push(COPY.returnCopy[returned]);
    }
    observations.forEach((copy) => {
      notes.appendChild(el("p", "chapter-intro", copy));
    });
    body.appendChild(notes);

    /*
     * Then all five, named, including the ones that held. The chapter used to
     * report only the reading that travelled furthest, which left four of the
     * five unaccounted for on the page about what the night did to them — and
     * a line that did not move is a finding as much as one that swung.
     */
    const movement = el("div", "guidance-block");
    movement.appendChild(el("p", "mark", COPY.movementHeading));
    const list = el("div", "movement-list");
    core.movementPerCurrent(data, profile).forEach((entry) => {
      const row = el("p", "movement-row");
      row.style.setProperty("--trace", entry.colourPaper);
      row.append(
        el("span", "movement-name", entry.name),
        el("span", "", ` ${entry.copy}`),
      );
      list.appendChild(row);
    });
    movement.appendChild(list);
    body.appendChild(movement);

    return node;
  }

  /* -------------------------------------------------- III: the five currents */


  /* ------------------------------------------------ IV: reading each current */

  /*
   * Five full pages of writing in one chapter is more than a reader will scroll
   * through to reach the fifth. The five are switched rather than stacked, on a
   * rail that names each line in its own colour so the choice is the reading
   * rather than a number — and everything stays inside Section III, because
   * these are one section's worth of material and not five chapters.
   */
  function buildDetailSwitcher(pages) {
    const rail = el("div", "current-rail");
    rail.setAttribute("role", "tablist");
    rail.setAttribute("aria-label", chapter("detail").title);

    const tabs = pages.map(({ current, page }, index) => {
      const tab = el("button", "current-tab");
      tab.type = "button";
      tab.id = `tab-current-${current.id}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", page.id);
      tab.style.setProperty("--trace", current.colourPaper);
      tab.append(
        el("span", "current-tab-name", current.name.toUpperCase()),
        // Blank inside the middle band, for the same reason the readout is.
        el("span", "current-tab-pole", poleNameFor(current)),
      );
      page.setAttribute("role", "tabpanel");
      page.setAttribute("aria-labelledby", tab.id);
      page.tabIndex = -1;
      tab.addEventListener("click", () => show(index));
      rail.appendChild(tab);
      return tab;
    });

    function show(index, options) {
      const to = Math.max(0, Math.min(index, pages.length - 1));
      pages.forEach(({ page }, at) => {
        page.hidden = at !== to;
      });
      tabs.forEach((tab, at) => {
        tab.setAttribute("aria-selected", String(at === to));
        tab.tabIndex = at === to ? 0 : -1;
      });
      if (options && options.silent) {
        return;
      }
      if (options && options.reveal) {
        /*
         * Back to the top of the chapter, not the top of the page and not the
         * top of this rail — a reader who has just switched current wants the
         * section heading and the switcher both in view, and the chapter rail
         * is sticky, so its height comes off the target or the heading arrives
         * underneath it.
         */
        const chapterNode = rail.closest(".chapter");
        const pager = document.querySelector(".pager-rail");
        const top = chapterNode.getBoundingClientRect().top + window.scrollY;
        const clearance = pager ? pager.getBoundingClientRect().height + 8 : 0;
        window.scrollTo({
          top: Math.max(0, Math.round(top - clearance)),
          behavior: stillMotion() ? "auto" : "smooth",
        });
      }
      say(`${pages[to].current.name}. ${to + 1} of ${pages.length}.`);
    }

    /*
     * A step to the current before and the current after, under the writing
     * rather than above it. The rail at the top of the chapter is easy to
     * scroll past and easier still to finish a page without ever looking back
     * at, so the next one is offered where the reader actually finishes.
     */
    pages.forEach(({ page }, index) => {
      const foot = el("nav", "current-step");
      foot.setAttribute("aria-label", chapter("detail").title);
      [
        ["previous", (index - 1 + pages.length) % pages.length, "‹"],
        ["next", (index + 1) % pages.length, "›"],
      ].forEach(([side, target, arrow]) => {
        const other = pages[target].current;
        const button = el("button", `current-step-link current-step-${side}`);
        button.type = "button";
        button.style.setProperty("--trace", other.colourPaper);
        const label = side === "previous" ? `${arrow} ${other.name}` : `${other.name} ${arrow}`;
        button.append(
          el("span", "current-step-name", label),
          el("span", "current-step-pole", poleNameFor(other)),
        );
        button.addEventListener("click", () => show(target, { reveal: true }));
        foot.appendChild(button);
      });
      page.appendChild(foot);
    });

    /*
     * Arrow keys move between the five, as they do on the chapter rail. The
     * switcher is a tablist, and a tablist a keyboard cannot cross is a set of
     * five panels four of which are unreachable.
     */
    rail.addEventListener("keydown", (event) => {
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!step) {
        return;
      }
      event.preventDefault();
      const at = tabs.indexOf(document.activeElement);
      const to = (Math.max(0, at) + step + tabs.length) % tabs.length;
      show(to);
      tabs[to].focus();
    });

    show(0, { silent: true });
    return rail;
  }

  function buildDetailChapter() {
    const { node, body } = section("detail");
    body.appendChild(el("p", "chapter-intro", COPY.detailIntro));

    const pages = [];
    profile.currents.forEach((current) => {
      const page = el("article", "current");
      page.id = `current-${current.id}`;
      page.style.setProperty("--trace", current.colourPaper);

      const head = el("div", "current-head");
      head.append(
        el("h3", "current-title", current.name.toUpperCase()),
        el("p", "mark mark-sentence", current.axis),
        spectrumReadout(current),
      );
      page.append(head, spectrumLine(current, { firmness: true }));

      const say = (label, copy, className) => {
        const block = el("div", className || "guidance-block");
        block.append(el("p", "mark", label), el("p", "", copy));
        page.appendChild(block);
      };

      say(LABELS.look, current.pole.look);

      /*
       * How this current came to be read the way it is. Only written for a
       * reading in the middle, where the finding is the range itself and
       * whether pressure produced it is the whole of what there is to say.
       */
      const movement = current.situational
        ? core.middleMovementFor(data, profile, current.id)
        : null;
      if (movement) {
        say(LABELS.underPressure, movement.copy);
      }

      /*
       * The facet lines are where a mid reading earns its keep: a domain built
       * from three readings that disagree is a different person from one built
       * from three that agree, and the average alone cannot tell them apart.
       *
       * Each is drawn the way the current above it is — a name at each end and
       * a mark between them. Printed as "4.8 / 5" they read as three scores
       * with a maximum, which is the one thing a bipolar reading is not.
       */
      const divides = el("div", "guidance-block");
      divides.appendChild(el("p", "mark", LABELS.divides));
      const facets = el("div", "facet-set");
      /*
       * The facet's own name is gone. "Anxiety", "Depression" and "Emotional
       * Volatility" were the labels a clinical inventory gives its subscales,
       * and both ends of each line are now named in the reader's own terms —
       * Risk-Tolerant to Risk-Sensitive says what the line measures without
       * telling the reader which end is the disorder.
       */
      current.facets.forEach((facet) => {
        const row = el("div", "facet-row");
        const track = el("div", "spectrum-track facet-track");
        const mark = el("span", "spectrum-mark");
        mark.style.setProperty("--at", `${(facet.normalised * 100).toFixed(1)}%`);
        track.append(el("span", "spectrum-centre"), mark);
        const ends = el("div", "spectrum-ends facet-ends");
        ends.append(
          el("p", "spectrum-pole", facet.poles ? facet.poles.low : ""),
          el("p", "spectrum-firmness", ""),
          el("p", "spectrum-pole spectrum-pole-high", facet.poles ? facet.poles.high : ""),
        );
        row.append(track, ends);
        facets.appendChild(row);
      });
      divides.append(facets, el("p", "", current.divergence.copy));
      page.appendChild(divides);

      say(LABELS.misread, current.pole.misread);
      say(LABELS.advantage, current.guidance.advantage);
      /*
       * The watch-for is written for the end this reading was taken at, not
       * for the third of the scale it falls in. The band version described
       * The Blade and The Ore with the same sentence, which is the flattening
       * that naming both ends was supposed to remove.
       */
      say(LABELS.overextension, current.pole.watchFor);
      if (current.firmness) {
        say(LABELS.firmness, current.firmness.copy);
      }

      /*
       * What this current asks of the other four belongs to Section IV, which
       * reads the whole cycle at once. Printing it here as well said the same
       * thing twice, once without the other side of the relationship.
       */
      // The action, likewise written for the end rather than for the band.
      say(LABELS.action, current.pole.action);
      say(LABELS.tryThis, current.guidance.reflection);
      pages.push({ current, page });
    });

    body.append(buildDetailSwitcher(pages), ...pages.map((entry) => entry.page));
    return node;
  }

  /* ------------------------------------------------- IV: what holds what */

  /*
   * The cycle read inward. Each current feeds one of your own and holds
   * another in check, which is what makes five readings a system rather than
   * five separate bars. It suggests, and never rates.
   */
  /*
   * Pointing at a current picks out the two edges it is on: the one it feeds
   * along and the one it restrains along. Everything else stays drawn — the
   * whole cycle is the subject, and this only says which part of it you are
   * asking about.
   *
   * Keyboard and pointer both, because the nodes are the only way into this
   * and a figure a keyboard cannot enter is a figure half the readers do not
   * have. Focus is what the CSS keys on, so the two paths cannot drift.
   */
  function wireCycleFocus(figure, blocks) {
    const svg = figure.querySelector("svg");
    if (!svg) {
      return;
    }
    const nodes = [...svg.querySelectorAll("[data-current]")];
    const set = (id) => {
      svg.dataset.focus = id || "";
      blocks.forEach((block, key) => {
        block.dataset.focus = String(Boolean(id) && key === id);
      });
    };

    nodes.forEach((node) => {
      const id = node.dataset.current;
      node.addEventListener("pointerenter", () => set(id));
      node.addEventListener("focus", () => set(id));
      node.addEventListener("blur", () => set(null));
      /*
       * Scroll the block into view on activation rather than on hover: a
       * figure that moves the page as the pointer crosses it is unusable.
       */
      node.addEventListener("click", () => {
        const block = blocks.get(id);
        if (block) {
          block.scrollIntoView({ block: "center", behavior: stillMotion() ? "auto" : "smooth" });
        }
      });
    });
    svg.addEventListener("pointerleave", () => set(null));
  }

  function buildRelationsChapter() {
    const { node, body } = section("relations");
    const labels = COPY.relationsLabels;
    body.appendChild(el("p", "chapter-intro", COPY.relationsIntro));

    /*
     * No current is the subject of this chapter. The figure used to fill the
     * one furthest from the middle and read the cycle outward from it, which
     * announced a leading element in a report that has none; every node now
     * carries its own reading and the cycle is drawn whole.
     */
    const reach = core.situationalReach(data);
    const figure = el("div", "relations-figure");
    if (art) {
      const nodes = data.assessment.cycles.generating.map((elementId) => {
        const element = data.assessment.elements[elementId];
        const entry = currentById(element.current);
        const distance = entry ? Math.abs(entry.magnitude) : 0;
        return {
          id: element.current,
          label: entry ? entry.name : element.name,
          colour: entry ? entry.colourPaper : null,
          weight: distance / (profile.scaleMax - core.CENTRE),
          filled: distance >= reach,
        };
      });
      figure.appendChild(art.elementCycle(nodes));
    }
    const key = el("p", "mark relations-key");
    key.append(
      el("span", "", labels.cycleGenerating),
      el("span", "", labels.cycleControlling),
    );
    figure.append(
      key,
      el("p", "mark mark-sentence relations-hint", COPY.relationsHint),
      el("p", "mark mark-sentence", COPY.relationsNote),
    );
    body.appendChild(figure);

    const excess = COPY.relationsExcess;
    const grid = el("div", "relations-grid");
    const blocks = new Map();

    profile.currents.forEach((current) => {
      const relations = current.relations || {};
      const feeds = relations.supports;
      const checks = relations.checks;
      const element = core.elementForCurrent(data, current.id);
      const block = el("article", "relations-block");
      block.id = `relations-${current.id}`;
      block.style.setProperty("--trace", current.colourPaper);
      block.append(
        el("h3", "current-title", current.name.toUpperCase()),
        // The end and the distance, written the way Section I writes them, so
        // no chapter claims a pole another chapter says was not taken.
        spectrumReadout(current),
        el("p", "mark", `${labels.supports} ${feeds ? feeds.name : ""} · ${labels.checks} ${checks ? checks.name : ""}`),
        el("p", "", current.pole.supports),
        el("p", "", current.pole.checks),
      );

      /*
       * And what happens when either relationship runs long. The report only
       * ever described the working direction, which reads as though more
       * feeding were always better and more checking always safer. In the
       * cycle these have the same shape and opposite failures: what you feed
       * without limit drains you, and what you restrain without limit stops
       * working at all.
       */
      if (element && element.excess) {
        const runs = el("div", "relations-excess");
        /*
         * Only the two this current does, not the two done to it. Every edge
         * appears twice in a five-element cycle — Wood being fed too hard by
         * Water is the same edge as Water feeding too hard — so printing all
         * four per current said each of the ten edges twice under two headings
         * and made twenty blocks out of ten findings.
         */
        [
          [excess.feeding, element.excess.feeding],
          [excess.checking, element.excess.checking],
        ].forEach(([label, copy]) => {
          const line = el("div", "relations-excess-line");
          line.append(el("p", "mark", label), el("p", "", copy));
          runs.appendChild(line);
        });
        block.appendChild(runs);
      }

      blocks.set(current.id, block);
      grid.appendChild(block);
    });
    body.appendChild(grid);

    if (art) {
      wireCycleFocus(figure, blocks);
    }

    return node;
  }

  /* ------------------------------------------------------- V: calibration */

  /*
   * How much weight the other five sections can carry. Because every domain
   * runs six forward and six reverse statements, a reader with no answering
   * habit centres on the middle of the scale — so a lean away from it is a
   * habit rather than a tendency, and worth saying out loud.
   */
  function buildCalibrationChapter() {
    const { node, body } = section("calibration");
    const copy = COPY.calibration;
    const style = profile.responseStyle;
    body.appendChild(el("p", "chapter-intro", copy.intro));

    if (style) {
      const scale = el("div", "guidance-block");
      scale.appendChild(el("p", "mark", copy.scaleHeading));

      /*
       * The sixty answers counted onto the five points they were given on.
       * Every figure below this is a summary of this one shape, and a flat
       * spread, a lean and a pile in the middle are three different ways of
       * answering that the same three sentences describe identically.
       */
      const chart = el("div", "response-chart");
      const labels = core.responseLabels(data);
      const tallest = Math.max(...style.distribution.map((entry) => entry.count), 1);
      style.distribution.forEach((entry) => {
        const column = el("div", "response-column");
        column.style.setProperty("--fill", `${((entry.count / tallest) * 100).toFixed(1)}%`);
        column.append(
          el("p", "response-count", String(entry.count)),
          el("span", "response-bar"),
          el("p", "response-point", String(entry.value)),
          el("p", "response-label", labels[entry.value - 1] || ""),
        );
        chart.appendChild(column);
      });
      scale.append(chart, el("p", "mark mark-sentence", copy.chartNote));

      const table = el("div", "calibration-table");
      [
        [copy.labels.balance, style.balance.value.toFixed(2), style.balance.copy],
        [copy.labels.ends, `${Math.round(style.ends.share * 100)}%`, style.ends.copy],
        [
          copy.labels.middle,
          `${Math.round(style.middle.share * 100)}%`,
          style.middle.copy || "",
        ],
        [
          copy.labels.agreement,
          `${style.agreement.held} / ${style.agreement.total}`,
          style.agreement.copy,
        ],
      ].forEach(([label, value, note]) => {
        const row = el("div", "calibration-row");
        row.append(
          el("p", "reading-name", label),
          el("p", "facet-value", value),
          el("p", "", note),
        );
        table.appendChild(row);
      });
      scale.appendChild(table);
      body.appendChild(scale);
    }

    /*
     * The third column used to hold the pole name, which is blank for any
     * reading in the middle — on a record where several sit there the table
     * was a column of dashes. It carries what the firmness actually means for
     * that line instead, which is the thing this section exists to say and is
     * never empty.
     */
    const firm = el("div", "guidance-block");
    firm.appendChild(el("p", "mark", copy.firmnessHeading));
    const index = el("div", "calibration-table");
    profile.currents.forEach((current) => {
      const row = el("div", "calibration-row");
      row.style.setProperty("--trace", current.colourPaper);
      row.append(
        el("p", "reading-name", current.name),
        el("p", "facet-value", current.firmness ? current.firmness.id : "—"),
        el("p", "", current.firmness ? current.firmness.copy : ""),
      );
      index.appendChild(row);
    });
    firm.appendChild(index);
    body.appendChild(firm);

    return node;
  }

  /* --------------------------------------------------------- VI: handover */

  function buildCloseChapter() {
    const { node, body } = section("close");

    /*
     * The question first, at the weight a closing question deserves, then the
     * standing note under it. The section ran reflection, four buttons and
     * then eight paragraphs of back matter in one undifferentiated column, so
     * the last thing the reader was asked sat in the same type as the licence.
     */
    const reflection = el("div", "handover");
    reflection.append(
      el("p", "mark", LABELS.reflection),
      el("p", "handover-question", summary.reflection),
      el("p", "record-statement", COPY.notATypeStatement),
    );
    body.appendChild(reflection);

    const actions = el("div", "close-actions");
    if (pdf) {
      actions.append(
        exportButton(COPY.actions.profilePdf, "action", () =>
          pdf.downloadProfile(data, state, core),
        ),
        exportButton(COPY.actions.storyPdf, "action action-quiet", () =>
          pdf.downloadStory(data, state, core),
        ),
      );
    }
    const back = el("a", "action action-quiet", COPY.actions.returnToStory);
    back.href = "./index.html";
    actions.appendChild(back);

    const restart = el("button", "action action-quiet", COPY.actions.restart);
    restart.type = "button";
    restart.addEventListener("click", () => {
      if (!window.confirm(COPY.restartConfirm)) {
        return;
      }
      core.clearJourney(storage);
      window.location.replace("./index.html");
    });
    actions.appendChild(restart);
    body.appendChild(actions);

    /*
     * The back matter. The five domain names appear here and nowhere else in
     * the report: the reading is carried entirely by the currents, and the
     * credit has to stay attached to something the reader can look up.
     */
    const record = COPY.record;
    const colophon = el("div", "colophon");
    colophon.append(el("p", "mark", record.eyebrow), el("h3", "current-title", record.title));
    [
      [record.whatHeading, data.assessment.methodNote],
      [record.notHeading, `${data.instrument.status}. ${data.instrument.statusNote} ${record.limitations}`],
      [record.structureHeading, `${data.instrument.attribution} ${record.mapping}`],
    ].forEach(([label, copy]) => {
      const block = el("div", "guidance-block");
      block.append(el("p", "mark", label), el("p", "", copy));
      colophon.appendChild(block);
    });
    [
      COPY.disclaimer,
      data.instrument.permission,
      data.assessment.bandNote,
      data.assessment.phaseNote,
      COPY.privacy,
    ].forEach((line) => colophon.appendChild(el("p", "", line)));

    const link = el("a", "", "The structure this is built on, at the Colby Personality Lab");
    link.href = data.instrument.reference;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    colophon.appendChild(link);
    body.appendChild(colophon);

    return node;
  }

  /* ------------------------------------------------------------ VI: closing */

  function exportButton(label, className, run) {
    const button = el("button", className, label);
    button.type = "button";
    button.addEventListener("click", async () => {
      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Preparing";
      try {
        await run();
        say(`${label} complete.`);
      } catch {
        say(`${label} could not be prepared.`);
      } finally {
        button.textContent = original;
        button.disabled = false;
      }
    });
    return button;
  }


  /* ---------------------------------------------------------- the masthead */

  /*
   * Front matter: how to read a line that has a name at both ends. It stays
   * outside the pager so it is read once, before the first chapter, and it
   * interprets no data — every reading belongs to the chapter that owns it.
   */
  /*
   * The standing notice, set as a named section rather than as loose copy
   * above the pager. It is not chapter zero — it carries no numeral, and it
   * stays on screen whichever chapter is open — but it is composed like one,
   * so its eyebrow and title line up with every heading below it instead of
   * sitting centred in a column of their own.
   */
  function buildOrientation() {
    const copy = COPY.orientation;
    const node = el("section", "chapter orientation");
    node.id = "orientation";
    const head = el("div", "chapter-head");
    head.append(el("p", "mark", copy.eyebrow), el("h2", "chapter-title", copy.title));
    const body = el("div", "chapter-body orientation-body");
    core.splitParagraphs(copy.body).forEach((line) => {
      body.appendChild(el("p", "", line));
    });
    node.append(head, body);
    return node;
  }

  function buildMasthead() {
    const masthead = el("header", "report-masthead");
    const meta = el("div", "report-meta");
    meta.append(
      el("p", "mark", COPY.eyebrow),
      el("p", "mark", `RECORDED ${completedOn()}`),
      el("p", "mark", COPY.classification),
    );
    masthead.append(
      meta,
      el("h1", "report-title", COPY.heading),
      el("p", "report-owner", profile.playerName),
      el("p", "report-standfirst", COPY.openingBody),
    );
    return masthead;
  }

  /* ----------------------------------------------------------------- boot */

  /* ------------------------------------------------------------- the pager */

  /*
   * The report is long, and reading it as one column asks the reader to hold
   * five chapters at once. It is still one document — every chapter is built
   * and stays in the page — but only one is shown, so the record arrives a
   * piece at a time. The chapter is in the address, so a chapter can be
   * returned to, linked and stepped through with the browser's own buttons.
   */
  function buildPager(chapters) {
    const rail = el("div", "pager-rail");
    rail.setAttribute("role", "tablist");
    rail.setAttribute("aria-label", "Report chapters");

    const foot = el("div", "pager-foot");
    const previous = el("button", "control", COPY.pager.previous);
    const next = el("button", "control", COPY.pager.next);
    const position = el("p", "mark pager-position", "");
    [previous, next].forEach((button) => {
      button.type = "button";
    });
    foot.append(previous, position, next);

    const tabs = chapters.map((chapter, index) => {
      const copy = COPY.chapters[index];
      const tab = el("button", "pager-tab");
      tab.type = "button";
      tab.id = `tab-${copy.id}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", chapter.id);
      // The chapter index is a Roman numeral, so it is never zero-padded.
      tab.append(
        el("span", "pager-tab-index", String(copy.index)),
        el("span", "pager-tab-title", copy.title),
      );
      tab.addEventListener("click", () => show(index));
      rail.appendChild(tab);
      chapter.setAttribute("role", "tabpanel");
      chapter.setAttribute("aria-labelledby", tab.id);
      chapter.tabIndex = -1;
      return tab;
    });

    rail.addEventListener("keydown", (event) => {
      const step =
        event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!step) {
        return;
      }
      event.preventDefault();
      const at = tabs.indexOf(document.activeElement);
      const to = (Math.max(0, at) + step + tabs.length) % tabs.length;
      show(to);
      tabs[to].focus();
    });

    let current = -1;

    function show(index, options) {
      const to = Math.max(0, Math.min(index, chapters.length - 1));
      if (to === current) {
        return;
      }
      current = to;
      chapters.forEach((chapter, at) => {
        chapter.hidden = at !== to;
      });
      tabs.forEach((tab, at) => {
        tab.setAttribute("aria-selected", String(at === to));
        tab.tabIndex = at === to ? 0 : -1;
      });
      previous.disabled = to === 0;
      next.disabled = to === chapters.length - 1;
      position.textContent = COPY.pager.position
        .replace("{index}", String(to + 1))
        .replace("{total}", String(chapters.length));

      const id = COPY.chapters[to].id;
      if (!options || options.pushHash !== false) {
        const url = `${window.location.pathname}#${id}`;
        if (window.location.hash.replace("#", "") !== id) {
          window.history.pushState({ chapter: id }, "", url);
        }
      }
      if (options && options.silent) {
        return;
      }
      // Land on the chapter that was asked for, not on the top of the report.
      // The rail is sticky, so its own height has to come off the target or
      // the section head arrives underneath it.
      const head = chapters[to].getBoundingClientRect().top + window.scrollY;
      const clearance = rail.getBoundingClientRect().height + 8;
      window.scrollTo({ top: Math.max(0, Math.round(head - clearance)), behavior: "auto" });
      chapters[to].focus({ preventScroll: true });
      say(`${COPY.chapters[to].title}. Chapter ${to + 1} of ${chapters.length}.`);
    }

    previous.addEventListener("click", () => show(current - 1));
    next.addEventListener("click", () => show(current + 1));
    window.addEventListener("popstate", () => {
      show(indexForHash(), { pushHash: false });
    });

    function indexForHash() {
      // Both "#role" and the element's own "#chapter-role" resolve, so links
      // written against either shape land on the same chapter.
      const id = window.location.hash.replace(/^#(chapter-)?/, "");
      const at = COPY.chapters.findIndex((entry) => entry.id === id);
      return at < 0 ? 0 : at;
    }

    show(indexForHash(), { pushHash: false, silent: true });
    return [rail, ...chapters, foot];
  }

  function boot() {
    if (!data || !core) {
      shell.replaceChildren(el("p", "loading-note", "Aurora Station could not load its record."));
      return;
    }

    state = core.loadState(data, storage);
    profile = core.scoreProfile(data, state);
    if (!profile || !state.participant.name) {
      window.location.replace("./index.html");
      return;
    }
    summary = core.summariseProfile(data, profile);

    if (art) {
      document.body.appendChild(art.grainOverlay());
    }

    const chapters = [
      buildWatchChapter(),
      buildShiftChapter(),
      buildDetailChapter(),
      buildRelationsChapter(),
      buildCalibrationChapter(),
      buildCloseChapter(),
    ];
    shell.replaceChildren(buildMasthead(), buildOrientation(), ...buildPager(chapters));

    document.title = `${profile.playerName} — Observation Report`;
    say("The observation report is ready.");
  }

  boot();
})();
