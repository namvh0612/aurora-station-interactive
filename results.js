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

  function fileName(value) {
    const safe = String(value || "Watchkeeper")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48);
    return safe || "Watchkeeper";
  }

  function completedOn() {
    const stamp = Number(state.completedAt);
    const date = Number.isFinite(stamp) && stamp > 0 ? new Date(stamp) : new Date();
    return date
      .toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
      .toUpperCase();
  }

  function roleFor(id) {
    return profile.roles.find((role) => role.id === id);
  }

  function domainFor(code) {
    return profile.domains.find((domain) => domain.code === code);
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

  /* ----------------------------------------------------------- I: contribution */

  function buildRoleChapter() {
    const { node, body } = section("role");
    const lead = summary.overall;
    const primary = lead.primary;

    const lede = el("div", "role-lede");

    const left = el("div");
    left.append(
      el("p", "mark", COPY.roleIntro),
      el("h3", "role-name", lead.isBlend ? lead.label : primary.name),
      el("p", "mark role-basis", `${LABELS.basis} · ${primary.basis}`),
      el("p", "role-statement", COPY.notATypeStatement),
    );

    // Why, described without exposing any mechanism.
    const why = data.assessment.whyTemplates;
    const reasons = [];
    reasons.push(
      lead.isBlend
        ? why.blend.replace("{roles}", lead.label)
        : why.single.replace("{role}", primary.name),
    );
    const supported = primary.facetFloor >= primary.score - 0.6;
    reasons.push(supported ? why.supported : why.uneven);
    left.appendChild(el("p", "role-why", reasons.join(" ")));

    const right = el("div");
    if (art) {
      const dial = art.instrumentDial(primary.normalised, primary.colour, primary.name);
      dial.style.setProperty("--trace", primary.colour);
      right.appendChild(dial);
    }
    const instrument = data.assessment.instruments[primary.domain];
    right.append(
      el("p", "mark", `${LABELS.instrument} · ${instrument.name.toUpperCase()}`),
      el("p", "mark", instrument.reads),
    );

    lede.append(left, right);
    body.appendChild(lede);

    const lines = el("div", "role-lines");
    [
      [LABELS.missionFunction, primary.missionFunction],
      [LABELS.brings, primary.brings],
      [LABELS.watchFor, primary.watchFor],
      [LABELS.action, `${primary.actionTitle} — ${primary.action}`],
    ].forEach(([label, copy]) => {
      const line = el("div", "role-line");
      line.append(el("p", "mark", label), el("p", "", copy));
      lines.appendChild(line);
    });
    body.appendChild(lines);

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
    const order = data.assessment.roleOrder;
    const steady = data.assessment.suitability.stableChange;

    const states = copy.states.map((entry) => {
      const phase = profile.phases.find((candidate) => candidate.id === entry.phase);
      return { ...entry, roles: order.map((id) => phase.roles.find((role) => role.id === id)) };
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
      dot.setAttribute("fill", data.assessment.roles[id].colour);
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
      label.textContent = data.assessment.roles[id].shortName;
      plot.appendChild(label);
    });

    /* The readings, which are also the accessible table of the instrument. */
    const list = el("ul", "reading-list");
    const rows = {};
    order.forEach((id) => {
      const role = data.assessment.roles[id];
      const item = el("li");
      const row = el("button", "reading");
      row.type = "button";
      const tipId = `reading-${id}`;
      row.setAttribute("aria-describedby", tipId);

      const swatch = el("span", "reading-swatch");
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.setProperty("--trace", role.colour);
      const name = el("span", "reading-name", role.shortName);
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
    let current = states[0].roles.map((role) => role.normalised);

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
        current = target.slice();
        paint(current);
        return;
      }
      const from = current.slice();
      const began = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - began) / PLOT_TRAVEL);
        const eased = 1 - Math.pow(1 - progress, 3);
        current = from.map((value, index) => value + (target[index] - value) * eased);
        paint(current);
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
          ? plotPoints(earlier.roles.map((role) => role.normalised))
          : plotPoints(stateAt.roles.map(() => 0)),
      );
      ghost.style.opacity = earlier ? "1" : "0";

      stateAt.roles.forEach((role, index) => {
        const before = earlier ? earlier.roles[index].score : null;
        const delta = before === null ? null : role.score - before;
        const change = describe(delta);
        const row = rows[role.id];
        row.value.textContent = outOf(role.score);
        row.change.textContent = change.text;
        row.change.dataset.steady = String(change.steady);
        row.tip.textContent = earlier
          ? `${role.name}: ${reading(role.score)} of ${core.MAX_RESPONSE}, ${change.spoken} from ${earlier.label} (${reading(before)}).`
          : `${role.name}: ${reading(role.score)} of ${core.MAX_RESPONSE} at ${stateAt.label}.`;
      });

      plot.setAttribute(
        "aria-label",
        `${copy.heading}. ${stateAt.label}. Each contribution reads from one to five. ${stateAt.roles
          .map((role) => `${role.shortName} ${reading(role.score)}`)
          .join(". ")}.`,
      );

      travel(stateAt.roles.map((role) => role.normalised));
      if (settings.announce) {
        say(`${stateAt.label}. ${stateAt.roles.map((role) => `${role.shortName} ${reading(role.score)}`).join(", ")}.`);
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
    wrap.append(switcher, plotWrap, el("p", "mark", copy.note));

    paint(current);
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
    const intoPressure = core.compareRoles(data, baseline, pressure);
    const outOfPressure = core.compareRoles(data, pressure, recovery);

    const notes = el("div", "chapter-body");
    notes.appendChild(el("p", "mark", LABELS.observations));

    const observations = [];
    if (intoPressure.stable && outOfPressure.stable) {
      observations.push(COPY.shiftStableCopy);
    } else {
      observations.push(summary.adaptation);
    }
    const returned = core.describeReturn(data, profile);
    if (returned) {
      observations.push(
        returned === "returned"
          ? "By the closing Acts the pattern had come back towards the one you began with."
          : returned === "retained"
            ? "By the closing Acts the pattern still sat nearer the pressure reading than the one you began with."
            : "By the closing Acts the pattern had settled somewhere that matches neither the opening nor the worst of it.",
      );
    }
    observations.forEach((copy) => {
      notes.appendChild(el("p", "chapter-intro", copy));
    });
    body.appendChild(notes);

    return node;
  }

  /* -------------------------------------------------- III: the five currents */

  function buildCurrentsChapter() {
    const { node, body } = section("currents");
    body.appendChild(el("p", "chapter-intro", COPY.currentsIntro));

    profile.domains.forEach((domain) => {
      const role = profile.roles.find((entry) => entry.domain === domain.code);
      const row = el("article", "spectrum");
      row.style.setProperty("--trace", role.colour);

      const left = el("div");
      left.append(
        el("h3", "spectrum-name", domain.name),
        el("p", "spectrum-reading", outOf(domain.score)),
        el("p", "mark", domain.bandLabel),
      );

      const right = el("div");
      const track = el("div", "spectrum-track");
      track.setAttribute("role", "img");
      track.setAttribute(
        "aria-label",
        `${domain.name}: ${reading(domain.score)} out of ${core.MAX_RESPONSE}, ${domain.bandLabel}`,
      );
      track.appendChild(el("span", "spectrum-centre"));
      const marker = el("span", "spectrum-node");
      marker.style.left = `${domain.normalised * 100}%`;
      track.appendChild(marker);

      const poles = el("div", "spectrum-poles");
      poles.append(
        el("p", "mark", data.assessment.instruments[domain.code].reads),
        el("p", "mark", `${role.shortName} · ${outOf(role.score)}`),
      );

      right.append(track, poles, el("p", "spectrum-copy", domain.interpretation));
      row.append(left, right);
      body.appendChild(row);
    });

    return node;
  }

  /* ------------------------------------------------ IV: reading each current */

  function buildDetailChapter() {
    const { node, body } = section("detail");
    body.appendChild(el("p", "chapter-intro", COPY.detailIntro));

    profile.domains.forEach((domain) => {
      const role = profile.roles.find((entry) => entry.domain === domain.code);
      const instrument = data.assessment.instruments[domain.code];
      const guidance = data.assessment.domains[domain.code].guidance[domain.band];

      const current = el("article", "current");
      current.style.setProperty("--trace", role.colour);

      const head = el("div", "current-head");
      const title = el("div");
      title.append(
        el("h3", "current-title", domain.name),
        el("p", "mark", `${domain.focus}`),
      );
      const dial = el("div", "current-instrument");
      if (art) {
        const face = art.instrumentDial(domain.normalised, role.colour, domain.name);
        face.style.setProperty("--trace", role.colour);
        dial.appendChild(face);
      }
      dial.append(
        el("p", "mark", instrument.name.toUpperCase()),
        el("p", "mark", outOf(domain.score)),
      );
      head.append(title, dial);
      current.appendChild(head);

      const facets = el("div");
      facets.appendChild(el("p", "mark", LABELS.facets));
      domain.facets.forEach((facet) => {
        const row = el("div", "facet-row");
        row.append(
          el("p", "reading-name", facet.name),
          el("p", "facet-value", outOf(facet.score)),
          el("p", "", facet.meaning),
        );
        facets.appendChild(row);
      });
      current.appendChild(facets);

      const blocks = el("div", "guidance");
      [
        [LABELS.advantage, guidance.advantage],
        [LABELS.overextension, guidance.overextension],
        [LABELS.reflection, guidance.reflection],
      ].forEach(([label, copy]) => {
        const block = el("div", "guidance-block");
        block.append(el("p", "mark", label), el("p", "", copy));
        blocks.appendChild(block);
      });
      current.appendChild(blocks);

      body.appendChild(current);
    });

    return node;
  }

  /* ------------------------------------------------------------- V: closing */

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

  function buildCloseChapter() {
    const { node, body } = section("close");

    [summary.consistency, summary.contribution].forEach((copy) => {
      body.appendChild(el("p", "chapter-intro", copy));
    });

    const reflection = el("div", "role-statement");
    reflection.append(el("p", "mark", LABELS.reflection), el("p", "", summary.reflection));
    body.appendChild(reflection);

    const actions = el("div", "close-actions");
    if (pdf) {
      actions.append(
        exportButton(COPY.actions.profilePdf, "action", () =>
          pdf.downloadProfile(
            data,
            state,
            core,
            `Aurora_Station_Report_${fileName(profile.playerName)}.pdf`,
          ),
        ),
        exportButton(COPY.actions.storyPdf, "action action-quiet", () =>
          pdf.downloadStory(
            data,
            state,
            core,
            `Aurora_Station_Record_${fileName(profile.playerName)}.pdf`,
          ),
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

    const colophon = el("div", "colophon");
    [
      COPY.disclaimer,
      `${data.instrument.status}. ${data.instrument.statusNote}`,
      data.instrument.attribution,
      data.instrument.permission,
      data.assessment.bandNote,
      data.assessment.phaseNote,
      COPY.privacy,
    ].forEach((line) => colophon.appendChild(el("p", "", line)));

    const link = el("a", "", "The BFI-2 at the Colby Personality Lab");
    link.href = data.instrument.reference;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    colophon.appendChild(link);
    body.appendChild(colophon);

    return node;
  }

  /* ---------------------------------------------------------- the masthead */

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

    shell.replaceChildren(
      buildMasthead(),
      buildRoleChapter(),
      buildShiftChapter(),
      buildCurrentsChapter(),
      buildDetailChapter(),
      buildCloseChapter(),
    );

    document.title = `${profile.playerName} — Observation Report`;
    say("The observation report is ready.");
  }

  boot();
})();
