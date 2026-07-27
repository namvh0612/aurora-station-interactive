(function attachAuroraAudio(globalScope) {
  "use strict";

  const PREFERENCE_KEY = "aurora-station-sound-v1";
  const DEFAULT_VOLUME = 0.07;
  const FADE_DURATION = 1600;
  const PHASES = [
    {
      key: "station-drift",
      title: "Station Drift",
      src: "./audio/station-drift.mp3",
      actIds: ["act-01", "act-02", "act-03"],
    },
    {
      key: "system-pressure",
      title: "System Pressure",
      src: "./audio/system-pressure.mp3",
      actIds: ["act-04", "act-05", "act-06"],
    },
    {
      key: "the-silence-between",
      title: "The Silence Between",
      src: "./audio/the-silence-between.mp3",
      actIds: ["act-07", "act-08"],
    },
    {
      key: "under-ice-pulse",
      title: "Under-Ice Pulse",
      src: "./audio/under-ice-pulse.mp3",
      actIds: ["act-09", "act-10", "act-11"],
    },
    {
      key: "under-the-ice",
      title: "Under the Ice",
      src: "./audio/under-the-ice.mp3",
      actIds: ["act-12"],
    },
  ];
  const phaseByAct = new Map(
    PHASES.flatMap((phase) =>
      phase.actIds.map((actId) => [actId, phase.key]),
    ),
  );
  const trackByKey = new Map(PHASES.map((phase) => [phase.key, phase]));

  let toggleButton = null;
  let enabled = true;
  let unlocked = false;
  let hidden = false;
  let desiredKey = null;
  let activeTrack = null;
  let incomingTrack = null;
  let outgoingTrack = null;
  let fadeFrame = 0;
  let targetVolume = DEFAULT_VOLUME;
  let initialised = false;

  function safeStorage() {
    try {
      return globalScope.localStorage;
    } catch {
      return null;
    }
  }

  function readPreference() {
    const storage = safeStorage();
    if (!storage) {
      return true;
    }
    return storage.getItem(PREFERENCE_KEY) !== "off";
  }

  function savePreference() {
    try {
      safeStorage()?.setItem(PREFERENCE_KEY, enabled ? "on" : "off");
    } catch {
      // Sound remains usable when storage is unavailable.
    }
  }

  function phaseForState(data, state, core) {
    const step = core.currentStep(data, state);
    if (step.type === "complete") {
      return null;
    }
    if (step.type === "reserve") {
      return "under-ice-pulse";
    }

    const act = data.story.acts.find((candidate) =>
      candidate.items.some((item) => item.number === step.item.number),
    );
    return act ? phaseByAct.get(act.id) || null : null;
  }

  function currentTitle() {
    return trackByKey.get(desiredKey)?.title || "Background soundtrack";
  }

  function isPlaying() {
    return Boolean(
      enabled &&
        activeTrack &&
        !activeTrack.audio.paused &&
        !hidden,
    );
  }

  function updateToggle() {
    if (!toggleButton) {
      return;
    }

    const playing = isPlaying();
    const title = currentTitle();
    toggleButton.dataset.enabled = String(enabled);
    toggleButton.dataset.playing = String(playing);
    toggleButton.setAttribute("aria-pressed", String(enabled));
    toggleButton.setAttribute(
      "aria-label",
      enabled ? "Mute background soundtrack" : "Play background soundtrack",
    );
    toggleButton.title = enabled
      ? `${title}. Sound is on.`
      : `${title}. Sound is off.`;

    const label = toggleButton.querySelector(".sound-label");
    if (label) {
      label.textContent = enabled ? "Sound on" : "Sound off";
    }
  }

  function createTrack(key) {
    const definition = trackByKey.get(key);
    if (!definition || typeof globalScope.Audio !== "function") {
      return null;
    }

    const audio = new globalScope.Audio(definition.src);
    audio.loop = true;
    audio.preload = "metadata";
    audio.volume = 0;
    audio.setAttribute("aria-hidden", "true");
    if (toggleButton) {
      toggleButton.dataset.available = "true";
    }
    audio.addEventListener("play", updateToggle);
    audio.addEventListener("pause", updateToggle);
    audio.addEventListener(
      "canplay",
      () => {
        if (toggleButton) {
          toggleButton.dataset.available = "true";
        }
        updateToggle();
      },
      { once: true },
    );
    audio.addEventListener("error", () => {
      if (toggleButton) {
        toggleButton.dataset.available = "false";
        toggleButton.title = `${definition.title} could not be loaded.`;
      }
    });
    return { key, audio };
  }

  function cancelFade() {
    if (fadeFrame) {
      globalScope.cancelAnimationFrame(fadeFrame);
      fadeFrame = 0;
    }
    if (outgoingTrack && outgoingTrack !== activeTrack) {
      retire(outgoingTrack);
    }
    outgoingTrack = null;
  }

  function retire(track) {
    if (!track) {
      return;
    }
    track.audio.pause();
    track.audio.removeAttribute("src");
    track.audio.load();
  }

  function fadeTracks(fromTrack, toTrack, duration, onComplete) {
    cancelFade();
    outgoingTrack = fromTrack;
    const start = globalScope.performance.now();
    const fromVolume = fromTrack?.audio.volume || 0;
    const toVolume = toTrack?.audio.volume || 0;

    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = progress * progress * (3 - 2 * progress);

      if (fromTrack) {
        fromTrack.audio.volume = Math.max(0, fromVolume * (1 - eased));
      }
      if (toTrack) {
        toTrack.audio.volume = Math.min(
          targetVolume,
          toVolume + (targetVolume - toVolume) * eased,
        );
      }

      if (progress < 1) {
        fadeFrame = globalScope.requestAnimationFrame(frame);
        return;
      }

      fadeFrame = 0;
      if (fromTrack) {
        retire(fromTrack);
      }
      outgoingTrack = null;
      onComplete?.();
      updateToggle();
    }

    fadeFrame = globalScope.requestAnimationFrame(frame);
  }

  async function startDesired(crossfade) {
    if (!enabled || !unlocked || hidden || !desiredKey) {
      updateToggle();
      return;
    }

    if (activeTrack?.key === desiredKey) {
      try {
        await activeTrack.audio.play();
        fadeTracks(null, activeTrack, 500);
      } catch {
        updateToggle();
      }
      return;
    }

    const nextTrack = createTrack(desiredKey);
    if (!nextTrack) {
      updateToggle();
      return;
    }

    incomingTrack = nextTrack;
    try {
      await nextTrack.audio.play();
    } catch {
      retire(nextTrack);
      incomingTrack = null;
      updateToggle();
      return;
    }

    if (
      !enabled ||
      hidden ||
      desiredKey !== nextTrack.key
    ) {
      retire(nextTrack);
      if (incomingTrack === nextTrack) {
        incomingTrack = null;
      }
      updateToggle();
      return;
    }

    const previousTrack = activeTrack;
    activeTrack = nextTrack;
    incomingTrack = null;
    fadeTracks(
      previousTrack,
      nextTrack,
      previousTrack && crossfade ? FADE_DURATION : 700,
    );
  }

  function stopPlayback(duration) {
    cancelFade();
    const previousTrack = activeTrack;
    activeTrack = null;
    if (!previousTrack) {
      updateToggle();
      return;
    }
    fadeTracks(previousTrack, null, duration || 500);
  }

  function unlockFromInteraction(event) {
    if (unlocked) {
      return;
    }
    if (
      event.target?.closest?.("#sound-toggle") ||
      (event.type === "keydown" &&
        !["Enter", " "].includes(event.key))
    ) {
      return;
    }
    unlocked = true;
    startDesired(false);
  }

  function handleVisibility() {
    hidden = globalScope.document.hidden;
    if (hidden) {
      cancelFade();
      activeTrack?.audio.pause();
      incomingTrack?.audio.pause();
      updateToggle();
      return;
    }
    startDesired(false);
  }

  function toggleSound() {
    enabled = !enabled;
    unlocked = true;
    savePreference();
    if (enabled) {
      startDesired(false);
    } else {
      stopPlayback(450);
    }
    updateToggle();
  }

  function init(options) {
    if (initialised || !globalScope.document) {
      return;
    }
    initialised = true;
    enabled = readPreference();
    toggleButton =
      options?.toggleButton ||
      globalScope.document.getElementById("sound-toggle");
    toggleButton?.addEventListener("click", toggleSound);
    globalScope.document.addEventListener(
      "pointerdown",
      unlockFromInteraction,
      { passive: true },
    );
    globalScope.document.addEventListener("keydown", unlockFromInteraction);
    globalScope.document.addEventListener(
      "visibilitychange",
      handleVisibility,
    );
    globalScope.document.body.classList.add("audio-ready");
    updateToggle();
  }

  function sync(data, state, core) {
    const nextKey = phaseForState(data, state, core);
    if (nextKey === desiredKey) {
      return desiredKey;
    }

    desiredKey = nextKey;
    if (!nextKey) {
      stopPlayback(900);
    } else {
      startDesired(true);
    }
    updateToggle();
    return desiredKey;
  }

  function setVolume(value) {
    targetVolume = Math.max(0, Math.min(0.18, Number(value) || 0));
    if (activeTrack && !fadeFrame) {
      activeTrack.audio.volume = targetVolume;
    }
  }

  function destroy() {
    cancelFade();
    retire(activeTrack);
    retire(incomingTrack);
    retire(outgoingTrack);
    activeTrack = null;
    incomingTrack = null;
    outgoingTrack = null;
    toggleButton?.removeEventListener("click", toggleSound);
    globalScope.document?.removeEventListener(
      "pointerdown",
      unlockFromInteraction,
    );
    globalScope.document?.removeEventListener(
      "keydown",
      unlockFromInteraction,
    );
    globalScope.document?.removeEventListener(
      "visibilitychange",
      handleVisibility,
    );
    initialised = false;
  }

  const api = {
    PHASES,
    destroy,
    init,
    phaseForState,
    setVolume,
    sync,
  };

  globalScope.AuroraAudio = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
