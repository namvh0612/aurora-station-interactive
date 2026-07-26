(function attachAuroraImage(globalScope) {
  "use strict";

  const FONT_STACK = "Roboto, Arial, sans-serif";

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

  function roundedRect(context, x, y, width, height, radius) {
    const right = x + width;
    const bottom = y + height;
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(right - radius, y);
    context.quadraticCurveTo(right, y, right, y + radius);
    context.lineTo(right, bottom - radius);
    context.quadraticCurveTo(right, bottom, right - radius, bottom);
    context.lineTo(x + radius, bottom);
    context.quadraticCurveTo(x, bottom, x, bottom - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
    context.fill();
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

    context.strokeStyle = "#d8dcda";
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
    context.fillStyle = "rgba(45, 99, 120, 0.16)";
    context.fill();
    context.strokeStyle = "#2d6378";
    context.lineWidth = 4;
    context.stroke();

    valuePoints.forEach((point, index) => {
      context.fillStyle = profile.elements[index].colour;
      context.strokeStyle = "#f6f4ef";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(point.x, point.y, 8, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    });

    context.fillStyle = "#17202a";
    context.font = `700 22px ${FONT_STACK}`;
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

  function profileCard(context, x, y, title, body) {
    context.fillStyle = "rgba(255,255,255,0.72)";
    context.strokeStyle = "#d9d8d3";
    context.lineWidth = 2;
    roundedRect(context, x, y, 650, 390, 22);

    context.fillStyle = "#2d6378";
    context.font = `700 21px ${FONT_STACK}`;
    context.fillText(title, x + 32, y + 50);

    context.fillStyle = "#3e4d55";
    context.font = `400 23px ${FONT_STACK}`;
    drawText(context, body, x + 32, y + 96, 585, 34);
  }

  async function buildProfileBlob(profile) {
    if (!profile || !profile.narrative) {
      throw new Error("A complete profile is required for PNG export.");
    }

    if (document.fonts) {
      await Promise.all([
        document.fonts.load(`400 29px ${FONT_STACK}`),
        document.fonts.load(`500 74px ${FONT_STACK}`),
        document.fonts.load(`700 24px ${FONT_STACK}`),
      ]);
      await document.fonts.ready;
    }

    const narrative = profile.narrative;
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 3200;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is unavailable.");
    }

    context.fillStyle = "#f6f4ef";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#2d6378";
    context.font = `700 24px ${FONT_STACK}`;
    context.fillText("YOUR AURORA PROFILE", 120, 125);

    context.fillStyle = "#17202a";
    context.font = `500 74px ${FONT_STACK}`;
    let y = drawText(context, narrative.title, 120, 230, 1360, 82);

    context.fillStyle = "#2d6378";
    context.font = `500 28px ${FONT_STACK}`;
    y = drawText(context, narrative.strapline, 120, y + 6, 1360, 40) + 45;

    context.fillStyle = "#334750";
    context.font = `400 29px ${FONT_STACK}`;
    y = drawText(context, profile.overview, 120, y, 1360, 45) + 28;

    drawRadar(context, profile, 470, y, 660);
    y += 680;

    context.fillStyle = "#68727a";
    context.font = `400 20px ${FONT_STACK}`;
    y =
      drawText(
        context,
        "The shape shows which response styles appeared more consistently in this journey. It is not a percentage or a comparison with other people.",
        280,
        y,
        1040,
        30,
      ) + 42;

    const cards = [
      ["WHAT YOU NATURALLY BRING", narrative.strengths.join(" • ")],
      ["YOUR DECISION RHYTHM", narrative.rhythm],
      ["WHEN PRESSURE RISES", narrative.pressure],
      ["A USEFUL COUNTERBALANCE", narrative.watchOut],
    ];

    cards.forEach(([title, body], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      profileCard(
        context,
        120 + column * 690,
        y + row * 420,
        title,
        body,
      );
    });
    y += 855;

    context.fillStyle = "#17202a";
    context.font = `500 38px ${FONT_STACK}`;
    context.fillText("How your five currents showed up", 120, y);
    y += 58;

    profile.elements.forEach((result) => {
      context.fillStyle = result.colour;
      context.beginPath();
      context.arc(134, y + 20, 9, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "#17202a";
      context.font = `700 24px ${FONT_STACK}`;
      context.fillText(`${result.element} · ${result.expression}`, 165, y + 8);

      context.fillStyle = "#58666d";
      context.font = `400 21px ${FONT_STACK}`;
      drawText(
        context,
        `${result.lens}. ${result.practicalReading}`,
        165,
        y + 43,
        1285,
        30,
      );
      y += 122;
    });

    context.strokeStyle = "#d9d8d3";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(120, 3070);
    context.lineTo(1480, 3070);
    context.stroke();

    context.fillStyle = "#6b7479";
    context.font = `400 18px ${FONT_STACK}`;
    drawText(
      context,
      "A story-based Five Elements reflection adapted from Big Five dimensions. It describes tendencies in Aurora Station, not a diagnosis, fixed type or population percentile.",
      120,
      3120,
      1360,
      28,
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
