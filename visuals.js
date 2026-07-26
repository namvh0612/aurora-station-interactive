(function attachAuroraVisuals(globalScope) {
  "use strict";

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function pointAt(index, count, radius, centre) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    return {
      x: centre + Math.cos(angle) * radius,
      y: centre + Math.sin(angle) * radius,
    };
  }

  function pointsString(points) {
    return points
      .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
      .join(" ");
  }

  function radarSvg(profile, options) {
    const settings = Object.assign(
      {
        size: 480,
        radius: 145,
        centre: 240,
        showScores: true,
      },
      options || {},
    );
    const results = profile.elements;
    const count = results.length;
    const rings = [2, 3, 4, 5, 6];
    const grid = rings
      .map((level) => {
        const ringRadius = settings.radius * ((level - 1) / 5);
        const points = Array.from({ length: count }, (_value, index) =>
          pointAt(index, count, ringRadius, settings.centre),
        );
        return `<polygon points="${pointsString(points)}" fill="none" stroke="#d8dcda" stroke-width="1"/>`;
      })
      .join("");

    const axes = results
      .map((_result, index) => {
        const end = pointAt(
          index,
          count,
          settings.radius,
          settings.centre,
        );
        return `<line x1="${settings.centre}" y1="${settings.centre}" x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}" stroke="#d8dcda" stroke-width="1"/>`;
      })
      .join("");

    const valuePoints = results.map((result, index) => {
      const ratio =
        result.score === null ? 0 : Math.max(0, (result.score - 1) / 5);
      return pointAt(
        index,
        count,
        settings.radius * ratio,
        settings.centre,
      );
    });

    const nodes = valuePoints
      .map((point, index) => {
        const colour = results[index].colour;
        return `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="5.5" fill="${escapeXml(colour)}" stroke="#fbfaf7" stroke-width="2"/>`;
      })
      .join("");

    const labels = results
      .map((result, index) => {
        const point = pointAt(
          index,
          count,
          settings.radius + 42,
          settings.centre,
        );
        const anchor =
          point.x < settings.centre - 12
            ? "end"
            : point.x > settings.centre + 12
              ? "start"
              : "middle";
        const score =
          settings.showScores && result.score !== null
            ? `<tspan x="${point.x.toFixed(1)}" dy="17" fill="#68727a" font-size="12">${result.score.toFixed(2)}</tspan>`
            : "";
        return `<text x="${point.x.toFixed(1)}" y="${point.y.toFixed(1)}" text-anchor="${anchor}" fill="#17202a" font-family="Arial, sans-serif" font-size="14" font-weight="700">${escapeXml(result.element)}${score}</text>`;
      })
      .join("");

    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${settings.size} ${settings.size}" role="img" aria-labelledby="radar-title radar-description">` +
      `<title id="radar-title">Five Elements profile</title>` +
      `<desc id="radar-description">A radar chart showing Wood, Fire, Earth, Metal and Water scores on a one to six scale.</desc>` +
      grid +
      axes +
      `<polygon points="${pointsString(valuePoints)}" fill="#2d6378" fill-opacity="0.16" stroke="#2d6378" stroke-width="3" stroke-linejoin="round"/>` +
      nodes +
      labels +
      `</svg>`
    );
  }

  const api = { radarSvg };
  globalScope.AuroraVisuals = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
