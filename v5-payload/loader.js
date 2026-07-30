(async function bootAuroraV5() {
  "use strict";

  const status = document.querySelector(".loading-copy");

  try {
    if (typeof DecompressionStream !== "function") {
      throw new Error("This browser does not support the Aurora v5 runtime.");
    }

    const urls = Array.from(
      { length: 7 },
      (_, index) =>
        `./v5-payload/${String(index + 1).padStart(2, "0")}.txt?v=5.0.0`,
    );
    const responses = await Promise.all(urls.map((url) => fetch(url)));

    if (responses.some((response) => !response.ok)) {
      throw new Error("Aurora v5 payload could not be loaded.");
    }

    const encoded = (await Promise.all(responses.map((response) => response.text()))).join("");
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    const source = await new Response(stream).text();
    (0, eval)(`${source}\n//# sourceURL=aurora-v5-bundle.js`);
  } catch (error) {
    console.error("[Aurora Station] v5 boot failed", error);
    if (status) {
      status.textContent = "Aurora Station could not start in this browser.";
    }
  }
})();
