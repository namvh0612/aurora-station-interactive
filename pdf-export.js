(function attachAuroraPdf(globalScope) {
  "use strict";

  function cleanText(value) {
    return String(value || "")
      .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-")
      .trim();
  }

  const EXPORT_PAGE_WIDTH = 2480;
  const EXPORT_PAGE_HEIGHT = 3508;
  const EXPORT_MARGIN = 170;
  const EXPORT_PDF_WIDTH = 595.28;
  const EXPORT_PDF_HEIGHT = 841.89;

  function exportCanvas() {
    if (!globalScope.document) {
      throw new Error("Profile export requires a browser canvas.");
    }
    const canvas = globalScope.document.createElement("canvas");
    canvas.width = EXPORT_PAGE_WIDTH;
    canvas.height = EXPORT_PAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Canvas rendering is unavailable.");
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    return { canvas, context };
  }

  /*
   * Two families, matching the web hierarchy: an editorial serif for narrative
   * and reflective copy, a technical mono for every label, reading, timestamp
   * and piece of metadata. "sans" is the historic key for the operational face.
   */
  function setExportFont(context, size, family, weight, style) {
    const selectedFamily = family === "sans"
      ? 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace'
      : '"Hoefler Text", "Iowan Old Style", "Palatino Linotype", Palatino, Cambria, serif';
    context.font = `${style || "normal"} ${weight || 400} ${size}px ${selectedFamily}`;
  }

  function splitExportLines(context, value, maxWidth) {
    const paragraphs = String(value || "").split(/\n+/);
    const lines = [];
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (!words.length) {
        lines.push("");
      } else {
        let line = words.shift();
        words.forEach((word) => {
          const candidate = `${line} ${word}`;
          if (context.measureText(candidate).width <= maxWidth) {
            line = candidate;
          } else {
            lines.push(line);
            line = word;
          }
        });
        lines.push(line);
      }
      if (paragraphIndex < paragraphs.length - 1) {
        lines.push("");
      }
    });
    return lines;
  }

  function drawExportText(context, value, x, y, maxWidth, settings) {
    const options = settings || {};
    setExportFont(
      context,
      options.size || 38,
      options.family || "serif",
      options.weight || 400,
      options.style || "normal",
    );
    context.fillStyle = options.colour || "#14181a";
    context.textAlign = options.align || "left";
    context.textBaseline = "alphabetic";
    const lineHeight = options.lineHeight || Math.round((options.size || 38) * 1.38);
    const lines = splitExportLines(context, cleanText(value), maxWidth);
    const maxLines = options.maxLines || lines.length;
    const visible = lines.slice(0, maxLines);
    visible.forEach((line, index) => {
      let rendered = line;
      if (index === visible.length - 1 && lines.length > maxLines && rendered) {
        while (context.measureText(`${rendered}…`).width > maxWidth && rendered.length > 1) {
          rendered = rendered.slice(0, -1);
        }
        rendered = `${rendered.trim()}…`;
      }
      context.fillText(rendered, x, y + index * lineHeight);
    });
    return y + Math.max(visible.length, 1) * lineHeight;
  }

  function drawExportRule(context, y, colour, width) {
    context.strokeStyle = colour || "#c1caca";
    context.lineWidth = width || 2;
    context.beginPath();
    context.moveTo(EXPORT_MARGIN, y);
    context.lineTo(EXPORT_PAGE_WIDTH - EXPORT_MARGIN, y);
    context.stroke();
  }

  function drawExportPageBase(context, pageNumber, playerName, accent, pageCount) {
    context.fillStyle = "#e6eaeb";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, EXPORT_PAGE_HEIGHT);

    /*
     * A calibration scale in the head margin rather than a gradient wash: a
     * printed instrument mark, and it says which page this is by how far the
     * long stroke has travelled along it.
     */
    context.strokeStyle = "#c1caca";
    context.lineWidth = 2;
    const scaleTop = 150;
    const scaleWidth = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    const steps = Math.max(1, pageCount || 8);
    for (let step = 0; step < steps; step += 1) {
      const at = EXPORT_MARGIN + (scaleWidth * step) / (steps - 1 || 1);
      const reached = step <= pageNumber - 1;
      context.strokeStyle = reached ? "#5c6568" : "#c1caca";
      context.beginPath();
      context.moveTo(at, scaleTop);
      context.lineTo(at, scaleTop + (reached ? 16 : 9));
      context.stroke();
    }

    context.fillStyle = accent || "#14181a";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, 8);

    drawExportText(
      context,
      `AURORA STATION  |  ${playerName || "WATCHKEEPER"}`.toUpperCase(),
      EXPORT_MARGIN,
      105,
      1500,
      { size: 25, family: "sans", weight: 600, colour: "#5c6568", lineHeight: 32 },
    );
    drawExportText(
      context,
      `PAGE ${pageNumber} OF ${pageCount || 8}`,
      EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
      105,
      360,
      { size: 25, family: "sans", weight: 600, colour: "#5c6568", align: "right", lineHeight: 32 },
    );

    drawExportRule(context, EXPORT_PAGE_HEIGHT - 135, "#c1caca", 2);
    drawExportText(
      context,
      "Aurora Station · Reflective profile · Non-commercial use",
      EXPORT_MARGIN,
      EXPORT_PAGE_HEIGHT - 76,
      1600,
      { size: 23, family: "sans", colour: "#5c6568", lineHeight: 30 },
    );
  }

  /*
   * An oversized opening, the way an Act opens on screen. The page is A4 at
   * 300dpi and the report was using about a third of it, which read as an
   * unfinished layout rather than a spare one.
   */
  function drawExportHeading(context, eyebrow, title, introduction, accent) {
    let y = 300;
    y = drawExportText(context, eyebrow.toUpperCase(), EXPORT_MARGIN, y, 1800, {
      size: 30,
      family: "sans",
      weight: 600,
      colour: accent || "#4b5457",
      lineHeight: 42,
    });
    y += 150;
    y = drawExportText(context, title, EXPORT_MARGIN, y, EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2, {
      size: 132,
      weight: 500,
      colour: "#14181a",
      lineHeight: 138,
      maxLines: 2,
    });
    if (introduction) {
      y += 46;
      y = drawExportText(context, introduction, EXPORT_MARGIN, y, 1960, {
        size: 40,
        colour: "#4b5457",
        lineHeight: 58,
        maxLines: 4,
      });
    }
    y += 54;
    drawExportRule(context, y, "#c1caca", 2);
    return y + 76;
  }

  function drawExportLabel(context, label, x, y, colour) {
    return drawExportText(context, label.toUpperCase(), x, y, 980, {
      size: 25,
      family: "sans",
      weight: 600,
      colour: colour || "#5c6568",
      lineHeight: 34,
      maxLines: 2,
    });
  }

  /*
   * A reading on a rule, the way the report draws it: the range is a hairline,
   * the reading is a mark on it. A filled rounded bar is a dashboard idiom and
   * does not belong in this publication.
   */
  function drawScoreTrack(context, x, y, width, normalised, colour) {
    const centre = y + 13;
    context.strokeStyle = "#c1caca";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, centre);
    context.lineTo(x + width, centre);
    context.stroke();

    // Whole scale points, so the mark can be read against the range.
    context.strokeStyle = "#d3dada";
    for (let step = 0; step <= 4; step += 1) {
      const at = x + (width * step) / 4;
      context.beginPath();
      context.moveTo(at, centre - 7);
      context.lineTo(at, centre + 7);
      context.stroke();
    }

    const mark = x + width * Math.max(0, Math.min(1, normalised));
    context.strokeStyle = colour;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(mark, centre - 15);
    context.lineTo(mark, centre + 15);
    context.stroke();
    context.fillStyle = colour;
    context.beginPath();
    context.arc(mark, centre, 9, 0, Math.PI * 2);
    context.fill();
  }

  /*
   * The five contributions on a ring, drawn the way the report draws them: a
   * feeding cycle around the outside, checking reaches across the middle, the
   * reader's own contribution filled and the four it touches picked out.
   */
  function drawElementCycle(context, centreX, centreY, radius, nodes, leadId, relations) {
    const related = relations
      ? [relations.supports, relations.supportedBy, relations.checks, relations.checkedBy]
      : [];
    const placed = nodes.map((node, index) => {
      const angle = (Math.PI * 2 * index) / nodes.length - Math.PI / 2;
      return {
        ...node,
        angle,
        x: centreX + Math.cos(angle) * radius,
        y: centreY + Math.sin(angle) * radius,
      };
    });

    function arrow(from, to, live, dashed) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const unit = { x: dx / length, y: dy / length };
      const gap = 42;
      const start = { x: from.x + unit.x * gap, y: from.y + unit.y * gap };
      const end = { x: to.x - unit.x * gap, y: to.y - unit.y * gap };

      context.save();
      context.strokeStyle = live ? "#4b5457" : "#c1caca";
      context.lineWidth = dashed ? 2 : 3;
      context.setLineDash(dashed ? [8, 12] : []);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
      context.restore();

      // The head, so the direction is drawn rather than implied.
      const head = 14;
      const left = { x: -unit.y, y: unit.x };
      context.fillStyle = live ? "#4b5457" : "#c1caca";
      context.beginPath();
      context.moveTo(end.x, end.y);
      context.lineTo(end.x - unit.x * head + left.x * head * 0.5, end.y - unit.y * head + left.y * head * 0.5);
      context.lineTo(end.x - unit.x * head - left.x * head * 0.5, end.y - unit.y * head - left.y * head * 0.5);
      context.closePath();
      context.fill();
    }

    placed.forEach((node, index) => {
      const target = placed[(index + 1) % placed.length];
      arrow(node, target, node.id === leadId || target.id === leadId, false);
    });
    placed.forEach((node, index) => {
      const target = placed[(index + 2) % placed.length];
      arrow(node, target, node.id === leadId || target.id === leadId, true);
    });

    placed.forEach((node) => {
      const lead = node.id === leadId;
      context.beginPath();
      context.arc(node.x, node.y, lead ? 26 : 17, 0, Math.PI * 2);
      context.fillStyle = lead ? node.colour : "#e6eaeb";
      context.fill();
      context.strokeStyle = node.colour;
      context.lineWidth = related.includes(node.id) ? 5 : 3;
      context.stroke();

      const out = 58;
      const horizontal = Math.cos(node.angle);
      drawExportText(
        context,
        node.label,
        node.x + horizontal * out,
        node.y + Math.sin(node.angle) * out + (Math.sin(node.angle) > 0.3 ? 26 : 10),
        520,
        {
          size: 26,
          family: "sans",
          weight: lead ? 600 : 400,
          colour: lead ? "#14181a" : "#4b5457",
          align: Math.abs(horizontal) < 0.35 ? "center" : horizontal > 0 ? "left" : "right",
          lineHeight: 34,
        },
      );
    });
  }

  /* Page 1: the watchkeeper, the date and the five Aurora Roles. */
  function drawProfileOverviewPage(context, data, profile, summary, dateLabel, pageCount) {
    drawExportPageBase(context, 1, profile.playerName, "#14181a", pageCount);
    let y = drawExportHeading(
      context,
      "Watchkeeper Profile",
      profile.playerName || "Watchkeeper",
      `Watch completed - ${dateLabel}`,
      "#14181a",
    );

    const width = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    y += 16;
    y = drawExportText(context, data.instrument.status, EXPORT_MARGIN, y, width, {
      size: 30,
      family: "sans",
      weight: 600,
      colour: "#4b5457",
      lineHeight: 42,
    });
    y += 30;

    drawExportLabel(context, "Most available across the watch", EXPORT_MARGIN, y, "#14181a");
    y += 62;
    y = drawExportText(context, summary.overall.label, EXPORT_MARGIN, y, width, {
      size: 62,
      colour: "#14181a",
      lineHeight: 74,
      maxLines: 1,
    });
    y += 46;

    profile.roles.forEach((role) => {
      drawExportText(context, role.shortName, EXPORT_MARGIN, y + 42, width - 520, {
        size: 42,
        family: "sans",
        weight: 600,
        colour: "#14181a",
        lineHeight: 52,
        maxLines: 1,
      });
      drawExportText(
        context,
        `${role.score.toFixed(1)} / ${profile.scaleMax}`,
        EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
        y + 42,
        480,
        {
          size: 42,
          family: "sans",
          weight: 600,
          colour: role.colourPaper,
          align: "right",
          lineHeight: 52,
        },
      );
      drawScoreTrack(context, EXPORT_MARGIN, y + 74, width, role.normalised, role.colourPaper);
      drawExportText(context, role.contribution, EXPORT_MARGIN, y + 148, width, {
        size: 26,
        family: "sans",
        colour: "#5c6568",
        lineHeight: 36,
        maxLines: 1,
      });
      y += 208;
    });

    y += 24;
    drawExportRule(context, y, "#c1caca", 2);
    y += 52;
    drawExportText(context, data.assessment.roleNote, EXPORT_MARGIN, y, width, {
      size: 28,
      colour: "#4b5457",
      lineHeight: 42,
      maxLines: 4,
    });
  }

  /*
   * Page 2: the contribution in full. The report on screen carries the role's
   * mission function, what it brings, what to watch for and the mission
   * action; without this page the export was a scoreboard of the same profile.
   */
  function drawProfileRolePage(context, data, profile, summary, pageNumber, pageCount) {
    const lead = summary.overall;
    const primary = lead.primary;
    drawExportPageBase(context, pageNumber, profile.playerName, primary.colourPaper, pageCount);

    let y = drawExportHeading(
      context,
      data.results.chapters[0].eyebrow,
      lead.isBlend ? lead.label : primary.name,
      data.results.roleIntro,
      primary.colourPaper,
    );

    const width = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    const labels = data.results.labels;

    y += 8;
    y = drawExportText(
      context,
      `${labels.basis} · ${primary.basis}`,
      EXPORT_MARGIN,
      y,
      width,
      { size: 26, family: "sans", weight: 600, colour: "#5c6568", lineHeight: 36 },
    );
    y += 40;
    y = drawExportText(context, data.results.notATypeStatement, EXPORT_MARGIN, y, width, {
      size: 33,
      style: "italic",
      colour: "#262b2d",
      lineHeight: 48,
    });
    y += 40;

    // Why this contribution, described the same way the report describes it.
    const why = data.assessment.whyTemplates;
    const reasons = [
      lead.isBlend
        ? why.blend.replace("{roles}", lead.label)
        : why.single.replace("{role}", primary.name),
      primary.facetFloor >= primary.score - 0.6 ? why.supported : why.uneven,
    ];
    y = drawExportText(context, reasons.join(" "), EXPORT_MARGIN, y, width, {
      size: 31,
      colour: "#262b2d",
      lineHeight: 46,
    });
    y += 36;
    drawExportRule(context, y, "#c1caca", 2);
    y += 66;

    [
      [labels.missionFunction, primary.missionFunction],
      [labels.brings, primary.brings],
      [labels.watchFor, primary.watchFor],
      [labels.action, `${primary.actionTitle} — ${primary.action}`],
    ].forEach(([label, copy]) => {
      drawExportLabel(context, label, EXPORT_MARGIN, y, primary.colourPaper);
      y += 54;
      y = drawExportText(context, copy, EXPORT_MARGIN, y, width, {
        size: 30,
        colour: "#262b2d",
        lineHeight: 44,
      });
      y += 44;
    });

    const instrument = data.assessment.instruments[primary.domain];
    drawExportRule(context, y, "#c1caca", 2);
    y += 64;
    drawExportLabel(context, `${labels.instrument} · ${instrument.name}`, EXPORT_MARGIN, y, "#14181a");
    y += 54;
    drawExportText(context, instrument.reads, EXPORT_MARGIN, y, width, {
      size: 28,
      colour: "#4b5457",
      lineHeight: 42,
    });
  }

  /*
   * The contribution read against the other four: which one it tends to feed,
   * which tends to feed it, and which holds it in check. A reading of
   * relationships between contributions, never a rating of people.
   */
  function drawProfileRelationsPage(context, data, profile, summary, core, pageNumber, pageCount) {
    const primary = summary.overall.primary;
    const relations = core.relationsFor(data, primary.id);
    const element = core.elementForRole(data, primary.id);
    const copy = data.results.relationsCopy;
    const labels = data.results.relationsLabels;
    const chapter = data.results.chapters.find((entry) => entry.id === "relations");

    drawExportPageBase(context, pageNumber, profile.playerName, primary.colourPaper, pageCount);
    let y = drawExportHeading(
      context,
      chapter.eyebrow,
      chapter.title,
      data.results.relationsIntro,
      primary.colourPaper,
    );

    const width = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    const columnWidth = width * 0.52;

    y += 10;
    drawExportLabel(context, `${labels.yours} · ${primary.name}`, EXPORT_MARGIN, y, "#14181a");
    let column = y + 52;
    column = drawExportText(
      context,
      `${labels.keywords} · ${element.keywords}`,
      EXPORT_MARGIN,
      column,
      columnWidth,
      { size: 27, family: "sans", colour: "#4b5457", lineHeight: 38 },
    );
    column += 16;
    // The shadow line the report shows under the role name, which the export
    // used to drop.
    column = drawExportText(
      context,
      `${labels.shadow}: ${element.shadow}`,
      EXPORT_MARGIN,
      column,
      columnWidth,
      { size: 27, colour: "#4b5457", lineHeight: 40 },
    );

    // The same figure the report draws, beside the reading rather than absent.
    const cycleNodes = data.assessment.cycles.generating.map((elementId) => {
      const role = profile.roles.find(
        (candidate) => candidate.id === data.assessment.elements[elementId].role,
      );
      return { id: role.id, label: role.shortName, colour: role.colourPaper };
    });
    drawElementCycle(
      context,
      EXPORT_PAGE_WIDTH - EXPORT_MARGIN - 430,
      y + 400,
      270,
      cycleNodes,
      primary.id,
      relations,
    );
    drawExportText(
      context,
      `${labels.cycleGenerating} — ${labels.cycleControlling} - - -`,
      EXPORT_PAGE_WIDTH - EXPORT_MARGIN - 430,
      y + 790,
      860,
      { size: 24, family: "sans", colour: "#5c6568", align: "center", lineHeight: 32 },
    );

    y = Math.max(column, y + 830) + 40;
    drawExportRule(context, y, "#c1caca", 2);
    y += 66;

    [
      ["supports", labels.supports],
      ["supportedBy", labels.supportedBy],
      ["checks", labels.checks],
      ["checkedBy", labels.checkedBy],
    ].forEach(([key, label]) => {
      const other = profile.roles.find((role) => role.id === relations[key]);
      const otherElement = core.elementForRole(data, other.id);
      // A mark beside the name, not a bar down the side of it.
      context.fillStyle = other.colourPaper;
      context.beginPath();
      context.arc(EXPORT_MARGIN + 10, y - 8, 10, 0, Math.PI * 2);
      context.fill();

      drawExportLabel(context, label, EXPORT_MARGIN + 44, y, other.colourPaper);
      y += 50;
      y = drawExportText(context, other.name, EXPORT_MARGIN + 44, y, width - 44, {
        size: 44,
        colour: "#14181a",
        lineHeight: 54,
        maxLines: 1,
      });
      y += 16;
      y = drawExportText(
        context,
        copy[key].replace("{role}", other.name),
        EXPORT_MARGIN + 44,
        y,
        width - 44,
        { size: 30, colour: "#262b2d", lineHeight: 44, maxLines: 3 },
      );
      y += 10;
      y = drawExportText(context, otherElement.keywords, EXPORT_MARGIN + 44, y, width - 44, {
        size: 26,
        family: "sans",
        colour: "#5c6568",
        lineHeight: 36,
        maxLines: 1,
      });
      y += 46;
    });

    drawExportRule(context, y, "#c1caca", 2);
    y += 60;
    drawExportText(context, data.results.relationsNote, EXPORT_MARGIN, y, width, {
      size: 27,
      colour: "#4b5457",
      lineHeight: 41,
    });
  }

  /*
   * The observations the watch produced, and the question the report closes
   * on. Both are written copy; neither survived into the old export.
   */
  function drawProfileObservationPage(context, data, profile, summary, pageNumber, pageCount) {
    drawExportPageBase(context, pageNumber, profile.playerName, "#14181a", pageCount);
    const closing = data.results.chapters[4];
    let y = drawExportHeading(context, closing.eyebrow, closing.title, null, "#14181a");

    const width = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    y += 20;
    drawExportLabel(context, data.results.labels.observations, EXPORT_MARGIN, y, "#14181a");
    y += 64;

    [summary.consistency, summary.adaptation, summary.contribution].forEach((line) => {
      y = drawExportText(context, line, EXPORT_MARGIN, y, width, {
        size: 30,
        colour: "#262b2d",
        lineHeight: 45,
      });
      y += 38;
    });

    y += 16;
    drawExportRule(context, y, "#c1caca", 2);
    y += 68;
    drawExportLabel(context, data.results.labels.reflection, EXPORT_MARGIN, y, "#14181a");
    y += 60;
    drawExportText(context, summary.reflection, EXPORT_MARGIN, y, width, {
      size: 33,
      style: "italic",
      colour: "#262b2d",
      lineHeight: 48,
    });
  }

  /* Page 2: how the pattern moved between the three story phases. */
  function drawProfilePhasePage(context, data, profile, summary, pageNumber, pageCount) {
    drawExportPageBase(context, pageNumber, profile.playerName, "#14181a", pageCount);
    let y = drawExportHeading(
      context,
      "Across the watch",
      "Under and after pressure",
      data.assessment.phaseNote,
      "#14181a",
    );

    const width = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    const columnWidth = (width - 80) / 3;
    y += 20;

    [
      ["Starting", summary.starting, profile.phases[0]],
      ["Under pressure", summary.pressure, profile.phases[1]],
      ["After pressure", summary.recovery, profile.phases[2]],
    ].forEach(([label, lead, phase], index) => {
      const x = EXPORT_MARGIN + index * (columnWidth + 40);
      drawExportLabel(context, label, x, y, "#14181a");
      drawExportText(context, lead.label, x, y + 74, columnWidth, {
        size: 40,
        colour: "#14181a",
        lineHeight: 50,
        maxLines: 2,
      });
      drawExportText(context, phase.window, x, y + 178, columnWidth, {
        size: 25,
        family: "sans",
        colour: "#5c6568",
        lineHeight: 34,
        maxLines: 1,
      });
    });
    y += 250;
    drawExportRule(context, y, "#c1caca", 2);
    y += 70;

    // One row per role, three bars: baseline, pressure, recovery.
    profile.roles.forEach((role) => {
      drawExportText(context, role.shortName, EXPORT_MARGIN, y + 34, 520, {
        size: 34,
        family: "sans",
        weight: 600,
        colour: "#14181a",
        lineHeight: 44,
        maxLines: 1,
      });
      profile.phases.forEach((phase, index) => {
        const entry = phase.roles.find((candidate) => candidate.id === role.id);
        const barY = y + 60 + index * 46;
        const barX = EXPORT_MARGIN + 560;
        const barWidth = width - 560 - 220;
        drawExportText(context, phase.shortLabel, EXPORT_MARGIN + 300, barY + 22, 240, {
          size: 23,
          family: "sans",
          colour: "#5c6568",
          lineHeight: 30,
          maxLines: 1,
        });
        drawScoreTrack(context, barX, barY, barWidth, entry.normalised, role.colourPaper);
        drawExportText(
          context,
          entry.score.toFixed(1),
          EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
          barY + 22,
          200,
          {
            size: 27,
            family: "sans",
            weight: 600,
            colour: "#14181a",
            align: "right",
            lineHeight: 34,
          },
        );
      });
      y += 216;
    });
  }

  /* One page per domain: interpretation, its guidance, then its three facets. */
  function drawProfileDomainPage(context, data, profile, domain, pageNumber, pageCount) {
    // A current takes the colour of the contribution that reads it, so a page
    // and the role bars on page 1 agree.
    const trace =
      (profile.roles.find((role) => role.domain === domain.code) || {}).colourPaper || "#14181a";
    drawExportPageBase(context, pageNumber, profile.playerName, trace, pageCount);
    let y = drawExportHeading(
      context,
      `${String(pageNumber - 2).padStart(2, "0")} - Domain`,
      domain.name,
      domain.focus,
      trace,
    );

    const width = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    drawExportText(
      context,
      `${domain.score.toFixed(1)} / ${profile.scaleMax}`,
      EXPORT_MARGIN,
      y + 56,
      700,
      { size: 74, family: "sans", weight: 600, colour: trace, lineHeight: 84 },
    );
    drawExportText(
      context,
      domain.bandLabel.toUpperCase(),
      EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
      y + 56,
      1100,
      {
        size: 28,
        family: "sans",
        weight: 600,
        colour: "#5c6568",
        align: "right",
        lineHeight: 38,
      },
    );
    y += 130;
    drawScoreTrack(context, EXPORT_MARGIN, y, width, domain.normalised, trace);
    y += 96;

    y = drawExportText(context, domain.interpretation, EXPORT_MARGIN, y, width, {
      size: 32,
      colour: "#262b2d",
      lineHeight: 47,
      maxLines: 5,
    });
    y += 40;

    // The advantage, the overextension and the reflection the report offers
    // for this band. Guidance, never a verdict.
    const labels = data.results.labels;
    const guidance = data.assessment.domains[domain.code].guidance[domain.band];
    const instrument = data.assessment.instruments[domain.code];
    drawExportRule(context, y, "#c1caca", 2);
    y += 58;
    [
      [labels.advantage, guidance.advantage],
      [labels.overextension, guidance.overextension],
      [labels.reflection, guidance.reflection],
    ].forEach(([label, copy]) => {
      drawExportLabel(context, label, EXPORT_MARGIN, y, trace);
      y += 48;
      y = drawExportText(context, copy, EXPORT_MARGIN, y, width, {
        size: 28,
        colour: "#262b2d",
        lineHeight: 41,
        maxLines: 4,
      });
      y += 34;
    });

    y += 6;
    drawExportRule(context, y, "#c1caca", 2);
    y += 62;

    drawExportLabel(
      context,
      `${labels.facets} · ${labels.instrument} ${instrument.name}`,
      EXPORT_MARGIN,
      y,
      trace,
    );
    y += 62;

    domain.facets.forEach((facet) => {
      drawExportText(context, facet.name, EXPORT_MARGIN, y + 34, width - 520, {
        size: 34,
        weight: 600,
        colour: "#14181a",
        lineHeight: 44,
        maxLines: 1,
      });
      drawExportText(
        context,
        `${facet.score.toFixed(1)} / ${profile.scaleMax}`,
        EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
        y + 34,
        480,
        {
          size: 34,
          family: "sans",
          weight: 600,
          colour: trace,
          align: "right",
          lineHeight: 44,
        },
      );
      drawScoreTrack(context, EXPORT_MARGIN, y + 62, width, facet.normalised, trace);
      drawExportText(context, facet.meaning, EXPORT_MARGIN, y + 130, width, {
        size: 25,
        colour: "#5c6568",
        lineHeight: 35,
        maxLines: 2,
      });
      y += 200;
    });
  }

  /* Final page: how to read the profile, and the BFI-2 attribution. */
  function drawProfileGuidancePage(context, data, profile, pageNumber, pageCount) {
    drawExportPageBase(context, pageNumber, profile.playerName, "#14181a", pageCount);
    let y = drawExportHeading(
      context,
      "How to read this profile",
      "Reading guidance",
      null,
      "#14181a",
    );

    const width = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    y += 20;
    [
      data.results.disclaimer,
      data.assessment.roleNote,
      data.assessment.phaseNote,
      data.assessment.bandNote,
    ].forEach((line) => {
      y = drawExportText(context, line, EXPORT_MARGIN, y, width, {
        size: 30,
        colour: "#262b2d",
        lineHeight: 45,
      });
      y += 34;
    });

    y += 20;
    drawExportRule(context, y, "#c1caca", 2);
    y += 76;

    drawExportLabel(context, "Measurement status", EXPORT_MARGIN, y, "#14181a");
    y += 62;
    y = drawExportText(
      context,
      `${data.instrument.status}. ${data.instrument.statusNote}`,
      EXPORT_MARGIN,
      y,
      width,
      { size: 29, colour: "#262b2d", lineHeight: 43 },
    );
    y += 60;

    drawExportLabel(context, "Attribution", EXPORT_MARGIN, y, "#14181a");
    y += 62;
    y = drawExportText(context, data.instrument.attribution, EXPORT_MARGIN, y, width, {
      size: 27,
      colour: "#4b5457",
      lineHeight: 40,
    });
    y += 30;
    y = drawExportText(context, data.instrument.permission, EXPORT_MARGIN, y, width, {
      size: 27,
      colour: "#4b5457",
      lineHeight: 40,
    });
    y += 30;
    y = drawExportText(context, data.assessment.bandNote, EXPORT_MARGIN, y, width, {
      size: 27,
      colour: "#4b5457",
      lineHeight: 40,
    });
    y += 30;
    drawExportText(context, data.instrument.reference, EXPORT_MARGIN, y, width, {
      size: 25,
      family: "sans",
      colour: "#5c6568",
      lineHeight: 38,
    });
  }


  const STORY_CONTENT_TOP = 270;
  const STORY_CONTENT_BOTTOM = EXPORT_PAGE_HEIGHT - 250;
  const STORY_TEXT_WIDTH = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;

  /*
   * The exported story is built from the same node stream the page renders,
   * so the PDF always carries the response-selected passages the reader
   * actually saw. Question nodes carry no prose and are skipped.
   */
  function buildStoryBlocks(data, state, core) {
    const blocks = [];

    core.buildNodes(data, state).forEach((node) => {
      switch (node.type) {
        case "prologue-heading":
          blocks.push({
            type: "chapter",
            eyebrow: "PROLOGUE",
            title: cleanText(node.title),
            time: cleanText(node.eyebrow),
          });
          break;
        case "act-heading":
          blocks.push({
            type: "chapter",
            eyebrow: `PART ${String(node.actNumber).padStart(2, "0")}`,
            title: cleanText(node.title),
            time: cleanText(node.time),
          });
          break;
        case "interlude-heading":
          blocks.push({
            type: "chapter",
            eyebrow: cleanText(node.eyebrow),
            title: cleanText(node.title),
            time: "",
          });
          break;
        case "question":
        case "completion":
          break;
        case "selected":
          blocks.push({ type: "chosen", text: cleanText(node.text) });
          break;
        case "closing":
        case "ending":
          blocks.push({ type: node.type, text: cleanText(node.text) });
          break;
        default:
          blocks.push({ type: "body", text: cleanText(node.text) });
      }
    });

    return blocks;
  }

  function storyStyle(type) {
    if (type === "closing" || type === "ending") {
      return { size: 34, lineHeight: 52, colour: "#262b2d", style: "italic", after: 32 };
    }
    return { size: 34, lineHeight: 52, colour: "#262b2d", style: "normal", after: 28 };
  }

  function layoutStoryPages(context, blocks) {
    const pages = [[]];
    let pageIndex = 0;
    let y = STORY_CONTENT_TOP;

    function nextPage() {
      pages.push([]);
      pageIndex += 1;
      y = STORY_CONTENT_TOP;
    }

    function pushTextLines(lines, style, extra) {
      let remaining = lines.slice();
      while (remaining.length) {
        const capacity = Math.max(
          1,
          Math.floor((STORY_CONTENT_BOTTOM - y) / style.lineHeight),
        );
        if (capacity <= 1 && y > STORY_CONTENT_TOP) {
          nextPage();
          continue;
        }
        const chunk = remaining.splice(0, capacity);
        pages[pageIndex].push({
          type: "lines",
          x: EXPORT_MARGIN + (extra?.indent || 0),
          y,
          width: STORY_TEXT_WIDTH - (extra?.indent || 0),
          lines: chunk,
          style,
        });
        y += chunk.length * style.lineHeight;
        if (remaining.length) {
          nextPage();
        }
      }
      y += style.after || 0;
    }

    blocks.forEach((block) => {
      if (block.type === "chapter") {
        setExportFont(context, 27, "mono", 600);
        const eyebrowLines = splitExportLines(context, block.eyebrow, STORY_TEXT_WIDTH);
        setExportFont(context, 76, "serif", 500);
        const titleLines = splitExportLines(context, block.title, STORY_TEXT_WIDTH);
        setExportFont(context, 27, "mono", 400);
        const timeLines = splitExportLines(context, block.time, STORY_TEXT_WIDTH);
        const height =
          eyebrowLines.length * 38 +
          30 +
          titleLines.length * 86 +
          24 +
          timeLines.length * 38 +
          54;
        if (y > STORY_CONTENT_TOP && y + height > STORY_CONTENT_BOTTOM) {
          nextPage();
        }
        pages[pageIndex].push({ type: "chapter", y, block });
        y += height;
        return;
      }

      const style = storyStyle(block.type);
      setExportFont(context, style.size, "serif", 400, style.style);
      const inset = block.type === "chosen" ? 72 : 0;
      const lines = splitExportLines(
        context,
        block.text,
        STORY_TEXT_WIDTH - inset * 2,
      );

      if (block.type === "chosen") {
        const boxHeight = lines.length * style.lineHeight + 76;
        if (y + boxHeight > STORY_CONTENT_BOTTOM && y > STORY_CONTENT_TOP) {
          nextPage();
        }
        pages[pageIndex].push({
          type: "chosen",
          y,
          lines,
          height: boxHeight,
          style,
        });
        y += boxHeight + 34;
        return;
      }

      pushTextLines(lines, style, block.type === "ending" ? { indent: 28 } : null);
      if (y > STORY_CONTENT_BOTTOM - 80) {
        nextPage();
      }
    });

    if (!pages[pages.length - 1].length) {
      pages.pop();
    }
    return pages;
  }

  function drawStoryPageBase(context, pageNumber, pageCount, playerName) {
    context.fillStyle = "#e6eaeb";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, EXPORT_PAGE_HEIGHT);
    context.fillStyle = "#14181a";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, 8);
    drawExportText(
      context,
      `AURORA STATION  |  ${playerName || "WATCHKEEPER"}`.toUpperCase(),
      EXPORT_MARGIN,
      105,
      1500,
      { size: 25, family: "sans", weight: 600, colour: "#5c6568", lineHeight: 32 },
    );
    drawExportText(
      context,
      `PAGE ${pageNumber} OF ${pageCount}`,
      EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
      105,
      420,
      { size: 25, family: "sans", weight: 600, colour: "#5c6568", align: "right", lineHeight: 32 },
    );
    drawExportRule(context, EXPORT_PAGE_HEIGHT - 135, "#c1caca", 2);
    drawExportText(
      context,
      "Aurora Station - Personal story - Non-commercial use",
      EXPORT_MARGIN,
      EXPORT_PAGE_HEIGHT - 76,
      1600,
      { size: 23, family: "sans", colour: "#5c6568", lineHeight: 30 },
    );
  }

  /*
   * The record is read after the night, so its cover is dawn like every other
   * page: paper, mineral ink and a drawn horizon. No aurora — by the time the
   * record is printed the sky has already gone.
   */
  function drawStoryCover(context, data, playerName, pageCount) {
    context.fillStyle = "#e6eaeb";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, EXPORT_PAGE_HEIGHT);
    context.fillStyle = "#14181a";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, 8);

    // Twelve field contours, one per act, settling toward the horizon.
    context.save();
    context.strokeStyle = "#14181a";
    // Printed rather than lit: a hairline at 6% alpha vanishes on paper, so
    // the contours carry enough weight to survive the page.
    context.lineWidth = 3;
    for (let index = 0; index < 12; index += 1) {
      const ratio = index / 11;
      context.globalAlpha = 0.2 + ratio * 0.4;
      const base = 1700 + index * 46;
      context.beginPath();
      for (let x = EXPORT_MARGIN; x <= EXPORT_PAGE_WIDTH - EXPORT_MARGIN; x += 12) {
        const span = (x - EXPORT_MARGIN) / (EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2);
        const swell = Math.sin(span * Math.PI * 2 + index * 0.42) * (108 - index * 7);
        const y = base + swell * (1 - ratio * 0.55);
        if (x === EXPORT_MARGIN) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
    }
    context.restore();

    drawExportRule(context, 2360, "#14181a", 3);

    drawExportText(context, "THE FINAL WATCH", EXPORT_MARGIN, 500, 1500, {
      size: 34,
      family: "sans",
      weight: 600,
      colour: "#4b5457",
      lineHeight: 44,
    });
    drawExportText(context, cleanText(data.title), EXPORT_MARGIN, 700, STORY_TEXT_WIDTH, {
      size: 152,
      weight: 500,
      colour: "#14181a",
      lineHeight: 160,
      maxLines: 2,
    });
    drawExportText(context, cleanText(data.subtitle), EXPORT_MARGIN, 1110, STORY_TEXT_WIDTH, {
      size: 62,
      style: "italic",
      colour: "#262b2d",
      lineHeight: 76,
    });
    drawExportText(context, "A journey shaped by your decisions", EXPORT_MARGIN, 1370, STORY_TEXT_WIDTH, {
      size: 34,
      family: "sans",
      colour: "#4b5457",
      lineHeight: 44,
    });
    drawExportText(context, `WATCHKEEPER - ${playerName || "FINAL WATCH"}`, EXPORT_MARGIN, 2920, STORY_TEXT_WIDTH, {
      size: 30,
      family: "sans",
      weight: 600,
      colour: "#5c6568",
      lineHeight: 40,
    });
    drawExportText(context, `${pageCount} PAGES`, EXPORT_PAGE_WIDTH - EXPORT_MARGIN, 2920, 500, {
      size: 30,
      family: "sans",
      weight: 600,
      colour: "#5c6568",
      align: "right",
      lineHeight: 40,
    });
  }

  function drawStoryCommands(context, commands) {
    commands.forEach((command) => {
      if (command.type === "chapter") {
        let y = command.y;
        y = drawExportText(context, command.block.eyebrow, EXPORT_MARGIN, y, STORY_TEXT_WIDTH, {
          size: 27,
          family: "sans",
          weight: 600,
          colour: "#4b5457",
          lineHeight: 38,
        });
        y += 70;
        y = drawExportText(context, command.block.title, EXPORT_MARGIN, y, STORY_TEXT_WIDTH, {
          size: 76,
          weight: 500,
          colour: "#14181a",
          lineHeight: 86,
          maxLines: 2,
        });
        y += 24;
        drawExportText(context, command.block.time, EXPORT_MARGIN, y, STORY_TEXT_WIDTH, {
          size: 27,
          family: "sans",
          colour: "#5c6568",
          lineHeight: 38,
        });
        return;
      }
      if (command.type === "chosen") {
        context.fillStyle = "rgba(20,24,26,0.05)";
        context.fillRect(EXPORT_MARGIN, command.y, STORY_TEXT_WIDTH, command.height);
        context.fillStyle = "#4b5457";
        context.fillRect(EXPORT_MARGIN, command.y, 4, command.height);
        setExportFont(context, command.style.size, "serif", 400, "italic");
        context.fillStyle = "#14181a";
        context.textAlign = "left";
        context.textBaseline = "alphabetic";
        command.lines.forEach((line, index) => {
          context.fillText(
            line,
            EXPORT_MARGIN + 58,
            command.y + 54 + index * command.style.lineHeight,
          );
        });
        return;
      }
      if (command.type === "lines") {
        setExportFont(
          context,
          command.style.size,
          "serif",
          400,
          command.style.style,
        );
        context.fillStyle = command.style.colour;
        context.textAlign = "left";
        context.textBaseline = "alphabetic";
        command.lines.forEach((line, index) => {
          context.fillText(line, command.x, command.y + index * command.style.lineHeight);
        });
      }
    });
  }

  async function downloadStoryPdf(data, state, core, filename, options) {
    const settings = options || {};
    const safeState = core.sanitiseState(data, state);
    if (!core.isComplete(safeState)) {
      throw new Error("Complete the journey before exporting the story.");
    }
    if (globalScope.document?.fonts?.ready) {
      await globalScope.document.fonts.ready;
    }
    const { canvas, context } = exportCanvas();
    const blocks = buildStoryBlocks(data, safeState, core);
    const storyPages = layoutStoryPages(context, blocks);
    const totalPages = storyPages.length + 1;
    const images = [];

    context.clearRect(0, 0, EXPORT_PAGE_WIDTH, EXPORT_PAGE_HEIGHT);
    drawStoryCover(context, data, safeState.participant.name, totalPages);
    images.push(await canvasToJpegBytes(canvas));
    if (typeof settings.onProgress === "function") {
      settings.onProgress(1, totalPages, `Rendering story page 1 of ${totalPages}`);
    }

    for (let index = 0; index < storyPages.length; index += 1) {
      context.clearRect(0, 0, EXPORT_PAGE_WIDTH, EXPORT_PAGE_HEIGHT);
      drawStoryPageBase(
        context,
        index + 2,
        totalPages,
        safeState.participant.name,
      );
      drawStoryCommands(context, storyPages[index]);
      images.push(await canvasToJpegBytes(canvas));
      if (typeof settings.onProgress === "function") {
        settings.onProgress(
          index + 2,
          totalPages,
          `Rendering story page ${index + 2} of ${totalPages}`,
        );
      }
      await new Promise((resolve) => globalScope.setTimeout(resolve, 0));
    }

    if (typeof settings.onAssembling === "function") {
      settings.onAssembling();
    }
    const pdfBytes = buildImagePdf(images, {
      title: `Aurora Station night watch log — ${safeState.participant.name || "Watchkeeper"}`,
      subject: "The night as it was recorded, passage by passage.",
      createdAt: Number(safeState.completedAt),
    });
    triggerPdfDownload(
      pdfBytes,
      filename || exportName("record", safeState.participant.name, safeState.completedAt),
    );
    return { pageCount: images.length, byteLength: pdfBytes.length };
  }

  function canvasToJpegBytes(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error("The report page could not be encoded."));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      }, "image/jpeg", 0.94);
    });
  }

  function asciiBytes(value) {
    return new TextEncoder().encode(value);
  }

  function concatenateBytes(parts) {
    const length = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(length);
    let offset = 0;
    parts.forEach((part) => {
      output.set(part, offset);
      offset += part.length;
    });
    return output;
  }

  /*
   * PDF text strings are escaped, not encoded: parentheses and backslashes are
   * structural, and anything outside ASCII is dropped rather than written as a
   * byte a reader would guess at.
   */
  function pdfString(value) {
    return String(value || "")
      .replace(/[^\x20-\x7e]/g, "-")
      .replace(/([\\()])/g, "\\$1");
  }

  function pdfDate(stamp) {
    const when = new Date(Number.isFinite(stamp) && stamp > 0 ? stamp : Date.now());
    const pad = (value) => String(value).padStart(2, "0");
    return (
      `D:${when.getFullYear()}${pad(when.getMonth() + 1)}${pad(when.getDate())}` +
      `${pad(when.getHours())}${pad(when.getMinutes())}${pad(when.getSeconds())}`
    );
  }

  function buildImagePdf(images, meta) {
    const info = meta || {};
    const pageCount = images.length;
    // One extra object for the document information dictionary.
    const totalObjects = 3 + pageCount * 3;
    const infoObject = totalObjects;
    const objects = new Array(totalObjects + 1);
    const pageRefs = [];

    for (let index = 0; index < pageCount; index += 1) {
      const pageObject = 3 + index * 3;
      const contentObject = pageObject + 1;
      const imageObject = pageObject + 2;
      pageRefs.push(`${pageObject} 0 R`);
      const content = `q\n${EXPORT_PDF_WIDTH.toFixed(2)} 0 0 ${EXPORT_PDF_HEIGHT.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
      objects[pageObject] = asciiBytes(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${EXPORT_PDF_WIDTH.toFixed(2)} ${EXPORT_PDF_HEIGHT.toFixed(2)}] /Resources << /XObject << /Im0 ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>`,
      );
      objects[contentObject] = concatenateBytes([
        asciiBytes(`<< /Length ${asciiBytes(content).length} >>\nstream\n`),
        asciiBytes(content),
        asciiBytes("endstream"),
      ]);
      objects[imageObject] = concatenateBytes([
        asciiBytes(
          `<< /Type /XObject /Subtype /Image /Width ${EXPORT_PAGE_WIDTH} /Height ${EXPORT_PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${images[index].length} >>\nstream\n`,
        ),
        images[index],
        asciiBytes("\nendstream"),
      ]);
    }

    objects[1] = asciiBytes("<< /Type /Catalog /Pages 2 0 R /Lang (en-GB) >>");
    objects[2] = asciiBytes(
      `<< /Type /Pages /Count ${pageCount} /Kids [${pageRefs.join(" ")}] >>`,
    );
    objects[infoObject] = asciiBytes(
      `<< /Title (${pdfString(info.title || "Aurora Station")})` +
        ` /Author (${pdfString(info.author || "Aurora Station")})` +
        ` /Subject (${pdfString(info.subject || "A BFI-2-aligned narrative self-reflection. Not a clinical instrument.")})` +
        " /Creator (Aurora Station) /Producer (Aurora Station)" +
        ` /CreationDate (${pdfDate(info.createdAt)}) >>`,
    );

    const header = asciiBytes("%PDF-1.4\n%âãÏÓ\n");
    const parts = [header];
    const offsets = new Array(totalObjects + 1).fill(0);
    let length = header.length;
    for (let objectNumber = 1; objectNumber <= totalObjects; objectNumber += 1) {
      offsets[objectNumber] = length;
      const wrapped = concatenateBytes([
        asciiBytes(`${objectNumber} 0 obj\n`),
        objects[objectNumber],
        asciiBytes("\nendobj\n"),
      ]);
      parts.push(wrapped);
      length += wrapped.length;
    }
    const xrefOffset = length;
    let xref = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
    for (let objectNumber = 1; objectNumber <= totalObjects; objectNumber += 1) {
      xref += `${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`;
    }
    xref += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R /Info ${infoObject} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    parts.push(asciiBytes(xref));
    return concatenateBytes(parts);
  }

  /*
   * One place decides what an export is called, so the two pages that can
   * trigger one never disagree. The date is the night the watch closed, not
   * the moment of export, so re-exporting the same record overwrites it
   * instead of collecting copies, while a second watch keeps its own file.
   */
  function exportName(kind, playerName, completedAt) {
    const safe = String(playerName || "Watchkeeper")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "Watchkeeper";
    const stamp = Number(completedAt);
    const when = new Date(Number.isFinite(stamp) && stamp > 0 ? stamp : Date.now());
    const day = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}-${String(
      when.getDate(),
    ).padStart(2, "0")}`;
    const label = kind === "report" ? "Observation_Report" : "Night_Watch_Log";
    return `Aurora_Station_${label}_${safe}_${day}.pdf`;
  }

  function triggerPdfDownload(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = globalScope.document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "Aurora_Station_Profile.pdf";
    anchor.style.display = "none";
    globalScope.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    globalScope.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function downloadProfile(data, state, core, filename, options) {
    const settings = options || {};
    const profile = core.scoreProfile(data, state);
    if (!profile) {
      throw new Error("Complete the journey before exporting the profile.");
    }
    if (globalScope.document?.fonts?.ready) {
      await globalScope.document.fonts.ready;
    }

    const safeState = core.sanitiseState(data, state);
    const stamp = Number(safeState.completedAt);
    const dateLabel = new Date(
      Number.isFinite(stamp) && stamp > 0 ? stamp : Date.now(),
    ).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

    const { canvas, context } = exportCanvas();
    const summary = core.summariseProfile(data, profile);
    // Overview, the contribution in full, the movement, one page per current,
    // the relationships, the observations, and the reading guidance.
    const pageCount = profile.domains.length + 6;
    const images = [];

    const capture = async (pageNumber, draw) => {
      context.clearRect(0, 0, EXPORT_PAGE_WIDTH, EXPORT_PAGE_HEIGHT);
      draw();
      images.push(await canvasToJpegBytes(canvas));
      if (typeof settings.onProgress === "function") {
        settings.onProgress(pageNumber, pageCount, `Rendering page ${pageNumber} of ${pageCount}`);
      }
      await new Promise((resolve) => globalScope.setTimeout(resolve, 0));
    };

    await capture(1, () =>
      drawProfileOverviewPage(context, data, profile, summary, dateLabel, pageCount),
    );
    await capture(2, () =>
      drawProfileRolePage(context, data, profile, summary, 2, pageCount),
    );
    await capture(3, () =>
      drawProfilePhasePage(context, data, profile, summary, 3, pageCount),
    );
    for (let index = 0; index < profile.domains.length; index += 1) {
      const pageNumber = index + 4;
      await capture(pageNumber, () =>
        drawProfileDomainPage(
          context,
          data,
          profile,
          profile.domains[index],
          pageNumber,
          pageCount,
        ),
      );
    }
    await capture(pageCount - 2, () =>
      drawProfileRelationsPage(context, data, profile, summary, core, pageCount - 2, pageCount),
    );
    await capture(pageCount - 1, () =>
      drawProfileObservationPage(context, data, profile, summary, pageCount - 1, pageCount),
    );
    await capture(pageCount, () =>
      drawProfileGuidancePage(context, data, profile, pageCount, pageCount),
    );

    if (typeof settings.onAssembling === "function") {
      settings.onAssembling();
    }
    const pdfBytes = buildImagePdf(images, {
      title: `Aurora Station observation report — ${profile.playerName || "Watchkeeper"}`,
      createdAt: Number(safeState.completedAt),
    });
    triggerPdfDownload(
      pdfBytes,
      filename || exportName("report", profile.playerName, safeState.completedAt),
    );
    return { pageCount: images.length, byteLength: pdfBytes.length };
  }

  const api = {
    buildStoryBlocks,
    exportName,
    layoutStoryPages,
    download: downloadStoryPdf,
    downloadStory: downloadStoryPdf,
    downloadProfile,
  };
  globalScope.AuroraPdf = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
