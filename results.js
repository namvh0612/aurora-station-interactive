/*
 * Aurora Station — Results page.
 *
 * Six navigable views on one route. Everything is recalculated from the raw
 * responses on load: no cached score is trusted, nothing is imputed, and an
 * incomplete assessment is returned to the story.
 *
 * The five Aurora Roles are a narrative reading of the five BFI-2 domains and
 * are labelled as such throughout. No role is presented as better than another,
 * nothing is a percentage, and every chart keeps the fixed 1-5 scale.
 */
(function startAuroraResults() {
  "use strict";

  const data = window.AURORA_STATION_DATA;
  const core = window.AuroraCore;
  const pdfExporter = window.AuroraPdf;

  const shell = document.getElementById("results");
  const liveRegion = document.getElementById("screen-reader-status");

  const SWIPE_DISTANCE = 60;
  const SWIPE_SLOPE = 40;

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
  let views = [];
  let activeIndex = 0;

  /* ------------------------------------------------------------- helpers */

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

  function announce(message) {
    if (!liveRegion || !message) {
      return;
    }
    liveRegion.textContent = "";
    window.setTimeout(() => {
      liveRegion.textContent = message;
    }, 30);
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function scoreText(value) {
    return Number.isFinite(value) ? value.toFixed(1) : "—";
  }

  function outOfFive(value) {
    return `${scoreText(value)} / ${core.MAX_RESPONSE}`;
  }

  function signed(value) {
    return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}`;
  }

  function fileSafeName(value) {
    const safe = String(value || "Watchkeeper")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48);
    return safe || "Watchkeeper";
  }

  function completionDate() {
    const stamp = Number(state.completedAt);
    const date = Number.isFinite(stamp) && stamp > 0 ? new Date(stamp) : new Date();
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function viewCopy(id) {
    return data.results.views.find((view) => view.id === id);
  }

  function colourFor(role) {
    return role.colour;
  }

  /* --------------------------------------------------------------- charts */

  /*
   * One five-axis radar on a fixed 1-to-5 scale, with three selectable states.
   * The axes never move and never reorder: only the distance along each axis
   * changes, so a shift reads as a contribution becoming more or less
   * available rather than a personality turning into a different one.
   */
  const RADAR_SIZE = 420;
  const RADAR_CENTRE = RADAR_SIZE / 2;
  const RADAR_RADIUS = 132;
  const RADAR_DURATION = 620;

  function radarPoint(index, count, ratio) {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      x: RADAR_CENTRE + Math.cos(angle) * RADAR_RADIUS * ratio,
      y: RADAR_CENTRE + Math.sin(angle) * RADAR_RADIUS * ratio,
    };
  }

  function radarPoints(ratios) {
    return ratios
      .map((ratio, index) => {
        const point = radarPoint(index, ratios.length, ratio);
        return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
      })
      .join(" ");
  }

  function buildRoleRadar() {
    const ns = "http://www.w3.org/2000/svg";
    const copy = data.results.radar;
    const order = data.assessment.roleOrder;
    const stable = data.assessment.suitability.stableChange;

    // One entry per selectable state, in story order.
    const states = copy.states.map((state) => {
      const phase = profile.phases.find((entry) => entry.id === state.phase);
      const roles = order.map((id) => phase.roles.find((role) => role.id === id));
      return { ...state, phase, roles };
    });

    const wrap = element("div", "radar-wrap");

    /* ---- the switcher ---- */
    const switcher = element("div", "radar-states");
    switcher.setAttribute("role", "tablist");
    switcher.setAttribute("aria-label", copy.heading);

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `-34 -20 ${RADAR_SIZE + 68} ${RADAR_SIZE + 44}`);
    svg.classList.add("role-radar");
    svg.setAttribute("role", "img");

    // Scale rings at every whole score from 2 to 5. Value 1 is the centre, so
    // the chart can never imply a zero origin.
    [2, 3, 4, 5].forEach((value) => {
      const ratio = (value - core.MIN_RESPONSE) / (core.MAX_RESPONSE - core.MIN_RESPONSE);
      const ring = document.createElementNS(ns, "polygon");
      ring.setAttribute("points", radarPoints(order.map(() => ratio)));
      ring.setAttribute("class", value === core.MAX_RESPONSE ? "radar-ring radar-ring-outer" : "radar-ring");
      svg.appendChild(ring);

      const tick = document.createElementNS(ns, "text");
      const top = radarPoint(0, order.length, ratio);
      tick.setAttribute("x", (top.x + 6).toFixed(1));
      tick.setAttribute("y", (top.y + 4).toFixed(1));
      tick.setAttribute("class", "radar-tick");
      tick.textContent = String(value);
      svg.appendChild(tick);
    });

    order.forEach((id, index) => {
      const outer = radarPoint(index, order.length, 1);
      const spoke = document.createElementNS(ns, "line");
      spoke.setAttribute("x1", String(RADAR_CENTRE));
      spoke.setAttribute("y1", String(RADAR_CENTRE));
      spoke.setAttribute("x2", outer.x.toFixed(1));
      spoke.setAttribute("y2", outer.y.toFixed(1));
      spoke.setAttribute("class", "radar-spoke");
      spoke.style.setProperty("--role-colour", data.assessment.roles[id].colour);
      svg.appendChild(spoke);
    });

    // The previous state, kept as a thin translucent outline.
    const ghost = document.createElementNS(ns, "polygon");
    ghost.setAttribute("class", "radar-ghost");
    ghost.setAttribute("points", radarPoints(order.map(() => 0)));
    ghost.setAttribute("aria-hidden", "true");
    svg.appendChild(ghost);

    const shape = document.createElementNS(ns, "polygon");
    shape.setAttribute("class", "radar-shape");
    svg.appendChild(shape);

    const dots = order.map((id, index) => {
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("r", "6");
      dot.setAttribute("class", "radar-dot");
      dot.setAttribute("fill", data.assessment.roles[id].colour);
      svg.appendChild(dot);
      return { id, index, node: dot };
    });

    order.forEach((id, index) => {
      const label = document.createElementNS(ns, "text");
      const anchor = radarPoint(index, order.length, 1.2);
      label.setAttribute("x", anchor.x.toFixed(1));
      label.setAttribute("y", anchor.y.toFixed(1));
      label.setAttribute("class", "radar-label");
      label.setAttribute(
        "text-anchor",
        Math.abs(anchor.x - RADAR_CENTRE) < 12
          ? "middle"
          : anchor.x > RADAR_CENTRE
            ? "start"
            : "end",
      );
      label.textContent = data.assessment.roles[id].shortName;
      svg.appendChild(label);
    });

    /* ---- axis cards: exact score and signed change on hover or focus ---- */
    const cards = element("div", "radar-axes");
    const cardsById = {};
    order.forEach((id) => {
      const role = data.assessment.roles[id];
      const card = element("button", "radar-axis");
      card.type = "button";
      card.style.setProperty("--role-colour", role.colour);
      const tooltipId = `radar-tip-${id}`;
      card.setAttribute("aria-describedby", tooltipId);

      const swatch = element("span", "role-swatch");
      swatch.setAttribute("aria-hidden", "true");
      const name = element("span", "radar-axis-name", role.shortName);
      const score = element("span", "radar-axis-score", "—");
      const delta = element("span", "radar-axis-delta", "");
      const tooltip = element("span", "radar-tooltip");
      tooltip.id = tooltipId;
      tooltip.setAttribute("role", "tooltip");

      card.append(swatch, name, score, delta, tooltip);
      cards.appendChild(card);
      cardsById[id] = { card, score, delta, tooltip };
    });

    /* ---- the score and change table ---- */
    const table = element("table", "radar-table");
    table.appendChild(element("caption", "", copy.tableCaption));
    const head = element("thead");
    const headRow = element("tr");
    headRow.append(
      element("th", "", copy.columns.role),
      element("th", "", copy.columns.previous),
      element("th", "", copy.columns.score),
      element("th", "", copy.columns.change),
    );
    head.appendChild(headRow);
    const tbody = element("tbody");
    const rowsById = {};
    order.forEach((id) => {
      const role = data.assessment.roles[id];
      const row = element("tr");
      const nameCell = element("td");
      const name = element("span", "role-name");
      const swatch = element("span", "role-swatch");
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.setProperty("--role-colour", role.colour);
      name.append(swatch, role.shortName);
      nameCell.appendChild(name);
      const previous = element("td", "numeric");
      const current = element("td", "numeric role-score");
      const change = element("td", "numeric");
      row.append(nameCell, previous, current, change);
      tbody.appendChild(row);
      rowsById[id] = { previous, current, change };
    });
    table.append(head, tbody);

    /* ---- state handling ---- */
    let activeIndex = 0;
    let animation = 0;
    let currentRatios = states[0].roles.map((role) => role.normalised);

    const describeChange = (delta) => {
      if (delta === null) {
        return { text: "—", label: "no previous state", stable: true };
      }
      if (Math.abs(delta) < stable) {
        return { text: copy.stableLabel, label: copy.stableLabel, stable: true };
      }
      const text = `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(2)}`;
      return { text, label: `${delta > 0 ? "up" : "down"} ${Math.abs(delta).toFixed(2)}`, stable: false };
    };

    const paint = (ratios) => {
      shape.setAttribute("points", radarPoints(ratios));
      dots.forEach((dot, index) => {
        const point = radarPoint(index, ratios.length, ratios[index]);
        dot.node.setAttribute("cx", point.x.toFixed(1));
        dot.node.setAttribute("cy", point.y.toFixed(1));
      });
    };

    // Each vertex travels along its own axis only: the radius is interpolated,
    // the angle never is.
    const animateTo = (target) => {
      window.cancelAnimationFrame(animation);
      if (prefersReducedMotion()) {
        currentRatios = target.slice();
        paint(currentRatios);
        return;
      }
      const from = currentRatios.slice();
      const started = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - started) / RADAR_DURATION);
        const eased = 1 - Math.pow(1 - progress, 3);
        currentRatios = from.map((value, index) => value + (target[index] - value) * eased);
        paint(currentRatios);
        if (progress < 1) {
          animation = window.requestAnimationFrame(step);
        }
      };
      animation = window.requestAnimationFrame(step);
    };

    const setState = (index, options) => {
      const settings = options || {};
      activeIndex = Math.max(0, Math.min(index, states.length - 1));
      const state = states[activeIndex];
      const earlier = activeIndex > 0 ? states[activeIndex - 1] : null;

      switcher.querySelectorAll(".radar-state").forEach((button, position) => {
        const selected = position === activeIndex;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
        button.classList.toggle("is-selected", selected);
      });

      ghost.setAttribute(
        "points",
        earlier ? radarPoints(earlier.roles.map((role) => role.normalised)) : radarPoints(state.roles.map(() => 0)),
      );
      ghost.style.opacity = earlier ? "1" : "0";

      state.roles.forEach((role, index) => {
        const before = earlier ? earlier.roles[index].score : null;
        const delta = before === null ? null : role.score - before;
        const change = describeChange(delta);
        const entry = cardsById[role.id];
        entry.score.textContent = outOfFive(role.score);
        entry.delta.textContent = change.text;
        entry.delta.dataset.stable = String(change.stable);
        entry.tooltip.textContent = earlier
          ? `${role.name}: ${scoreText(role.score)} of ${core.MAX_RESPONSE}, ${change.label} from ${earlier.label} (${scoreText(before)}).`
          : `${role.name}: ${scoreText(role.score)} of ${core.MAX_RESPONSE} at ${state.label}.`;

        const row = rowsById[role.id];
        row.previous.textContent = before === null ? "—" : scoreText(before);
        row.current.textContent = outOfFive(role.score);
        row.change.textContent = change.text;
        row.change.dataset.stable = String(change.stable);
      });

      svg.setAttribute(
        "aria-label",
        `${copy.heading}. ${state.label}. Each role is scored from one to five. ${state.roles
          .map((role) => `${role.shortName} ${scoreText(role.score)}`)
          .join(". ")}.`,
      );

      animateTo(state.roles.map((role) => role.normalised));
      if (settings.announce) {
        announce(`${state.label}. ${state.roles.map((role) => `${role.shortName} ${scoreText(role.score)}`).join(", ")}.`);
      }
    };

    states.forEach((state, index) => {
      const button = element("button", "radar-state", state.label);
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(index === 0));
      button.tabIndex = index === 0 ? 0 : -1;
      button.addEventListener("click", () => setState(index, { announce: true }));
      button.addEventListener("keydown", (event) => {
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) {
          return;
        }
        event.preventDefault();
        const next = (index + step + states.length) % states.length;
        setState(next, { announce: true });
        switcher.querySelectorAll(".radar-state")[next].focus();
      });
      switcher.appendChild(button);
    });

    wrap.append(
      switcher,
      element("p", "view-intro", copy.intro),
      svg,
      cards,
      table,
      element("p", "radar-note", copy.note),
    );

    paint(currentRatios);
    setState(0);
    return wrap;
  }

  function roleTable(roles, caption) {
    const copy = viewCopy("roles");
    const table = element("table", "role-table");
    table.appendChild(element("caption", "", caption));

    const head = element("thead");
    const headRow = element("tr");
    headRow.append(
      element("th", "", "Role"),
      element("th", "", `Score / ${core.MAX_RESPONSE}`),
      element("th", "", copy.facetFloorLabel),
      element("th", "", copy.suitabilityLabel),
    );
    head.appendChild(headRow);

    const body = element("tbody");
    roles.forEach((role) => {
      const row = element("tr");
      const nameCell = element("td");
      const name = element("span", "role-name");
      const swatch = element("span", "role-swatch");
      swatch.style.setProperty("--role-colour", colourFor(role));
      swatch.setAttribute("aria-hidden", "true");
      name.append(swatch, role.shortName);
      nameCell.append(name, element("span", "role-meaning", role.contribution));
      row.append(
        nameCell,
        element("td", "numeric role-score", outOfFive(role.score)),
        element("td", "numeric", scoreText(role.facetFloor)),
        element("td", "numeric role-score", scoreText(role.profileSuitability)),
      );
      body.appendChild(row);
    });

    table.append(head, body);
    return table;
  }

  /* Paired bars for two phases of the same role, on one fixed 1-5 scale. */
  function roleComparison(earlier, later, earlierLabel, laterLabel) {
    const laterById = Object.fromEntries(later.map((role) => [role.id, role]));
    const rows = element("div", "role-rows");

    earlier.forEach((role) => {
      const partner = laterById[role.id];
      const row = element("section", "role-row");
      row.style.setProperty("--role-colour", colourFor(role));

      const name = element("div", "role-row-name");
      const swatch = element("span", "role-swatch");
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.setProperty("--role-colour", colourFor(role));
      name.append(swatch, role.name);

      const bars = element("div", "role-bars");
      [
        { phase: "earlier", label: earlierLabel, entry: role },
        { phase: "later", label: laterLabel, entry: partner },
      ].forEach(({ phase, label, entry }) => {
        const bar = element("div", "role-bar");
        bar.dataset.phase = phase;
        const track = element("div", "role-track");
        track.setAttribute("role", "img");
        track.setAttribute(
          "aria-label",
          `${role.name}, ${label}: ${scoreText(entry?.score)} out of ${core.MAX_RESPONSE}`,
        );
        const fill = element("span", "role-fill");
        fill.style.width = `${Math.max(2, (entry?.normalised ?? 0) * 100)}%`;
        track.appendChild(fill);
        bar.append(
          element("span", "role-bar-label", label),
          track,
          element("span", "role-bar-value", scoreText(entry?.score)),
        );
        bars.appendChild(bar);
      });

      row.append(name, bars);
      rows.appendChild(row);
    });

    return rows;
  }

  function phaseCard(phase, lead, roleLabel) {
    const card = element("article", "phase-card");
    card.append(
      element("p", "meta", roleLabel),
      element("h3", "", phase.label),
      element("p", "phase-window", phase.window),
      element("p", "phase-lead", lead.label),
      element("p", "phase-desc", phase.description),
    );
    return card;
  }

  function shiftList(shifts) {
    const list = element("ul", "shift-list");
    shifts.forEach((shift) => {
      const item = element("li", "shift-item");
      const name = element("span", "role-name");
      const swatch = element("span", "role-swatch");
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.setProperty("--role-colour", colourFor(shift));
      name.append(swatch, shift.name);
      item.append(
        name,
        element("span", "shift-delta", signed(shift.delta)),
        element("span", "shift-size", `${shift.size} ${shift.direction}`),
      );
      list.appendChild(item);
    });
    return list;
  }

  /* ---------------------------------------------------------- the six views */

  function viewHeading(copy) {
    const header = element("header", "view-heading");
    header.append(
      element("p", "meta", copy.label.toUpperCase()),
      element("h2", "view-title", copy.title),
    );
    if (copy.intro) {
      header.appendChild(element("p", "view-intro", copy.intro));
    }
    return header;
  }

  function buildCompleteView() {
    const copy = viewCopy("complete");
    const view = element("section", "results-view completion-view");
    view.append(
      element("p", "meta", `${profile.playerName} · ${completionDate()}`),
      element("h2", "view-title", copy.title),
      element("p", "completion-bridge", copy.bridge),
      element("p", "completion-body", copy.body),
      element("p", "completion-disclaimer", copy.disclaimer),
    );
    return view;
  }

  function buildRolesView() {
    const copy = viewCopy("roles");
    const view = element("section", "results-view");
    view.appendChild(viewHeading(copy));

    view.appendChild(buildRoleRadar());

    const layout = element("div", "roles-layout");
    const side = element("div");
    const lead = element("div", "role-lead");
    lead.append(
      element("p", "meta", copy.overallLabel),
      element("p", "role-lead-name", summary.overall.label),
      element(
        "p",
        "role-lead-copy",
        summary.overall.blended
          .map((role) => `${role.name}: ${role.reading}`)
          .join(". ") + ".",
      ),
    );
    if (summary.overall.isBlend) {
      lead.appendChild(element("p", "meta", copy.blendNote));
    } else if (summary.overall.secondary) {
      lead.appendChild(
        element(
          "p",
          "meta",
          `${copy.secondaryLabel}: ${summary.overall.secondary.shortName}`,
        ),
      );
    }
    lead.appendChild(element("p", "meta", copy.recommendedNote));
    side.appendChild(lead);
    layout.append(side, roleTable(profile.roles, copy.tableCaption));

    view.append(layout, element("p", "view-intro", data.assessment.roleNote));
    return view;
  }

  function buildPressureView() {
    const copy = viewCopy("pressure");
    const baseline = profile.phases[0];
    const pressure = profile.phases[1];
    const comparison = core.compareRoles(data, baseline, pressure);

    const view = element("section", "results-view");
    view.appendChild(viewHeading(copy));

    const cards = element("div", "phase-compare");
    cards.append(
      phaseCard(baseline, summary.starting, "Starting role"),
      phaseCard(pressure, summary.pressure, "Pressure role"),
    );
    view.appendChild(cards);

    view.appendChild(
      roleComparison(baseline.roles, pressure.roles, baseline.shortLabel, pressure.shortLabel),
    );

    const body = element("div", "view-body");
    if (comparison.stable) {
      body.appendChild(element("p", "", copy.stableCopy));
    } else {
      view.appendChild(shiftList(comparison.shifts));
      const rose = comparison.shifts.find((shift) => shift.delta > 0);
      const fell = comparison.shifts.find((shift) => shift.delta < 0);
      if (rose) {
        body.appendChild(
          element(
            "p",
            "",
            copy.shiftLeadIn
              .replace("{role}", rose.name)
              .replace("{reading}", rose.reading),
          ),
        );
      }
      if (fell) {
        body.appendChild(
          element("p", "", copy.shiftDropLeadIn.replace("{role}", fell.name)),
        );
      }
    }
    body.appendChild(element("p", "view-intro", data.assessment.phaseNote));
    view.appendChild(body);
    return view;
  }

  function buildRecoveryView() {
    const copy = viewCopy("recovery");
    const pressure = profile.phases[1];
    const recovery = profile.phases[2];
    const comparison = core.compareRoles(data, pressure, recovery);
    const returnKind = core.describeReturn(data, profile);

    const view = element("section", "results-view");
    view.appendChild(viewHeading(copy));

    const cards = element("div", "phase-compare");
    cards.append(
      phaseCard(pressure, summary.pressure, "Pressure role"),
      phaseCard(recovery, summary.recovery, "Recovery role"),
    );
    view.appendChild(cards);

    view.appendChild(
      roleComparison(pressure.roles, recovery.roles, pressure.shortLabel, recovery.shortLabel),
    );

    const body = element("div", "view-body");
    if (comparison.stable) {
      body.appendChild(element("p", "", copy.stableCopy));
    } else {
      view.appendChild(shiftList(comparison.shifts));
      const rose = comparison.shifts.find((shift) => shift.delta > 0);
      if (rose) {
        body.appendChild(
          element(
            "p",
            "",
            copy.shiftLeadIn
              .replace("{role}", rose.name)
              .replace("{reading}", rose.reading),
          ),
        );
      }
    }
    body.appendChild(
      element(
        "p",
        "",
        returnKind === "returned"
          ? copy.returnedCopy
          : returnKind === "retained"
            ? copy.retainedCopy
            : copy.newBalanceCopy,
      ),
    );
    body.appendChild(element("p", "view-intro", data.assessment.phaseNote));
    view.appendChild(body);
    return view;
  }

  function buildDetailView() {
    const copy = viewCopy("detail");
    const view = element("section", "results-view");
    view.appendChild(viewHeading(copy));

    profile.domains.forEach((domain) => {
      const panel = element("article", "domain-panel");
      panel.style.setProperty("--domain-colour", domain.colour);

      const side = element("div");
      const heading = element("div", "domain-panel-heading");
      const name = element("h3");
      const marker = element("span", "domain-marker");
      marker.setAttribute("aria-hidden", "true");
      name.append(marker, domain.name);
      heading.append(name, element("strong", "domain-panel-score", outOfFive(domain.score)));
      side.append(
        heading,
        element("p", "meta domain-panel-band", domain.bandLabel),
        element("p", "domain-panel-focus", domain.focus),
        element("p", "domain-panel-copy", domain.interpretation),
      );

      const facets = element("div", "facet-rows");
      domain.facets.forEach((facet) => {
        const row = element("section", "facet-row");
        const label = element("div", "facet-row-label");
        label.append(
          element("h4", "", facet.name),
          element("p", "facet-meaning", facet.meaning),
        );
        const value = element("div", "facet-row-value");
        value.appendChild(element("strong", "facet-score", outOfFive(facet.score)));
        const track = element("div", "facet-track");
        track.setAttribute("role", "img");
        track.setAttribute(
          "aria-label",
          `${facet.name}: ${scoreText(facet.score)} out of ${core.MAX_RESPONSE}`,
        );
        const fill = element("span", "facet-fill");
        fill.style.width = `${Math.max(2, facet.normalised * 100)}%`;
        track.appendChild(fill);
        value.appendChild(track);
        row.append(label, value);
        facets.appendChild(row);
      });

      panel.append(side, facets);
      view.appendChild(panel);
    });

    const notes = element("div", "detail-notes");
    notes.append(
      element("p", "", copy.higherNote),
      element("p", "", copy.negativeEmotionalityNote),
      element("p", "", copy.aegisNote),
    );
    view.appendChild(notes);
    return view;
  }

  function buildSummaryView() {
    const copy = viewCopy("summary");
    const view = element("section", "results-view");
    view.appendChild(viewHeading(copy));

    const cards = element("div", "summary-roles");
    [
      ["Across the watch", summary.overall],
      ["Starting", summary.starting],
      ["Under pressure", summary.pressure],
      ["After pressure", summary.recovery],
    ].forEach(([label, lead]) => {
      const card = element("article", "summary-role-card");
      const value = element("span", "summary-role-value");
      const swatch = element("span", "role-swatch");
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.setProperty("--role-colour", colourFor(lead.primary));
      value.append(swatch, lead.label);
      card.append(element("p", "meta", label), value);
      cards.appendChild(card);
    });
    view.appendChild(cards);

    const paragraphs = element("div", "summary-paragraphs");
    [
      ["Consistency", summary.consistency],
      ["Adaptation", summary.adaptation],
      ["In a group", summary.contribution],
    ].forEach(([label, text]) => {
      const block = element("section");
      block.append(element("h3", "", label), element("p", "", text));
      paragraphs.appendChild(block);
    });
    view.appendChild(paragraphs);

    const reflection = element("div", "reflection-question");
    reflection.append(
      element("p", "meta", copy.reflectionLabel),
      element("p", "", summary.reflection),
    );
    view.appendChild(reflection);
    return view;
  }

  /* ------------------------------------------------------------ navigation */

  function showView(index, options) {
    const settings = options || {};
    const next = Math.max(0, Math.min(index, views.length - 1));
    activeIndex = next;

    views.forEach((view, position) => {
      view.node.hidden = position !== next;
    });

    const dots = shell.querySelectorAll(".results-dot");
    dots.forEach((dot, position) => {
      dot.setAttribute("aria-current", String(position === next));
    });

    const label = shell.querySelector(".page-label");
    label.textContent = data.results.pageLabelTemplate
      .replace("{current}", String(next + 1).padStart(2, "0"))
      .replace("{total}", String(views.length).padStart(2, "0"));

    shell.querySelector(".pager-previous").disabled = next === 0;
    shell.querySelector(".pager-next").disabled = next === views.length - 1;

    if (settings.updateHash !== false) {
      const hash = `#${views[next].copy.hash}`;
      if (window.location.hash !== hash) {
        window.history.pushState(null, "", hash);
      }
    }

    if (settings.announce !== false) {
      announce(`${views[next].copy.label}. Page ${next + 1} of ${views.length}.`);
    }
    if (settings.focus) {
      views[next].node.focus?.({ preventScroll: true });
    }
  }

  function indexForHash(hash) {
    const id = String(hash || "").replace(/^#/, "");
    const found = views.findIndex((view) => view.copy.hash === id);
    return found === -1 ? 0 : found;
  }

  function buildNavigation() {
    const nav = element("nav", "results-nav");
    nav.setAttribute("aria-label", "Profile pages");

    const dots = element("ol", "results-dots");
    views.forEach((view, index) => {
      const item = element("li");
      const dot = element("button", "results-dot", view.copy.shortLabel);
      dot.type = "button";
      dot.setAttribute("aria-current", String(index === 0));
      dot.addEventListener("click", () => showView(index, { focus: true }));
      item.appendChild(dot);
      dots.appendChild(item);
    });

    const pager = element("div", "results-pager");
    const previous = element("button", "secondary-action pager-previous", data.results.previous);
    previous.type = "button";
    previous.addEventListener("click", () => showView(activeIndex - 1, { focus: true }));

    const label = element("p", "meta page-label", "01 / 06");
    label.setAttribute("aria-live", "off");

    const next = element("button", "secondary-action pager-next", data.results.next);
    next.type = "button";
    next.addEventListener("click", () => showView(activeIndex + 1, { focus: true }));

    pager.append(previous, label, next);
    nav.append(dots, pager);
    return nav;
  }

  function bindNavigation() {
    document.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showView(activeIndex - 1, { focus: true });
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showView(activeIndex + 1, { focus: true });
      }
    });

    window.addEventListener("popstate", () => {
      showView(indexForHash(window.location.hash), { updateHash: false });
    });

    // Swipe is an addition to the buttons, never the only way through.
    let startX = 0;
    let startY = 0;
    shell.addEventListener(
      "touchstart",
      (event) => {
        startX = event.changedTouches[0].clientX;
        startY = event.changedTouches[0].clientY;
      },
      { passive: true },
    );
    shell.addEventListener(
      "touchend",
      (event) => {
        const deltaX = event.changedTouches[0].clientX - startX;
        const deltaY = event.changedTouches[0].clientY - startY;
        if (Math.abs(deltaX) < SWIPE_DISTANCE || Math.abs(deltaY) > SWIPE_SLOPE) {
          return;
        }
        showView(activeIndex + (deltaX < 0 ? 1 : -1));
      },
      { passive: true },
    );
  }

  /* ---------------------------------------------------------- chrome parts */

  function exportButton(label, className, run) {
    const button = element("button", className, label);
    button.type = "button";
    button.addEventListener("click", async () => {
      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Preparing…";
      try {
        await run();
        announce(`${label} complete.`);
      } catch {
        announce(`${label} could not be created.`);
      } finally {
        button.textContent = original;
        button.disabled = false;
      }
    });
    return button;
  }

  function profilePdfButton(className) {
    return exportButton(data.results.actions.profilePdf, className, () =>
      pdfExporter.downloadProfile(
        data,
        state,
        core,
        `Aurora_Station_Profile_${fileSafeName(profile.playerName)}.pdf`,
      ),
    );
  }

  function storyPdfButton(className) {
    return exportButton(data.results.actions.storyPdf, className, () =>
      pdfExporter.downloadStory(
        data,
        state,
        core,
        `Aurora_Station_Story_${fileSafeName(profile.playerName)}.pdf`,
      ),
    );
  }

  function exitLink(className, label) {
    const link = element("a", className, label);
    link.href = "./index.html";
    return link;
  }

  function restartButton(className) {
    const button = element("button", className, data.results.actions.restart);
    button.type = "button";
    button.addEventListener("click", () => {
      if (!window.confirm(data.results.restartConfirm)) {
        return;
      }
      core.clearJourney(storage);
      window.location.replace("./index.html");
    });
    return button;
  }

  function buildMasthead() {
    const masthead = element("header", "results-masthead");
    const identity = element("div", "results-identity");
    identity.append(
      element("p", "meta", data.results.eyebrow),
      element("h1", "", data.results.heading),
      element("p", "results-owner", profile.playerName),
    );

    // Download and exit stay available from every view.
    const utilities = element("div", "results-utilities");
    if (pdfExporter) {
      utilities.append(profilePdfButton("primary-action"), storyPdfButton("secondary-action"));
    }
    utilities.appendChild(exitLink("secondary-action", data.results.actions.returnToStory));

    masthead.append(identity, utilities);
    return masthead;
  }

  function buildFooter() {
    const footer = element("footer", "results-footer");

    const actions = element("div", "results-footer-actions");
    if (pdfExporter) {
      actions.append(profilePdfButton("primary-action"), storyPdfButton("secondary-action"));
    }
    actions.append(
      exitLink("secondary-action", "Return to Completed Story"),
      restartButton("secondary-action"),
    );

    const fine = element("div", "results-fine");
    fine.append(
      element("p", "", `${data.instrument.status}. ${data.instrument.statusNote}`),
      element("p", "", data.instrument.attribution),
      element("p", "", data.instrument.permission),
      element("p", "", data.assessment.bandNote),
      element("p", "", data.results.privacy),
    );
    const link = element("a", "", "The BFI-2 at the Colby Personality Lab");
    link.href = data.instrument.reference;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    fine.appendChild(link);

    footer.append(actions, fine);
    return footer;
  }

  /* ----------------------------------------------------------------- boot */

  function boot() {
    if (!data || !core) {
      shell.replaceChildren(
        element("p", "loading-copy", "Aurora Station could not load its data."),
      );
      return;
    }

    state = core.loadState(data, storage);
    profile = core.scoreProfile(data, state);
    if (!profile || !state.participant.name) {
      window.location.replace("./index.html");
      return;
    }
    summary = core.summariseProfile(data, profile);

    const builders = {
      complete: buildCompleteView,
      roles: buildRolesView,
      pressure: buildPressureView,
      recovery: buildRecoveryView,
      detail: buildDetailView,
      summary: buildSummaryView,
    };

    views = data.results.views.map((copy) => {
      const node = builders[copy.id]();
      node.id = `view-${copy.id}`;
      node.tabIndex = -1;
      node.setAttribute("aria-label", copy.label);
      node.hidden = true;
      return { copy, node };
    });

    const viewport = element("div", "results-views");
    views.forEach((view) => viewport.appendChild(view.node));

    shell.replaceChildren(buildMasthead(), buildNavigation(), viewport, buildFooter());
    bindNavigation();

    if (prefersReducedMotion()) {
      document.body.classList.add("reduced-motion");
    }

    showView(indexForHash(window.location.hash), { updateHash: false, announce: false });
    document.title = `${profile.playerName} — Watchkeeper Profile`;
    announce("Your Watchkeeper Profile is ready.");
  }

  boot();
})();
