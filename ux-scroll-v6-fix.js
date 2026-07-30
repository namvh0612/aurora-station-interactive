(function stabiliseAuroraScrollExtraction() {
  "use strict";

  function normalise(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function candidateStatement(runtime) {
    const buttons = Array.from(
      runtime.querySelectorAll(
        "button[data-level], button.spectrum-choice, button.entry-signal-choice",
      ),
    ).filter((button) => {
      const value = Number(button.dataset.level || normalise(button.textContent));
      return Number.isInteger(value) && value >= 1 && value <= 5;
    });
    if (buttons.length < 5) return "";

    const marker = Array.from(runtime.querySelectorAll("p, span, div, small")).find(
      (node) => /^STATEMENT\s+\d{1,2}\s*\/\s*60$/i.test(normalise(node.textContent)),
    );
    const firstButton = buttons[0];
    const preferred = runtime.querySelector(
      ".assessment-statement, .question-statement, .statement-text, .prompt, .inner-voice",
    );
    if (preferred) return normalise(preferred.textContent);

    return (
      Array.from(runtime.querySelectorAll("p, h1, h2, h3, h4, blockquote"))
        .filter((node) => {
          const text = normalise(node.textContent);
          if (text.length < 28 || text.length > 460) return false;
          if (/strongly agree|strongly disagree|move across|choose once|back arrow/i.test(text)) {
            return false;
          }
          if (marker && !(marker.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)) {
            return false;
          }
          if (
            firstButton &&
            !(node.compareDocumentPosition(firstButton) & Node.DOCUMENT_POSITION_FOLLOWING)
          ) {
            return false;
          }
          return true;
        })
        .map((node) => ({
          text: normalise(node.textContent),
          size: Number.parseFloat(getComputedStyle(node).fontSize) || 0,
        }))
        .sort((left, right) => right.size - left.size || right.text.length - left.text.length)[0]
        ?.text || ""
    );
  }

  function sync() {
    const runtime = document.getElementById("story-runtime");
    const reader = document.getElementById("story");
    if (!runtime || !reader) return;

    const raw = String(runtime.innerText || "");
    const actMatch = raw.match(/ACT\s+(\d{1,2})\s*\/\s*12(?:\s*[·|]\s*([^\n]+))?/i);
    if (!actMatch) return;

    const actNumber = Number(actMatch[1]);
    const act = reader.querySelector(`[data-act-number="${actNumber}"]`);
    if (!act) return;

    const runtimeTitle = Array.from(runtime.querySelectorAll("h1, h2"))
      .map((node) => normalise(node.textContent))
      .find(
        (text) =>
          text.length > 4 &&
          text.length < 100 &&
          !/^(act|part|statement|question|story)/i.test(text),
      );
    if (runtimeTitle) {
      const title = act.querySelector(".scroll-act-title");
      if (title) title.textContent = runtimeTitle;
    }

    const kicker = act.querySelector(".scroll-act-kicker");
    if (kicker) {
      const meta = normalise(actMatch[2]);
      kicker.textContent = `ACT ${String(actNumber).padStart(2, "0")} / 12${meta ? ` · ${meta}` : ""}`;
    }

    const statement = candidateStatement(runtime);
    const visibleStatement = act.querySelector(".scroll-question-statement");
    if (statement && visibleStatement) visibleStatement.textContent = statement;
  }

  function start() {
    const runtime = document.getElementById("story-runtime");
    if (!runtime) {
      setTimeout(start, 100);
      return;
    }
    const observer = new MutationObserver(() => requestAnimationFrame(sync));
    observer.observe(runtime, { childList: true, subtree: true, characterData: true });
    sync();
  }

  start();
})();
