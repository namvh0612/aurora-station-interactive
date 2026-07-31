/*
 * Aurora Station — Results page.
 *
 * Everything shown here is recalculated from the raw responses on load. No
 * cached score is trusted, nothing is imputed, and an incomplete assessment
 * returns the reader to the Journey page.
 */
(function startAuroraResults() {
  "use strict";

  const data = window.AURORA_STATION_DATA;
  const core = window.AuroraCore;
  const pdfExporter = window.AuroraPdf;

  const shell = document.getElementById("results");
  const liveRegion = document.getElementById("screen-reader-status");

  const storage = (() => {
    try {
      const probe = window.localStorage;
      probe.getItem(core.JOURNEY_KEY);
      return probe;
    } catch {
      return null;
    }
  })();

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

  function scoreText(value) {
    return Number.isFinite(value) ? value.toFixed(1) : "—";
  }

  function outOfFive(value) {
    return `${scoreText(value)} / ${core.MAX_RESPONSE}`;
  }

  /* The domain's colour, matching its vertex on the overview chart. */
  function domainMarker() {
    const marker = element("span", "domain-marker");
    marker.setAttribute("aria-hidden", "true");
    return marker;
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

  function completionDate(state) {
    const stamp = Number(state.completedAt);
    const date = Number.isFinite(stamp) && stamp > 0 ? new Date(stamp) : new Date();
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /* ------------------------------------------------------------ the chart */

  /*
   * A five-axis radial chart on a fixed 1 to 5 scale. The exact scores are
   * always available as a table beneath it, so nothing depends on reading
   * the shape.
   */
  function buildDomainChart(profile) {
    const ns = "http://www.w3.org/2000/svg";
    const size = 380;
    const centre = size / 2;
    const radius = 104;
    const svg = document.createElementNS(ns, "svg");
    // A little slack around the geometry so the longest axis labels sit inside.
    svg.setAttribute("viewBox", `-22 -8 ${size + 44} ${size + 20}`);
    svg.classList.add("domain-chart");
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      `Five-domain overview on a one to five scale. ${profile.domains
        .map((domain) => `${domain.name} ${scoreText(domain.score)}`)
        .join(". ")}.`,
    );

    const angleFor = (index) => (Math.PI * 2 * index) / profile.domains.length - Math.PI / 2;
    const pointFor = (index, ratio) => ({
      x: centre + Math.cos(angleFor(index)) * radius * ratio,
      y: centre + Math.sin(angleFor(index)) * radius * ratio,
    });

    // Rings at every scale point from 1 to 5, so the scale never starts at zero.
    [0.25, 0.5, 0.75, 1].forEach((ratio) => {
      const ring = document.createElementNS(ns, "polygon");
      ring.setAttribute(
        "points",
        profile.domains
          .map((_, index) => {
            const point = pointFor(index, ratio);
            return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
          })
          .join(" "),
      );
      ring.setAttribute("class", "chart-ring");
      svg.appendChild(ring);
    });

    profile.domains.forEach((_, index) => {
      const spoke = document.createElementNS(ns, "line");
      const outer = pointFor(index, 1);
      spoke.setAttribute("x1", String(centre));
      spoke.setAttribute("y1", String(centre));
      spoke.setAttribute("x2", outer.x.toFixed(1));
      spoke.setAttribute("y2", outer.y.toFixed(1));
      spoke.setAttribute("class", "chart-spoke");
      svg.appendChild(spoke);
    });

    const shape = document.createElementNS(ns, "polygon");
    shape.setAttribute(
      "points",
      profile.domains
        .map((domain, index) => {
          const point = pointFor(index, Math.max(0.04, domain.normalised));
          return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
        })
        .join(" "),
    );
    shape.setAttribute("class", "chart-shape");
    svg.appendChild(shape);

    profile.domains.forEach((domain, index) => {
      const point = pointFor(index, Math.max(0.04, domain.normalised));
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", point.x.toFixed(1));
      dot.setAttribute("cy", point.y.toFixed(1));
      dot.setAttribute("r", "4.5");
      dot.setAttribute("fill", domain.colour);
      svg.appendChild(dot);

      // Domain names are wrapped onto their own lines so the longer ones stay
      // inside the drawing area.
      const label = document.createElementNS(ns, "text");
      const anchor = pointFor(index, 1.22);
      const alignment =
        Math.abs(anchor.x - centre) < 12 ? "middle" : anchor.x > centre ? "start" : "end";
      const words = domain.name.split(/\s+|(?<=-)/).filter(Boolean);
      label.setAttribute("x", anchor.x.toFixed(1));
      label.setAttribute("y", (anchor.y - (words.length - 1) * 5).toFixed(1));
      label.setAttribute("class", "chart-label");
      label.setAttribute("text-anchor", alignment);
      words.forEach((word, line) => {
        const span = document.createElementNS(ns, "tspan");
        span.setAttribute("x", anchor.x.toFixed(1));
        if (line > 0) {
          span.setAttribute("dy", "11");
        }
        span.textContent = word;
        label.appendChild(span);
      });
      svg.appendChild(label);
    });

    return svg;
  }

  /* ---------------------------------------------------------- the sections */

  function buildHeader(profile, state) {
    const copy = data.results;
    const header = element("header", "results-header");

    const identity = element("div", "results-identity");
    identity.append(
      element("p", "technical-label", copy.eyebrow),
      element("h1", "results-title", copy.heading),
      element("p", "results-name", profile.playerName || "Watchkeeper"),
      element("p", "technical-label results-date", `Watch completed · ${completionDate(state)}`),
    );

    const actions = element("div", "results-actions");
    if (pdfExporter) {
      actions.append(
        exportButton(copy.actions.profilePdf, "primary-action", () =>
          pdfExporter.downloadProfile(
            data,
            state,
            core,
            `Aurora_Station_Profile_${fileSafeName(profile.playerName)}.pdf`,
          ),
        ),
        exportButton(copy.actions.storyPdf, "secondary-action", () =>
          pdfExporter.downloadStory(
            data,
            state,
            core,
            `Aurora_Station_Story_${fileSafeName(profile.playerName)}.pdf`,
          ),
        ),
      );
    }

    const back = element("a", "secondary-action", copy.actions.returnToStory);
    back.href = "./index.html";
    actions.appendChild(back);

    const restart = element("button", "secondary-action restart-action", copy.actions.restart);
    restart.type = "button";
    restart.addEventListener("click", confirmRestart);
    actions.appendChild(restart);

    header.append(identity, actions);
    return header;
  }

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

  function buildHero(profile) {
    const copy = data.results;
    const hero = element("section", "results-hero");

    const summary = element("div", "hero-summary");
    summary.append(
      element("h2", "", copy.heroHeading),
      element("p", "hero-copy", core.summariseProfile(data, profile)),
      element("p", "hero-note", copy.descriptiveNote),
    );

    const chart = element("div", "hero-chart");
    chart.appendChild(buildDomainChart(profile));

    hero.append(summary, chart);
    return hero;
  }

  function buildOverview(profile) {
    const section = element("section", "results-section");
    section.append(
      element("p", "technical-label", "OVERVIEW"),
      element("h2", "", data.results.overviewHeading),
    );

    const grid = element("div", "domain-tiles");
    profile.domains.forEach((domain) => {
      const tile = element("article", "domain-tile");
      tile.style.setProperty("--domain-colour", domain.colour);
      const tileName = element("p", "technical-label domain-tile-name");
      tileName.append(domainMarker(), domain.name.toUpperCase());
      tile.append(
        tileName,
        element("strong", "domain-tile-score", outOfFive(domain.score)),
        element("p", "domain-tile-band", domain.bandLabel),
      );
      grid.appendChild(tile);
    });

    section.appendChild(grid);
    return section;
  }

  function buildDomainPanels(profile) {
    const section = element("section", "results-section");
    section.append(
      element("p", "technical-label", "DETAIL"),
      element("h2", "", data.results.detailHeading),
    );

    profile.domains.forEach((domain) => {
      const panel = element("article", "domain-panel");
      panel.style.setProperty("--domain-colour", domain.colour);

      const summary = element("div", "domain-panel-summary");
      const heading = element("div", "domain-panel-heading");
      const panelName = element("h3", "");
      panelName.append(domainMarker(), domain.name);
      heading.append(
        panelName,
        element("strong", "domain-panel-score", outOfFive(domain.score)),
      );
      summary.append(
        heading,
        element("p", "technical-label domain-panel-band", domain.bandLabel),
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

      panel.append(summary, facets);
      section.appendChild(panel);
    });

    return section;
  }

  function buildGuidance() {
    const copy = data.results;
    const instrument = data.instrument;
    const section = element("section", "results-guidance");
    section.appendChild(element("h2", "guidance-heading", copy.guidanceHeading));
    copy.guidance.forEach((line) => {
      section.appendChild(element("p", "", line));
    });

    const status = element("p", "guidance-status");
    status.append(
      element("strong", "", `${instrument.status}. `),
      document.createTextNode(instrument.statusNote),
    );
    section.appendChild(status);

    section.appendChild(element("p", "guidance-fine", instrument.attribution));
    section.appendChild(element("p", "guidance-fine", instrument.permission));
    section.appendChild(element("p", "guidance-fine", data.assessment.bandNote));
    section.appendChild(element("p", "guidance-fine", copy.privacy));

    const link = element("a", "guidance-link", "The BFI-2 at the Colby Personality Lab");
    link.href = instrument.reference;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    section.appendChild(link);

    return section;
  }

  function buildFooterActions(profile, state) {
    const copy = data.results.actions;
    const section = element("section", "results-footer-actions");

    if (pdfExporter) {
      section.append(
        exportButton(copy.profilePdf, "primary-action", () =>
          pdfExporter.downloadProfile(
            data,
            state,
            core,
            `Aurora_Station_Profile_${fileSafeName(profile.playerName)}.pdf`,
          ),
        ),
        exportButton(copy.storyPdf, "secondary-action", () =>
          pdfExporter.downloadStory(
            data,
            state,
            core,
            `Aurora_Station_Story_${fileSafeName(profile.playerName)}.pdf`,
          ),
        ),
      );
    }

    const back = element("a", "secondary-action", "Return to Completed Story");
    back.href = "./index.html";
    section.appendChild(back);

    const restart = element("button", "secondary-action restart-action", copy.restart);
    restart.type = "button";
    restart.addEventListener("click", confirmRestart);
    section.appendChild(restart);

    return section;
  }

  function confirmRestart() {
    if (!window.confirm(data.results.restartConfirm)) {
      return;
    }
    core.clearJourney(storage);
    window.location.replace("./index.html");
  }

  /* ----------------------------------------------------------------- boot */

  function boot() {
    if (!data || !core) {
      shell.replaceChildren(
        element("p", "loading-copy", "Aurora Station could not load its data."),
      );
      return;
    }

    const state = core.loadState(data, storage);

    // Recalculated from raw answers every time; an incomplete or missing
    // journey has no profile to show.
    const profile = core.scoreProfile(data, state);
    if (!profile || !state.participant.name) {
      window.location.replace("./index.html");
      return;
    }

    shell.replaceChildren(
      buildHeader(profile, state),
      buildHero(profile),
      buildOverview(profile),
      buildDomainPanels(profile),
      buildGuidance(),
      buildFooterActions(profile, state),
    );

    document.title = `${profile.playerName} — Watchkeeper Profile`;
    announce("Your Watchkeeper Profile is ready.");
  }

  boot();
})();
