(function attachAuroraImage(globalScope) {
  "use strict";

  function wrapLines(context, text, maxWidth) {
    const words = String(text || "").split(/\s+/);
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
    if (line) lines.push(line);
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
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
    context.stroke();
  }

  function loadSvg(svg) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Chart image could not be rendered."));
      };
      image.src = url;
    });
  }

  async function buildProfileBlob(profile, visuals) {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 2200;
    const context = canvas.getContext("2d");
    context.fillStyle = "#f6f4ef";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#2d6378";
    context.font = "700 24px Roboto, Arial, sans-serif";
    context.fillText("YOUR AURORA PROFILE", 120, 125);

    context.fillStyle = "#17202a";
    context.font = "500 74px Roboto, Arial, sans-serif";
    let y = drawText(context, profile.identityTitle, 120, 230, 1360, 82);

    context.fillStyle = "#2d6378";
    context.font = "700 28px Roboto, Arial, sans-serif";
    context.fillText(profile.identitySubtitle, 120, y + 20);
    y += 95;

    context.fillStyle = "#334750";
    context.font = "400 29px Roboto, Arial, sans-serif";
    y = drawText(context, profile.overview, 120, y, 1360, 45) + 40;

    const chart = await loadSvg(
      visuals.radarSvg(profile, {
        size: 620,
        radius: 185,
        centre: 310,
        showScores: false,
      }),
    );
    context.drawImage(chart, 490, y, 620, 620);
    y += 650;

    const cards = [
      ["WHAT YOU NATURALLY BRING", profile.strengths.join(" • ")],
      ["WHAT TO WATCH", profile.watchOuts.join(" • ")],
      ["WHEN PRESSURE RISES", profile.pressureStyle],
      ["WORKING WITH YOU", profile.collaborationStyle],
    ];

    cards.forEach(([title, body], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 120 + column * 690;
      const cardY = y + row * 310;
      context.fillStyle = "rgba(255,255,255,0.72)";
      context.strokeStyle = "#d9d8d3";
      context.lineWidth = 2;
      roundedRect(context, x, cardY, 650, 270, 22);
      context.fillStyle = "#2d6378";
      context.font = "700 21px Roboto, Arial, sans-serif";
      context.fillText(title, x + 32, cardY + 48);
      context.fillStyle = "#3e4d55";
      context.font = "400 23px Roboto, Arial, sans-serif";
      drawText(context, body, x + 32, cardY + 90, 585, 34);
    });

    context.fillStyle = "#6b7479";
    context.font = "400 18px Roboto, Arial, sans-serif";
    drawText(
      context,
      "A structured Five Elements reflection adapted from Big Five dimensions. Not a diagnosis or population percentile.",
      120,
      2135,
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

  async function downloadProfile(profile, visuals, filename) {
    const blob = await buildProfileBlob(profile, visuals);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "Aurora_Station_My_Profile.png";
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
