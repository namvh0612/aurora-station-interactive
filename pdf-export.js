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

  function setExportFont(context, size, family, weight, style) {
    const selectedFamily = family === "mono"
      ? '"IBM Plex Mono", "Courier New", monospace'
      : '"Source Serif 4", Georgia, serif';
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
    context.fillStyle = options.colour || "#172d35";
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
    context.strokeStyle = colour || "#cbd2cf";
    context.lineWidth = width || 2;
    context.beginPath();
    context.moveTo(EXPORT_MARGIN, y);
    context.lineTo(EXPORT_PAGE_WIDTH - EXPORT_MARGIN, y);
    context.stroke();
  }

  function drawExportPageBase(context, pageNumber, playerName, accent) {
    context.fillStyle = "#f1f0e9";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, EXPORT_PAGE_HEIGHT);

    const wash = context.createRadialGradient(
      EXPORT_PAGE_WIDTH - 250,
      190,
      20,
      EXPORT_PAGE_WIDTH - 250,
      190,
      620,
    );
    wash.addColorStop(0, `${accent || "#6f98a8"}24`);
    wash.addColorStop(1, "rgba(241,240,233,0)");
    context.fillStyle = wash;
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, 1050);

    context.fillStyle = accent || "#6f98a8";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, 8);

    drawExportText(
      context,
      `AURORA STATION  |  ${playerName || "WATCHKEEPER"}`.toUpperCase(),
      EXPORT_MARGIN,
      105,
      1500,
      { size: 25, family: "mono", weight: 600, colour: "#697b80", lineHeight: 32 },
    );
    drawExportText(
      context,
      `PAGE ${pageNumber} OF 8`,
      EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
      105,
      360,
      { size: 25, family: "mono", weight: 600, colour: "#697b80", align: "right", lineHeight: 32 },
    );

    drawExportRule(context, EXPORT_PAGE_HEIGHT - 135, "#cbd2cf", 2);
    drawExportText(
      context,
      "Aurora Station · Reflective profile · Non-commercial use",
      EXPORT_MARGIN,
      EXPORT_PAGE_HEIGHT - 76,
      1600,
      { size: 23, family: "mono", colour: "#788489", lineHeight: 30 },
    );
  }

  function drawExportHeading(context, eyebrow, title, introduction, accent) {
    let y = 220;
    y = drawExportText(context, eyebrow.toUpperCase(), EXPORT_MARGIN, y, 1800, {
      size: 27,
      family: "mono",
      weight: 600,
      colour: accent || "#416c75",
      lineHeight: 38,
    });
    y += 86;
    y = drawExportText(context, title, EXPORT_MARGIN, y, EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2, {
      size: 82,
      weight: 500,
      colour: "#172d35",
      lineHeight: 88,
      maxLines: 2,
    });
    if (introduction) {
      y += 24;
      y = drawExportText(context, introduction, EXPORT_MARGIN, y, 1960, {
        size: 35,
        colour: "#56696f",
        lineHeight: 50,
        maxLines: 4,
      });
    }
    y += 32;
    drawExportRule(context, y, "#cbd2cf", 2);
    return y + 54;
  }

  function drawExportLabel(context, label, x, y, colour) {
    return drawExportText(context, label.toUpperCase(), x, y, 980, {
      size: 25,
      family: "mono",
      weight: 600,
      colour: colour || "#607277",
      lineHeight: 34,
      maxLines: 2,
    });
  }

  function drawExportSpectrum(context, result, x, y, width, compact) {
    const height = compact ? 230 : 280;
    const labelY = y + 44;
    drawExportText(context, `${result.element.toUpperCase()} · ${result.trait}`, x, labelY, width - 260, {
      size: compact ? 34 : 39,
      weight: 600,
      colour: "#172d35",
      lineHeight: 44,
      maxLines: 1,
    });
    drawExportText(context, `${result.score.toFixed(1)} / ${result.scaleMax}`, x + width, labelY, 250, {
      size: compact ? 30 : 34,
      family: "mono",
      weight: 600,
      colour: result.colour,
      align: "right",
      lineHeight: 40,
    });

    const axisY = y + (compact ? 118 : 138);
    const axisX1 = x;
    const axisX2 = x + width;
    const balancedX1 = axisX1 + width * 0.45;
    const balancedX2 = axisX1 + width * 0.55;
    context.fillStyle = "rgba(82,108,114,0.08)";
    context.fillRect(balancedX1, axisY - 18, balancedX2 - balancedX1, 36);
    context.strokeStyle = "#b7c3c0";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(axisX1, axisY);
    context.lineTo(axisX2, axisY);
    context.stroke();
    context.strokeStyle = result.colour;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(axisX1, axisY);
    context.lineTo(axisX1 + width * result.position, axisY);
    context.stroke();
    context.fillStyle = result.colour;
    context.beginPath();
    context.arc(axisX1 + width * result.position, axisY, 12, 0, Math.PI * 2);
    context.fill();

    drawExportText(context, result.spectrum.lower, axisX1, axisY + 54, width * 0.46, {
      size: compact ? 22 : 25,
      family: "mono",
      colour: "#6a777b",
      lineHeight: 30,
      maxLines: 1,
    });
    drawExportText(context, result.spectrum.higher, axisX2, axisY + 54, width * 0.46, {
      size: compact ? 22 : 25,
      family: "mono",
      colour: "#6a777b",
      align: "right",
      lineHeight: 30,
      maxLines: 1,
    });
    drawExportText(context, result.expression.toUpperCase(), x, axisY + 103, width, {
      size: compact ? 21 : 24,
      family: "mono",
      weight: 600,
      colour: result.colour,
      lineHeight: 30,
      maxLines: 1,
    });
    return y + height;
  }

  function drawExportRolePage(context, profile) {
    const role = profile.role;
    drawExportPageBase(context, 1, profile.playerName, role.colour);
    let y = drawExportHeading(
      context,
      "01 · Recommended Aurora Role",
      role.title,
      `${role.element} · ${role.trait}`,
      role.colour,
    );

    context.strokeStyle = `${role.colour}99`;
    context.lineWidth = 3;
    context.strokeRect(EXPORT_MARGIN, y, EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2, 1880);
    context.fillStyle = `${role.colour}0c`;
    context.fillRect(EXPORT_MARGIN, y, EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2, 1880);

    drawExportText(context, role.fit.toUpperCase(), EXPORT_PAGE_WIDTH - EXPORT_MARGIN - 36, y + 68, 460, {
      size: 25,
      family: "mono",
      weight: 600,
      colour: role.colour,
      align: "right",
      lineHeight: 32,
    });
    let cardY = y + 108;
    cardY = drawExportText(context, role.definition, EXPORT_MARGIN + 58, cardY, 1910, {
      size: 38,
      colour: "#41565c",
      lineHeight: 54,
      maxLines: 4,
    });
    cardY += 36;
    drawExportRule(context, cardY, `${role.colour}55`, 2);
    cardY += 62;

    const columns = [EXPORT_MARGIN + 58, EXPORT_MARGIN + 1090];
    const blockWidth = 900;
    const blocks = [
      ["Mission function", role.function],
      ["What you bring", role.whatYouBring],
      ["Watch for", role.watchFor],
      ["Mission action", `${role.actionTitle} — ${role.action}`],
    ];
    blocks.forEach(([label, copy], index) => {
      const bx = columns[index % 2];
      const by = cardY + Math.floor(index / 2) * 420;
      drawExportLabel(context, label, bx, by, role.colour);
      drawExportText(context, copy, bx, by + 58, blockWidth, {
        size: 34,
        colour: "#2f464d",
        lineHeight: 49,
        maxLines: 6,
      });
    });

    const whyY = cardY + 860;
    drawExportLabel(context, "Why this role", EXPORT_MARGIN + 58, whyY, role.colour);
    let next = drawExportText(context, role.why, EXPORT_MARGIN + 58, whyY + 58, 1960, {
      size: 34,
      colour: "#324950",
      lineHeight: 49,
      maxLines: 5,
    });
    next += 18;
    drawExportText(context, role.basis, EXPORT_MARGIN + 58, next, 1960, {
      size: 24,
      family: "mono",
      colour: "#718084",
      lineHeight: 35,
      maxLines: 5,
    });
  }

  function drawExportSpectrumPage(context, profile) {
    drawExportPageBase(context, 2, profile.playerName, "#6f98a8");
    let y = drawExportHeading(
      context,
      "02 · Five-Element Profile",
      "How the five currents showed up",
      "Each current is a bipolar range. Neither end is automatically better, and the shaded centre marks the balanced or context-sensitive range.",
      "#416c75",
    );
    profile.elements.forEach((result) => {
      y = drawExportSpectrum(
        context,
        result,
        EXPORT_MARGIN,
        y,
        EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2,
        true,
      );
      drawExportText(context, result.description, EXPORT_MARGIN, y + 52, EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2, {
        size: 26,
        colour: "#42575d",
        lineHeight: 37,
        maxLines: 2,
      });
      y += 164;
      drawExportRule(context, y - 24, "#d1d6d2", 2);
    });
    drawExportText(
      context,
      "These are raw scores within Aurora Station. They are not percentages, population percentiles or rankings between people.",
      EXPORT_MARGIN,
      Math.min(y + 10, EXPORT_PAGE_HEIGHT - 250),
      EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2,
      { size: 24, family: "mono", colour: "#6a7378", lineHeight: 34, maxLines: 3 },
    );
  }

  function drawExportMovementPage(context, profile) {
    drawExportPageBase(context, 3, profile.playerName, "#6f98a8");
    let y = drawExportHeading(
      context,
      "03 · Context Movement",
      "How the pattern moved",
      profile.context.note,
      "#416c75",
    );
    const width = EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2;
    const lineX1 = EXPORT_MARGIN + 380;
    const lineX2 = EXPORT_PAGE_WIDTH - EXPORT_MARGIN - 360;
    profile.elements.forEach((result) => {
      const rowTop = y;
      drawExportText(context, result.element, EXPORT_MARGIN, rowTop + 74, 320, {
        size: 34,
        weight: 600,
        colour: result.colour,
        lineHeight: 42,
      });
      const points = result.context.stages.map((stage, index) => {
        const px = lineX1 + ((lineX2 - lineX1) * index) / 2;
        const py = rowTop + 112 - (stage.score - 1) / 4 * 84;
        return { x: px, y: py, score: stage.score };
      });
      context.strokeStyle = result.colour;
      context.lineWidth = 4;
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.stroke();
      points.forEach((point, index) => {
        context.fillStyle = result.colour;
        context.beginPath();
        context.arc(point.x, point.y, 11, 0, Math.PI * 2);
        context.fill();
        drawExportText(context, point.score.toFixed(1), point.x, rowTop + 162, 180, {
          size: 24,
          family: "mono",
          colour: "#52666c",
          align: "center",
          lineHeight: 30,
        });
        if (result === profile.elements[0]) {
          drawExportText(context, profile.context.stages[index].label.toUpperCase(), point.x, rowTop - 10, 320, {
            size: 20,
            family: "mono",
            weight: 600,
            colour: "#718084",
            align: "center",
            lineHeight: 27,
          });
        }
      });
      drawExportText(
        context,
        `${result.context.delta > 0 ? "+" : ""}${result.context.delta.toFixed(1)}`,
        EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
        rowTop + 72,
        260,
        { size: 31, family: "mono", weight: 600, colour: result.colour, align: "right", lineHeight: 39 },
      );
      drawExportText(context, result.context.label, EXPORT_PAGE_WIDTH - EXPORT_MARGIN, rowTop + 119, 330, {
        size: 23,
        colour: "#64757a",
        align: "right",
        lineHeight: 31,
        maxLines: 2,
      });
      y += 335;
      drawExportRule(context, y - 36, "#d1d6d2", 2);
    });

    const observationY = y + 6;
    context.fillStyle = "rgba(255,255,255,0.3)";
    context.fillRect(EXPORT_MARGIN, observationY, width, 450);
    context.fillStyle = "#6f98a8";
    context.fillRect(EXPORT_MARGIN, observationY, 8, 450);
    drawExportLabel(context, "Context observations", EXPORT_MARGIN + 48, observationY + 68, "#416c75");
    const observations = profile.context.highlights.length
      ? profile.context.highlights.slice(0, 3)
      : [profile.context.summary];
    let oy = observationY + 130;
    observations.forEach((text) => {
      oy = drawExportText(context, `• ${text}`, EXPORT_MARGIN + 48, oy, width - 100, {
        size: 30,
        colour: "#42575d",
        lineHeight: 43,
        maxLines: 3,
      });
      oy += 18;
    });
  }

  function drawExportDetailPage(context, profile, result, pageNumber, isLast) {
    drawExportPageBase(context, pageNumber, profile.playerName, result.colour);
    let y = drawExportHeading(
      context,
      `${String(pageNumber).padStart(2, "0")} · Current Detail`,
      `${result.element} · ${result.trait}`,
      result.plainMeaning,
      result.colour,
    );

    y = drawExportSpectrum(
      context,
      result,
      EXPORT_MARGIN,
      y,
      EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2,
      false,
    );
    y += 28;

    const facetWidth = 1000;
    result.facets.forEach((facet, index) => {
      const x = EXPORT_MARGIN + index * 1060;
      context.fillStyle = "rgba(255,255,255,0.28)";
      context.fillRect(x, y, facetWidth, 360);
      context.fillStyle = result.colour;
      context.fillRect(x, y, 7, 360);
      drawExportLabel(context, facet.name, x + 46, y + 70, result.colour);
      drawExportText(context, `${facet.score.toFixed(1)} / ${result.scaleMax}`, x + 46, y + 137, 320, {
        size: 53,
        family: "mono",
        weight: 600,
        colour: "#172d35",
        lineHeight: 60,
      });
      drawExportText(
        context,
        result.facetDefinitions[facet.name] || "",
        x + 46,
        y + 215,
        facetWidth - 90,
        { size: 27, colour: "#52656a", lineHeight: 39, maxLines: 4 },
      );
    });
    y += 420;

    drawExportLabel(context, "Facet pattern", EXPORT_MARGIN, y, result.colour);
    y = drawExportText(context, result.facetPattern, EXPORT_MARGIN, y + 58, EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2, {
      size: 31,
      colour: "#41565c",
      lineHeight: 46,
      maxLines: 5,
    });
    y += 32;

    const blocks = [
      ["Potential advantage", result.potentialAdvantage],
      ["Possible overextension", result.overextension],
      ["Reflection", result.reflection],
    ];
    blocks.forEach(([label, copy]) => {
      drawExportLabel(context, label, EXPORT_MARGIN, y, result.colour);
      y = drawExportText(context, copy, EXPORT_MARGIN, y + 56, EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2, {
        size: 32,
        colour: "#324950",
        lineHeight: 47,
        maxLines: 5,
      });
      y += 38;
    });

    if (isLast) {
      const panelY = Math.min(Math.max(y + 20, 2540), EXPORT_PAGE_HEIGHT - 780);
      context.fillStyle = "rgba(255,255,255,0.3)";
      context.fillRect(EXPORT_MARGIN, panelY, EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2, 570);
      drawExportLabel(context, "Final operational outcome", EXPORT_MARGIN + 44, panelY + 62, result.colour);
      drawExportText(context, profile.finalChoice?.title || "Not recorded", EXPORT_MARGIN + 44, panelY + 128, 900, {
        size: 38,
        weight: 600,
        colour: "#172d35",
        lineHeight: 48,
      });
      drawExportText(context, profile.finalChoice?.note || "", EXPORT_MARGIN + 44, panelY + 188, 930, {
        size: 25,
        family: "mono",
        colour: "#697b80",
        lineHeight: 35,
        maxLines: 4,
      });
      drawExportLabel(context, "Response quality", EXPORT_MARGIN + 1130, panelY + 62, result.colour);
      drawExportText(context, profile.quality.status, EXPORT_MARGIN + 1130, panelY + 128, 820, {
        size: 36,
        weight: 600,
        colour: "#172d35",
        lineHeight: 46,
      });
      drawExportText(context, profile.quality.summary, EXPORT_MARGIN + 1130, panelY + 188, 900, {
        size: 25,
        colour: "#607277",
        lineHeight: 36,
        maxLines: 6,
      });
      drawExportText(
        context,
        "Aurora Station is a self-reflection experience inspired by the Big Five framework. It is not a diagnosis, fixed personality type, validated recruitment assessment or basis for high-impact decisions. Intended for personal reflection, learning and non-commercial team discussion.",
        EXPORT_MARGIN + 44,
        panelY + 455,
        EXPORT_PAGE_WIDTH - EXPORT_MARGIN * 2 - 88,
        { size: 23, family: "mono", colour: "#6a7378", lineHeight: 33, maxLines: 4 },
      );
    }
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
        case "results":
          break;
        case "chosen":
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
      return { size: 34, lineHeight: 52, colour: "#344c55", style: "italic", after: 32 };
    }
    return { size: 34, lineHeight: 52, colour: "#263a42", style: "normal", after: 28 };
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
    context.fillStyle = "#f1f0e9";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, EXPORT_PAGE_HEIGHT);
    context.fillStyle = "#2d6378";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, 8);
    drawExportText(
      context,
      `AURORA STATION  |  ${playerName || "WATCHKEEPER"}`.toUpperCase(),
      EXPORT_MARGIN,
      105,
      1500,
      { size: 25, family: "mono", weight: 600, colour: "#697b80", lineHeight: 32 },
    );
    drawExportText(
      context,
      `PAGE ${pageNumber} OF ${pageCount}`,
      EXPORT_PAGE_WIDTH - EXPORT_MARGIN,
      105,
      420,
      { size: 25, family: "mono", weight: 600, colour: "#697b80", align: "right", lineHeight: 32 },
    );
    drawExportRule(context, EXPORT_PAGE_HEIGHT - 135, "#cbd2cf", 2);
    drawExportText(
      context,
      "Aurora Station - Personal story - Non-commercial use",
      EXPORT_MARGIN,
      EXPORT_PAGE_HEIGHT - 76,
      1600,
      { size: 23, family: "mono", colour: "#788489", lineHeight: 30 },
    );
  }

  function drawStoryCover(context, data, playerName, pageCount) {
    context.fillStyle = "#06131d";
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, EXPORT_PAGE_HEIGHT);
    const aurora = context.createLinearGradient(0, 0, EXPORT_PAGE_WIDTH, 1150);
    aurora.addColorStop(0, "rgba(88,229,239,0.68)");
    aurora.addColorStop(0.24, "rgba(49,203,183,0.52)");
    aurora.addColorStop(0.5, "rgba(102,216,138,0.42)");
    aurora.addColorStop(0.74, "rgba(139,114,232,0.46)");
    aurora.addColorStop(1, "rgba(211,109,168,0.32)");
    context.fillStyle = aurora;
    context.fillRect(0, 0, EXPORT_PAGE_WIDTH, 1080);
    const fade = context.createLinearGradient(0, 500, 0, 1450);
    fade.addColorStop(0, "rgba(6,19,29,0)");
    fade.addColorStop(1, "#06131d");
    context.fillStyle = fade;
    context.fillRect(0, 480, EXPORT_PAGE_WIDTH, 1000);

    drawExportText(context, "THE FINAL WATCH", EXPORT_MARGIN, 520, 1500, {
      size: 34,
      family: "mono",
      weight: 600,
      colour: "#7ee5ef",
      lineHeight: 44,
    });
    drawExportText(context, cleanText(data.title), EXPORT_MARGIN, 720, STORY_TEXT_WIDTH, {
      size: 152,
      weight: 500,
      colour: "#f4f7f4",
      lineHeight: 160,
      maxLines: 2,
    });
    drawExportText(context, cleanText(data.subtitle), EXPORT_MARGIN, 1130, STORY_TEXT_WIDTH, {
      size: 62,
      style: "italic",
      colour: "#c8d8dc",
      lineHeight: 76,
    });
    drawExportText(context, "A journey shaped by your decisions", EXPORT_MARGIN, 1390, STORY_TEXT_WIDTH, {
      size: 34,
      family: "mono",
      colour: "#91a8b0",
      lineHeight: 44,
    });
    drawExportText(context, `WATCHKEEPER - ${playerName || "FINAL WATCH"}`, EXPORT_MARGIN, 2920, STORY_TEXT_WIDTH, {
      size: 30,
      family: "mono",
      weight: 600,
      colour: "#91a8b0",
      lineHeight: 40,
    });
    drawExportText(context, `${pageCount} PAGES`, EXPORT_PAGE_WIDTH - EXPORT_MARGIN, 2920, 500, {
      size: 30,
      family: "mono",
      weight: 600,
      colour: "#91a8b0",
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
          family: "mono",
          weight: 600,
          colour: "#2d6378",
          lineHeight: 38,
        });
        y += 70;
        y = drawExportText(context, command.block.title, EXPORT_MARGIN, y, STORY_TEXT_WIDTH, {
          size: 76,
          weight: 500,
          colour: "#172d35",
          lineHeight: 86,
          maxLines: 2,
        });
        y += 24;
        drawExportText(context, command.block.time, EXPORT_MARGIN, y, STORY_TEXT_WIDTH, {
          size: 27,
          family: "mono",
          colour: "#697b80",
          lineHeight: 38,
        });
        return;
      }
      if (command.type === "chosen") {
        context.fillStyle = "rgba(45,99,120,0.07)";
        context.fillRect(EXPORT_MARGIN, command.y, STORY_TEXT_WIDTH, command.height);
        context.fillStyle = "#6f98a8";
        context.fillRect(EXPORT_MARGIN, command.y, 8, command.height);
        setExportFont(context, command.style.size, "serif", 400, "italic");
        context.fillStyle = "#29434e";
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
    if (safeState.answers.length < core.flattenItems(data).length) {
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
    drawStoryCover(context, data, safeState.playerName, totalPages);
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
        safeState.playerName,
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
    const pdfBytes = buildImagePdf(images);
    triggerPdfDownload(pdfBytes, filename || "Aurora_Station_Story.pdf");
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

  function buildImagePdf(images) {
    const pageCount = images.length;
    const totalObjects = 2 + pageCount * 3;
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

    objects[1] = asciiBytes("<< /Type /Catalog /Pages 2 0 R >>");
    objects[2] = asciiBytes(
      `<< /Type /Pages /Count ${pageCount} /Kids [${pageRefs.join(" ")}] >>`,
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
    xref += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    parts.push(asciiBytes(xref));
    return concatenateBytes(parts);
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
    const profile = core.analyseProfile(data, state);
    if (!profile.complete) {
      throw new Error("Complete the journey before exporting the profile.");
    }
    if (globalScope.document?.fonts?.ready) {
      await globalScope.document.fonts.ready;
    }
    const { canvas, context } = exportCanvas();
    const images = [];
    const renderers = [
      () => drawExportRolePage(context, profile),
      () => drawExportSpectrumPage(context, profile),
      () => drawExportMovementPage(context, profile),
      ...profile.elements.map((result, index) => () =>
        drawExportDetailPage(context, profile, result, index + 4, index === profile.elements.length - 1),
      ),
    ];

    for (let index = 0; index < renderers.length; index += 1) {
      context.clearRect(0, 0, EXPORT_PAGE_WIDTH, EXPORT_PAGE_HEIGHT);
      renderers[index]();
      images.push(await canvasToJpegBytes(canvas));
      if (typeof settings.onProgress === "function") {
        settings.onProgress(index + 1, renderers.length, `Rendering page ${index + 1} of ${renderers.length}`);
      }
      await new Promise((resolve) => globalScope.setTimeout(resolve, 0));
    }

    if (typeof settings.onAssembling === "function") {
      settings.onAssembling();
    }
    const pdfBytes = buildImagePdf(images);
    triggerPdfDownload(pdfBytes, filename || "Aurora_Station_Profile.pdf");
    return { pageCount: images.length, byteLength: pdfBytes.length };
  }

  const api = {
    buildStoryBlocks,
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
