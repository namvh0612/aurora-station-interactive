(function attachAuroraPdf(globalScope) {
  "use strict";

  const PDF_FONTS = {
    StorySerif: {
      normal:
        "https://cdn.jsdelivr.net/gh/adobe-fonts/source-serif@release/TTF/SourceSerif4-Regular.ttf",
      bold:
        "https://cdn.jsdelivr.net/gh/adobe-fonts/source-serif@release/TTF/SourceSerif4-Semibold.ttf",
      italics:
        "https://cdn.jsdelivr.net/gh/adobe-fonts/source-serif@release/TTF/SourceSerif4-It.ttf",
      bolditalics:
        "https://cdn.jsdelivr.net/gh/adobe-fonts/source-serif@release/TTF/SourceSerif4-SemiboldIt.ttf",
    },
    SystemMono: {
      normal:
        "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ibmplexmono/IBMPlexMono-Regular.ttf",
      bold:
        "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ibmplexmono/IBMPlexMono-SemiBold.ttf",
      italics:
        "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ibmplexmono/IBMPlexMono-Italic.ttf",
      bolditalics:
        "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ibmplexmono/IBMPlexMono-SemiBoldItalic.ttf",
    },
  };

  function cleanText(value) {
    return String(value || "")
      .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-")
      .trim();
  }

  function paragraphs(core, value, style, extra) {
    return core.splitParagraphs(value).map((text) => ({
      text: cleanText(text),
      style: style || "body",
      ...(extra || {}),
    }));
  }

  function chosenBlock(text) {
    return {
      table: {
        widths: ["*"],
        body: [
          [
            {
              text: cleanText(text),
              fillColor: "#eef3f4",
              color: "#203640",
              margin: [10, 7, 10, 7],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: (index) => (index === 0 ? 1.5 : 0),
        vLineColor: () => "#6f98a8",
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      },
      margin: [0, 5, 0, 12],
    };
  }

  function resultBlock(result) {
    const facets = result.facets.map((facet) => ({
      text: `${cleanText(facet.name)}  ${facet.score.toFixed(2)}`,
      color: "#5d6970",
      fontSize: 9,
      margin: [0, 2, 0, 0],
    }));

    return {
      unbreakable: true,
      margin: [0, 0, 0, 18],
      stack: [
        {
          columns: [
            {
              width: "*",
              stack: [
                { text: result.element, style: "elementName" },
                { text: result.trait, style: "elementTrait" },
              ],
            },
            {
              width: "auto",
              text: result.score.toFixed(2),
              color: result.colour,
              bold: true,
              fontSize: 15,
            },
          ],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 4,
              x2: 462,
              y2: 4,
              lineWidth: 1.4,
              lineColor: result.colour,
            },
          ],
          margin: [0, 5, 0, 7],
        },
        { columns: facets, columnGap: 16 },
        {
          text: cleanText(result.description),
          fontSize: 9.5,
          lineHeight: 1.35,
          color: "#26343b",
          margin: [0, 7, 0, 0],
        },
      ],
    };
  }

  function definitionBlock(result) {
    const facetDefinitions = result.facets.map((facet) => ({
      text: [
        { text: `${cleanText(facet.name)}. `, bold: true },
        {
          text: cleanText(result.facetDefinitions[facet.name] || ""),
        },
      ],
      margin: [0, 3, 0, 0],
    }));

    return {
      unbreakable: true,
      margin: [0, 0, 0, 17],
      stack: [
        {
          text: `${cleanText(result.element)} - ${cleanText(result.lens)}`,
          style: "definitionTitle",
          color: result.colour,
        },
        {
          text: cleanText(
            `In Big Five terms, this element reflects ${result.trait}.`,
          ),
          style: "definitionBody",
        },
        {
          text: cleanText(result.plainMeaning),
          style: "definitionBody",
          margin: [0, 3, 0, 0],
        },
        {
          text: [
            { text: "Not the same as. ", bold: true },
            { text: cleanText(result.notSameAs) },
          ],
          style: "definitionBody",
          margin: [0, 3, 0, 0],
        },
        {
          text: [
            { text: "Both ends can work. ", bold: true },
            { text: cleanText(result.adaptiveRange) },
          ],
          style: "definitionBody",
          margin: [0, 3, 0, 0],
        },
        ...facetDefinitions.map((entry) => ({
          ...entry,
          style: "definitionBody",
        })),
      ],
    };
  }

  function buildStoryDefinition(data, state, core) {
    const safeState = core.sanitiseState(data, state);
    const reserve = core.selectedReserve(data, safeState);
    const content = [];

    content.push({
      stack: [
        { text: "THE FINAL WATCH", style: "coverEyebrow" },
        { text: cleanText(data.title), style: "coverTitle" },
        { text: cleanText(data.subtitle), style: "coverSubtitle" },
        {
          text: "A journey shaped by your decisions",
          style: "coverLine",
        },
        {
          text: "Aurora Station",
          style: "coverFooter",
          margin: [0, 280, 0, 0],
        },
      ],
      pageBreak: "after",
    });

    content.push({
      toc: {
        title: { text: "Contents", style: "tocTitle" },
        textMargin: [0, 4, 0, 4],
      },
      pageBreak: "after",
    });

    content.push({
      text: cleanText(data.story.prologue.title),
      style: "chapterTitle",
      tocItem: true,
    });
    content.push(...paragraphs(core, data.story.prologue.text));

    data.story.acts.forEach((act) => {
      content.push({
        text: `PART ${act.number}  |  ${cleanText(act.time)}`,
        style: "chapterEyebrow",
        pageBreak: "before",
      });
      content.push({
        text: cleanText(act.title),
        style: "chapterTitle",
        tocItem: true,
      });
      content.push(...paragraphs(core, act.opening));

      act.items.forEach((item) => {
        const raw = safeState.answers[item.number - 1];
        if (!raw) {
          return;
        }
        const branch = core.branchForRaw(data, item, raw);
        content.push(...paragraphs(core, item.context));
        if (branch) {
          content.push(chosenBlock(branch.transition));
        }
        content.push(...paragraphs(core, item.convergence));
      });

      content.push(...paragraphs(core, act.closing));

      if (act.id === data.finalReserve.insertAfterActId && reserve) {
        content.push(chosenBlock(reserve.immediate));
        content.push(...paragraphs(core, reserve.act12Opening));
      }
    });

    content.push({
      text: "What remained unresolved",
      style: "chapterTitle",
      tocItem: true,
      pageBreak: "before",
    });
    content.push(...paragraphs(core, data.ending.rescue));
    if (reserve) {
      content.push(chosenBlock(reserve.endingConsequence.rescueState));
      content.push(
        ...paragraphs(core, reserve.endingConsequence.dataLegacy),
      );
    }
    content.push(...paragraphs(core, data.ending.shared, "ending"));

    return {
      info: {
        title: "Aurora Station - The Final Watch",
        author: "Aurora Station",
        subject: "Interactive story and Five Elements reflection",
        keywords: "Aurora Station, Big Five, Five Elements, reflection",
      },
      pageSize: "A4",
      pageMargins: [58, 66, 58, 58],
      header(currentPage) {
        if (currentPage === 1) {
          return null;
        }
        return {
          columns: [
            { text: "AURORA STATION", alignment: "left" },
            { text: "THE FINAL WATCH", alignment: "right" },
          ],
          margin: [58, 28, 58, 0],
          color: "#788086",
          font: "SystemMono",
          fontSize: 7,
          characterSpacing: 1.2,
        };
      },
      footer(currentPage, pageCount) {
        if (currentPage === 1) {
          return null;
        }
        return {
          text: `${currentPage} / ${pageCount}`,
          alignment: "center",
          color: "#8b9195",
          font: "SystemMono",
          fontSize: 8,
          margin: [0, 18, 0, 0],
        };
      },
      content,
      defaultStyle: {
        font: "StorySerif",
        fontSize: 10.3,
        lineHeight: 1.52,
        color: "#17202a",
      },
      styles: {
        coverEyebrow: {
          font: "SystemMono",
          fontSize: 10,
          bold: true,
          color: "#2d6378",
          characterSpacing: 2.4,
          margin: [0, 64, 0, 24],
        },
        coverTitle: {
          fontSize: 48,
          bold: true,
          color: "#17202a",
          lineHeight: 0.95,
          margin: [0, 0, 0, 10],
        },
        coverSubtitle: {
          fontSize: 21,
          italics: true,
          color: "#5c6870",
          margin: [0, 0, 0, 32],
        },
        coverLine: {
          fontSize: 11,
          color: "#2d6378",
        },
        coverFooter: {
          font: "SystemMono",
          fontSize: 8,
          bold: true,
          color: "#788086",
          characterSpacing: 1.4,
        },
        tocTitle: {
          fontSize: 28,
          bold: true,
          color: "#17202a",
          margin: [0, 32, 0, 24],
        },
        chapterEyebrow: {
          font: "SystemMono",
          fontSize: 8,
          bold: true,
          color: "#2d6378",
          characterSpacing: 1.3,
          margin: [0, 10, 0, 6],
        },
        chapterTitle: {
          fontSize: 25,
          bold: true,
          lineHeight: 1.05,
          color: "#17202a",
          margin: [0, 0, 0, 22],
        },
        body: {
          margin: [0, 0, 0, 11],
        },
        innerVoice: {
          italics: true,
          color: "#40525b",
          margin: [12, 4, 0, 14],
        },
        ending: {
          fontSize: 11,
          italics: true,
          color: "#263f4a",
          margin: [0, 5, 0, 12],
        },
        profileOverview: {
          fontSize: 11.5,
          lineHeight: 1.45,
          color: "#263f4a",
          margin: [0, 0, 0, 12],
        },
        elementName: {
          fontSize: 15,
          bold: true,
        },
        elementTrait: {
          font: "SystemMono",
          fontSize: 8.5,
          color: "#69737a",
        },
        definitionTitle: {
          fontSize: 13,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        definitionBody: {
          fontSize: 9.4,
          color: "#35434a",
          lineHeight: 1.35,
        },
        methodNote: {
          font: "SystemMono",
          fontSize: 8.5,
          color: "#6a7378",
          lineHeight: 1.4,
        },
      },
    };
  }

  function buildProfileDefinition(data, state, core) {
    const profile = core.analyseProfile(data, state);
    const narrative = profile.narrative;
    const content = [
      { text: "YOUR AURORA PROFILE", style: "eyebrow" },
      {
        text: cleanText(narrative?.title || "Your response pattern"),
        style: "title",
      },
      {
        text: cleanText(narrative?.strapline || ""),
        style: "strapline",
      },
      {
        text: cleanText(profile.overview),
        style: "overview",
      },
      { text: "Natural strengths", style: "sectionTitle" },
      {
        ul: (narrative?.strengths || []).map(cleanText),
        style: "body",
      },
      { text: "Under pressure", style: "sectionTitle" },
      { text: cleanText(narrative?.pressure || ""), style: "body" },
      { text: "A useful counterbalance", style: "sectionTitle" },
      { text: cleanText(narrative?.watchOut || ""), style: "body" },
      { text: "Working with others", style: "sectionTitle" },
      { text: cleanText(narrative?.collaboration || ""), style: "body" },
      {
        text: "How your five currents showed up",
        style: "sectionTitle",
        pageBreak: "before",
      },
      {
        text:
          "These labels describe which response styles came forward most readily. " +
          "They are not percentages, population percentiles or fixed categories.",
        style: "note",
      },
      ...profile.elements.map((result) => ({
        unbreakable: true,
        margin: [0, 0, 0, 16],
        stack: [
          {
            columns: [
              {
                width: "*",
                stack: [
                  {
                    text: `${cleanText(result.element)} - ${cleanText(result.lens)}`,
                    style: "elementTitle",
                    color: result.colour,
                  },
                  {
                    text: cleanText(result.trait),
                    style: "elementTrait",
                  },
                ],
              },
              {
                width: "auto",
                text: cleanText(result.expression),
                bold: true,
                color: result.colour,
                fontSize: 9,
              },
            ],
          },
          {
            text: cleanText(result.description),
            style: "body",
            margin: [0, 7, 0, 0],
          },
          {
            text: [
              { text: "In practice. ", bold: true },
              { text: cleanText(result.practicalReading) },
            ],
            style: "body",
          },
          {
            text: [
              { text: "Within this element. ", bold: true },
              { text: cleanText(result.facetPattern) },
            ],
            style: "body",
          },
          {
            text: [
              { text: "Possible trade-off. ", bold: true },
              { text: cleanText(result.tradeOff) },
            ],
            style: "body",
          },
          {
            text: [
              { text: "Useful balance. ", bold: true },
              { text: cleanText(result.balancePrompt) },
            ],
            style: "body",
          },
        ],
      })),
      {
        text: "Understanding the five elements",
        style: "sectionTitle",
        pageBreak: "before",
      },
      {
        text:
          "The elements are narrative names for five broad Big Five dimensions. " +
          "Every person uses all five, and context determines which style is most useful.",
        style: "note",
      },
      ...profile.elements.map(definitionBlock),
      {
        text:
          "Reverse-keyed statements were corrected before the two facets were combined. " +
          "This story-based profile describes response tendencies in Aurora Station; it is not a diagnosis or a population norm.",
        style: "method",
      },
    ];

    return {
      info: {
        title: "Aurora Station - Personal Profile",
        author: "Aurora Station",
        subject: "Story-based Big Five and Five Elements profile",
        keywords: "Aurora Station, Big Five, Five Elements, profile",
      },
      pageSize: "A4",
      pageMargins: [58, 64, 58, 56],
      header(currentPage) {
        return currentPage === 1
          ? null
          : {
              text: "AURORA STATION  |  PERSONAL PROFILE",
              margin: [58, 28, 58, 0],
              color: "#788086",
              font: "SystemMono",
              fontSize: 7,
              characterSpacing: 1.1,
            };
      },
      footer(currentPage, pageCount) {
        return {
          text: `${currentPage} / ${pageCount}`,
          alignment: "center",
          color: "#8b9195",
          font: "SystemMono",
          fontSize: 8,
          margin: [0, 18, 0, 0],
        };
      },
      content,
      defaultStyle: {
        font: "StorySerif",
        fontSize: 10.3,
        lineHeight: 1.48,
        color: "#17202a",
      },
      styles: {
        eyebrow: {
          font: "SystemMono",
          fontSize: 9,
          bold: true,
          color: "#2d6378",
          characterSpacing: 2,
          margin: [0, 40, 0, 18],
        },
        title: {
          fontSize: 32,
          bold: true,
          margin: [0, 0, 0, 8],
        },
        strapline: {
          fontSize: 13,
          italics: true,
          color: "#2d6378",
          margin: [0, 0, 0, 22],
        },
        overview: {
          fontSize: 11.5,
          lineHeight: 1.55,
          margin: [0, 0, 0, 24],
        },
        sectionTitle: {
          fontSize: 17,
          bold: true,
          margin: [0, 18, 0, 9],
        },
        body: {
          margin: [0, 0, 0, 10],
        },
        note: {
          color: "#5d6970",
          margin: [0, 0, 0, 18],
        },
        elementTitle: {
          fontSize: 13,
          bold: true,
        },
        elementTrait: {
          font: "SystemMono",
          fontSize: 8.5,
          color: "#69737a",
        },
        definitionTitle: {
          fontSize: 13,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        definitionBody: {
          fontSize: 9.4,
          color: "#35434a",
          lineHeight: 1.35,
        },
        method: {
          font: "SystemMono",
          fontSize: 8.5,
          color: "#6a7378",
          lineHeight: 1.4,
          margin: [0, 18, 0, 0],
        },
      },
    };
  }

  function downloadDefinition(definition, filename) {
    if (!globalScope.pdfMake) {
      return Promise.reject(new Error("PDF engine is unavailable."));
    }

    return new Promise((resolve, reject) => {
      try {
        globalScope.pdfMake
          .createPdf(definition, null, PDF_FONTS)
          .download(filename || "Aurora_Station_Journey.pdf", resolve);
      } catch (error) {
        reject(error);
      }
    });
  }

  function downloadStory(data, state, core, filename) {
    return downloadDefinition(
      buildStoryDefinition(data, state, core),
      filename || "Aurora_Station_Journey.pdf",
    );
  }

  function downloadProfile(data, state, core, filename) {
    return downloadDefinition(
      buildProfileDefinition(data, state, core),
      filename || "Aurora_Station_Profile.pdf",
    );
  }

  const api = {
    buildDocumentDefinition: buildStoryDefinition,
    buildStoryDefinition,
    buildProfileDefinition,
    download: downloadStory,
    downloadStory,
    downloadProfile,
  };
  globalScope.AuroraPdf = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
