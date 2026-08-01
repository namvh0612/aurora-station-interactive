/*
 * Aurora Station — artwork.
 *
 * Every image in this project is drawn, not photographed. The motifs are the
 * things a polar observatory actually produces: magnetic-field contours, chart
 * recorder traces, calibration rules, ice-core columns, an observation window,
 * and one instrument face per behavioural current.
 *
 * Everything is deterministic. A given seed always draws the same figure, so a
 * reload never reshuffles the artwork under the reader.
 */
(function attachAuroraArtwork(globalScope) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  /* A small deterministic generator, so figures are stable across reloads. */
  function sequence(seed) {
    let value = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function seedFrom(text) {
    let total = 7;
    String(text)
      .split("")
      .forEach((character) => {
        total = (total * 31 + character.charCodeAt(0)) % 2147483647;
      });
    return total;
  }

  function svg(width, height, className) {
    const node = document.createElementNS(NS, "svg");
    node.setAttribute("viewBox", `0 0 ${width} ${height}`);
    node.setAttribute("preserveAspectRatio", "xMidYMid slice");
    node.setAttribute("focusable", "false");
    node.setAttribute("aria-hidden", "true");
    if (className) {
      node.setAttribute("class", className);
    }
    return node;
  }

  function shape(name, attributes) {
    const node = document.createElementNS(NS, name);
    Object.entries(attributes || {}).forEach(([key, value]) => {
      node.setAttribute(key, String(value));
    });
    return node;
  }

  function path(points, closed) {
    return points
      .map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`)
      .join(" ")
      .concat(closed ? " Z" : "");
  }

  /* ---------------------------------------------------------- the ground */

  /*
   * A polar horizon: the land is a low, quiet band and most of the frame is
   * the sky above it. The ridge is drawn from the seed so each Act has its own
   * skyline without any of them looking arbitrary.
   */
  function horizon(target, seed, width, height) {
    const next = sequence(seed);
    const baseline = height * (0.62 + next() * 0.12);
    const points = [];
    let elevation = baseline;
    for (let x = 0; x <= width; x += width / 48) {
      elevation += (next() - 0.5) * height * 0.035;
      elevation = Math.max(baseline - height * 0.09, Math.min(baseline + height * 0.05, elevation));
      points.push([x, elevation]);
    }
    points.push([width, height], [0, height]);
    target.appendChild(shape("path", { d: path(points, true), class: "art-ground" }));

    // A second, further ridge sits behind it and reads as distance.
    const far = [];
    let distant = baseline - height * 0.06;
    for (let x = 0; x <= width; x += width / 30) {
      distant += (next() - 0.5) * height * 0.02;
      far.push([x, distant]);
    }
    far.push([width, baseline], [0, baseline]);
    target.appendChild(shape("path", { d: path(far, true), class: "art-ridge" }));
    return baseline;
  }

  /*
   * Magnetic-field contours. Concentric, slightly irregular loops around a
   * drifting centre — the shape a magnetometer chart makes, not a decorative
   * gradient.
   */
  function fieldContours(target, seed, width, height, count) {
    const next = sequence(seed + 17);
    const centreX = width * (0.28 + next() * 0.44);
    const centreY = height * (0.24 + next() * 0.3);
    const rings = count || 9;

    for (let ring = 0; ring < rings; ring += 1) {
      const scale = (ring + 1) / rings;
      const points = [];
      for (let angle = 0; angle <= 360; angle += 12) {
        const radians = (angle * Math.PI) / 180;
        const wobble = 1 + Math.sin(radians * 3 + ring) * 0.06 + (next() - 0.5) * 0.03;
        points.push([
          centreX + Math.cos(radians) * width * 0.34 * scale * wobble,
          centreY + Math.sin(radians) * height * 0.3 * scale * wobble * 0.82,
        ]);
      }
      target.appendChild(
        shape("path", {
          d: path(points, true),
          class: "art-contour",
          "data-ring": String(ring),
        }),
      );
    }
  }

  /* A chart-recorder trace: one continuous pen line with an event in it. */
  function recorderTrace(target, seed, width, height, disturbance) {
    const next = sequence(seed + 41);
    const middle = height * 0.5;
    const points = [];
    const event = 0.45 + next() * 0.2;

    for (let step = 0; step <= 240; step += 1) {
      const progress = step / 240;
      const distance = Math.abs(progress - event);
      const spike = distance < 0.12 ? Math.cos((distance / 0.12) * Math.PI * 0.5) : 0;
      const noise = (next() - 0.5) * height * 0.05;
      const swell = Math.sin(progress * Math.PI * 6) * height * 0.05;
      points.push([
        progress * width,
        middle + noise + swell + spike * height * 0.34 * (disturbance || 0),
      ]);
    }
    target.appendChild(shape("path", { d: path(points, false), class: "art-trace" }));
  }

  /* Calibration rules — the ruled edge of an instrument, not decoration. */
  function calibration(target, width, height, divisions) {
    const steps = divisions || 40;
    for (let index = 0; index <= steps; index += 1) {
      const x = (index / steps) * width;
      const major = index % 5 === 0;
      target.appendChild(
        shape("line", {
          x1: x,
          y1: height,
          x2: x,
          y2: height - (major ? height * 0.5 : height * 0.22),
          class: major ? "art-tick art-tick-major" : "art-tick",
        }),
      );
    }
  }

  /* The observation window: a structural frame the story is seen through. */
  function windowFrame(target, width, height) {
    const inset = Math.min(width, height) * 0.06;
    target.appendChild(
      shape("rect", {
        x: inset,
        y: inset,
        width: width - inset * 2,
        height: height - inset * 2,
        class: "art-frame",
      }),
    );
    target.appendChild(
      shape("line", {
        x1: width * 0.5,
        y1: inset,
        x2: width * 0.5,
        y2: height - inset,
        class: "art-mullion",
      }),
    );
    [0.34, 0.66].forEach((ratio) => {
      target.appendChild(
        shape("line", {
          x1: inset,
          y1: height * ratio,
          x2: width - inset,
          y2: height * ratio,
          class: "art-mullion",
        }),
      );
    });
  }

  /* ------------------------------------------------------------ act plate */

  /*
   * The full-bleed figure behind an Act opening. Composition tightens as the
   * watch degrades: the horizon drops, the contours multiply and the recorder
   * picks up the disturbance.
   */
  function actPlate(actNumber, phase, options) {
    const settings = options || {};
    const width = 1200;
    const height = 760;
    const figure = svg(width, height, "art-plate");
    figure.dataset.phase = phase;
    figure.dataset.act = String(actNumber);

    const seed = seedFrom(`act-${actNumber}-${phase}`);
    const disturbance =
      phase === "baseline" ? 0.15 : phase === "pressure" ? 0.75 : 0.4;

    const sky = shape("g", { class: "art-sky" });
    fieldContours(sky, seed, width, height, phase === "baseline" ? 6 : 11);
    figure.appendChild(sky);

    const ground = shape("g", { class: "art-terrain" });
    horizon(ground, seed, width, height);
    figure.appendChild(ground);

    const instruments = shape("g", { class: "art-instruments" });
    recorderTrace(instruments, seed, width, height * 0.42, disturbance);
    figure.appendChild(instruments);

    const rule = shape("g", {
      class: "art-rule",
      transform: `translate(0 ${height - 34})`,
    });
    calibration(rule, width, 26, phase === "pressure" ? 60 : 36);
    figure.appendChild(rule);

    if (settings.window) {
      const frame = shape("g", { class: "art-window" });
      windowFrame(frame, width, height);
      figure.appendChild(frame);
    }

    return figure;
  }

  /* ------------------------------------------------------- ice-core column */

  /* A drilled column, read as the record of a night in layers. */
  function coreColumn(segments, activeIndex) {
    const width = 96;
    const height = 620;
    const figure = svg(width, height, "art-core");
    figure.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const next = sequence(seedFrom("core"));
    const band = height / segments;

    for (let index = 0; index < segments; index += 1) {
      const y = index * band;
      figure.appendChild(
        shape("rect", {
          x: width * 0.28,
          y,
          width: width * 0.44,
          height: band - 2,
          class: "art-core-band",
          "data-state": index < activeIndex ? "read" : index === activeIndex ? "reading" : "unread",
        }),
      );
      const strata = 2 + Math.floor(next() * 3);
      for (let line = 0; line < strata; line += 1) {
        const offset = y + band * ((line + 1) / (strata + 1));
        figure.appendChild(
          shape("line", {
            x1: width * 0.28,
            y1: offset,
            x2: width * 0.72,
            y2: offset,
            class: "art-core-strata",
          }),
        );
      }
    }

    figure.appendChild(
      shape("line", { x1: width * 0.5, y1: 0, x2: width * 0.5, y2: height, class: "art-core-axis" }),
    );
    return figure;
  }

  /* -------------------------------------------------------- instrument face */

  /*
   * One dial per behavioural current. The needle is the reading; the arc is
   * the range it could have taken. No numbers are exposed here — the figure is
   * the illustration, and the exact value is always in the text beside it.
   */
  function instrumentDial(normalised, colour, label) {
    const size = 180;
    const figure = svg(size, size * 0.7, "art-dial");
    figure.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const centreX = size * 0.5;
    const centreY = size * 0.58;
    const radius = size * 0.38;
    const sweep = 140;
    const start = 180 + (180 - sweep) / 2;

    const arcPoints = [];
    for (let angle = start; angle <= start + sweep; angle += 4) {
      const radians = (angle * Math.PI) / 180;
      arcPoints.push([centreX + Math.cos(radians) * radius, centreY + Math.sin(radians) * radius]);
    }
    figure.appendChild(shape("path", { d: path(arcPoints, false), class: "art-dial-arc" }));

    for (let index = 0; index <= 8; index += 1) {
      const angle = start + (sweep * index) / 8;
      const radians = (angle * Math.PI) / 180;
      const inner = radius * (index % 2 === 0 ? 0.86 : 0.93);
      figure.appendChild(
        shape("line", {
          x1: centreX + Math.cos(radians) * inner,
          y1: centreY + Math.sin(radians) * inner,
          x2: centreX + Math.cos(radians) * radius,
          y2: centreY + Math.sin(radians) * radius,
          class: "art-dial-tick",
        }),
      );
    }

    const reading = start + sweep * Math.max(0, Math.min(1, normalised));
    const radians = (reading * Math.PI) / 180;
    const needle = shape("line", {
      x1: centreX,
      y1: centreY,
      x2: centreX + Math.cos(radians) * radius * 0.82,
      y2: centreY + Math.sin(radians) * radius * 0.82,
      class: "art-dial-needle",
    });
    needle.style.setProperty("--trace", colour);
    figure.appendChild(needle);
    figure.appendChild(shape("circle", { cx: centreX, cy: centreY, r: 4, class: "art-dial-pin" }));

    if (label) {
      figure.setAttribute("aria-hidden", "true");
    }
    return figure;
  }

  /* ------------------------------------------------------------ the aurora */

  /*
   * Ribbons drawn as masked bands rather than a glow. Intensity is a number
   * from 0 to 1 that the caller raises as the event develops, so the aurora
   * arrives gradually instead of switching on.
   */
  function auroraRibbons(count) {
    const width = 1200;
    const height = 520;
    const figure = svg(width, height, "art-aurora");
    figure.setAttribute("preserveAspectRatio", "none");
    const next = sequence(seedFrom("aurora"));
    const ribbons = count || 4;

    for (let index = 0; index < ribbons; index += 1) {
      const top = height * (0.1 + index * 0.14);
      const amplitude = height * (0.08 + next() * 0.09);
      const upper = [];
      const lower = [];
      for (let x = 0; x <= width; x += width / 40) {
        const wave =
          Math.sin((x / width) * Math.PI * (2 + index * 0.6) + index) * amplitude +
          Math.sin((x / width) * Math.PI * 7) * amplitude * 0.2;
        upper.push([x, top + wave]);
        lower.push([x, top + wave + height * (0.1 + next() * 0.08)]);
      }
      const band = shape("path", {
        d: `${path(upper, false)} L${width} ${height} L0 ${height} Z`,
        class: "art-aurora-band",
        "data-band": String(index),
      });
      figure.appendChild(band);
      const edge = shape("path", { d: path(upper, false), class: "art-aurora-edge" });
      figure.appendChild(edge);
    }

    return figure;
  }

  /* --------------------------------------------------------------- texture */

  /* Halftone and grain, applied as one reusable overlay element. */
  function grainOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "art-grain";
    overlay.setAttribute("aria-hidden", "true");
    return overlay;
  }

  const api = {
    actPlate,
    auroraRibbons,
    calibration,
    coreColumn,
    fieldContours,
    grainOverlay,
    horizon,
    instrumentDial,
    recorderTrace,
    seedFrom,
    windowFrame,
  };

  globalScope.AuroraArtwork = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
