/* Edit this data file to update the story; no rebuild is required. */
window.AURORA_STATION_DATA = {
  "schemaVersion": "1.0.0",
  "contentVersion": "4.1.0-honest-response-onboarding",
  "id": "aurora-station",
  "title": "Aurora Station",
  "subtitle": "The Final Watch",
  "language": "en",
  "runtimeContract": {
    "platform": "Static HTML/CSS/JavaScript",
    "dataLoading": "Classic script; works from file:// and GitHub Pages",
    "persistence": "Browser localStorage with in-memory fallback",
    "export": "Direct personalised story PDF and multi-page profile PDF downloads"
  },
  "assessment": {
    "model": "Big Five OCEAN",
    "scoredItemCount": 60,
    "actCount": 12,
    "itemsPerAct": 5,
    "spectrum": {
      "id": "self-fit-6",
      "min": 1,
      "max": 6,
      "positions": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "leftAnchor": "Not how I would respond",
      "rightAnchor": "Exactly how I would respond",
      "showIntermediateLabels": false,
      "bands": {
        "low": [
          1,
          2
        ],
        "mid": [
          3,
          4
        ],
        "high": [
          5,
          6
        ]
      }
    },
    "scoring": {
      "positiveKey": "corrected = raw",
      "reverseKey": "corrected = 7 - raw",
      "facetScore": "mean of six corrected items assigned to the facet",
      "traitScore": "mean of the two equally weighted facet scores",
      "waterRule": "Score Emotional Stability directly. Reverse at the raw-score level only if an OCEAN Neuroticism score is required.",
      "normingRule": "Do not calculate percentiles or a dominant Element without an appropriate validated reference group."
    },
    "elements": {
      "WO": {
        "code": "WO",
        "element": "Wood",
        "trait": "Openness",
        "facets": [
          "Ideas",
          "Aesthetics"
        ],
        "colour": "#3D8B5C",
        "interpretation": {
          "lens": "Exploration and possibility",
          "higher": "keeps multiple explanations visible, notices patterns and makes room for what is not yet understood",
          "lower": "narrows toward evidence that can be acted on and protects attention from speculative paths",
          "facets": {
            "Ideas": "How readily you explore alternatives, patterns and unfamiliar explanations.",
            "Aesthetics": "How strongly colour, rhythm, atmosphere and sensory detail enter your attention."
          },
          "guide": {
            "action": "open the frame before choosing an explanation",
            "plainMeaning": "Wood describes how much room you give unfamiliar possibilities, patterns and sensory detail before closing on an explanation.",
            "notSameAs": "It is not a measure of intelligence, artistic talent or how imaginative you ought to be.",
            "adaptiveRange": "More Wood widens the frame; less Wood protects focus. Either can be useful depending on whether the situation needs discovery or closure.",
            "higherUse": "You tend to keep alternatives visible and let patterns or atmosphere inform the picture before you commit.",
            "lowerUse": "You tend to filter possibilities quickly and concentrate on evidence that can support a decision now.",
            "higherTradeOff": "Exploration can delay closure or give weak signals more attention than they deserve.",
            "lowerTradeOff": "Fast filtering can make an unfamiliar but useful possibility disappear too early.",
            "higherBalance": "Set a stopping rule: decide what evidence would be enough to move from exploration to commitment.",
            "lowerBalance": "Before closing, name one plausible explanation or sensory cue that has not yet been considered.",
            "facetFocus": {
              "Ideas": "exploring alternatives and unfamiliar explanations",
              "Aesthetics": "letting atmosphere and sensory detail shape attention"
            }
          }
        }
      },
      "FI": {
        "code": "FI",
        "element": "Fire",
        "trait": "Extraversion",
        "facets": [
          "Assertiveness",
          "Enthusiasm"
        ],
        "colour": "#C9485B",
        "interpretation": {
          "lens": "Visible energy and direction",
          "higher": "brings direction, expression and social momentum into the room",
          "lower": "uses quieter influence, contained energy and carefully timed intervention",
          "facets": {
            "Assertiveness": "How readily you state direction, challenge assumptions and take visible control.",
            "Enthusiasm": "How readily you create energy, expression and connection around a shared task."
          },
          "guide": {
            "action": "make energy and direction visible",
            "plainMeaning": "Fire describes how readily you put energy into the room through visible direction, expression and social momentum.",
            "notSameAs": "It is not a measure of popularity, leadership ability or how loud a person is.",
            "adaptiveRange": "More Fire mobilises people quickly; less Fire uses quieter influence and timing. Both can move a group forward.",
            "higherUse": "You tend to state direction, create momentum and make your engagement visible to other people.",
            "lowerUse": "You tend to influence more quietly, conserve social energy and choose carefully when to step forward.",
            "higherTradeOff": "Visible momentum can occupy space that others needed in order to think or contribute.",
            "lowerTradeOff": "Waiting for the right moment can leave your view unheard until the decision has nearly closed.",
            "higherBalance": "After setting direction, create a deliberate pause in which someone else can change or refine it.",
            "lowerBalance": "State your position once, clearly and early, before deciding whether quieter influence is enough.",
            "facetFocus": {
              "Assertiveness": "stating direction and challenging assumptions",
              "Enthusiasm": "creating shared energy and expressive connection"
            }
          }
        }
      },
      "EA": {
        "code": "EA",
        "element": "Earth",
        "trait": "Agreeableness",
        "facets": [
          "Empathy",
          "Cooperation"
        ],
        "colour": "#C78A28",
        "interpretation": {
          "lens": "Human connection and cooperation",
          "higher": "reads the human stakes, invites shared input and protects connection while acting",
          "lower": "keeps the task boundary firm and avoids letting interpersonal needs overtake the decision",
          "facets": {
            "Empathy": "How readily you notice and respond to another person’s emotional experience.",
            "Cooperation": "How readily you coordinate, accommodate and build a shared way forward."
          },
          "guide": {
            "action": "bring the human stakes into the decision",
            "plainMeaning": "Earth describes how strongly another person's experience, cooperation and relationship continuity enter your decisions.",
            "notSameAs": "It is not a score for kindness, morality or whether you avoid disagreement.",
            "adaptiveRange": "More Earth protects connection; less Earth protects task boundaries and candour. Sound decisions often need both.",
            "higherUse": "You tend to notice the human impact, invite input and preserve cooperation while action is still possible.",
            "lowerUse": "You tend to keep the task boundary firm and resist allowing interpersonal pressure to overtake the decision.",
            "higherTradeOff": "Protecting harmony can soften a necessary disagreement or delay a difficult boundary.",
            "lowerTradeOff": "Task clarity can come at the cost of information that people reveal only when they feel heard.",
            "higherBalance": "Separate care from agreement: name the human impact and the boundary that still has to hold.",
            "lowerBalance": "Before finalising, ask whose experience contains information the task view may have missed.",
            "facetFocus": {
              "Empathy": "noticing and responding to emotional experience",
              "Cooperation": "coordinating and building a shared way forward"
            }
          }
        }
      },
      "ME": {
        "code": "ME",
        "element": "Metal",
        "trait": "Conscientiousness",
        "facets": [
          "Orderliness",
          "Industriousness"
        ],
        "colour": "#67727E",
        "interpretation": {
          "lens": "Structure and sustained action",
          "higher": "creates sequence, boundaries and follow-through when the situation is uncertain",
          "lower": "adapts structure to the moment and stops effort when its cost outweighs its likely value",
          "facets": {
            "Orderliness": "How readily you create clear sequence, criteria, limits and records.",
            "Industriousness": "How readily you sustain effort, complete checks and continue purposeful action."
          },
          "guide": {
            "action": "turn intent into sequence and follow-through",
            "plainMeaning": "Metal describes how readily you create structure, standards and sustained action when conditions are uncertain.",
            "notSameAs": "It is not a measure of intelligence, obedience or personal worth, and it does not require rigidity.",
            "adaptiveRange": "More Metal protects reliability; less Metal protects adaptability and effort. The useful level depends on the cost of error and the cost of procedure.",
            "higherUse": "You tend to create sequence, checks and clear ownership, then keep effort moving toward completion.",
            "lowerUse": "You tend to adapt structure to the moment and stop routines when their cost exceeds their likely value.",
            "higherTradeOff": "A reliable process can continue after it has stopped serving the purpose it was designed for.",
            "lowerTradeOff": "Useful flexibility can leave critical checks, records or finishing work without a clear owner.",
            "higherBalance": "Ask whether the procedure still serves the goal, and identify the one step that can safely be removed.",
            "lowerBalance": "Name one non-negotiable check and one explicit finish point before improvising the rest.",
            "facetFocus": {
              "Orderliness": "creating sequence, criteria, limits and records",
              "Industriousness": "sustaining effort and completing purposeful action"
            }
          }
        }
      },
      "WA": {
        "code": "WA",
        "element": "Water",
        "trait": "Emotional Stability",
        "facets": [
          "Calmness",
          "Resilience"
        ],
        "colour": "#287EAF",
        "interpretation": {
          "lens": "Regulation under pressure",
          "higher": "holds attention steady and returns to useful action after stress or uncertainty",
          "lower": "registers threat and emotional release more strongly before attention settles again",
          "facets": {
            "Calmness": "How steadily you regulate immediate tension, alarm and uncertainty.",
            "Resilience": "How readily you recover focus and re-enter a useful rhythm after strain."
          },
          "guide": {
            "action": "steady attention before returning to action",
            "plainMeaning": "Water describes how steadily attention remains usable during stress and how readily it returns after strain.",
            "notSameAs": "It is not emotional depth, courage or the absence of feeling. A calm response can still contain strong concern.",
            "adaptiveRange": "More Water supports steadiness and recovery; less Water registers threat and emotional intensity earlier. Both carry useful information.",
            "higherUse": "You tend to keep attention steady in the first wave of pressure and re-enter a useful rhythm after strain.",
            "lowerUse": "You tend to register threat and emotional intensity strongly before attention settles and action becomes easier again.",
            "higherTradeOff": "Composure can make strain less visible to others or postpone recognising your own need for recovery.",
            "lowerTradeOff": "A strong alarm response can narrow working attention before the signal has been interpreted.",
            "higherBalance": "Make strain explicit even when you look calm, and schedule recovery before capacity quietly runs out.",
            "lowerBalance": "Create a brief physical or procedural pause so that alarm can become information before it becomes the decision.",
            "facetFocus": {
              "Calmness": "regulating immediate tension, alarm and uncertainty",
              "Resilience": "recovering focus and rhythm after sustained strain"
            }
          }
        }
      }
    },
    "verifiedDistribution": {
      "WO": {
        "items": 12,
        "facets": {
          "Ideas": 6,
          "Aesthetics": 6
        },
        "keys": {
          "positive": 8,
          "reverse": 4
        }
      },
      "FI": {
        "items": 12,
        "facets": {
          "Assertiveness": 6,
          "Enthusiasm": 6
        },
        "keys": {
          "positive": 8,
          "reverse": 4
        }
      },
      "EA": {
        "items": 12,
        "facets": {
          "Empathy": 6,
          "Cooperation": 6
        },
        "keys": {
          "positive": 8,
          "reverse": 4
        }
      },
      "ME": {
        "items": 12,
        "facets": {
          "Orderliness": 6,
          "Industriousness": 6
        },
        "keys": {
          "positive": 8,
          "reverse": 4
        }
      },
      "WA": {
        "items": 12,
        "facets": {
          "Calmness": 6,
          "Resilience": 6
        },
        "keys": {
          "positive": 8,
          "reverse": 4
        }
      }
    },
    "methodNote": "Narrative-adapted Big Five OCEAN self-report using one behavioural statement per item and a six-point Likert self-fit scale. This adaptation requires empirical validation before normative or diagnostic claims."
  },
  "story": {
    "prologue": {
      "id": "prologue",
      "title": "The Final Watch",
      "text": "The wind finds every seam in Aurora Station. It presses snow across the outer window until the world becomes a grey sheet, then eases just enough for the dark ridge to appear again.\n\nOnly three people remain for the winter closeout. Mira Voss has spent four seasons repairing what the cold loosens. Ilan Marek came south for a pattern buried in old magnetic records. You have the final overnight watch before the station is placed into unattended mode.\n\nAt 21:58, Mira sets the handover folder beneath the control-room lamp. Her coat is zipped. One glove is already on.\n\nMost of the pages are neat. The last line is not.\n\nSECTOR C INTERMITTENT — MONITOR.\n\n“No trip,” Mira says. “Temperature only. Three times.”\n\nIlan turns from the window. “Did the magnetic channel move?”\n\nMira looks at the closed folder, then at the storm. “I did not check it at full resolution.”\n\nA formal call to Hobart is due at midnight. A Ridge survey team is camped to the south, beyond normal radio range and a road that closes in whiteout conditions.\n\nThe wind lowers into a mechanical growl. Somewhere inside the wall, metal answers with a small click.\n\nMira rests her hand on the door. Once the handover is signed, the station is yours."
    },
    "acts": [
      {
        "id": "act-01",
        "number": 1,
        "title": "The Final Handover",
        "time": "21:58–22:06",
        "opening": "Mira waits by the door while snow runs sideways across the glass. The handover is complete except for six words about Sector C. There is no trigger, no next check and no note of what she has already ruled out.",
        "items": [
          {
            "id": "q01",
            "number": 1,
            "title": "Six Words",
            "context": "Mira's note lists three Sector C spikes. Her completed checks sit across the alarm history and a handwritten page.",
            "statement": "I would want the completed checks and open questions organised clearly before taking over.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Orderliness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You close the folder and mark the line for review. Mira leaves; the alarm history carries the missing detail."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You add the last timestamps and one unresolved check. Mira answers, then leaves."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You ask Mira to list the checks, the causes she ruled out and the questions still open. Her rest begins a few minutes later."
              }
            },
            "convergence": "The record now shows three brief spikes. Each cleared by itself, and none reached the trip limit."
          },
          {
            "id": "q02",
            "number": 2,
            "title": "At the Door",
            "context": "The written procedure gives one safe return trigger. Mira's own threshold is slightly more cautious.",
            "statement": "I would use the written boundary without asking Mira to restate her judgement.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Assertiveness",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You stop her at the door and ask. She gives you the boundary before leaving."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You let her step into the corridor, then confirm the boundary over the radio."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You close the door and find the rule in the manual. It gives the trigger, but not Mira's reasoning."
              }
            },
            "convergence": "A heat spike can be watched. A matching current change means Mira must return."
          },
          {
            "id": "q03",
            "number": 3,
            "title": "The Window",
            "context": "Ilan watches the storm while the old Sector C records remain open beside him. His recorder check is unfinished.",
            "statement": "I would notice how the shutdown was affecting Ilan and invite him to speak.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Empathy",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You hand him a recorder check. The task steadies his hands, and he begins to talk while working."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You ask whether he can continue the watch. He says the shutdown feels like a closing door."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You wait beside him and ask what this night means to him. The first console check waits with you."
              }
            },
            "convergence": "Ilan opens two years of archived traces beside the live display."
          },
          {
            "id": "q04",
            "number": 4,
            "title": "Two Explanations",
            "context": "Sensor noise explains most of the trace. One feature still matches Ilan's older anomaly.",
            "statement": "I would keep another plausible explanation in mind while testing the familiar one.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Ideas",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You close the archive and work only from sensor noise, with a clear test for abandoning it."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You lead with sensor noise and add the magnetic channel to the screen."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep both explanations in the log and write what would separate them."
              }
            },
            "convergence": "The next event will be captured across temperature, current and magnetics."
          },
          {
            "id": "q05",
            "number": 5,
            "title": "The Quiet Minute",
            "context": "Sector C remains unresolved. The rest of Aurora continues through its normal watch cycle.",
            "statement": "I would return my attention to the wider watch without dwelling on Sector C.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Calmness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep Sector C at the front of every scan. The rest of the station receives less of your attention."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You make one extra check, then return to the normal cycle."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You hold to the planned interval and let the rest of the station back into view."
              }
            },
            "convergence": "At 22:06, the console sounds once. The alert is from Sector C."
          }
        ],
        "closing": "At 22:06, the console gives one soft tone. The temperature line jumps twice. This time the current line moves with it."
      },
      {
        "id": "act-02",
        "number": 2,
        "title": "The First Spike",
        "time": "22:06–22:18",
        "opening": "The alarm clears before anyone reaches it. On replay, the magnetic trace bends first, then current, then heat. Outside, the whiteout is still building. There may be time to inspect Sector C before the corridor is cut off.",
        "items": [
          {
            "id": "q06",
            "number": 6,
            "title": "The Shape",
            "context": "All readings remain below their limits. The traces repeat the same order and spacing.",
            "statement": "I would focus on the defined limits rather than the pattern formed by the traces.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Aesthetics",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You enlarge the traces and compare their spacing. A faint magnetic lead appears."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You check the limits, then save a short replay that preserves the sequence."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep the response tied to individual readings. Ilan later notices the repeated rhythm."
              }
            },
            "convergence": "The order is repeatable. It does not explain the fault, but it is not random noise."
          },
          {
            "id": "q07",
            "number": 7,
            "title": "Before It Fades",
            "context": "The event has cleared. Its cleanest data is still available before the next shutdown task begins.",
            "statement": "I would begin the cross-check while the evidence was still fresh.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Industriousness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You save the event and continue the shutdown list until another change confirms it."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You run one calibration check and make deeper work depend on a second event."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You open the alarm history, calibration record and backup channels at once."
              }
            },
            "convergence": "A second sensor moves the same way, and an independent estimate confirms a real load change."
          },
          {
            "id": "q08",
            "number": 8,
            "title": "Three Views",
            "context": "Mira knows the hardware, Ilan knows the archive and you hold the live readings.",
            "statement": "I would form my own view before combining it with theirs.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Cooperation",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You ask for all three readings before choosing a cause. The discussion starts wide."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You state a provisional view and ask each person for one fact that could overturn it."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You finish your own interpretation before inviting either person to challenge it."
              }
            },
            "convergence": "The first working cause is unstable measurement, with an upstream fault still possible."
          },
          {
            "id": "q09",
            "number": 9,
            "title": "Move",
            "context": "The inspection window is closing. Mira and Ilan are ready, but neither has started moving.",
            "statement": "I would make my energy and urgency visible enough to start the group moving.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Enthusiasm",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You assign the first tasks in a quiet voice. The room moves without a change in tone."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You name the next three actions and send each person to one."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You stand, call the inspection and make the start impossible to miss."
              }
            },
            "convergence": "Mira takes the generator panel. Ilan takes the trace. You take the corridor."
          },
          {
            "id": "q10",
            "number": 10,
            "title": "After the Alarm",
            "context": "A second spike drives the alarm red for less than a second. The tone stops.",
            "statement": "I would return my attention to the evidence quickly after the alarm.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Resilience",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "The sound stays with you. You slow the inspection start and check the room once more."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You take one breath, confirm the alarm cleared and begin."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You return to the trace almost at once and call the first measurement."
              }
            },
            "convergence": "The inspection begins before the whiteout closes the corridor route."
          }
        ],
        "closing": "The corridor tightens around the beam of your lamp. Frost coats the pipes. The air grows warmer with every step towards Sector C."
      },
      {
        "id": "act-03",
        "number": 3,
        "title": "Heat Behind the Panel",
        "time": "22:20–22:41",
        "opening": "Heat comes through the cabinet door even through your glove. A burnt-plastic smell hangs in the corridor. The local indicator stays green, as if nothing behind the panel has changed.",
        "items": [
          {
            "id": "q11",
            "number": 11,
            "title": "The Green Light",
            "context": "The cabinet is hot while its local indicator remains green. A direct measurement is ready.",
            "statement": "I would stay with the most familiar explanation until direct evidence challenged it.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Ideas",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You widen the fault model before opening the panel and include the upstream supply."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You test the sensor first while keeping the common supply on the watch list."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You stay with the sensor explanation and begin the direct check at its likely failure point."
              }
            },
            "convergence": "The surface temperature is real. Something inside the cabinet is heating under a normal indication."
          },
          {
            "id": "q12",
            "number": 12,
            "title": "Behind the Cover",
            "context": "The likely hot point is behind the front cover. The checklist begins with several wider checks.",
            "statement": "I would move towards the suspected point before completing the full sequence.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Orderliness",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You finish the remaining confirmations, then open the cover with the full sequence complete."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You complete only the checks that could still change the safety boundary, then move inward."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You move to the hot section while Mira tracks the deferred confirmations over the radio."
              }
            },
            "convergence": "A portable meter shows leakage on the Sector C branch and a smaller pulse upstream."
          },
          {
            "id": "q13",
            "number": 13,
            "title": "One Authority",
            "context": "Mira watches the generator, Ilan watches the trace and you hold the isolation switch.",
            "statement": "I would state clearly who controlled each role and the final switch.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Assertiveness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You let expertise organise the work. The first exchange reveals who is waiting for whom."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You name the stop condition and critical roles, then leave the sequence to Mira."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You name every role, callout and the single switching authority."
              }
            },
            "convergence": "Mira covers generator readiness, Ilan the trace, and you the switch."
          },
          {
            "id": "q14",
            "number": 14,
            "title": "Radio Picture",
            "context": "Mira and Ilan cannot see the corridor. They can only hear your breathing and short radio calls.",
            "statement": "I would notice when their uncertainty needed a brief reassuring update.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Empathy",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep the radio to measurements and commands. Their questions wait for a pause."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You report what is visible at each decision point and leave the smaller uncertainties unspoken."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You give position, visible risk, uncertainty and next action before every change."
              }
            },
            "convergence": "The branch can be isolated, but the upstream pulse keeps the main supply suspect."
          },
          {
            "id": "q15",
            "number": 15,
            "title": "The Smell of Fire",
            "context": "The burnt smell grows stronger. The next isolation step is ready and no flame is visible.",
            "statement": "I would keep most of my attention on the next confirmed step.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Calmness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You scan the corridor, generator and exit before returning to the cabinet."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You name the wider risks once, then return to the isolation point."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You stay with the meter, switch and cabinet boundary while remote alarms watch the rest."
              }
            },
            "convergence": "The Sector C branch is isolated. One final leakage pulse appears on the common supply."
          }
        ],
        "closing": "The Sector C branch begins to cool. Then a dull impact travels through the floor. The main generator trips, and the station returns in emergency red."
      },
      {
        "id": "act-04",
        "number": 4,
        "title": "Ninety Seconds",
        "time": "22:47–22:55",
        "opening": "The backup generator catches, stumbles and catches again. A red countdown appears: 90 seconds to automatic load shedding. Mira reaches the panel and starts reading values. Ilan stands between the dead displays and the radio rack, waiting.",
        "items": [
          {
            "id": "q16",
            "number": 16,
            "title": "Ninety Seconds",
            "context": "The backup catches unevenly. Mira is still reading the values that will shape the first cut.",
            "statement": "I would feel pressure to act before the critical readings were complete.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Calmness",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You let the pressure pass through the room without becoming the order. Mira calls for a precise forty-percent cut."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You ask only for the values that can still change the first action."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "The falling number drives an immediate cut; you narrow it as Mira's readings arrive."
              }
            },
            "convergence": "The same critical loads survive. The bus settles before the countdown reaches zero."
          },
          {
            "id": "q17",
            "number": 17,
            "title": "Keep Going",
            "context": "Emergency power is stable. Several useful diagnostic checks remain, and the team has not rested.",
            "statement": "I would continue purposeful checks before taking a break.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Industriousness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You protect the stable state and call a short recovery break before deeper work."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You complete the single check most likely to change the plan, then pause."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You finish the decision-relevant checks while the evidence is fresh, then release the team to rest."
              }
            },
            "convergence": "The main generator cannot be restarted safely while the station is occupied."
          },
          {
            "id": "q18",
            "number": 18,
            "title": "One Plan",
            "context": "Mira tests the generator, Ilan follows the traces and you manage the live loads.",
            "statement": "I would coordinate the three workstreams through one shared plan.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Cooperation",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You let each stream run alone and connect them only when one changes another."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You set shared checkpoints and leave each person independent between them."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You place all three streams on one sequence where every dependency is visible."
              }
            },
            "convergence": "At current load, backup power lasts under two hours; at survival load, a little over five."
          },
          {
            "id": "q19",
            "number": 19,
            "title": "The Red Room",
            "context": "The restart attempt ends. Mira and Ilan become quiet while the generator note fills the room.",
            "statement": "I would let the room recover without trying to lift its mood.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Enthusiasm",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You name what the team has already secured and give the next task a clear beginning."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You keep the tone low but mark each completed step aloud."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You return to your own work without making the room's progress visible."
              }
            },
            "convergence": "The room finds a working pace again, without any promise that the main generator will return."
          },
          {
            "id": "q20",
            "number": 20,
            "title": "The Generator's Note",
            "context": "Before each correction, the generator changes pitch and a vibration reaches the console.",
            "statement": "I would include the changing sound and vibration in the diagnosis.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Aesthetics",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep the record to instrument values until Mira mentions the vibration."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You use the sound only to choose which part of the trace to inspect."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You mark each change in pitch and vibration against the electrical corrections."
              }
            },
            "convergence": "The pattern shows the backup unit is stable only at reduced load."
          }
        ],
        "closing": "At 22:55, the red lights hold steady. The long-range radio rack remains dark. Aurora can no longer reach Hobart."
      },
      {
        "id": "act-05",
        "number": 5,
        "title": "Cut Off from Base",
        "time": "22:56–23:15",
        "opening": "The handheld radio still works. It simply cannot reach anyone. VHF gives back storm noise; the long-range amplifier is too heavy for the damaged supply. The set glows in your hand, warm and useless.",
        "items": [
          {
            "id": "q21",
            "number": 21,
            "title": "Other Routes",
            "context": "The long-range route is dead. Several low-power communication paths remain technically possible.",
            "statement": "I would explore less conventional ways to make contact before accepting the isolation.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Ideas",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You protect the budget for one conventional call path and stop when it fails."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You test the two routes with the strongest evidence, then stop."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You use the fixed budget across several distinct, plausible routes and rule each one in or out."
              }
            },
            "convergence": "No route reaches outside. Aurora must plan as if no answer is coming."
          },
          {
            "id": "q22",
            "number": 22,
            "title": "Calls in the Static",
            "context": "The static changes from minute to minute. A fixed call schedule sits beside the radio.",
            "statement": "I would retry when conditions seemed favourable rather than follow the fixed schedule.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Orderliness",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You log the channels and set timed calls around the midnight status."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You keep short call windows and allow them to move with the storm."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You transmit whenever the static thins. Ilan keeps a minimal note of each attempt."
              }
            },
            "convergence": "If midnight is missed, Hobart should contact Ridge. Aurora cannot know whether that chain begins."
          },
          {
            "id": "q23",
            "number": 23,
            "title": "Say It Plainly",
            "context": "Mira expects contact to return soon. Ilan speaks as though rescue is already moving.",
            "statement": "I would state the present situation and the next priority plainly.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Assertiveness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You call contact temporarily unavailable and turn to the heat budget."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You state the present limit and pair it with the next action."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You name the isolation, the missed-call safeguard and the heat calculation that comes next."
              }
            },
            "convergence": "All three now plan without an assumed rescue time."
          },
          {
            "id": "q24",
            "number": 24,
            "title": "After the News",
            "context": "Mira becomes still. Ilan turns to the window. The heating screen is waiting.",
            "statement": "I would keep the update task-focused and check on them at the next pause.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Empathy",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You stop for a brief fitness check before opening the heat model."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You let the news settle, then ask whether the next task feels manageable."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You move directly to heating. Their reactions remain private for now."
              }
            },
            "convergence": "Both can continue. Mira asks for exact limits; Ilan asks for a clear role."
          },
          {
            "id": "q25",
            "number": 25,
            "title": "What Is Left",
            "context": "The radio cannot be repaired here. Heat, shelter and local monitoring can still be managed.",
            "statement": "I would return most of my attention to what remained under local control.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Resilience",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "The failed call stays at the front of your attention until the thermal alarm sounds."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You name what cannot be changed and list what still can."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You place contact outside the immediate problem and return to local systems."
              }
            },
            "convergence": "The thermal model finishes. Aurora will cool before any rescue time can be assumed."
          }
        ],
        "closing": "The heating screen shows three zones and enough power for one loop. Outside that loop, the station will begin to freeze."
      },
      {
        "id": "act-06",
        "number": 6,
        "title": "Rationing Heat",
        "time": "23:16–23:40",
        "opening": "Mira points to the control-room loop. Ilan points to the shared refuge. The machinery bay and Sector C are already cooling. On the screen, every heated room turns another room blue.",
        "items": [
          {
            "id": "q26",
            "number": 26,
            "title": "One Warm Room",
            "context": "Mira marks the control room, Ilan marks the refuge and you hold a third workable plan.",
            "statement": "I would bring the different views into one discussion before fixing the heat allocation.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Cooperation",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You choose the loop with the lowest heat loss and explain it during setup."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You hear each priority and test only the assumptions that could change the choice."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You place all three plans against the same loss rates, occupancy and access limits."
              }
            },
            "convergence": "The compact control-room refuge is the only loop that can shelter all three and keep the safety panel live."
          },
          {
            "id": "q27",
            "number": 27,
            "title": "Small Loads",
            "context": "The major loads are off. Several small lights, chargers and heat leaks remain.",
            "statement": "I would keep looking for useful small savings after the main work was complete.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Industriousness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You stop after the major savings and begin the rest cycle."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You test only the small changes with the clearest return."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You continue until the remaining checks no longer offer a credible saving. Several extra minutes appear in the estimate."
              }
            },
            "convergence": "The survival setup may last until 04:10, if no new fault appears."
          },
          {
            "id": "q28",
            "number": 28,
            "title": "When the Fans Stop",
            "context": "The final fan stops. In the quiet, a faint grouped sound enters through the floor.",
            "statement": "I would stay with the instruments rather than turn towards the unfamiliar sound.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Aesthetics",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You step away from the display and listen beside the wall."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You finish the current check, then listen through the pause."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You stay with the instruments until Ilan asks everyone to be still."
              }
            },
            "convergence": "All three hear the rhythm. A faint magnetic movement appears beneath Sector C."
          },
          {
            "id": "q29",
            "number": 29,
            "title": "The Cold Routine",
            "context": "Checks and radio calls repeat. Between them, the room becomes quiet and inward.",
            "statement": "I would let each person manage their own social energy during the routine.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Enthusiasm",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep a low current of conversation moving between checks."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You make brief contact at each handover and allow silence between them."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You leave the quiet intact and speak only when the task requires it."
              }
            },
            "convergence": "The group stays functional. Ilan finds the same interval in the old anomaly file."
          },
          {
            "id": "q30",
            "number": 30,
            "title": "Frost at the Door",
            "context": "Frost reaches the door seal. The refuge remains within its limits, but the sight unsettles the room.",
            "statement": "I would regain focus after noticing the frost and continue with the agreed checks.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Resilience",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "The image of the frost stays with you. You reopen the calculation and begin checking assumptions again."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You compare the trend with the trigger points, then take another check to settle your attention."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You register the concern, confirm the limits and return fully to the working rhythm."
              }
            },
            "convergence": "The refuge remains in range. Beneath the floor, the pulse repeats clearly enough for the recorder."
          }
        ],
        "closing": "The last fans wind down. In the new silence, three slow knocks pass through the floor, followed by a long pause."
      },
      {
        "id": "act-07",
        "number": 7,
        "title": "The Signal Under the Ice",
        "time": "23:41–01:10",
        "opening": "The knocks return in groups, separated by long breaths of silence. A small magnetic movement appears before each sound. Ilan opens the recorder case. At midnight, Aurora's scheduled call passes unanswered.",
        "items": [
          {
            "id": "q31",
            "number": 31,
            "title": "The Whole Pulse",
            "context": "Mira wants the safety values. Ilan wants the full shape, spacing and sound of the pulse.",
            "statement": "I would preserve the signal's rhythm and sensory detail in the record.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Aesthetics",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep the compact safety record and allow one short waveform."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You preserve one complete group beside the summary."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You reserve enough capacity for the full shape, spacing, sound and room conditions around several groups."
              }
            },
            "convergence": "The record confirms a repeatable delay from magnetic movement to sound."
          },
          {
            "id": "q32",
            "number": 32,
            "title": "Before Record",
            "context": "The pulse may return at any time. Mira asks for a duration, power limit and stop conditions.",
            "statement": "I would agree the limits before switching the recorder on.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Orderliness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You start the recorder while the limits are still being discussed."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You agree the power ceiling and stop conditions, then finish the timing while it runs."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You set the duration, load and stop rules before Mira closes the switch."
              }
            },
            "convergence": "The recorder receives forty minutes and three immediate stop conditions."
          },
          {
            "id": "q33",
            "number": 33,
            "title": "Two Years",
            "context": "Ilan keeps both hands on the recorder case. He has spent two years returning to these traces.",
            "statement": "I would acknowledge what the opportunity meant to Ilan before setting the limit.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Empathy",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep the exchange to watts and minutes and let the authorised run speak for itself."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You recognise the time behind his request, then return to the limit."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You name what stopping may cost him before setting the boundary."
              }
            },
            "convergence": "Ilan accepts the limit. Mira watches the power while he takes the recorder."
          },
          {
            "id": "q34",
            "number": 34,
            "title": "Twenty or Forty",
            "context": "Mira asks for twenty minutes. Ilan asks for forty. Neither adds new information.",
            "statement": "I would set the operating limit myself when the discussion stopped moving.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Assertiveness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You allow one more round and wait for a shared number."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You set the non-negotiable stops and let them work inside those limits."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You set the ceiling, end time and stop authority."
              }
            },
            "convergence": "Forty minutes enters the log. Ilan starts recording while Mira watches fuel and refuge heat."
          },
          {
            "id": "q35",
            "number": 35,
            "title": "Under the Floor",
            "context": "With the fans silent, the pulse seems to rise through your boots rather than the speakers.",
            "statement": "I would experience the unknown source as personally threatening.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Calmness",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You treat the pulse as strange, not personal, and keep your eyes on the instruments."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "Unease rises with the next group; you return to the measured interval."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "The sound begins to feel close and intentional, competing with the instrument task."
              }
            },
            "convergence": "Three groups are captured. The source remains unknown, and midnight has passed without contact."
          }
        ],
        "closing": "The recorder falls back to low power. Under the red lights, the next knock seems closer than the last, though the measured level has not changed."
      },
      {
        "id": "act-08",
        "number": 8,
        "title": "The Figure in the Whiteout",
        "time": "01:12–03:50",
        "opening": "Ilan rises so quickly that his chair strikes the wall.\n\n“There is someone outside.”\n\nSnow drives across the window. The glass returns a warped reflection of the red room. The outer camera is half blind, and the door alarm shows nothing.",
        "items": [
          {
            "id": "q36",
            "number": 36,
            "title": "Someone Outside",
            "context": "Ilan points into the whiteout. Your first reply comes out sharper than you intended.",
            "statement": "I would need time before my voice settled during the verification.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Resilience",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "Your first reply sharpens, then settles. You ask for place, movement and duration."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You pause long enough to turn the tension into a factual question."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "The tension remains in your voice and keeps pulling the check back towards the fear in the room."
              }
            },
            "convergence": "He identifies one point beyond the left window frame, but cannot separate movement from reflection."
          },
          {
            "id": "q37",
            "number": 37,
            "title": "Fear First",
            "context": "Ilan is cold and frightened. He keeps looking at the same point in the glass.",
            "statement": "I would acknowledge his fear before deciding what he had seen.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Empathy",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You move straight to verification and let the work carry the response."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You say the sight was frightening, then separate that from its cause."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You name his fear before beginning the check."
              }
            },
            "convergence": "Ilan remains oriented, but his hands are cold. Mira wraps him in thermal blankets."
          },
          {
            "id": "q38",
            "number": 38,
            "title": "What It Could Be",
            "context": "Reflection, ice, camera error, exhaustion and a real figure remain possible.",
            "statement": "I would keep more than one explanation in mind while the checks ran.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Ideas",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You test the most likely cause first. The room light removes most of the shape."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You compare reflection and camera error before widening the search."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep several causes open and choose checks that separate them."
              }
            },
            "convergence": "Most of the shape disappears. One movement remains hidden by snow on the camera."
          },
          {
            "id": "q39",
            "number": 39,
            "title": "Nine More Checks",
            "context": "The first camera and door checks show no entry. Nine additional checks remain.",
            "statement": "I would be ready to stop after the first checks showed nothing.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Industriousness",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You continue until the remaining checks can no longer change the safety plan."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You complete only the checks that could alter the refuge plan."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You close the review after the first camera and door checks."
              }
            },
            "convergence": "No system confirms an intruder. The sighting remains an unverified observation."
          },
          {
            "id": "q40",
            "number": 40,
            "title": "Back Together",
            "context": "Mira returns to fuel. Ilan folds around the recorder. The room separates into three silences.",
            "statement": "I would create a shared rhythm that brought the group back into contact.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Enthusiasm",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You let the quiet hold until the next formal handover."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You call a short reset for water, warmth and the next two tasks."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You bring everyone into a brief shared check-in, then restart the watch as one group."
              }
            },
            "convergence": "A twenty-minute rotation begins. No second figure appears."
          }
        ],
        "closing": "At 03:50, the wind drops below its peak. Green light spills across the snow, and every surviving instrument begins to drift."
      },
      {
        "id": "act-09",
        "number": 9,
        "title": "Aurora at 03:50",
        "time": "03:50–03:58",
        "opening": "Aurora floods the window in green and violet, with a pale band none of you can name. The magnetic trace rises with it. The pulse beneath the ice grows clearer. On the generator panel, the fuel estimate falls again.",
        "items": [
          {
            "id": "q41",
            "number": 41,
            "title": "The Sky Enters",
            "context": "Green and violet light moves across the ceiling while the alarm band stays red.",
            "statement": "I would take a few seconds to absorb the aurora's colour and scale.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Aesthetics",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep your eyes on the instruments and let the sky remain outside the record."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You look once, then return to the panel and save a short image."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You let the colour and movement enter your attention before returning to the emergency."
              }
            },
            "convergence": "The magnetic rise matches the aurora, and the pulse beneath the floor grows clearer."
          },
          {
            "id": "q42",
            "number": 42,
            "title": "Drifting Baselines",
            "context": "Several instrument baselines begin to drift. The fixed observation list remains beside the screen.",
            "statement": "I would keep the same observation order while the instruments drifted.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Orderliness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You abandon the list and follow whichever channel changes next."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You preserve the core order but break it for short-lived changes."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You continue through the fixed sequence, marking every deviation in the same place."
              }
            },
            "convergence": "The record remains comparable while short changes are captured in side notes."
          },
          {
            "id": "q43",
            "number": 43,
            "title": "Two Emergencies",
            "context": "Mira watches survival systems. Ilan watches the signal. Their tasks no longer overlap naturally.",
            "statement": "I would let them remain separate and coordinate mainly at planned handovers.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Cooperation",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You bring both streams together whenever one changes the other's limit."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You set short handovers and leave them separate between those points."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You let each specialist remain deep in one task until the next planned handover."
              }
            },
            "convergence": "The fuel limit and recorder state finally meet on one shared screen."
          },
          {
            "id": "q44",
            "number": 44,
            "title": "Reconnect the Room",
            "context": "Mira and Ilan speak only to their own instruments. Neither hears the other's latest number.",
            "statement": "I would make my engagement visible enough to reconnect the room.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Enthusiasm",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You allow the separate focus to continue until the next deadline forces contact."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You call one shared update, then return both people to their work."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You step between the stations, restate the common problem with visible energy and make each person answer the other."
              }
            },
            "convergence": "The room returns to one operating picture as the fuel estimate drops again."
          },
          {
            "id": "q45",
            "number": 45,
            "title": "A Deliberate Sound",
            "context": "The pulse repeats like a call. The resemblance raises unease, though the measurements remain stable.",
            "statement": "I would steady my attention and continue treating the pulse as measured data.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Calmness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "The resemblance takes over the room. You check the walls and window before returning to the trace."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You name the feeling, then bring your attention back to timing and amplitude."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You hold the unease beside the data and continue the measured check without narrowing your attention."
              }
            },
            "convergence": "The pattern remains repeatable. Its source and meaning remain unknown."
          }
        ],
        "closing": "The reserve is now measured in minutes. Mira asks for heat. Ilan asks for one uninterrupted recording."
      },
      {
        "id": "act-10",
        "number": 10,
        "title": "The Last Reserve",
        "time": "03:58–04:06",
        "opening": "Fifteen minutes of fuel remain for one major load. Every switch will consume part of that time. Mira and Ilan argue over the generator alarm, their voices rising while the number falls.",
        "items": [
          {
            "id": "q46",
            "number": 46,
            "title": "One More Calculation",
            "context": "The fuel estimate is falling faster than before. Some assumptions may still be wrong.",
            "statement": "I would recheck the parts of the calculation most likely to change the decision.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Industriousness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You accept the latest estimate and move directly to the choice."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You verify the single assumption most likely to move the result."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You check every assumption that could still change the choice and leave the rest untouched."
              }
            },
            "convergence": "The revised result changes little: one major load, about fifteen minutes."
          },
          {
            "id": "q47",
            "number": 47,
            "title": "A Third Plan",
            "context": "Mira's heat plan and Ilan's recording plan are complete. A third approach remains possible.",
            "statement": "I would compare the two complete plans before developing another option.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Ideas",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You use the blank line to build a timed split and calculate the switching loss."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You compare the two plans, then sketch a split only where their minimums overlap."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep the decision between the two complete plans."
              }
            },
            "convergence": "The split remains possible, but it gives less heat and less data than either pure plan."
          },
          {
            "id": "q48",
            "number": 48,
            "title": "Cross-Examination",
            "context": "Mira and Ilan hold different assumptions. Both are ready to answer one direct question from the other.",
            "statement": "I would invite them to test each other's assumptions openly.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Cooperation",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You question each plan separately and carry the answers between them."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You ask one direct question from each person to the other."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You make them test each other's figures and state what would disqualify their own plan."
              }
            },
            "convergence": "The hidden costs become clear: slower rescue response under cold, and incomplete proof under short recording."
          },
          {
            "id": "q49",
            "number": 49,
            "title": "The Circle",
            "context": "The same figures return louder each time. The switch sequence is waiting.",
            "statement": "I would interrupt the repetition and take control of the final exchange.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Assertiveness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You allow one more round and wait for either person to move."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You stop the repeated points and ask for one final new fact from each."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You end the circle, set the speaking order and call the decision point."
              }
            },
            "convergence": "No new fact removes the trade-off. The reserve continues to fall."
          },
          {
            "id": "q50",
            "number": 50,
            "title": "Two Urgencies",
            "context": "Mira names the danger of cold. Ilan names the loss of the signal. The pressure rises.",
            "statement": "I would remain pulled towards whichever loss felt most immediate.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Resilience",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You let the urgency register, then return to the criteria without carrying either voice into the comparison."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "The urgency pulls at you, but a deliberate pause returns your attention to the written limits."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "The pressure keeps displacing the criteria, and the nearer loss begins to dominate the choice."
              }
            },
            "convergence": "The plans remain unchanged. Only the emotional weight in the room has moved."
          }
        ],
        "closing": "No calculation removes the loss. The only question left is what Aurora will protect."
      },
      {
        "id": "act-11",
        "number": 11,
        "title": "Two Paths and a Narrow Third",
        "time": "04:06–04:12",
        "opening": "Three plans lie beneath the red lamp: heat, recording, or a timed split. Each saves something. Each abandons something. Mira keeps one finger on the fuel estimate. Ilan keeps both hands around the data drive.",
        "items": [
          {
            "id": "q51",
            "number": 51,
            "title": "Behind the Numbers",
            "context": "Mira's page carries three names under HEAT. Ilan's carries two years of dates under RECORD.",
            "statement": "I would keep the personal meaning separate from the measurable comparison.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Empathy",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You name what each plan means to the person defending it before returning to the figures."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You acknowledge the stakes briefly and keep them beside, not inside, the calculation."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You remove the personal history from the comparison and work only from measured outcomes."
              }
            },
            "convergence": "Both people understand what the choice can and cannot account for."
          },
          {
            "id": "q52",
            "number": 52,
            "title": "One Grid",
            "context": "The three plans use different units and assumptions. A blank grid waits on the console.",
            "statement": "I would place all three plans into the same structure before choosing.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Orderliness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You compare the plans in their existing forms and preserve their differences."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You standardise the critical values only."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You rewrite all three plans into one set of columns and thresholds."
              }
            },
            "convergence": "The plans can now be compared line by line, though some nuance has been flattened."
          },
          {
            "id": "q53",
            "number": 53,
            "title": "The Unmeasured Cost",
            "context": "The immediate figures are close. Several consequences remain uncertain and may appear only later.",
            "statement": "I would consider less-visible consequences before closing the decision.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Ideas",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep the decision to outcomes that can be measured now."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You name one uncertain consequence but give it less weight than the current figures."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You test several plausible hidden consequences and ask whether any could reverse the ranking."
              }
            },
            "convergence": "No hidden consequence can be quantified, but none can be dismissed."
          },
          {
            "id": "q54",
            "number": 54,
            "title": "Without Certainty",
            "context": "No plan removes every risk. The final comparison is complete and the switch window is closing.",
            "statement": "I would steady myself enough to commit while uncertainty remained.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Calmness",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "The remaining uncertainty keeps the choice open while you look for one more disqualifying fact."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You state what remains unknown, steady the room and choose."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You hold the uncertainty without letting it become the decision, then call the plan."
              }
            },
            "convergence": "A decision is reached. Mira confirms the switch sequence, but execution has not yet begun."
          },
          {
            "id": "q55",
            "number": 55,
            "title": "The Duty Lead",
            "context": "The choice is made. Mira and Ilan understand it, but one final challenge is still possible.",
            "statement": "I would present the direction as provisional until they had one last chance to challenge it.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Assertiveness",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You state the final direction and move directly to execution."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You state the decision, allow one question about execution and close the discussion."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You present the direction as provisional and invite one final challenge before the switch moves."
              }
            },
            "convergence": "The switching sequence begins under the chosen allocation."
          }
        ],
        "closing": "At 04:12, the wind drops below the travel limit. Thirty kilometres south, Ridge starts its vehicles. No voice reaches Aurora."
      },
      {
        "id": "act-12",
        "number": 12,
        "title": "The Final Watch",
        "time": "04:28–05:20",
        "opening": "By 04:28, the generator is silent. Chemical lights hang from the console. The battery VHF sits between three sleeping bags in the smallest warm room. The missed midnight call should have started a search, but Aurora has no way to know.",
        "items": [
          {
            "id": "q56",
            "number": 56,
            "title": "Three Sleeping Bags",
            "context": "The smallest warm room can hold all three. The sleeping positions and watch roles still need agreement.",
            "statement": "I would work with the others to arrange one shared refuge plan.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Cooperation",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep everyone warm but let each person manage a separate routine and resting position."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You share one warm zone and coordinate only at fixed checks."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You build one rotation that coordinates rest, radio watch, symptom checks and the limited space."
              }
            },
            "convergence": "No one remains in an unheated part of the station, and every watch interval has an owner."
          },
          {
            "id": "q57",
            "number": 57,
            "title": "What Still Works",
            "context": "No powered system can be changed. Radio listening and survival checks still remain.",
            "statement": "I would stop the regular routine and conserve energy until conditions changed.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "R",
              "correctedScoreFormula": "7 - raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Industriousness",
                "keyDirection": "R",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep a minimal watch of radio, symptoms, battery and entry point."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You lengthen the intervals and keep only survival checks."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You suspend the regular cycle until the group agrees on a smaller one."
              }
            },
            "convergence": "A low-energy watch remains, matched to the team's declining capacity."
          },
          {
            "id": "q58",
            "number": 58,
            "title": "Keep Time Moving",
            "context": "Between radio checks, the chemical light barely moves. Silence hides how alert each person remains.",
            "statement": "I would keep a quiet conversation moving through the wait.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Enthusiasm",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You choose silence and use names only at scheduled checks."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You ask brief questions at each interval and allow silence between them."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep a low current of practical conversation moving."
              }
            },
            "convergence": "At 04:46, a voice breaks through the VHF static: Ridge Survey, fourteen kilometres south."
          },
          {
            "id": "q59",
            "number": 59,
            "title": "Thirty-Four Minutes",
            "context": "Ridge is thirty-four minutes away. Relief enters the room before the rescue team does.",
            "statement": "I would settle back into the next routine quickly after hearing Ridge's voice.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Resilience",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "Relief breaks the routine for several minutes before the next check begins."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You let the relief register, then restate the final interval."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You return at once to radio, warmth and safe-entry preparation."
              }
            },
            "convergence": "Ridge receives the hazard and entry point. The last auroral colour fades from the sky."
          },
          {
            "id": "q60",
            "number": 60,
            "title": "What the Log Misses",
            "context": "The fault log holds times, loads and alarms, but not the light or the knocks.",
            "statement": "I would record the night's colours, sounds and unanswered details beside the technical report.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "+",
              "correctedScoreFormula": "raw",
              "constructContract": {
                "format": "single-statement Likert 1-6",
                "targetFacet": "Aesthetics",
                "keyDirection": "+",
                "contextRule": "Neutral narrative context; no preferred response stated",
                "responseRule": "Rate how closely the statement matches the player’s likely response"
              }
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep the final entry factual and leave interpretation for later."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You complete the fault log and add a separate observation note."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You place colour, sound and uncertainty beside the technical record."
              }
            },
            "convergence": "At 05:20, tracked lights appear through the thinning snow. Ridge has reached Aurora."
          }
        ],
        "closing": "The outer door opens into white headlamps, engine noise and blue Ridge jackets. For the first time that night, responsibility begins to leave your hands."
      }
    ]
  },
  "finalReserve": {
    "id": "final-reserve",
    "scored": false,
    "insertAfterQuestionId": "q55",
    "insertAfterActId": "act-11",
    "branchInsertBeforeActId": "act-12",
    "title": "The Final Reserve",
    "note": "Unscored. This decision changes the night, not your Five-Element scores.",
    "prompt": "One major load can remain. What does Aurora protect?",
    "options": [
      {
        "id": "safety",
        "title": "Protect the crew",
        "text": "Keep refuge heat and safety monitoring alive.",
        "immediate": "The recorder falls silent. Heat and the safety panel remain until the reserve is gone.",
        "act12Opening": "The refuge keeps useful warmth after the generator stops. Everyone is cold, but the room loses heat slowly.",
        "endingConsequence": {
          "rescueState": "All three show cold exposure and require evacuation, but they remain responsive when Ridge arrives.",
          "dataLegacy": "The signal record contains separated fragments. It proves that an anomaly occurred but cannot establish a complete repeating cycle."
        }
      },
      {
        "id": "discovery",
        "title": "Capture the signal",
        "text": "Give the reserve to one uninterrupted recording.",
        "immediate": "The heater dies. The recorder runs for eleven continuous minutes before the generator stops.",
        "act12Opening": "The refuge cools quickly. The crew enters the powerless wait with the clearest record and the least warmth.",
        "endingConsequence": {
          "rescueState": "All three are conscious but show more advanced cold exposure; Ridge begins active rewarming before evacuation.",
          "dataLegacy": "The eleven-minute record shows a repeatable structure and a consistent magnetic-to-acoustic delay, but it still cannot identify the source."
        }
      },
      {
        "id": "bounded",
        "title": "Make a bounded split",
        "text": "Record for four minutes, then return the remaining reserve to heat.",
        "immediate": "One partial sequence is captured. The switch costs time, but the refuge receives one final burst of heat.",
        "act12Opening": "The refuge holds less warmth than the safety plan and more than the recording plan. The data ends before a full cycle.",
        "endingConsequence": {
          "rescueState": "All three require rewarming and evacuation. Their cold exposure falls between the other two outcomes.",
          "dataLegacy": "The four-minute record confirms the magnetic-to-acoustic sequence but ends before the repeating structure can be demonstrated."
        }
      }
    ]
  },
  "ending": {
    "rescue": "Ridge technicians isolate the damaged bus before connecting their portable generator to the safe service inlet. Heat returns first, then radio light, then the low ordinary hum of a working room.\n\nThe pulse beneath the ice disappears into that noise.",
    "shared": "No camera or sensor ever confirms the figure Ilan saw in the whiteout.\n\nIn the tracked vehicle, Mira says the first Sector C warning should have been escalated. Ilan holds the data drive in both hands and says he will return when Aurora is safe.\n\nThrough the ice-covered window, the station becomes a black shape beneath a colourless sky. Warm air pulls you towards sleep, but the night's evidence refuses to settle.\n\nThe pulse, the drifting instruments and the figure may share one cause—or none. Ice movement, damaged machinery, interference and exhaustion remain possible in different combinations. The record ends before those possibilities do.\n\nWhen the next watch returns to Aurora, what will it hear beneath the ordinary noise?"
  },
  "narrativeDelivery": {
    "principle": "The system remains analytical underneath; the reader experiences a story on the surface, while each statement remains a neutral single-construct Likert item.",
    "voice": "Second person, present tense, restrained psychological hard science fiction.",
    "visibleLayer": [
      "scene",
      "character",
      "sensation",
      "uncertainty",
      "choice"
    ],
    "hiddenLayer": [
      "element",
      "facet",
      "key direction",
      "scoring",
      "branch balance"
    ],
    "revision": "Senior editorial integrity pass: continuity, construct clarity, response neutrality and restrained hard-SF delivery."
  }
};
