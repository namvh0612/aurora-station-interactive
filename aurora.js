import {
  Mesh,
  Program,
  Renderer,
  Triangle,
} from "https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm";

const auroraConfig = {
  speed: 0.085,
  intensity: 0.72,
  brightness: 0.92,
  distortion: 0.2,
  maxPixelRatio: 1.5,
};

const phasePresets = {
  "station-drift": {
    speed: 0.052,
    intensity: 0.42,
    brightness: 0.58,
    distortion: 0.14,
    palette: ["#123747", "#347987", "#386c60"],
  },
  "system-pressure": {
    speed: 0.064,
    intensity: 0.46,
    brightness: 0.58,
    distortion: 0.17,
    palette: ["#102c3d", "#2f6b77", "#486e5d"],
  },
  "the-silence-between": {
    speed: 0.035,
    intensity: 0.36,
    brightness: 0.52,
    distortion: 0.11,
    palette: ["#0d2938", "#315d68", "#36584f"],
  },
  "under-ice-pulse": {
    speed: 0.058,
    intensity: 0.52,
    brightness: 0.64,
    distortion: 0.2,
    palette: ["#113244", "#397f89", "#4f8b6f"],
  },
  "under-the-ice": {
    speed: 0.042,
    intensity: 0.4,
    brightness: 0.56,
    distortion: 0.13,
    palette: ["#183746", "#3d727b", "#587a66"],
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

  float curtain(float x, float centre, float width) {
    float distanceFromCurtain = abs(x - centre);
    return exp(-distanceFromCurtain * distanceFromCurtain / width);
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 point = vUv * 2.0 - 1.0;
    point.x *= aspect;

    float time = uTime * uSpeed * 7.0;
    float broadNoise = layeredNoise(
      vec2(point.x * 0.55 + time * 0.13, point.y * 0.38 - time * 0.035)
    );
    float fineNoise = layeredNoise(
      vec2(point.x * 1.18 - time * 0.08, point.y * 0.7 + time * 0.025)
    );
    float deformation =
      (broadNoise - 0.5) * uDistortion +
      sin(point.y * 1.35 + time * 0.34) * 0.045;
    float shiftedX = point.x + deformation;

    float firstCurtain = curtain(
      shiftedX,
      -0.82 + sin(point.y * 0.9 + time * 0.18) * 0.12,
      0.24
    );
    float secondCurtain = curtain(
      shiftedX,
      0.78 + sin(point.y * 1.05 - time * 0.15) * 0.15,
      0.31
    );
    float distantCurtain = curtain(
      shiftedX,
      0.08 + sin(point.y * 0.72 + time * 0.11) * 0.23,
      0.52
    ) * 0.32;

    float heightMask = smoothstep(-0.92, 0.76, point.y);
    float centreDistance = length(point * vec2(0.72, 0.92));
    float readingMask = mix(
      0.48,
      1.0,
      smoothstep(0.16, 1.22, centreDistance)
    );
    float variation = mix(0.9, 1.06, fineNoise);
    float light =
      (firstCurtain + secondCurtain + distantCurtain) *
      heightMask *
      readingMask *
      variation;

    vec3 colour = mix(uColourA, uColourB, broadNoise);
    colour = mix(colour, uColourC, smoothstep(0.5, 0.9, fineNoise) * 0.42);
    float alpha = clamp(light * uIntensity * 1.3, 0.015, 0.82);

    gl_FragColor = vec4(colour * uBrightness, alpha);
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
let phasePaused = false;
let hidden = false;
let initialised = false;
let destroyed = false;

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
  renderFrame(reducedMotion ? 18 : undefined);
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
  if (now - lastFrameTime < 32) {
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
  auroraConfig.intensity = Math.max(
    0,
    Math.min(0.95, Number(value) || 0),
  );

  if (program) {
    program.uniforms.uIntensity.value = auroraConfig.intensity;
    renderFrame();
  }
}

function setAuroraSpeed(value) {
  auroraConfig.speed = Math.max(
    0.005,
    Math.min(0.2, Number(value) || 0.085),
  );

  if (program) {
    program.uniforms.uSpeed.value = auroraConfig.speed;
  }
}

function setAuroraBrightness(value) {
  auroraConfig.brightness = Math.max(
    0.18,
    Math.min(1.15, Number(value) || 0.92),
  );

  if (program) {
    program.uniforms.uBrightness.value = auroraConfig.brightness;
    renderFrame();
  }
}

function setAuroraDistortion(value) {
  auroraConfig.distortion = Math.max(
    0.04,
    Math.min(0.28, Number(value) || 0.18),
  );
  if (program) {
    program.uniforms.uDistortion.value = auroraConfig.distortion;
    renderFrame();
  }
}

function setAuroraPalette(palette) {
  if (!program || !Array.isArray(palette) || palette.length < 3) {
    return;
  }
  program.uniforms.uColourA.value = hexToRgb(palette[0]);
  program.uniforms.uColourB.value = hexToRgb(palette[1]);
  program.uniforms.uColourC.value = hexToRgb(palette[2]);
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

function applyPhase(phase) {
  const preset = phasePresets[phase];
  phasePaused = phase === "dawn";
  background?.setAttribute("data-phase", phase || "station-drift");

  if (preset) {
    setAuroraSpeed(preset.speed);
    setAuroraIntensity(preset.intensity);
    setAuroraBrightness(preset.brightness);
    setAuroraDistortion(preset.distortion);
    setAuroraPalette(preset.palette);
  }

  if (phasePaused || reducedMotion) {
    stopAnimation();
    renderFrame(reducedMotion ? 18 : undefined);
  } else {
    ensureAnimation();
  }
}

function handlePhaseChange(event) {
  applyPhase(event.detail?.phase || document.body.dataset.storyPhase);
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
    renderFrame(18);
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

function initAurora() {
  if (initialised || destroyed) {
    return;
  }

  background = document.querySelector(".aurora-background");
  canvas = document.getElementById("aurora-canvas");
  if (!background || !canvas) {
    return;
  }

  try {
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
      powerPreference: "low-power",
      webgl: 1,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

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
        uColourA: { value: hexToRgb("#123747") },
        uColourB: { value: hexToRgb("#347987") },
        uColourC: { value: hexToRgb("#386c60") },
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
    background.classList.add("is-webgl");
    canvas.addEventListener("webglcontextlost", handleContextLost);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("aurora-phase-change", handlePhaseChange);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener?.("change", handleMotionPreference);
    resize();
    applyPhase(document.body.dataset.storyPhase || "station-drift");
    window.dispatchEvent(new CustomEvent("aurora-ready"));
  } catch {
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
