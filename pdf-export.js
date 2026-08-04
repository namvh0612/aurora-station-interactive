(function attachAuroraPdf(globalScope) {
  "use strict";

  /*
   * The export's face has no dash glyphs, so every dash becomes a hyphen. It
   * has to take the surrounding spacing with it: an unspaced em dash set as an
   * unspaced hyphen printed "a personality change-the kind of shift", which
   * reads as a compound word rather than a break in the sentence. A dash that
   * was already spaced keeps its single spaces rather than gaining more.
   */
  function cleanText(value) {
    return String(value || "")
      .replace(/[ \t]*[\u2010\u2011\u2012\u2013\u2014][ \t]*/g, " - ")
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
  /*
   * `titleAccent` is for the five pages that carry an element: there the title
   * *is* the element, and setting it in ink made the one word that says which
   * line you are reading the only mark on the page without its colour. The
   * section pages keep an ink title, because a section is not an element.
   */
  function drawExportHeading(context, eyebrow, title, introduction, accent, titleAccent) {
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
      colour: titleAccent ? accent : "#14181a",
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
   * One dial, matching the instrument on screen: an arc for the range the
   * reading could have taken, ticks along it, and a needle at the reading. No
   * number on the face — the figure illustrates, the text states the value.
   */
  function drawInstrumentDial(context, centreX, centreY, radius, normalised, colour) {
    const from = Math.PI * 0.82;
    const to = Math.PI * 2.18;
    const at = from + (to - from) * Math.max(0, Math.min(1, normalised));

    context.save();
    context.strokeStyle = "#c1caca";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(centreX, centreY, radius, from, to);
    context.stroke();

    for (let step = 0; step <= 8; step += 1) {
      const angle = from + ((to - from) * step) / 8;
      const major = step % 2 === 0;
      const inner = radius - (major ? 26 : 14);
      context.strokeStyle = major ? "#5c6568" : "#c1caca";
      context.lineWidth = major ? 3 : 2;
      context.beginPath();
      context.moveTo(centreX + Math.cos(angle) * inner, centreY + Math.sin(angle) * inner);
      context.lineTo(centreX + Math.cos(angle) * radius, centreY + Math.sin(angle) * radius);
      context.stroke();
    }

    context.strokeStyle = colour;
    context.lineWidth = 7;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(centreX, centreY);
    context.lineTo(centreX + Math.cos(at) * (radius - 18), centreY + Math.sin(at) * (radius - 18));
    context.stroke();

    context.fillStyle = "#14181a";
    context.beginPath();
    context.arc(centreX, centreY, 11, 0, Math.PI * 2);
    context.fill();
    context.restore();
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
  function drawProfileOverviewPage(context, data, profile, summary, core, dateLabel, pageCount) {
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

    drawExportLabel(context, data.results.overviewLabel, EXPORT_MARGIN, y, "#14181a");
    y += 62;
    y = drawExportText(context, data.results.heading, EXPORT_MARGIN, y, width, {
      size: 62,
      colour: "#14181a",
      lineHeight: 74,
      maxLines: 1,
    });
    y += 40;

    /*
     * The five lines at a glance, each with a name at both ends: the element,
     * what it reads, the finding, the line, then the two names. The same order
     * the report sets them in — the finding used to sit out to the right of
     * the name, where it wrapped onto a second line and landed on the track.
     */
    profile.currents.forEach((current) => {
      drawExportText(context, current.name.toUpperCase(), EXPORT_MARGIN, y + 40, 700, {
        size: 42,
        family: "sans",
        weight: 600,
        // The element's own colour, as the report sets it.
        colour: current.colourPaper,
        lineHeight: 52,
        maxLines: 1,
      });
      drawExportText(context, current.axis, EXPORT_PAGE_WIDTH - EXPORT_MARGIN, y + 46, width - 740, {
        size: 27,
        family: "sans",
        colour: "#5c6568",
        align: "right",
        lineHeight: 36,
        maxLines: 1,
      });
      drawExportText(
        context,
        spectrumReadout(current, data.results.labels, core.MAGNITUDE_CLEAR).toUpperCase(),
        EXPORT_MARGIN,
        y + 100,
        width,
        { size: 27, family: "sans", weight: 600, colour: "#4b5457", lineHeight: 36, maxLines: 1 },
      );
      drawSpectrum(
        context,
        EXPORT_MARGIN,
        y + 148,
        width,
        current,
        current.colourPaper,
        { min: profile.scaleMin, max: profile.scaleMax },
        { centreBand: core.MAGNITUDE_CLEAR },
      );
      y += 268;
    });

    y += 24;
    drawExportRule(context, y, "#c1caca", 2);
    y += 52;
    y = drawExportText(context, data.results.notATypeStatement, EXPORT_MARGIN, y, width, {
      size: 28,
      colour: "#4b5457",
      lineHeight: 42,
      maxLines: 3,
    });
    y += 30;
    drawExportText(context, data.assessment.spectra.note, EXPORT_MARGIN, y, width, {
      size: 28,
      colour: "#4b5457",
      lineHeight: 42,
      maxLines: 4,
    });
  }

  /*
   * The contribution read against the other four: which one it tends to feed,
   * which tends to feed it, and which holds it in check. A reading of
   * relationships between contributions, never a rating of people.
   */
  function drawProfileRelationsPage(context, data, profile, summary, core, pageNumber, pageCount) {
    const primary = profile.currents.reduce(
      (best, entry) => (Math.abs(entry.magnitude) > Math.abs(best.magnitude) ? entry : best),
      profile.currents[0],
    );
    const relations = core.relationsFor(data, primary.id);
    const element = core.elementForCurrent(data, primary.id);
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
    // The shadow line the report shows under the current name, which the export
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
      const named = profile.currents.find(
        (entry) => entry.id === data.assessment.elements[elementId].current,
      );
      return { id: named.id, label: named.name, colour: named.colourPaper };
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
      const other = profile.currents.find((entry) => entry.id === relations[key]);
      const otherElement = core.elementForCurrent(data, other.id);
      // A mark beside the name, not a bar down the side of it.
      context.fillStyle = other.colourPaper;
      context.beginPath();
      context.arc(EXPORT_MARGIN + 10, y - 8, 10, 0, Math.PI * 2);
      context.fill();

      drawExportLabel(context, label, EXPORT_MARGIN + 44, y, other.colourPaper);
      y += 50;
      const otherCurrent = profile.currents.find((entry) => entry.domain === other.domain);
      y = drawExportText(context, otherCurrent ? otherCurrent.name : other.name, EXPORT_MARGIN + 44, y, width - 44, {
        size: 44,
        colour: "#14181a",
        lineHeight: 54,
        maxLines: 1,
      });
      y += 16;
      y = drawExportText(
        context,
        copy[key].replace("{current}", other.name),
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


  /* Page 2: how the pattern moved between the three story phases. */
  function drawProfilePhasePage(context, data, profile, summary, core, pageNumber, pageCount) {
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

    /*
     * The headline of a stretch is the line that sat furthest from the middle
     * of the scale in it, named at the end it sat on. There is no leading
     * contribution to print here any more, and a magnitude is the only thing
     * five separate readings can be ranked by without inventing a total.
     */
    const furthest = (phase) =>
      phase.currents.reduce(
        (best, entry) =>
          Number.isFinite(entry.magnitude) &&
          (!best || Math.abs(entry.magnitude) > Math.abs(best.magnitude))
            ? entry
            : best,
        null,
      );

    [
      ["Starting", profile.phases[0]],
      ["Under pressure", profile.phases[1]],
      ["After pressure", profile.phases[2]],
    ].forEach(([label, phase], index) => {
      const x = EXPORT_MARGIN + index * (columnWidth + 40);
      const lead = furthest(phase);
      drawExportLabel(context, label, x, y, "#14181a");
      const named = lead ? poleNameFor(lead, core.MAGNITUDE_CLEAR) : "";
      drawExportText(context, named || "—", x, y + 74, columnWidth, {
        size: 40,
        colour: lead ? lead.colourPaper : "#14181a",
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
    y += 40;

    /*
     * The observations the movement chapter prints on the web, printed here
     * too. The report and the record have to agree about what the night did.
     */
    const labels = data.results.labels;
    drawExportLabel(context, labels.observations, EXPORT_MARGIN, y, "#14181a");
    y += 58;

    const returned = core.describeReturn(data, profile);
    [summary.adaptation, returned ? data.results.returnCopy[returned] : null]
      .filter(Boolean)
      .forEach((line) => {
        y = drawExportText(context, line, EXPORT_MARGIN, y, width, {
          size: 27,
          colour: "#262b2d",
          lineHeight: 40,
          maxLines: 4,
        });
        y += 24;
      });
    y += 30;

    /*
     * Three rules per contribution, one for each stretch of the watch, each
     * labelled once at the left of its own row so no two labels can collide
     * and two equal readings cannot land on top of each other. The marks are
     * then joined down the rows, so the shift is a shape the eye follows
     * rather than three positions to compare: a contribution that did not move
     * draws a straight line, one that swung draws a visible bend.
     */
    const trackX = EXPORT_MARGIN + 560;
    const trackWidth = width - 560 - 220;
    const at = (normalised) => trackX + trackWidth * Math.max(0, Math.min(1, normalised));
    const ROW = 52;

    // The scale, named once at the top rather than on every row.
    drawExportText(context, `${profile.scaleMin}`, trackX, y - 12, 80, {
      size: 23, family: "sans", colour: "#5c6568", align: "center", lineHeight: 30,
    });
    drawExportText(context, `${profile.scaleMax}`, trackX + trackWidth, y - 12, 80, {
      size: 23, family: "sans", colour: "#5c6568", align: "center", lineHeight: 30,
    });
    y += 34;

    profile.currents.forEach((line) => {
      const readings = profile.phases.map((phase) => ({
        phase,
        entry: phase.currents.find((candidate) => candidate.id === line.id),
      }));

      drawExportText(context, line.name, EXPORT_MARGIN, y + 34, 460, {
        size: 34, family: "sans", weight: 600, colour: "#14181a", lineHeight: 44, maxLines: 1,
      });

      const rowCentre = (index) => y + 24 + index * ROW;

      // The three ranges, one per stretch.
      readings.forEach(({ phase }, index) => {
        const centre = rowCentre(index);
        context.strokeStyle = "#c1caca";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(trackX, centre);
        context.lineTo(trackX + trackWidth, centre);
        context.stroke();
        for (let step = 0; step <= 4; step += 1) {
          const tick = trackX + (trackWidth * step) / 4;
          context.beginPath();
          context.moveTo(tick, centre - 6);
          context.lineTo(tick, centre + 6);
          context.stroke();
        }
        drawExportText(context, phase.shortLabel, EXPORT_MARGIN + 300, centre + 10, 250, {
          size: 23, family: "sans", colour: "#5c6568", lineHeight: 30, maxLines: 1,
        });
        drawExportText(
          context,
          readings[index].entry.score.toFixed(1),
          EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
          centre + 10,
          200,
          { size: 27, family: "sans", weight: 600, colour: "#14181a", align: "right", lineHeight: 34 },
        );
      });

      // The travel, joined down the rows and drawn first so a mark always
      // sits on top of it.
      context.strokeStyle = line.colourPaper;
      context.lineWidth = 4;
      context.beginPath();
      readings.forEach(({ entry }, index) => {
        const x = at(entry.normalised);
        const centre = rowCentre(index);
        if (index === 0) {
          context.moveTo(x, centre);
        } else {
          context.lineTo(x, centre);
        }
      });
      context.stroke();

      readings.forEach(({ entry }, index) => {
        const x = at(entry.normalised);
        const centre = rowCentre(index);
        context.lineWidth = 4;
        context.strokeStyle = line.colourPaper;
        context.fillStyle = "#e6eaeb";
        context.beginPath();
        context.arc(x, centre, 12, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        // The stretch under pressure is the filled one, so the middle of the
        // night is findable without reading the labels.
        if (index === 1) {
          context.fillStyle = line.colourPaper;
          context.beginPath();
          context.arc(x, centre, 6, 0, Math.PI * 2);
          context.fill();
        }
      });

      y += ROW * 3 + 44;
    });
  }

  /* One page per domain: interpretation, its guidance, then its three facets. */
  /*
   * Which end the reading is nearer, how far from the middle, and how firmly
   * that reads. Inside the middle band no end is named: naming one there would
   * put a pole against a distance of 0.04, which claims a side the responses
   * did not take. The report writes the same line the same way.
   */
  function poleNameFor(current, clear) {
    const distance = Math.abs(current.magnitude);
    return distance >= clear && current.pole ? current.pole.name : "";
  }

  function spectrumReadout(current, labels, clear) {
    const distance = Math.abs(current.magnitude);
    const named = poleNameFor(current, clear);
    return `${named ? `${named} · ` : ""}${distance.toFixed(2)} ${labels.fromCentre} · ${current.magnitudeLabel}`;
  }

  /*
   * The line a current is read on: a shaded middle, a mark where the reading
   * falls, and a name under each end. The reading is a position rather than a
   * quantity and the line has no top, so nothing here is drawn as a length.
   *
   * The same composition as the report: line first, names under it, the middle
   * shaded to the width a reading has to clear before an end is named. A
   * single tick at the centre said only "here is the middle"; a band says how
   * far from it a reading has to be before it means anything.
   */
  function drawSpectrum(context, x, y, width, current, trace, scale, options) {
    const settings = options || {};
    const span = scale.max - scale.min;
    const line = y + 20;
    const band = (settings.centreBand / span) * width;

    context.save();
    if (band > 0) {
      context.fillStyle = "rgba(20, 24, 26, 0.06)";
      context.fillRect(x + width / 2 - band, line - 22, band * 2, 44);
    }
    context.strokeStyle = "#c1caca";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(x, line);
    context.lineTo(x + width, line);
    context.stroke();

    // Held one radius inside each end, so a reading of 1.0 or 5.0 still draws
    // a whole mark on the line rather than half of one over its edge.
    const radius = 14;
    const share = Math.max(0, Math.min(1, (current.score - scale.min) / span));
    context.fillStyle = trace;
    context.beginPath();
    context.arc(x + radius + (width - radius * 2) * share, line, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const names = line + 46;
    drawExportText(context, current.poles.low.name.toUpperCase(), x, names, width * 0.36, {
      size: 26,
      family: "sans",
      weight: 600,
      colour: "#5c6568",
      lineHeight: 34,
      maxLines: 1,
    });
    if (settings.firmness) {
      drawExportText(context, settings.firmness.toUpperCase(), x + width / 2, names, width * 0.26, {
        size: 26,
        family: "sans",
        colour: "#5c6568",
        align: "center",
        lineHeight: 34,
        maxLines: 1,
      });
    }
    drawExportText(context, current.poles.high.name.toUpperCase(), x + width, names, width * 0.36, {
      size: 26,
      family: "sans",
      weight: 600,
      colour: "#5c6568",
      align: "right",
      lineHeight: 34,
      maxLines: 1,
    });

    return names + 44;
  }

  function drawProfileCurrentPage(context, data, profile, current, core, pageNumber, pageCount) {
    const trace = current.colourPaper || "#14181a";
    drawExportPageBase(context, pageNumber, profile.playerName, trace, pageCount);
    let y = drawExportHeading(
      context,
      `${String(pageNumber - 2).padStart(2, "0")} - Current`,
      current.name.toUpperCase(),
      current.axis,
      trace,
      true,
    );

    const width = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    const labels = data.results.labels;

    // The finding under the heading, the line under the finding, both names
    // under the line: the order the report reads them in.
    y += 8;
    drawExportText(
      context,
      spectrumReadout(current, labels, core.MAGNITUDE_CLEAR).toUpperCase(),
      EXPORT_MARGIN,
      y,
      width,
      { size: 27, family: "sans", weight: 600, colour: "#4b5457", lineHeight: 36, maxLines: 1 },
    );
    y += 62;
    y = drawSpectrum(
      context,
      EXPORT_MARGIN,
      y,
      width,
      current,
      trace,
      { min: profile.scaleMin, max: profile.scaleMax },
      { centreBand: core.MAGNITUDE_CLEAR, firmness: current.firmness ? current.firmness.id : "" },
    );
    y += 30;

    const block = (label, copy, maxLines) => {
      drawExportLabel(context, label, EXPORT_MARGIN, y, trace);
      y += 46;
      y = drawExportText(context, copy, EXPORT_MARGIN, y, width, {
        size: 28,
        colour: "#262b2d",
        lineHeight: 41,
        maxLines: maxLines || 4,
      });
      y += 30;
    };

    block(labels.look, current.pole.look);
    block(labels.misread, current.pole.misread);
    block(labels.advantage, current.guidance.advantage);
    block(labels.overextension, current.guidance.overextension);

    drawExportRule(context, y, "#c1caca", 2);
    y += 56;
    drawExportLabel(context, labels.divides, EXPORT_MARGIN, y, trace);
    y += 56;
    current.facets.forEach((facet) => {
      drawExportText(context, facet.name, EXPORT_MARGIN, y + 30, width - 520, {
        size: 30,
        weight: 600,
        colour: "#14181a",
        lineHeight: 40,
        maxLines: 1,
      });
      drawExportText(
        context,
        `${facet.score.toFixed(1)} / ${profile.scaleMax}`,
        EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
        y + 30,
        480,
        { size: 30, family: "sans", weight: 600, colour: trace, align: "right", lineHeight: 40 },
      );
      drawScoreTrack(context, EXPORT_MARGIN, y + 54, width, facet.normalised, trace);
      y += 108;
    });
    y += 16;
    y = drawExportText(context, current.divergence.copy, EXPORT_MARGIN, y, width, {
      size: 28,
      colour: "#262b2d",
      lineHeight: 41,
      maxLines: 3,
    });
    y += 34;

    if (current.firmness) {
      block(labels.firmness, current.firmness.copy, 3);
    }

    /*
     * The four lines about what this current asks of the other four used to
     * sit here as well as on the relations page, which said the same thing
     * twice under two headings. They are drawn once, there.
     */
    block(labels.tryThis, current.guidance.reflection, 3);
  }

  /*
   * How the scale itself was used, and how much each reading can be leaned on.
   * It closes the report's own loop: the five pages before it are only as firm
   * as the answers they were built from.
   */
  function drawProfileCalibrationPage(context, data, profile, core, pageNumber, pageCount) {
    const trace = "#14181a";
    drawExportPageBase(context, pageNumber, profile.playerName, trace, pageCount);
    const copy = data.results.calibration;
    let y = drawExportHeading(context, "Calibration", copy.scaleHeading, copy.intro, trace);
    const width = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    y += 40;

    const style = profile.responseStyle;
    if (style) {
      [
        [copy.labels.balance, style.balance.value.toFixed(2), style.balance.copy],
        [copy.labels.ends, `${Math.round(style.ends.share * 100)}%`, style.ends.copy],
        [copy.labels.middle, `${Math.round(style.middle.share * 100)}%`, style.middle.copy || ""],
        [
          copy.labels.agreement,
          `${style.agreement.held} / ${style.agreement.total}`,
          style.agreement.copy,
        ],
      ].forEach(([label, value, note]) => {
        drawExportText(context, label, EXPORT_MARGIN, y + 30, width - 640, {
          size: 30,
          weight: 600,
          colour: "#14181a",
          lineHeight: 40,
          maxLines: 1,
        });
        drawExportText(context, value, EXPORT_PAGE_WIDTH - EXPORT_MARGIN, y + 30, 600, {
          size: 30,
          family: "sans",
          weight: 600,
          colour: trace,
          align: "right",
          lineHeight: 40,
        });
        y += 76;
        if (note) {
          y = drawExportText(context, note, EXPORT_MARGIN, y, width, {
            size: 26,
            colour: "#5c6568",
            lineHeight: 38,
            maxLines: 3,
          });
        }
        y += 40;
        drawExportRule(context, y - 18, "#c1caca", 2);
      });
    }

    y += 40;
    drawExportLabel(context, copy.firmnessHeading, EXPORT_MARGIN, y, trace);
    y += 60;
    profile.currents.forEach((current) => {
      drawExportText(context, current.name, EXPORT_MARGIN, y, width - 900, {
        size: 30,
        weight: 600,
        colour: "#14181a",
        lineHeight: 40,
        maxLines: 1,
      });
      drawExportText(context, poleNameFor(current, core.MAGNITUDE_CLEAR) || "—", EXPORT_MARGIN + 420, y, 700, {
        size: 28,
        colour: "#5c6568",
        lineHeight: 40,
        maxLines: 1,
      });
      drawExportText(
        context,
        current.firmness ? current.firmness.id.toUpperCase() : "—",
        EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
        y,
        600,
        {
          size: 28,
          family: "sans",
          weight: 600,
          colour: current.colourPaper || trace,
          align: "right",
          lineHeight: 40,
        },
      );
      y += 62;
    });
  }

  /* Final page: how to read the profile, and where the structure comes from. */
  /*
   * The closing section and the back matter it carries, on one page.
   *
   * They used to be two, and both were mostly white: the observations had been
   * moved to the movement chapter where the report keeps them, which left a
   * page holding a single italic question. The web reads them as one section —
   * the question, then the record — so the export sets them as one page.
   */
  function drawProfileHandoverPage(context, data, profile, summary, pageNumber, pageCount) {
    drawExportPageBase(context, pageNumber, profile.playerName, "#14181a", pageCount);
    // By id, never by position: inserting a chapter before this one used to
    // slide the index and print the wrong heading over this page.
    const closing = data.results.chapters.find((entry) => entry.id === "close");
    const record = data.results.record;
    let y = drawExportHeading(context, closing.eyebrow, closing.title, null, "#14181a");

    const width = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    y += 20;
    drawExportLabel(context, data.results.labels.reflection, EXPORT_MARGIN, y, "#14181a");
    y += 60;
    y = drawExportText(context, summary.reflection, EXPORT_MARGIN, y, width, {
      size: 33,
      style: "italic",
      colour: "#262b2d",
      lineHeight: 48,
    });
    y += 30;
    y = drawExportText(context, data.results.notATypeStatement, EXPORT_MARGIN, y, width, {
      size: 29,
      colour: "#4b5457",
      lineHeight: 43,
    });

    y += 44;
    drawExportRule(context, y, "#c1caca", 2);
    y += 70;
    drawExportLabel(context, record.eyebrow, EXPORT_MARGIN, y, "#14181a");
    y += 66;
    y = drawExportText(context, record.title, EXPORT_MARGIN, y, width, {
      size: 46,
      colour: "#14181a",
      lineHeight: 58,
    });
    y += 40;

    // The same three headed blocks the report's colophon sets, in the same
    // order, so the download is not a differently worded version of it.
    [
      [record.whatHeading, data.assessment.methodNote],
      [
        record.notHeading,
        `${data.instrument.status}. ${data.instrument.statusNote} ${record.limitations}`,
      ],
      [record.structureHeading, `${data.instrument.attribution} ${record.mapping}`],
    ].forEach(([label, copy]) => {
      drawExportLabel(context, label, EXPORT_MARGIN, y, "#14181a");
      y += 56;
      y = drawExportText(context, copy, EXPORT_MARGIN, y, width, {
        size: 28,
        colour: "#262b2d",
        lineHeight: 42,
      });
      y += 42;
    });

    y += 10;
    drawExportRule(context, y, "#c1caca", 2);
    y += 52;
    [
      data.results.disclaimer,
      data.instrument.permission,
      data.assessment.bandNote,
      data.assessment.phaseNote,
      data.results.privacy,
    ].forEach((line) => {
      y = drawExportText(context, line, EXPORT_MARGIN, y, width, {
        size: 26,
        colour: "#4b5457",
        lineHeight: 39,
      });
      y += 22;
    });
    y += 12;
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
   * The responses exactly as they were pressed, in order, still on the scale
   * they were pressed on. Nothing is keyed and nothing is scored: this is the
   * log of the night, not a reading of it, so a statement written in the
   * opposite direction still draws whichever way the reader actually answered.
   */
  function responseSeries(state) {
    const answers = state?.assessment?.answers || {};
    const values = [];
    for (;;) {
      const value = answers[`q${String(values.length + 1).padStart(2, "0")}`];
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        return values;
      }
      values.push(value);
    }
  }

  /*
   * A Catmull-Rom spline written as cubic Béziers. Sixty points across the
   * page is far enough apart that straight segments would read as a saw, and
   * the slight overshoot at a reversal is what rounds the peaks.
   */
  const SPECTRUM_TENSION = 7.4;

  function strokeSmoothSeries(context, points) {
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (let index = 0; index < points.length - 1; index += 1) {
      const before = points[index > 0 ? index - 1 : 0];
      const from = points[index];
      const to = points[index + 1];
      const after = points[Math.min(index + 2, points.length - 1)];
      context.bezierCurveTo(
        from[0] + (to[0] - before[0]) / SPECTRUM_TENSION,
        from[1] + (to[1] - before[1]) / SPECTRUM_TENSION,
        to[0] - (after[0] - from[0]) / SPECTRUM_TENSION,
        to[1] - (after[1] - from[1]) / SPECTRUM_TENSION,
        to[0],
        to[1],
      );
    }
    context.stroke();
  }

  /*
   * The night as a spectrum rather than a chart: no axis, no scale, no item
   * numbers, nothing to read off. It is meant to be taken for instrument
   * output — the trace a recorder left running overnight — and it happens to
   * be entirely true.
   *
   * The centre line is the record itself. The bands around it open where the
   * answer was decisive and close toward the line where it sat on the middle
   * of the scale, so a night spent at the ends of the scale looks nothing like
   * a night spent hedging, without either being labelled as such. Every band
   * is a pure function of the sixty responses, so the same record always draws
   * the same figure and no two records draw the same one.
   *
   * Nothing is ruled and nothing is marked. A vertical division every five
   * observations would be true, and would also be the one stroke on the page
   * that turned an instrument trace into a chart with a grid behind it.
   */
  const SPECTRUM_BANDS = 9;
  const SPECTRUM_TOP = 1480;
  const SPECTRUM_HEIGHT = 800;

  function drawResponseSpectrum(context, values, top, height) {
    if (values.length < 2) {
      return;
    }
    /*
     * Edge to edge rather than inside the margin. The trace gains a sixth of
     * its length, which is a sixth off every slope, and running out of both
     * sides of the page reads as a recording that was already going before the
     * paper started.
     */
    const middle = top + height / 2;
    const carry = height * 0.16;
    const spread = height * 0.25;
    const at = (index) => (index / (values.length - 1)) * EXPORT_PAGE_WIDTH;
    /* 3 is the middle of the scale, so it draws on the centre line. */
    const level = (index) => middle - ((values[index] - 3) / 2) * carry;
    /*
     * The bands breathe rather than shut. Closing them all the way toward the
     * line on a run of middling answers packed nineteen strokes into a finger's
     * width and printed as a moiré screen, which read as a fault on the page
     * rather than as a quiet stretch of the night.
     */
    const opening = (index) => 0.62 + 0.38 * (Math.abs(values[index] - 3) / 2);

    context.save();
    context.strokeStyle = "#14181a";
    context.lineJoin = "round";
    context.lineCap = "round";

    /*
     * Evenly spaced and near enough evenly weighted, because bands that crowd
     * the centre and fade out of it read as a glow cast by the line rather
     * than as a spectrum the line sits inside. Printed rather than lit: a
     * hairline at 6% alpha disappears on paper, so even the outermost band
     * carries enough ink to survive the page.
     */
    context.lineWidth = 2;
    for (let band = SPECTRUM_BANDS; band >= 1; band -= 1) {
      const reach = (band / SPECTRUM_BANDS) * spread;
      context.globalAlpha = 0.54 - 0.16 * ((band - 1) / (SPECTRUM_BANDS - 1));
      [-1, 1].forEach((side) => {
        strokeSmoothSeries(
          context,
          values.map((value, index) => [
            at(index),
            level(index) + side * reach * opening(index),
          ]),
        );
      });
    }

    context.globalAlpha = 0.84;
    context.lineWidth = 4;
    strokeSmoothSeries(
      context,
      values.map((value, index) => [at(index), level(index)]),
    );
    context.restore();
  }

  /*
   * The record is read after the night, so its cover is dawn like every other
   * page: paper, mineral ink and a drawn horizon. No aurora — by the time the
   * record is printed the sky has already gone.
   */
  function drawStoryCover(context, data, state, pageCount) {
    const playerName = state.participant.name;
    context.fillStyle = "#e6eaeb";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, EXPORT_PAGE_HEIGHT);
    context.fillStyle = "#14181a";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, 8);

    drawResponseSpectrum(context, responseSeries(state), SPECTRUM_TOP, SPECTRUM_HEIGHT);

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
    drawStoryCover(context, data, safeState, totalPages);
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
        ` /Subject (${pdfString(info.subject || "A narrative self-reflection. Not a clinical instrument.")})` +
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
    // Overview, the night, one page per current, calibration, the
    // relationships, and the handover.
    const pageCount = profile.currents.length + 5;
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
      drawProfileOverviewPage(context, data, profile, summary, core, dateLabel, pageCount),
    );
    await capture(2, () =>
      drawProfilePhasePage(context, data, profile, summary, core, 2, pageCount),
    );
    for (let index = 0; index < profile.currents.length; index += 1) {
      const pageNumber = index + 3;
      await capture(pageNumber, () =>
        drawProfileCurrentPage(
          context,
          data,
          profile,
          profile.currents[index],
          core,
          pageNumber,
          pageCount,
        ),
      );
    }
    await capture(pageCount - 2, () =>
      drawProfileCalibrationPage(context, data, profile, core, pageCount - 2, pageCount),
    );
    await capture(pageCount - 1, () =>
      drawProfileRelationsPage(context, data, profile, summary, core, pageCount - 1, pageCount),
    );
    await capture(pageCount, () =>
      drawProfileHandoverPage(context, data, profile, summary, pageCount, pageCount),
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
    drawResponseSpectrum,
    exportName,
    layoutStoryPages,
    responseSeries,
    download: downloadStoryPdf,
    downloadStory: downloadStoryPdf,
    downloadProfile,
  };
  globalScope.AuroraPdf = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
