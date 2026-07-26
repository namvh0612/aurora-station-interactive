(function attachAuroraImage(globalScope) {
  "use strict";

  const SERIF_FONT = '"Source Serif 4", Georgia, serif';
  const TECHNICAL_FONT = '"IBM Plex Mono", monospace';

  function wrapLines(context, text, maxWidth) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });

    if (line) {
      lines.push(line);
    }
    return lines;
  }

  function drawText(context, text, x, y, maxWidth, lineHeight) {
    const lines = wrapLines(context, text, maxWidth);
    lines.forEach((line, index) => {
      context.fillText(line, x, y + index * lineHeight);
    });
    return y + lines.length * lineHeight;
  }

  function drawRule(context, x, y, width, colour, lineWidth) {
    context.strokeStyle = colour;
    context.lineWidth = lineWidth || 2;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + width, y);
    context.stroke();
  }

  function pointAt(index, count, radius, centreX, centreY) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    return {
      x: centreX + Math.cos(angle) * radius,
      y: centreY + Math.sin(angle) * radius,
    };
  }

  function polygon(context, points) {
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.closePath();
  }

  function drawRadar(context, profile, x, y, size) {
    const centreX = x + size / 2;
    const centreY = y + size / 2;
    const radius = size * 0.295;
    const count = profile.elements.length;

    context.strokeStyle = "#cbd2cf";
    context.lineWidth = 1.5;
    [2, 3, 4, 5, 6].forEach((level) => {
      const ringRadius = radius * ((level - 1) / 5);
      const points = profile.elements.map((_result, index) =>
        pointAt(index, count, ringRadius, centreX, centreY),
      );
      polygon(context, points);
      context.stroke();
    });

    profile.elements.forEach((_result, index) => {
      const end = pointAt(index, count, radius, centreX, centreY);
      context.beginPath();
      context.moveTo(centreX, centreY);
      context.lineTo(end.x, end.y);
      context.stroke();
    });

    const valuePoints = profile.elements.map((result, index) => {
      const ratio =
        result.score === null ? 0 : Math.max(0, (result.score - 1) / 5);
      return pointAt(index, count, radius * ratio, centreX, centreY);
    });
    polygon(context, valuePoints);
    context.fillStyle = "rgba(49, 95, 105, 0.14)";
    context.fill();
    context.strokeStyle = "#315f69";
    context.lineWidth = 4;
    context.stroke();

    valuePoints.forEach((point, index) => {
      context.fillStyle = profile.elements[index].colour;
      context.strokeStyle = "#f1f0e9";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(point.x, point.y, 8, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    });

    context.fillStyle = "#172d35";
    context.font = `600 21px ${TECHNICAL_FONT}`;
    profile.elements.forEach((result, index) => {
      const point = pointAt(index, count, radius + 58, centreX, centreY);
      context.textAlign =
        point.x < centreX - 12
          ? "right"
          : point.x > centreX + 12
            ? "left"
            : "center";
      context.textBaseline = "middle";
      context.fillText(result.element, point.x, point.y);
    });
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
  }

  function drawInsight(context, x, y, width, title, body) {
    drawRule(context, x, y, width, "#cbd2cf", 2);

    context.fillStyle = "#315f69";
    context.font = `600 18px ${TECHNICAL_FONT}`;
    context.fillText(title, x, y + 42);

    context.fillStyle = "#3e5359";
    context.font = `400 23px ${SERIF_FONT}`;
    return drawText(context, body, x, y + 88, width, 33);
  }

  async function buildProfileBlob(profile) {
    if (!profile || !profile.narrative) {
      throw new Error("A complete profile is required for PNG export.");
    }

    if (document.fonts) {
      await Promise.all([
        document.fonts.load('400 29px "Source Serif 4"'),
        document.fonts.load('500 74px "Source Serif 4"'),
        document.fonts.load('600 22px "IBM Plex Mono"'),
      ]);
      await document.fonts.ready;
    }

    const narrative = profile.narrative;
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 3600;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is unavailable.");
    }

    context.fillStyle = "#f1f0e9";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#416c75";
    context.font = `600 22px ${TECHNICAL_FONT}`;
    context.fillText("DAWN DEBRIEF  ·  FINAL WATCH COMPLETE", 120, 125);

    context.fillStyle = "#172d35";
    context.font = `500 74px ${SERIF_FONT}`;
    let y = drawText(context, narrative.title, 120, 230, 1360, 82);

    context.fillStyle = "#315f69";
    context.font = `italic 500 29px ${SERIF_FONT}`;
    y = drawText(context, narrative.strapline, 120, y + 6, 1360, 41) + 42;

    context.fillStyle = "#3e5359";
    context.font = `400 29px ${SERIF_FONT}`;
    y = drawText(context, profile.overview, 120, y, 1360, 44) + 36;

    drawRule(context, 120, y, 1360, "#cbd2cf", 2);
    context.fillStyle = "#416c75";
    context.font = `600 18px ${TECHNICAL_FONT}`;
    context.textAlign = "center";
    context.fillText("SIGNAL MAP  ·  YOUR RESPONSE SHAPE", 800, y + 44);
    context.textAlign = "left";

    drawRadar(context, profile, 470, y + 45, 660);
    y += 735;

    context.fillStyle = "#5c6b70";
    context.font = `400 18px ${TECHNICAL_FONT}`;
    y =
      drawText(
        context,
        "The shape shows which response styles appeared more consistently in this journey. It is not a percentage or a comparison with other people.",
        280,
        y,
        1040,
        29,
      ) + 58;

    context.fillStyle = "#172d35";
    context.font = `500 38px ${SERIF_FONT}`;
    context.fillText("Reading the pattern", 120, y);
    y += 48;

    const insights = [
      ["NATURAL STRENGTHS", narrative.strengths.join(" • ")],
      ["DECISION RHYTHM", narrative.rhythm],
      ["WHEN PRESSURE RISES", narrative.pressure],
      ["USEFUL COUNTERBALANCE", narrative.watchOut],
    ];

    const firstRowY = y;
    const firstLeftEnd = drawInsight(
      context,
      120,
      firstRowY,
      650,
      insights[0][0],
      insights[0][1],
    );
    const firstRightEnd = drawInsight(
      context,
      830,
      firstRowY,
      650,
      insights[1][0],
      insights[1][1],
    );
    y = Math.max(firstLeftEnd, firstRightEnd) + 58;

    const secondLeftEnd = drawInsight(
      context,
      120,
      y,
      650,
      insights[2][0],
      insights[2][1],
    );
    const secondRightEnd = drawInsight(
      context,
      830,
      y,
      650,
      insights[3][0],
      insights[3][1],
    );
    y = Math.max(secondLeftEnd, secondRightEnd) + 88;

    context.fillStyle = "#172d35";
    context.font = `500 38px ${SERIF_FONT}`;
    context.fillText("How your five currents showed up", 120, y);
    y += 52;
    drawRule(context, 120, y, 1360, "#cbd2cf", 2);
    y += 38;

    profile.elements.forEach((result) => {
      context.fillStyle = result.colour;
      context.fillRect(120, y - 17, 17, 17);

      context.fillStyle = "#172d35";
      context.font = `600 21px ${TECHNICAL_FONT}`;
      context.fillText(`${result.element}  ·  ${result.expression}`, 162, y);

      context.fillStyle = "#4d6167";
      context.font = `400 22px ${SERIF_FONT}`;
      const rowEnd = drawText(
        context,
        `${result.lens}. ${result.practicalReading}`,
        162,
        y + 38,
        1288,
        31,
      );
      y = rowEnd + 25;
      drawRule(context, 162, y, 1288, "#d7ddda", 1);
      y += 38;
    });

    const footerY = Math.max(y + 20, 3450);
    drawRule(context, 120, footerY, 1360, "#cbd2cf", 2);
    context.fillStyle = "#5c6b70";
    context.font = `400 17px ${TECHNICAL_FONT}`;
    drawText(
      context,
      "A story-based Five Elements reflection adapted from Big Five dimensions. It describes tendencies in Aurora Station, not a diagnosis, fixed type or population percentile.",
      120,
      footerY + 48,
      1360,
      27,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("PNG creation failed.")),
        "image/png",
      );
    });
  }

  async function downloadProfile(profile, _visuals, filename) {
    const blob = await buildProfileBlob(profile);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "Aurora_Station_Profile.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const api = { buildProfileBlob, downloadProfile };
  globalScope.AuroraImage = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
