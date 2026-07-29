let Mesh;
let Program;
let Renderer;
let Triangle;
let oglLoadPromise = null;

function loadOgl() {
  if (Renderer && Program && Mesh && Triangle) {
    return Promise.resolve();
  }
  if (!oglLoadPromise) {
    const moduleRequest = import("https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm");
    const timeout = new Promise((_, reject) => {
      window.setTimeout(
        () => reject(new Error("OGL did not load within the startup window.")),
        2800,
      );
    });
    oglLoadPromise = Promise.race([moduleRequest, timeout]).then((module) => {
      ({ Mesh, Program, Renderer, Triangle } = module);
    });
  }
  return oglLoadPromise;
}

const auroraConfig = {
  speed: 0.036,
  intensity: 0.72,
  brightness: 0.82,
  distortion: 0.24,
  maxPixelRatio: 1.75,
};

const phasePresets = {
  "station-drift": {
    speed: 0.03,
    intensity: 0.66,
    brightness: 0.8,
    distortion: 0.18,
    palette: [
      "#58e5ef",
      "#31cbb7",
      "#66d88a",
      "#468ee8",
      "#8b72e8",
      "#d36da8",
    ],
  },
  "system-pressure": {
    speed: 0.036,
    intensity: 0.7,
    brightness: 0.82,
    distortion: 0.22,
    palette: [
      "#5be9ef",
      "#2acbb6",
      "#5bd783",
      "#417fe0",
      "#8768df",
      "#c85f9f",
    ],
  },
  "the-silence-between": {
    speed: 0.028,
    intensity: 0.62,
    brightness: 0.78,
    distortion: 0.17,
    palette: [
      "#65ddea",
      "#36bda9",
      "#64c982",
      "#4c79cf",
      "#7867cf",
      "#b96398",
    ],
  },
  "under-ice-pulse": {
    speed: 0.044,
    intensity: 0.76,
    brightness: 0.84,
    distortion: 0.3,
    palette: [
      "#61f0f2",
      "#2bd9c0",
      "#75e58d",
      "#4a98f1",
      "#987bf0",
      "#db6cae",
    ],
  },
  "under-the-ice": {
    speed: 0.036,
    intensity: 0.7,
    brightness: 0.8,
    distortion: 0.26,
    palette: [
      "#5ae9f0",
      "#30cdb8",
      "#68d98a",
      "#4b8be5",
      "#876fe6",
      "#c566a3",
    ],
  },
};

const vertexShader = `
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform float uBrightness;
  uniform float uDistortion;
  uniform vec2 uResolution;
  uniform vec3 uColourA;
  uniform vec3 uColourB;
  uniform vec3 uColourC;
  uniform vec3 uColourD;
  uniform vec3 uColourE;
  uniform vec3 uColourF;

  float hash(vec2 point) {
    return fract(
      sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123
    );
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);

    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
      mix(
        hash(cell + vec2(0.0, 1.0)),
        hash(cell + vec2(1.0, 1.0)),
        local.x
      ),
      local.y
    );
  }

  float layeredNoise(vec2 point) {
    float value = 0.0;
    float weight = 0.55;
    mat2 turn = mat2(0.82, -0.57, 0.57, 0.82);

    for (int index = 0; index < 4; index++) {
      value += weight * noise(point);
      point = turn * point * 1.93 + 0.17;
      weight *= 0.5;
    }
    return value;
  }

  float ribbonBand(float y, float centre, float width) {
    float distanceFromRibbon = y - centre;
    return exp(-(distanceFromRibbon * distanceFromRibbon) / width);
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 point = vUv * 2.0 - 1.0;
    point.x *= aspect;

    float time = uTime * uSpeed * 3.25;
    float broadNoise = layeredNoise(
      vec2(point.x * 0.36 + time * 0.075, point.y * 0.22 - time * 0.018)
    );
    float fineNoise = layeredNoise(
      vec2(point.x * 1.28 - time * 0.055, point.y * 0.72 + time * 0.026)
    );
    float slowNoise = layeredNoise(
      vec2(point.x * 0.24 + time * 0.024, point.y * 0.18 + time * 0.012)
    );

    float warp =
      (broadNoise - 0.5) * uDistortion * 0.48 +
      (fineNoise - 0.5) * uDistortion * 0.22;
    float diagonalY = point.y + point.x * 0.055 + warp;

    float centreA =
      0.42 +
      sin(point.x * 0.72 + time * 0.30) * 0.14 +
      sin(point.x * 1.64 - time * 0.15 + 1.2) * 0.045;
    float centreB =
      0.08 +
      sin(point.x * 0.58 - time * 0.23 + 2.1) * 0.17 +
      sin(point.x * 1.35 + time * 0.12) * 0.05;
    float centreC =
      0.68 +
      sin(point.x * 0.46 + time * 0.18 + 3.2) * 0.11 +
      sin(point.x * 1.05 - time * 0.11) * 0.035;
    float centreD =
      -0.18 +
      sin(point.x * 0.66 + time * 0.16 + 0.5) * 0.14;

    float ribbonA = ribbonBand(diagonalY, centreA, 0.058);
    float ribbonB = ribbonBand(diagonalY, centreB, 0.082);
    float ribbonC = ribbonBand(diagonalY, centreC, 0.048);
    float ribbonD = ribbonBand(diagonalY, centreD, 0.105);

    float striation = mix(
      0.7,
      1.28,
      layeredNoise(vec2(point.x * 7.8 - time * 0.13, time * 0.08))
    );
    float shimmer = mix(0.82, 1.18, fineNoise);
    float pulse = 0.92 + sin(time * 0.46 + slowNoise * 6.2831) * 0.08;
    float skyMask = smoothstep(-1.04, -0.7, point.y) *
      (1.0 - smoothstep(0.9, 1.16, point.y));
    float sideMask = 1.0 - smoothstep(aspect * 0.72, aspect * 1.02, abs(point.x));

    ribbonA *= striation * shimmer;
    ribbonB *= mix(0.76, 1.18, broadNoise);
    ribbonC *= mix(0.72, 1.24, slowNoise) * striation;
    ribbonD *= mix(0.7, 1.1, fineNoise);

    vec3 colourA = mix(uColourA, uColourB, broadNoise);
    vec3 colourB = mix(uColourC, uColourD, fineNoise);
    vec3 colourC = mix(uColourE, uColourF, slowNoise);
    vec3 colourD = mix(uColourD, uColourA, broadNoise * 0.7);

    vec3 aurora =
      colourA * ribbonA * 0.98 +
      colourB * ribbonB * 0.86 +
      colourC * ribbonC * 0.82 +
      colourD * ribbonD * 0.55;

    float energy =
      ribbonA * 0.82 +
      ribbonB * 0.66 +
      ribbonC * 0.58 +
      ribbonD * 0.34;

    float centreDistance = length(point * vec2(0.62, 0.95));
    float readingMask = mix(
      0.48,
      1.0,
      smoothstep(0.18, 1.08, centreDistance)
    );
    aurora *= skyMask * sideMask * readingMask * pulse * uIntensity;

    vec3 night = vec3(0.006, 0.026, 0.043);
    vec3 atmosphericBlue = vec3(0.014, 0.054, 0.082) *
      smoothstep(-1.0, 0.78, point.y) * 0.28;
    vec3 finalColour = night + atmosphericBlue + aurora * uBrightness;
    finalColour += colourC * pow(max(energy * skyMask, 0.0), 2.35) * 0.045;

    // Compress overlapping ribbons before they clip to white. This preserves
    // distinct aurora colours while keeping text readable over the sky.
    float peak = max(finalColour.r, max(finalColour.g, finalColour.b));
    finalColour /= 1.0 + max(0.0, peak - 0.62) * 1.35;
    finalColour = pow(max(finalColour, vec3(0.0)), vec3(1.08));

    gl_FragColor = vec4(clamp(finalColour, 0.0, 0.88), 1.0);
  }

`;

let renderer = null;
let program = null;
let mesh = null;
let canvas = null;
let background = null;
let frameId = 0;
let lastFrameTime = 0;
let startTime = 0;
let manualPaused = false;
let phasePaused = true;
let hidden = false;
let initialised = false;
let destroyed = false;
let surgeActive = false;

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = motionQuery.matches;

function hexToRgb(value) {
  const clean = String(value).replace("#", "");
  const expanded =
    clean.length === 3
      ? clean
          .split("")
          .map((character) => character + character)
          .join("")
      : clean;
  const number = Number.parseInt(expanded, 16);
  return [
    ((number >> 16) & 255) / 255,
    ((number >> 8) & 255) / 255,
    (number & 255) / 255,
  ];
}

function canAnimate() {
  return (
    initialised &&
    !destroyed &&
    surgeActive &&
    !manualPaused &&
    !phasePaused &&
    !hidden &&
    !reducedMotion
  );
}

function resize() {
  if (!renderer || !program) {
    return;
  }
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  renderer.dpr = Math.min(
    window.devicePixelRatio || 1,
    auroraConfig.maxPixelRatio,
  );
  renderer.setSize(width, height);
  program.uniforms.uResolution.value = [
    renderer.gl.canvas.width,
    renderer.gl.canvas.height,
  ];
  renderFrame(reducedMotion ? 26 : undefined);
}

function renderFrame(staticTime) {
  if (!renderer || !mesh || !program) {
    return;
  }
  if (staticTime !== undefined) {
    program.uniforms.uTime.value = staticTime;
  }
  renderer.render({ scene: mesh });
}

function animate(now) {
  if (!canAnimate()) {
    frameId = 0;
    return;
  }

  frameId = window.requestAnimationFrame(animate);
  if (now - lastFrameTime < 28) {
    return;
  }
  lastFrameTime = now;
  program.uniforms.uTime.value = (now - startTime) / 1000;
  renderFrame();
}

function ensureAnimation() {
  if (!canAnimate() || frameId) {
    return;
  }
  startTime =
    window.performance.now() - program.uniforms.uTime.value * 1000;
  frameId = window.requestAnimationFrame(animate);
}

function stopAnimation() {
  if (frameId) {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
  }
}

function setAuroraIntensity(value) {
  auroraConfig.intensity = Math.max(0, Math.min(0.95, Number(value) || 0));
  if (program) {
    program.uniforms.uIntensity.value = auroraConfig.intensity;
    renderFrame();
  }
}

function setAuroraSpeed(value) {
  auroraConfig.speed = Math.max(0.008, Math.min(0.12, Number(value) || 0.036));
  if (program) {
    program.uniforms.uSpeed.value = auroraConfig.speed;
  }
}

function setAuroraBrightness(value) {
  auroraConfig.brightness = Math.max(
    0.3,
    Math.min(1.0, Number(value) || 0.82),
  );
  if (program) {
    program.uniforms.uBrightness.value = auroraConfig.brightness;
    renderFrame();
  }
}

function setAuroraDistortion(value) {
  auroraConfig.distortion = Math.max(
    0.06,
    Math.min(0.4, Number(value) || 0.24),
  );
  if (program) {
    program.uniforms.uDistortion.value = auroraConfig.distortion;
    renderFrame();
  }
}

function setAuroraPalette(palette) {
  if (!program || !Array.isArray(palette) || palette.length < 6) {
    return;
  }
  ["A", "B", "C", "D", "E", "F"].forEach((key, index) => {
    program.uniforms[`uColour${key}`].value = hexToRgb(palette[index]);
  });
  renderFrame();
}

function pauseAurora() {
  manualPaused = true;
  stopAnimation();
}

function resumeAurora() {
  manualPaused = false;
  ensureAnimation();
}

function applyPhase(phase, nextSurgeActive, nextStrength = 1) {
  const preset = phasePresets[phase] || phasePresets["under-ice-pulse"];
  surgeActive = Boolean(nextSurgeActive);
  const strength = Math.max(0, Math.min(1, Number(nextStrength) || 0));
  phasePaused = phase === "dawn" || !surgeActive;
  background?.setAttribute("data-phase", phase || "station-drift");
  background?.setAttribute("data-active", String(surgeActive));

  setAuroraSpeed(preset.speed);
  setAuroraIntensity(preset.intensity * strength);
  setAuroraBrightness(preset.brightness * (0.72 + strength * 0.28));
  setAuroraDistortion(preset.distortion);
  setAuroraPalette(preset.palette);

  if (phasePaused || reducedMotion) {
    stopAnimation();
    if (surgeActive) {
      renderFrame(reducedMotion ? 26 : undefined);
    }
  } else {
    ensureAnimation();
  }
}

function handlePhaseChange(event) {
  applyPhase(
    event.detail?.phase || document.body.dataset.storyPhase,
    event.detail?.surgeActive ??
      document.body.classList.contains("aurora-surge-active"),
    event.detail?.strength ??
      (document.body.classList.contains("aurora-rescue-faint")
        ? 0.28
        : document.body.classList.contains("aurora-rescue-contact")
          ? 0.58
          : 1),
  );
}

function handleVisibility() {
  hidden = document.hidden;
  if (hidden) {
    stopAnimation();
  } else {
    ensureAnimation();
  }
}

function handleMotionPreference(event) {
  reducedMotion = event.matches;
  if (reducedMotion) {
    stopAnimation();
    if (surgeActive) {
      renderFrame(26);
    }
  } else {
    ensureAnimation();
  }
}

function handleContextLost(event) {
  event.preventDefault();
  stopAnimation();
  background?.classList.add("is-fallback");
  background?.classList.remove("is-webgl");
}

async function initAurora() {
  if (initialised || destroyed) {
    return;
  }

  background = document.querySelector(".aurora-background");
  canvas = document.getElementById("aurora-canvas");
  if (!background || !canvas) {
    return;
  }

  background.classList.add("is-fallback");

  try {
    await loadOgl();
    renderer = new Renderer({
      canvas,
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      dpr: Math.min(
        window.devicePixelRatio || 1,
        auroraConfig.maxPixelRatio,
      ),
      powerPreference: "high-performance",
      webgl: 1,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const defaultPalette = phasePresets["under-ice-pulse"].palette;
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      transparent: false,
      depthTest: false,
      depthWrite: false,
      cullFace: null,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: auroraConfig.speed },
        uIntensity: { value: auroraConfig.intensity },
        uBrightness: { value: auroraConfig.brightness },
        uDistortion: { value: auroraConfig.distortion },
        uResolution: { value: [1, 1] },
        uColourA: { value: hexToRgb(defaultPalette[0]) },
        uColourB: { value: hexToRgb(defaultPalette[1]) },
        uColourC: { value: hexToRgb(defaultPalette[2]) },
        uColourD: { value: hexToRgb(defaultPalette[3]) },
        uColourE: { value: hexToRgb(defaultPalette[4]) },
        uColourF: { value: hexToRgb(defaultPalette[5]) },
      },
    });
    if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
      throw new Error("Aurora shader could not be linked.");
    }
    mesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program,
    });

    initialised = true;
    background.classList.remove("is-fallback");
    background.classList.add("is-webgl");
    canvas.addEventListener("webglcontextlost", handleContextLost);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("aurora-phase-change", handlePhaseChange);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener?.("change", handleMotionPreference);
    resize();
    applyPhase(
      document.body.dataset.storyPhase || "station-drift",
      document.body.classList.contains("aurora-surge-active"),
      document.body.classList.contains("aurora-rescue-faint")
        ? 0.28
        : document.body.classList.contains("aurora-rescue-contact")
          ? 0.58
          : 1,
    );
    window.dispatchEvent(new CustomEvent("aurora-ready"));
  } catch (error) {
    console.error("[Aurora] WebGL initialisation failed:", error);
    background.classList.add("is-fallback");
    background.classList.remove("is-webgl");
    program?.remove?.();
    renderer?.gl?.getExtension("WEBGL_lose_context")?.loseContext();
    renderer = null;
    program = null;
    mesh = null;
  }
}

function destroyAurora() {
  destroyed = true;
  stopAnimation();
  window.removeEventListener("resize", resize);
  window.removeEventListener("aurora-phase-change", handlePhaseChange);
  document.removeEventListener("visibilitychange", handleVisibility);
  motionQuery.removeEventListener?.("change", handleMotionPreference);
  canvas?.removeEventListener("webglcontextlost", handleContextLost);
  mesh?.geometry?.remove?.();
  program?.remove?.();
  renderer?.gl?.getExtension("WEBGL_lose_context")?.loseContext();
  renderer = null;
  program = null;
  mesh = null;
  canvas = null;
  initialised = false;
}

window.AuroraFlow = {
  auroraConfig,
  destroyAurora,
  initAurora,
  pauseAurora,
  resumeAurora,
  setAuroraBrightness,
  setAuroraDistortion,
  setAuroraIntensity,
  setAuroraPalette,
  setAuroraSpeed,
};

initAurora();
