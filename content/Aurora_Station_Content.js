/* Edit this data file to update the story; no rebuild is required. */
window.AURORA_STATION_DATA = {
  "schemaVersion": "1.0.0",
  "contentVersion": "2.2.0-result-and-story-export",
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
    }
  },
  "story": {
    "prologue": {
      "id": "prologue",
      "title": "The Final Watch",
      "text": "The sun set at Aurora Station earlier in the week and will not return for months. Midwinter is not complete darkness here; it is a long grey twilight in which distance, wind and cold seem to merge.\n\nAurora is a small Australian research outpost on the Antarctic ice, almost four thousand kilometres from Hobart. The summer crew has gone. Three people remain to finish the last measurements, secure the equipment and place the station into unattended winter mode.\n\nMira Voss, the senior maintenance engineer, has spent four winters on the ice. She speaks in the compact language of someone used to solving faults before they become emergencies. Ilan Marek, a glaciologist on his first winter closeout, requested the assignment after finding neglected records of a repeating magnetic anomaly beneath Sector C. You are duty lead for the final overnight watch.\n\nThe watch runs from 22:00 to 06:00. A formal status call is due at midnight. A Ridge survey team is camped thirty kilometres south with its own satellite terminal, but the route closes whenever the wind exceeds the whiteout travel limit.\n\nOutside, the wind has changed from a whistle to a low mechanical growl. A whiteout is moving towards the station.\n\nAt 21:58, Mira places the handover folder on the control desk. Her coat is already zipped and fatigue has flattened her voice.\n\n“Sector C has been intermittent,” she says. “The temperature channel jumps without warning. I have not found the cause. It may be measurement noise, but if it happens again, look at what moves with it.”\n\nHer shift is over, but she will remain in the living module with a radio. Once the handover is signed, the station is yours to watch."
    },
    "acts": [
      {
        "id": "act-01",
        "number": 1,
        "title": "The Final Handover",
        "time": "21:58–22:06",
        "opening": "The handover folder is complete except for one handwritten line: “Sector C intermittent — monitor.” It contains no threshold, no next check and no record of which explanations Mira has already tested. She waits beside the door while Ilan watches snow begin to travel horizontally across the outer window.",
        "items": [
          {
            "id": "q01",
            "number": 1,
            "title": "An Unfinished Entry",
            "context": "Mira is ready to leave after a long shift. Keeping her at the desk would delay her rest, but closing the handover now would leave the next operator to reconstruct the warning from alarms and memory.",
            "statement": "With Mira ready to leave, my instinct would be to keep the handover open until the Sector C note felt complete.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You mark the note for review and close the handover, preserving Mira's rest. The live alarm history will have to carry more of the detail."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You add the latest timestamps and a practical review point. Mira supplies the minimum detail before leaving."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You hold the folder open long enough to record the observations, completed checks and escalation threshold. Mira's rest begins a few minutes later."
              }
            },
            "convergence": "Whichever route you take, the record now identifies three brief spikes from the previous shift. Each cleared by itself, and none crossed the automatic trip threshold."
          },
          {
            "id": "q02",
            "number": 2,
            "title": "One Question at the Door",
            "context": "One boundary remains unclear: should Mira be recalled after another temperature spike, or only when an electrical reading moves with it? A direct question would hold her at the door; the standing instruction may already contain the answer.",
            "statement": "I would be inclined to close the handover and consult the standing instruction rather than stop Mira with one more direct question.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You stop Mira at the door and ask for the boundary directly. Her rest is delayed by one exchange, and the recall threshold becomes explicit."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You let the door open, then confirm the boundary over the radio before she reaches the living module."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You close the handover and consult the standing instruction. It supplies the threshold without another exchange, though not Mira's reasoning behind it."
              }
            },
            "convergence": "The operational boundary is now fixed. A temperature spike alone can be observed; a matching current change requires escalation and Mira's return."
          },
          {
            "id": "q03",
            "number": 3,
            "title": "The Uneasy Researcher",
            "context": "After Mira leaves, Ilan keeps looking towards the storm and admits that the shutdown may end his only chance to study the old anomaly. Asking what is behind his unease would interrupt the opening checks; returning to work may give him useful structure.",
            "statement": "Before returning to the displays, I would feel drawn to ask what was behind Ilan's unease.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You give Ilan a concrete recorder check instead of opening a personal conversation. The task steadies his hands, and he begins to speak while working."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You ask whether he is fit for the watch and stay for a brief answer. He admits that the shutdown feels like a closing door on his research."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You ask what is behind the unease and allow the answer to arrive slowly. The first console checks wait while he explains what this watch may mean."
              }
            },
            "convergence": "Ilan opens the old Sector C records beside the live displays. His anxiety has a shape now: the storm, the shutdown, and the possibility that two years of work may end without an answer."
          },
          {
            "id": "q04",
            "number": 4,
            "title": "A Convenient Explanation",
            "context": "Sensor noise is familiar and statistically likely. Ilan's archived anomaly is less likely, but it would connect details the sensor explanation leaves open. Holding both accounts costs attention; choosing one makes the watch simpler.",
            "statement": "I would be inclined to keep a second explanation visible while working from the more familiar one.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You use sensor noise as the sole working account and define the evidence that would displace it. The watch remains simple and testable."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You lead with sensor noise while adding current and magnetic channels to the display. A second account remains visible at low cost."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep both explanations in the log and note what would separate them. The wider watch uses more attention but preserves more possibilities."
              }
            },
            "convergence": "The live display now shows the three channels together. Nothing is moving yet, but the next anomaly will leave a wider trace than the previous ones did."
          },
          {
            "id": "q05",
            "number": 5,
            "title": "The First Quiet Minute",
            "context": "The control room settles after the handover. Sector C remains unresolved, yet the rest of the station still requires an ordinary watch rotation. Extra vigilance may catch a change early but can pull attention away from everything else.",
            "statement": "I would expect to settle into the wider watch without the unresolved warning taking over my attention.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep Sector C near the front of the watch and scan it more often than scheduled. The extra attention reduces uncertainty there but narrows the wider rotation."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You make one additional review, then return to the normal watch cycle."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You hold to the planned interval and let the rest of the station back into view. The warning remains less immediate between checks."
              }
            },
            "convergence": "At 22:06, the console gives a single soft tone. The alert comes from Sector C."
          }
        ],
        "closing": "At 22:06, the temperature trace leaps, drops and leaps again. This time the current trace moves with it."
      },
      {
        "id": "act-02",
        "number": 2,
        "title": "The First Spike",
        "time": "22:06–22:18",
        "opening": "The temperature and current changes are not perfectly aligned, but they are too close to treat as independent. The whiteout is still short of its predicted peak, leaving a narrow window for a physical inspection.",
        "items": [
          {
            "id": "q06",
            "number": 6,
            "title": "The Shape of the Trace",
            "context": "The values remain below protection limits, but the traces bend in a repeating order: magnetic movement, current movement, then heat. Thresholds are documented and efficient; shape and timing are less certain but may contain information.",
            "statement": "My attention would stay mainly on defined limits rather than on the visual shape and rhythm of the traces.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You enlarge the traces and compare their timing and shape. The less standard reading takes longer but reveals a faint magnetic lead."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You check the limits first, then preserve a short high-resolution window. The replay reveals a disturbance hidden by the summary view."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep the response tied to documented limits. Ilan later enlarges the trace and identifies the same magnetic lead."
              }
            },
            "convergence": "The pattern is now part of the evidence: magnetic disturbance, current movement, then temperature rise. It does not explain the fault, but it is not random noise."
          },
          {
            "id": "q07",
            "number": 7,
            "title": "Evidence While It Is Fresh",
            "context": "The readings have returned to normal. A full cross-check now would pause the shutdown list and use the team's remaining energy; waiting may make the cleanest event harder to reconstruct.",
            "statement": "I would feel compelled to begin the cross-check while the event was still fresh, even if the shutdown list had to pause.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You preserve the event and wait for a confirming change before committing the watch. Shutdown work continues, while the first trace grows less immediate."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You complete one calibration check now and make deeper review conditional on another movement."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You open the alarm history, calibration record and redundant channels at once. The evidence stays fresh, while the shutdown list pauses."
              }
            },
            "convergence": "The redundant temperature sensor reads lower but moves in the same direction. An independent current estimate confirms that the electrical load is changing in reality."
          },
          {
            "id": "q08",
            "number": 8,
            "title": "Three Interpretations",
            "context": "Mira knows the maintenance history, Ilan knows the archived pattern, and you hold the live operating picture. Combining the views early may reveal gaps; forming your own view first may reduce noise and group influence.",
            "statement": "I would prefer to form a working explanation myself before bringing Mira's and Ilan's interpretations together.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You place the three views side by side before choosing a working cause. The comparison starts broadly and takes more discussion."
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
                "transition": "You finish your own interpretation before inviting challenge. The initial picture stays coherent, while Mira's and Ilan's details enter later."
              }
            },
            "convergence": "All three accounts now agree on one practical point: a local temperature fault cannot explain the verified current movement. Sector C needs a physical check."
          },
          {
            "id": "q09",
            "number": 9,
            "title": "Moving the Room",
            "context": "The inspection window is closing. Mira has just returned from trying to rest and Ilan is alert but hesitant. The room can be moved by visible energy or by quiet, precise instructions.",
            "statement": "My first instinct would be to raise the room's energy and pull everyone visibly into action.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep the tone restrained and issue precise requests. The room moves without a visible lift in mood."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You state the urgency and give each person one concrete task. The pace rises while the tone stays contained."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You stand, name the objective and bring visible momentum into the room. The energy helps movement, though Mira asks for one instruction to be repeated."
              }
            },
            "convergence": "The portable meter, radio, protective equipment and Sector C drawing are ready. At 22:18, the inspection begins before the whiteout reaches full strength."
          },
          {
            "id": "q10",
            "number": 10,
            "title": "After the Second Alarm",
            "context": "A second spike drives the alarm band red for less than a second. The display settles immediately, but the sound and physical jolt remain while the inspection still has to begin.",
            "statement": "After the second alarm, I would expect my attention to return to the evidence fairly quickly.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You take another pass through the readings before the alarm's physical jolt settles. The extra review delays departure but restores confidence in the sequence."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You pause to reset your breathing and restate the next step aloud."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You continue from the last verified fact almost immediately. Momentum is preserved, with less time spent checking the effect of the alarm on the room."
              }
            },
            "convergence": "At 22:18, you leave the control room with the portable meter. Mira stays on the radio, and Ilan watches the live traces from the console."
          }
        ],
        "closing": "The corridor narrows towards Sector C. Frost covers the pipes, yet the air grows warmer with every step."
      },
      {
        "id": "act-03",
        "number": 3,
        "title": "Heat Behind the Panel",
        "time": "22:20–22:41",
        "opening": "Heat radiates through the distribution cabinet strongly enough to feel through a glove. A thin burnt smell hangs in the corridor, while the local indicator continues to report a permitted load.",
        "items": [
          {
            "id": "q11",
            "number": 11,
            "title": "The Normal Indicator",
            "context": "The local indicator remains normal, while the cabinet radiates heat and a cold conduit has begun to thaw. Treating the sensor circuit as the working cause keeps the test focused; widening the model may catch an upstream fault.",
            "statement": "Until a direct measurement challenged it, I would continue using the sensor fault as my working explanation.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You treat the contradiction as a reason to widen the fault model before touching the cabinet. The upstream conduit enters the inspection immediately."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You retain the sensor fault as the leading account while adding overload and upstream leakage as measured alternatives."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep the familiar diagnosis and move to its confirming measurement. The focused test is quick, and the meter challenges the account."
              }
            },
            "convergence": "A live reading shows an unstable load that the local indicator is smoothing away. The fault is electrical, and its heat path extends beyond the visible branch."
          },
          {
            "id": "q12",
            "number": 12,
            "title": "The Suspected Hot Point",
            "context": "The likely hot point is behind the front cover. The full inspection begins outside the cabinet and works inward; going straight to the suspected point would save time but postpone several safeguards.",
            "statement": "With the temperature rising, I would prioritise the suspected hot point before completing the full inspection sequence.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You follow the full outside-to-inside sequence. It takes longer but rules out a loose terminal before the cover opens."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You keep the checks that protect the next action and log the rest for later completion."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You test the suspected point first and obtain a rapid load reading. The skipped checks then have to be completed before switching."
              }
            },
            "convergence": "The result is the same: the visible Sector C branch is overloaded intermittently, but a leakage pulse also appears on the common bus upstream of its protection."
          },
          {
            "id": "q13",
            "number": 13,
            "title": "The Safety Boundary",
            "context": "Mira is covering generator readiness, Ilan is watching the live trace and you are at the cabinet. Explicit roles reduce ambiguity; allowing expertise to organise the work may be faster and less rigid.",
            "statement": "In the next exchange, I would naturally take explicit control of roles and isolation authority.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You let expertise organise the work. Roles emerge through the questions Mira and Ilan direct to you, with one brief overlap to resolve."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You confirm the stop condition and the critical roles, then leave the detailed sequence to Mira's experience."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You name the roles, callouts and single point of switching authority. The setup takes an extra exchange before the inspection continues."
              }
            },
            "convergence": "Mira covers generator readiness, Ilan covers the live trace and you hold switching authority. The cabinet check continues under one understood boundary."
          },
          {
            "id": "q14",
            "number": 14,
            "title": "Voices on the Radio",
            "context": "Mira and Ilan can neither see the cabinet nor judge your position from the radio. Frequent updates improve their picture but add speech and interruption during close electrical work.",
            "statement": "While working the fault, I would tend to give short radio updates rather than communicate only at decision points.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You limit the radio to measurements and commands. The inspection stays uncluttered, while Mira and Ilan hold their questions for a pause."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You give a short update at each decision point."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You describe position, risk and next action before each change. Their picture improves, while the extra radio traffic slows the sequence slightly."
              }
            },
            "convergence": "The radio picture is shared: the local branch can be isolated, but the upstream pulse means the main supply must still be treated as unstable."
          },
          {
            "id": "q15",
            "number": 15,
            "title": "The Possibility of Fire",
            "context": "Fire and cascading supply failure are now possible, though neither has occurred. A wider safety scan may catch a second threat; staying with the bounded isolation may protect concentration.",
            "statement": "My attention would remain mostly on the next confirmed step even as the possibility of fire entered the room.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You scan the corridor, generator status and evacuation route before returning to the cabinet. The wider check takes time but tests whether a second emergency is emerging."
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
                "transition": "You keep the field of attention on the cabinet, meter and isolation boundary. The local sequence moves faster while the wider risks remain on remote monitoring."
              }
            },
            "convergence": "The Sector C branch is isolated in a controlled sequence. The cabinet begins to cool, but the portable meter catches one more earth-leakage pulse on the common bus before it disappears."
          }
        ],
        "closing": "The Sector C branch is cooling, but the upstream fault remains. Mira begins preparing a controlled transfer so the common bus can be inspected.\n\nAt 22:47, before the transfer is ready, a dull impact travels through the station. The main generator trips. The lights vanish, then return in emergency red as the backup unit starts unevenly."
      },
      {
        "id": "act-04",
        "number": 4,
        "title": "Ninety Seconds",
        "time": "22:47–22:55",
        "opening": "The backup generator catches, stumbles and catches again. Its controller starts a ninety-second countdown to automatic load shedding. If the bus is still unstable at zero, a fixed priority table will choose the loads—a table never designed for tonight's fault.\n\nMira reaches the panel and begins reading the critical values. Ilan stands between the dark displays and the radio rack, waiting for direction.",
        "items": [
          {
            "id": "q16",
            "number": 16,
            "title": "The Countdown",
            "context": "The controller shows ninety seconds. Mira is reading voltage, frequency, load and oil pressure in a measured cadence; each new value narrows the safe action while the countdown continues to fall.",
            "statement": "The countdown would make me want to issue the first recovery order before Mira finished the critical readings.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You wait for the essential readings. The later start uses more of the countdown, but Mira's final value supports a precise forty-percent reduction."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You ask only for the decision values. Mira compresses the rest into one sentence, trading detail for time."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You order an immediate cut to nonessential loads. Mira adjusts its scope against the readings still arriving."
              }
            },
            "convergence": "The same critical loads are preserved. With seconds remaining, the bus settles and the automatic shed is cancelled."
          },
          {
            "id": "q17",
            "number": 17,
            "title": "Beyond the First Success",
            "context": "Emergency power is stable, but the main generator is still unavailable and the upstream leakage remains unexplained. Continuing now preserves fresh evidence; pausing protects an exhausted team and a fragile stable state.",
            "statement": "Once critical power was stable, I would want to continue into deeper diagnostics before allowing the team to pause.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You protect the stable state and give the team a short recovery pause. Some diagnostic detail will be less fresh when work resumes."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You complete the checks that decide whether a restart is possible and defer the lower-priority work."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You continue through the deeper checks while the evidence is fresh. The diagnostic picture improves, while the team postpones its first rest."
              }
            },
            "convergence": "The main generator cannot be restarted safely while the station is occupied. Its field circuit is unstable, and the common bus still shows intermittent leakage."
          },
          {
            "id": "q18",
            "number": 18,
            "title": "One Recovery Picture",
            "context": "Mira is testing the generator, Ilan is following the traces and you are choosing the live loads. A single plan keeps dependencies visible; independent work gives each specialist speed and concentration.",
            "statement": "I would prefer to coordinate the three workstreams through one shared plan rather than let each specialist run independently.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You let the three workstreams run independently and connect them only when one changes another. Specialisation stays fast, with periodic corrections."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You set common checkpoints while leaving each person independent between them."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You place all three workstreams on one shared sequence. Dependencies stay visible, though each specialist waits more often for the others."
              }
            },
            "convergence": "The team reaches one operating picture. At the present load, backup power would last less than two hours; at a minimum survival load, it may last a little over five."
          },
          {
            "id": "q19",
            "number": 19,
            "title": "The Red Room",
            "context": "The first restart attempt is abandoned. Mira goes quiet and Ilan stops asking questions. Trying to lift the room may restore momentum; leaving people alone may conserve energy and avoid forced optimism.",
            "statement": "I would prefer to keep my own focus quiet and let Mira and Ilan recover their momentum in their own way.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You name the progress already made and give the next task a visible beginning. The room's energy rises, though the encouragement asks for a response."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You keep the tone restrained but mark each completed step aloud."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You work quietly and leave the others to re-enter through their own tasks. Social pressure stays low, while the room remains subdued for longer."
              }
            },
            "convergence": "The team resumes a functional pace. There is no promise that the main generator will return, only enough momentum to build the next plan."
          },
          {
            "id": "q20",
            "number": 20,
            "title": "What the Machine Sounds Like",
            "context": "The backup panel is stable, but the generator's note rises and falls and a vibration reaches the console before each field correction. Instrumented values are easier to verify; sound and vibration may reveal behaviour the summary display misses.",
            "statement": "I would be inclined to include the generator's changing sound and vibration in the diagnosis.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep the diagnosis anchored to instrumented values. The approach is easier to verify, while the vibration remains outside the record until Mira raises it."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You use the changing note as a cue for when to inspect the numerical trace. The two forms of evidence meet without receiving equal weight."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You mark sound and vibration against the field corrections. The richer record takes more interpretation but reveals a repeatable relationship."
              }
            },
            "convergence": "The vibration confirms that the backup unit is stable only at the reduced load. The long-range HF amplifier cannot be re-energised without risking another trip."
          }
        ],
        "closing": "At 22:55, Aurora is running on emergency red light and a reduced bus. The HF rack is dark; the station can no longer reach Hobart."
      },
      {
        "id": "act-05",
        "number": 5,
        "title": "Cut Off from Base",
        "time": "22:56–23:15",
        "opening": "The radio still has battery power. The problem is reach. Without the HF amplifier, Aurora cannot cross the distance to Hobart. VHF returns only storm noise, and every fixed station lies beyond its normal range.\n\nThe set glows in your hand—working, but unable to carry a voice through the whiteout.",
        "items": [
          {
            "id": "q21",
            "number": 21,
            "title": "Routes That Might Still Exist",
            "context": "The normal communication route is gone. Lower-power HF, a different antenna path or a field relay might still work, but each test uses scarce power and time with a low chance of success.",
            "statement": "I would spend some of the remaining power budget testing less conventional communication routes before accepting isolation.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You accept the present isolation and protect power for heat and monitoring. Mira checks the hardware limits without running another transmission."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You test the two routes with the highest estimated chance and stop when their power cost rises."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You map and test the remaining plausible paths. The search consumes more of the power budget but rules out several assumptions."
              }
            },
            "convergence": "No route is currently viable. HF requires the amplifier, VHF cannot cross the storm at this distance, and the field relay is outside Aurora's direct control."
          },
          {
            "id": "q22",
            "number": 22,
            "title": "Calls into Static",
            "context": "Propagation may change without warning. A fixed call-and-log schedule protects battery and attention; opportunistic retries may catch the brief window that a schedule misses.",
            "statement": "I would prefer flexible retries based on changing conditions over a fixed call-and-log schedule.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You log the failed channels and set timed retries around weather updates and the midnight call. The schedule protects battery but may miss a brief change."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You create short retry windows and allow them to shift with the storm. The record stays light but usable."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You call when the static seems to thin. The approach follows conditions closely, while Ilan keeps a minimal note so attempts are not repeated blindly."
              }
            },
            "convergence": "The log confirms one important safeguard: if the midnight status is missed, Hobart should activate lost communications and can contact the Ridge team through its independent satellite terminal. Aurora cannot know whether that chain succeeds."
          },
          {
            "id": "q23",
            "number": 23,
            "title": "Naming the Isolation",
            "context": "Mira and Ilan are making different assumptions about when outside support might answer. Naming the isolation directly creates a common baseline; a provisional message may avoid making the situation sound more final than it is.",
            "statement": "I would want to tell the team plainly that Aurora could not currently reach Base and name the next priority.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You describe contact as temporarily unavailable and move to the heat budget. The wording preserves uncertainty, though Mira asks how the team should plan."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You state the present limit and pair it immediately with the next action."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You name Aurora's current isolation and the midnight safeguard in direct terms. The shared baseline arrives with a sharper emotional impact."
              }
            },
            "convergence": "All three people are now working from the same reality. No rescue time can be assumed, and every remaining watt must be valued against an unknown wait."
          },
          {
            "id": "q24",
            "number": 24,
            "title": "After the Technical Update",
            "context": "Mira becomes still when the range limits are confirmed, while Ilan turns back towards the window. A personal check-in may reveal strain; the heating problem is already demanding immediate attention.",
            "statement": "I would keep the update task-focused and postpone personal check-ins until the next operational pause.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You pause for a brief fitness check before moving on. The heat calculation waits while Mira and Ilan name what they need to keep working."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You give the news a moment to settle and ask whether any part of the next plan feels unmanageable."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You turn directly to the heating load and preserve operational momentum. Personal reactions remain private until the next planned pause."
              }
            },
            "convergence": "Neither person is incapacitated, but both need structure. Mira asks for exact power limits; Ilan asks for a role that keeps him connected to the operating picture."
          },
          {
            "id": "q25",
            "number": 25,
            "title": "What Remains Possible",
            "context": "Contact cannot be restored from the control room. The uncertainty will remain, but heat, shelter, monitoring and the midnight procedure are still within the team's influence.",
            "statement": "After confirming contact was unavailable, I would expect most of my attention to return to what remained under local control.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "The failed contact remains near the front of your attention until the thermal alarm provides a concrete next task."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You name what cannot be changed and list the decisions that remain."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You place communication outside the immediate problem and return to local systems. The operating picture narrows, while unanswered outside risk remains in the background."
              }
            },
            "convergence": "The thermal model finishes recalculating. At the present load, Aurora will cool long before any rescue time can be assumed."
          }
        ],
        "closing": "The heating panel shows three zones and enough emergency power for one thermal loop. Everything outside that loop will begin moving towards freezing."
      },
      {
        "id": "act-06",
        "number": 6,
        "title": "Rationing Heat",
        "time": "23:16–23:40",
        "opening": "Mira wants to protect the control and machinery area. Ilan wants a shared refuge where no one has to endure the cold alone. Sector C still contains the unresolved fault and the instruments tied to his research. Every allocation protects one value by exposing another.",
        "items": [
          {
            "id": "q26",
            "number": 26,
            "title": "One Loop, Three People",
            "context": "Mira, Ilan and you favour different heat loops for different reasons. A joint comparison will take time and may widen disagreement; deciding centrally will be faster but may leave hidden assumptions untested.",
            "statement": "Before fixing the allocation, I would want all three perspectives in the same conversation rather than reconcile them by myself.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You choose the loop with the lowest projected heat loss and explain it afterwards. The decision is fast, while two assumptions are challenged during setup."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You hear each priority and test only the assumptions capable of changing the allocation."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You place all three proposals against the same loss rates, occupancy and access limits. The comparison takes longer but exposes where the priorities differ."
              }
            },
            "convergence": "The figures identify one viable core: the compact control-room refuge, which contains the emergency panel and can shelter all three people. The machinery bay and Sector C will be monitored remotely."
          },
          {
            "id": "q27",
            "number": 27,
            "title": "Every Remaining Watt",
            "context": "The largest loads are already off and the refuge is stable. Another sweep may recover a few extra minutes, but it will take attention away from rest, monitoring and the newly audible pulse.",
            "statement": "Once the largest savings were secured, I would still feel compelled to search for smaller ones, even if it delayed the next rest cycle.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You stop after the major savings and protect a rest and monitoring cycle. Mira makes one last visual sweep for any obvious loss."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You check the few remaining changes with plausible gains, then stop when the expected saving falls below the effort required."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You continue through the small loads and heat leaks. The estimate gains several minutes, while the next rest cycle begins later."
              }
            },
            "convergence": "The survival configuration extends the estimate to approximately 04:10. The figure depends on fuel flow, door losses and the absence of another electrical trip."
          },
          {
            "id": "q28",
            "number": 28,
            "title": "When the Station Becomes Quiet",
            "context": "The last fans wind down. The remaining displays still require attention, while a faint grouped pulse becomes audible through the structure for the first time.",
            "statement": "With the displays stable, my attention would stay on the instruments rather than shift towards the unfamiliar sound.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You pause beside the altered structure and compare the pulse with the earlier vibration. The displays go briefly unattended, but the grouped rhythm becomes clear."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You complete the current display check before listening. The pulse repeats during the pause between routines."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You stay with the instruments. Ilan notices the sound first and asks the room to become still enough to confirm it."
              }
            },
            "convergence": "When the room becomes still, all three people hear the same grouped rhythm. A faint matching disturbance appears on the magnetic channel beneath Sector C."
          },
          {
            "id": "q29",
            "number": 29,
            "title": "The Cold Settles In",
            "context": "The night has become a repetition of checks, retries and small adjustments. Conversation can keep the group connected, but quiet allows each person to conserve energy in their own way.",
            "statement": "As the station grew colder, I would prefer to work quietly and let each person manage their own energy.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep a light conversation moving between checks. It uses some energy but makes withdrawal easier to notice."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You conserve words while keeping brief contact at each handover."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You allow long stretches of independent, quiet work. Energy is conserved, while changes in mood are less visible."
              }
            },
            "convergence": "The group remains functional, though by different routes. Ilan brings the archived anomaly file onto the main screen and identifies the same grouped interval."
          },
          {
            "id": "q30",
            "number": 30,
            "title": "Holding the Heat Decision",
            "context": "Frost forms along the corridor door. Reopening the heat plan might expose an overlooked risk, but repeated reviews also consume attention while the refuge temperature and fuel trend remain inside their limits.",
            "statement": "Seeing frost at the door would not, by itself, make me want to reopen the heat plan while its indicators remained within limits.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You reopen the heat calculation when frost appears. The review uses time but confirms that no threshold has been crossed."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You compare the live trend with the trigger points before deciding whether the frost represents new evidence."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep the current allocation and continue monitoring. Attention remains available elsewhere, while the visible cold stays unresolved."
              }
            },
            "convergence": "The refuge remains within its planned range. Beneath the floor, the pulse repeats clearly enough for Ilan's recorder to detect."
          }
        ],
        "closing": "Ilan opens the recorder case. The signal he crossed Antarctica to find is finally audible because the station's machinery has gone quiet."
      },
      {
        "id": "act-07",
        "number": 7,
        "title": "The Signal Under the Ice",
        "time": "23:41–01:10",
        "opening": "The pulse arrives in groups, like knocks separated by long breaths. It appears in both the magnetic and acoustic channels, with a small delay between them. It may be natural, mechanical, instrumental or something the team has not yet imagined.\n\nA clean recording will consume power and attention needed elsewhere. At midnight, Aurora's scheduled status call passes unanswered.",
        "items": [
          {
            "id": "q31",
            "number": 31,
            "title": "More Than an Amplitude",
            "context": "Mira needs the measurements that bear on station safety. Ilan wants the full waveform, whose rhythm and texture may matter later. A summary is efficient; a richer record costs power and analysis time.",
            "statement": "I would want to preserve some of the signal's rhythm and texture even if that made the record less compact.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You capture the safety-relevant values first. The record stays compact, and Ilan adds one short waveform for later comparison."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You preserve one complete pulse group beside the summary measurements."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You retain shape, spacing and environmental detail. The richer record costs more power and leaves more material to interpret."
              }
            },
            "convergence": "The combined view confirms a repeatable magnetic-to-acoustic delay. It supports a real relationship between channels but does not identify the source."
          },
          {
            "id": "q32",
            "number": 32,
            "title": "A Bounded Recording",
            "context": "The pulse does not arrive on command. Switching the recorder on now offers the best chance of capturing it, but every unplanned minute reduces the heat reserve. Mira asks how long the run will last and what would make it stop.",
            "statement": "I would want the duration, power limit and stopping conditions agreed before the recorder was switched on, even if the next pulse might be missed.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You energise the recorder while the limits are still being discussed. The first faint pulse is captured, and Mira sets the boundary before the next cycle."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You agree the power ceiling and stop conditions, then complete the timing details while the recorder runs."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You finish the operating envelope before energising the recorder. The first faint pulse passes, but the next cycle is captured under a shared limit."
              }
            },
            "convergence": "The recorder receives a forty-minute ceiling, a fixed power limit and immediate stop conditions for fuel, refuge temperature or bus instability."
          },
          {
            "id": "q33",
            "number": 33,
            "title": "Why Ilan Came",
            "context": "Ilan says he has spent two years trying to bring someone back to these records. Recognising what the chance means may help him accept a limit; staying with watts and minutes keeps personal stakes from influencing it.",
            "statement": "Before setting the limit, I would feel a need to acknowledge what the opportunity meant to Ilan.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep the exchange operational and let the authorised recording show that Ilan's work has a place in the plan."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You recognise the time behind his request, then return to watts and minutes."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You acknowledge what stopping may cost him before setting the boundary. The exchange takes longer, but he no longer has to argue for the moment's importance."
              }
            },
            "convergence": "Ilan accepts the operating boundary, and Mira takes responsibility for the power readings while he manages the recorder."
          },
          {
            "id": "q34",
            "number": 34,
            "title": "The Operating Limit",
            "context": "Mira argues for a shorter run and Ilan for a longer one. More discussion may produce shared ownership; delay may also allow the signal or the fuel margin to decide for the team.",
            "statement": "When the discussion stopped producing new information, my instinct would be to set the operating limit myself.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You allow Mira and Ilan another round and wait for a shared boundary. The agreement arrives later and carries broader ownership."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You set the non-negotiable stops and let them shape the work inside those limits."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You set the ceiling, end time and stop authority yourself. The boundary arrives quickly, with responsibility concentrated in one place."
              }
            },
            "convergence": "A forty-minute recording envelope is entered in the watch log. Ilan starts the recorder while Mira watches fuel and refuge temperature."
          },
          {
            "id": "q35",
            "number": 35,
            "title": "Knocks Beneath the Floor",
            "context": "With the fans silent, each grouped pulse seems to travel through the floor rather than the speakers. The source lies below the station, beyond sight and beyond any safe route in the storm.",
            "statement": "As the pulse continued beneath the silent station, I would feel its unknown source becoming personally threatening.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You experience the pulse as strange rather than personally threatening and keep the routine focused on the instruments. Its possible human meaning stays distant."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "Unease rises with the next group, and you return deliberately to the measured interval."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "The unknown source begins to feel close and intentional. The feeling sharpens your watch of the room but competes with the instrument task."
              }
            },
            "convergence": "Three complete groups are recorded before the authorised window closes. The source remains unknown, and the midnight status call has passed without an answer from outside."
          }
        ],
        "closing": "The recorder returns to low-power monitoring. Under the red lights, cold and fatigue begin to blur the boundary between observation and interpretation."
      },
      {
        "id": "act-08",
        "number": 8,
        "title": "The Figure in the Whiteout",
        "time": "01:12–03:50",
        "opening": "Ilan suddenly rises and points through the snow-covered window.\n\n“There is someone outside.”\n\nYou see driving snow, darkness and the distorted reflection of the control room. The outer camera is partly obscured. No door alarm has activated, but that cannot prove the view is empty.",
        "items": [
          {
            "id": "q36",
            "number": 36,
            "title": "The Room Breaks Apart",
            "context": "Ilan stands abruptly and says someone is outside. The claim interrupts an exhausted routine and echoes his earlier frustration at not being believed about the signal.",
            "statement": "I would notice the interruption and Ilan's claim pulling tension into my voice before I had verified what he saw.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep your first response even and ask Ilan for location, movement and duration. The factual start protects the check, while your own reaction remains unspoken."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "A sharp reply rises, but you pause and turn it into a factual question."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "Tension enters your voice before the check begins. Ilan responds defensively, but the urgency also produces a precise description of where to look."
              }
            },
            "convergence": "Ilan identifies one fixed point outside the left window frame. He can describe what he saw, but not whether it moved independently of the reflection."
          },
          {
            "id": "q37",
            "number": 37,
            "title": "Fear Without a Verdict",
            "context": "Ilan is cold, sleep-deprived and frightened. Treating the figure as real may deepen the alarm; treating it only as error may leave him defending his experience instead of helping with an internal check.",
            "statement": "Even before knowing whether the figure was real, I would feel drawn to acknowledge Ilan's fear.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You move directly to verification and let practical action carry the response. Ilan follows, though the fear itself remains unaddressed."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You acknowledge that the experience was frightening, then separate that from what caused it."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You acknowledge his fear before beginning the check. The emotional pause costs time but reduces his need to defend the claim."
              }
            },
            "convergence": "Ilan remains oriented, but his hands are cold and his attention is narrowing. Mira brings him into the thermal blankets while the internal checks begin."
          },
          {
            "id": "q38",
            "number": 38,
            "title": "Several Possible Figures",
            "context": "The shape may be reflection, ice, a camera artefact, exhaustion or a genuine presence outside. Testing several explanations takes effort, while choosing the most likely one gives the team a faster route.",
            "statement": "My mind would keep returning to more than one explanation while the internal checks ran.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You test the most probable explanation first. Changing the interior light removes most, but not all, of the shape."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You compare reflection and camera explanations before widening the search."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep several causes in view and choose internal checks that distinguish among them. The broader search uses more effort but avoids an early conclusion."
              }
            },
            "convergence": "Changing the lights and viewing angle removes most of the shape. One movement remains ambiguous because snow obscures the camera frame."
          },
          {
            "id": "q39",
            "number": 39,
            "title": "How Far to Verify",
            "context": "The first camera and door checks show no entry. A deeper internal review could reduce uncertainty, but fatigue makes every extra check costly and no one can safely go outside.",
            "statement": "After the first camera and door checks showed nothing, I would feel ready to stop the verification.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You continue through the internal evidence until the available checks stop changing the safety picture. The review uses effort but reduces uncertainty."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You complete only the checks capable of changing the refuge plan, then stop."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You close the verification after the first camera and door checks. Effort is preserved, while the sighting remains more weakly resolved in the log."
              }
            },
            "convergence": "No internal system confirms a person outside. No one opens the station. The event is logged as an unverified observation, not a hallucination and not an intrusion."
          },
          {
            "id": "q40",
            "number": 40,
            "title": "Returning to One Room",
            "context": "After the sighting, Mira retreats to the generator trend and Ilan curls around the recorder. Quiet may let each person recover; active reconnection may make the next rotation easier to coordinate.",
            "statement": "After the incident, I would feel an urge to bring everyone back into a shared rhythm.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You allow a quiet recovery and reconnect the team at the next formal handover. The pause preserves space but lengthens the separation."
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
                "transition": "You start a shared speak-check-work rotation. The common rhythm returns sooner, though it asks more social energy from the room."
              }
            },
            "convergence": "A twenty-minute rotation begins with handovers and symptom checks. The pulse remains low, the storm holds and no second sighting occurs."
          }
        ],
        "closing": "At 03:50, the wind eases below its peak. At the same moment, the aurora floods the sky and every surviving instrument begins to drift."
      },
      {
        "id": "act-09",
        "number": 9,
        "title": "Aurora at 03:50",
        "time": "03:50–03:58",
        "opening": "Green and violet light pours across the window, crossed by a pale colour none of you can name. The magnetic channel rises with the aurora. Beneath the ice, the grouped pulse becomes clearer, while the backup controller reports that fuel is falling faster than the survival estimate predicted.\n\nIlan is transfixed. Mira grows more guarded with every change on the panel.",
        "items": [
          {
            "id": "q41",
            "number": 41,
            "title": "Beauty Inside an Emergency",
            "context": "Moving green, violet and pale light fills the control room while the alarm band remains red. Looking away from the instruments costs attention; keeping the sky outside the watch may leave the event recorded only as numbers.",
            "statement": "Even in the emergency, I would want a few seconds to take in the aurora's colour, scale and strangeness.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep your eyes on the instruments. Operational attention stays continuous, while Ilan becomes the person who describes the colour."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You register the scene briefly and use the visual change as another time marker."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You give the aurora a few unguarded seconds. The experience is preserved, while the console is viewed through Mira's callouts during the pause."
              }
            },
            "convergence": "The strongest band of light coincides with another magnetic rise. The relationship is striking, but coincidence alone is not a cause."
          },
          {
            "id": "q42",
            "number": 42,
            "title": "Instruments That Will Not Hold Still",
            "context": "The geomagnetic surge makes several baselines drift at once. A fixed observation sequence preserves comparison; adapting moment by moment may capture brief changes that the sequence reaches too late.",
            "statement": "I would want to keep a fixed observation order even while the instruments were changing too quickly to hold still.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You follow the most active channels as they change. Several brief details are captured, but the sampling order varies."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You keep a shortened sequence across the channels most relevant to the immediate question."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You hold one fixed observation order and call each time point. Comparability improves, while a brief out-of-sequence change is recorded only in summary."
              }
            },
            "convergence": "The combined timeline shows the same order twice: auroral magnetic rise, under-ice magnetic pulse, then acoustic response. Fuel consumption increases during both sequences."
          },
          {
            "id": "q43",
            "number": 43,
            "title": "Two Separate Emergencies",
            "context": "Mira is protecting the survival systems while Ilan is protecting the signal. Separate focus gives each task depth; frequent coordination may expose conflicts before they become urgent.",
            "statement": "I would let each specialist stay with their own task and coordinate only at defined handover points.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You require fuel and signal changes to share one timeline before either specialist changes a load. Coordination increases, while both workstreams pause more often."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You allow separate focus with frequent points for reporting cross-effects."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You let each workstream continue to the next handover. Both retain depth, while the competing load requests become visible later."
              }
            },
            "convergence": "The conflict is now explicit: every additional minute of clean recording removes thermal margin, and every protective load cut may end the only clear signal window."
          },
          {
            "id": "q44",
            "number": 44,
            "title": "One Active Team Again",
            "context": "Ilan speaks only to the recorder and Mira only to the panel. A shared deadline may eventually reunite them; intervening with visible energy may reconnect the room sooner but interrupt both workstreams.",
            "statement": "With the room divided, I would feel drawn to use my own energy to reconnect the group.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You let the shared fuel constraint draw both specialists back to the central display. Their separate work continues a little longer."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You call both names, state the deadline and assign one joint check."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You interrupt both workstreams to reconnect the room around the final window. Coordination improves at the cost of a short pause in each task."
              }
            },
            "convergence": "Mira and Ilan bring their figures to the central console. The next plan must be executable within minutes."
          },
          {
            "id": "q45",
            "number": 45,
            "title": "When the Pulse Sounds Intentional",
            "context": "The grouped pulse now resembles a deliberate call, though intention is not a measurable property of the signal. Treating it as data protects distance; allowing the resemblance in may sharpen or distort attention.",
            "statement": "Even as the pulse began to sound intentional, I would still experience it mainly as data rather than as a presence.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "The resemblance to a call draws your attention towards purpose. You return to the timing trace to separate the impression from the measurement."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You allow the possibility into the discussion but label it as interpretation."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You continue recording interval and waveform without assigning intention. Distance is preserved, while the human impact of the sound receives less attention."
              }
            },
            "convergence": "The backup alarm changes from amber to red. Whatever the signal means, Aurora has entered its final usable reserve."
          }
        ],
        "closing": "The usable reserve is now measured in minutes. Mira proposes heat and safety monitoring; Ilan proposes one final uninterrupted recording."
      },
      {
        "id": "act-10",
        "number": 10,
        "title": "The Last Reserve",
        "time": "03:58–04:06",
        "opening": "The remaining fuel can support about fifteen minutes of one major load. Changing major loads will consume part of that reserve. Mira and Ilan begin arguing while the generator alarm continues beneath their voices.",
        "items": [
          {
            "id": "q46",
            "number": 46,
            "title": "Before Accepting the Trade-off",
            "context": "The latest fuel drop makes the existing estimate less certain. Rebuilding it may recover a few minutes or confirm the same trade-off, but it would consume part of the remaining decision window.",
            "statement": "I would want to spend part of the remaining decision window on one more full calculation before committing.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You use the current estimate and preserve the remaining decision window. Mira checks only the figure most likely to have changed."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You recalculate the major loads and switching loss, leaving minor assumptions outside the pass."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You rebuild the budget from live fuel flow, heat, recorder demand and transfer loss. The figures become firmer, while the choice must be made in less time."
              }
            },
            "convergence": "Full heat and full recording cannot coexist. A short recording followed by heat is possible, but switching loss weakens both outcomes."
          },
          {
            "id": "q47",
            "number": 47,
            "title": "A Choice That Looks Binary",
            "context": "Mira's safety plan and Ilan's recording plan are ready to execute. Constructing a timed split could preserve a minimum of each, but it adds switching loss and uses time that the two existing plans do not.",
            "statement": "With two complete plans available, I would prefer to compare those before spending time constructing a third.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You test whether a bounded split can meet a minimum for both aims. A third plan becomes executable, at the cost of time and switching loss."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You compare the two complete plans first and add a split only after defining its minimums."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep the main comparison between the two execution-ready plans. The decision space stays compact, while any mixed option remains less developed."
              }
            },
            "convergence": "Three executable allocations are now defined: protect the crew, capture the signal, or make a bounded split. None preserves every value."
          },
          {
            "id": "q48",
            "number": 48,
            "title": "Testing Each Other's Plan",
            "context": "Mira and Ilan each have accurate figures and a blind spot created by what they are protecting. Directly challenging each other may reveal assumptions; separate questioning may keep the comparison calmer.",
            "statement": "I would prefer Mira and Ilan to challenge each other's assumptions directly rather than have me reconcile the plans separately.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You question the proposals separately and reconcile the assumptions yourself. The exchange stays calmer, while each specialist sees less of the other's reasoning."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You ask each person one question that the other proposal must answer."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You ask Mira and Ilan to test each other's minimums directly. More assumptions surface, along with a sharper exchange."
              }
            },
            "convergence": "Mira accepts that four synchronised minutes have scientific value; Ilan accepts that the discovery plan produces the smallest thermal margin."
          },
          {
            "id": "q49",
            "number": 49,
            "title": "Ending the Circular Argument",
            "context": "The same values are being repeated with greater intensity. One more round might surface a shared answer; interrupting now would protect the decision window but place the boundary in your hands.",
            "statement": "When the discussion started circling, my instinct would be to interrupt and take control of the final exchange.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You allow one more round in case a shared answer emerges. It does not, and the available decision time becomes shorter."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You interrupt with a time limit and the fields every proposal must contain."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You stop the circular exchange and take control of its final structure. Time is protected, while the closure rests visibly with you."
              }
            },
            "convergence": "All three plans now use the same execution fields: load, duration, thermal effect, data value and stopping point."
          },
          {
            "id": "q50",
            "number": 50,
            "title": "Pressure from Both Sides",
            "context": "Mira speaks about keeping people alive; Ilan speaks about losing a once-only discovery. Their urgency is directed at you, and neither outcome can be reversed once the reserve is committed.",
            "statement": "As the argument intensified, I would expect my view to shift towards whichever loss felt most immediate.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You notice both appeals without feeling your ranking move with either one. The criteria remain stable, while the emotional distance is visible."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "Your attention shifts with the last speaker, and you return to the written comparison before deciding."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "Each newly described loss pulls your view towards it. You call for a short silence so the movement can settle before the allocation."
              }
            },
            "convergence": "At 04:06, both people stop speaking. Three plans remain on the console, and operational authority still belongs to you."
          }
        ],
        "closing": "No new option removes the trade-off. The remaining task is to decide what Aurora will protect."
      },
      {
        "id": "act-11",
        "number": 11,
        "title": "Two Paths and a Narrow Third",
        "time": "04:06–04:12",
        "opening": "Mira's plan protects the refuge heater and safety monitoring. Ilan's protects one uninterrupted scientific record. A bounded split preserves a minimum of each but accepts switching loss and two incomplete outcomes.\n\nNone is a clean answer. Each exchanges one kind of uncertainty for another.",
        "items": [
          {
            "id": "q51",
            "number": 51,
            "title": "What the Numbers Do Not Contain",
            "context": "Behind Mira's figures is responsibility for the crew; behind Ilan's are two years of work. Naming those stakes may help both people feel seen, but it may also make an already difficult comparison more emotionally charged.",
            "statement": "I would separate the personal stakes from the decision and base the choice only on the measurable outcomes.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Empathy",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You name what each person stands to lose before returning to the comparison. Both people feel recognised, while emotion stays present in the room."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You acknowledge the stakes once and then hold the technical criteria steady."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep the exchange inside measurable outcomes. The comparison stays contained, while personal recognition is deferred."
              }
            },
            "convergence": "The plans do not change. The exchange changes only how explicitly the human stakes accompany them into the decision."
          },
          {
            "id": "q52",
            "number": 52,
            "title": "One Set of Criteria",
            "context": "The three plans use different formats and emphasise different strengths. Converting them to one grid would make comparison cleaner, but it would take time and flatten some of their differences.",
            "statement": "I would feel more comfortable choosing after placing all three plans into the same comparison grid.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Orderliness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You compare the plans in their original forms and explain your integrated judgement. Their differences remain vivid, though the structure is less explicit."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You use the same criteria as a verbal sequence without building a full table."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You convert all three plans into one grid. Comparison becomes cleaner, while some qualitative differences require separate notes."
              }
            },
            "convergence": "Safety leads on thermal margin, discovery on data value, and the split remains intermediate with the greatest switching loss."
          },
          {
            "id": "q53",
            "number": 53,
            "title": "Beyond the First Consequence",
            "context": "The immediate figures favour one plan by a narrow margin. Ilan warns that a short record may be unusable; Mira warns that a colder crew may respond more slowly when rescue calls. Neither effect is quantified.",
            "statement": "My attention would be drawn to how those less-visible consequences might change the choice.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Ideas",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You stay with the measured first-order outcomes. The choice remains timely, while uncertain downstream effects stay outside it."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You test only the less-visible consequence capable of reversing the narrow lead."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You follow each plan one step beyond its immediate result. The broader view uses time but shows which assumptions carry the ranking."
              }
            },
            "convergence": "The trade-off remains. The discovery record would be meaningful but incomplete; the safety plan would preserve response capacity; the split would preserve partial value from both."
          },
          {
            "id": "q54",
            "number": 54,
            "title": "Certainty Is Not Available",
            "context": "No option can guarantee rescue, safety or discovery. One final check could expose a disqualifying fact; it could also use the last time available for the switching sequence.",
            "statement": "After the final check, my impulse would be to commit even with uncertainty still present.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Calmness",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You complete one more check and add a verified fact. The controller alarm then leaves less time for the switch."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You allow one final check for a disqualifying condition, then stop."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You commit with the uncertainty still visible. The decision begins sooner, while the unchosen risks remain unresolved."
              }
            },
            "convergence": "All three options remain imperfect but executable. The allocation can now be chosen without treating uncertainty as a solvable final step."
          },
          {
            "id": "q55",
            "number": 55,
            "title": "The Voice of the Duty Lead",
            "context": "The plans are understood and the switching sequence must begin. One final challenge could catch an execution risk, but it could also reopen a decision that is already made.",
            "statement": "I would present the direction as provisional until Mira and Ilan had one final chance to challenge it.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Assertiveness",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You state the selected direction as final and limit questions to execution. The switch begins quickly, with less room for a late challenge."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You fix the objective and invite only practical adjustments within it."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You present the direction as provisional for one final challenge. A switching detail is clarified, and the execution begins later."
              }
            },
            "convergence": "Both people are ready at their controls. Mira's hand rests above the heater circuit; Ilan's rests above the recorder bus. They wait for the allocation."
          }
        ],
        "closing": "At 04:12, the wind falls below the travel limit. Inside Aurora, no one knows that the Ridge team is starting its vehicles thirty kilometres to the south."
      },
      {
        "id": "act-12",
        "number": 12,
        "title": "The Final Watch",
        "time": "04:28–05:20",
        "opening": "By 04:28, the backup generator has stopped under every final allocation. Chemical lights, hand tools, survival equipment and the battery-powered VHF radio are all that remain. The refuge temperature differs between paths, but every path reaches the same powerless wait.\n\nThe midnight status was missed. Somewhere beyond the storm, the lost-communication procedure should have begun. Aurora has no way to know whether it did.",
        "items": [
          {
            "id": "q56",
            "number": 56,
            "title": "Three Sources of Heat",
            "context": "The refuge can be arranged with everyone close together to share warmth and monitor symptoms, or with separate resting positions and scheduled checks. The first sacrifices privacy and uninterrupted rest; the second sacrifices continuous observation.",
            "statement": "As the refuge cooled, I would prefer the three of us to remain together in the smallest insulated space.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "EA",
              "facet": "Cooperation",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You arrange separate resting positions with scheduled checks. Privacy and uninterrupted rest improve, while observation occurs only at intervals."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You share equipment in one zone but preserve distinct resting roles and spaces."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You bring everyone into the smallest insulated space. Warmth and continuous observation improve, while privacy and uninterrupted rest diminish."
              }
            },
            "convergence": "No one remains in an unheated part of the station. The chosen refuge arrangement becomes the basis of the final watch."
          },
          {
            "id": "q57",
            "number": 57,
            "title": "When No Powered Action Remains",
            "context": "Powered options are gone, but small routines remain: VHF listening, symptom checks, battery preservation and preparation for a rescue entry. Continuing them uses energy; stopping them protects rest and body heat.",
            "statement": "Once powered options were gone, I would feel ready to stop the regular routine and conserve energy until conditions changed.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "ME",
              "facet": "Industriousness",
              "key": "R",
              "correctedScoreFormula": "7 - raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You preserve a minimal radio and symptom routine. It uses energy but keeps time and condition visible."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You lengthen the intervals and retain only checks tied to contact or survival."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You suspend the regular cycle and conserve body heat. After a quiet interval, the group agrees on a smaller schedule that fits the remaining energy."
              }
            },
            "convergence": "A low-energy watch remains: radio, symptom check, battery, entry plan and rest. Its intervals match the team's declining capacity."
          },
          {
            "id": "q58",
            "number": 58,
            "title": "Keeping Time Moving",
            "context": "During the long wait, quiet conserves energy and lets exhausted people withdraw. Conversation makes alertness easier to judge, but it can become another demand.",
            "statement": "During the long wait, I would feel like keeping a quiet conversation going so the time still felt as though it was moving.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "FI",
              "facet": "Enthusiasm",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You choose quiet and use names only at scheduled checks. Energy is conserved, while each person's inner state remains more private."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You mark the intervals with brief questions and allow silence between them."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You keep a quiet current of practical conversation moving. Alertness is easier to hear, though speaking becomes another small demand."
              }
            },
            "convergence": "At 04:46, a new voice breaks through the VHF static: 'Aurora, this is Ridge Survey. We are fourteen kilometres south. Confirm your condition.' Above the ridge, the last green-violet bands begin to thin as the solar disturbance falls away."
          },
          {
            "id": "q59",
            "number": 59,
            "title": "Thirty-Four More Minutes",
            "context": "Ridge is thirty-four minutes away. Relief may loosen the discipline that has carried the group this far; staying guarded may prevent anyone from releasing the strain.",
            "statement": "After hearing Ridge's voice, I would expect my attention to settle back into the next routine fairly quickly.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WA",
              "facet": "Resilience",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "Relief interrupts the routine for a few minutes. The pause releases tension before the next symptom check begins."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You let the relief register, then restate the final interval and the checks that remain."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You return quickly to radio, warmth and entry preparation. The routine stays intact, while the emotional release waits."
              }
            },
            "convergence": "Ridge receives Aurora's condition, the electrical hazard and the safe entry point. The rescue team confirms that it will not energise the damaged common bus. By then, the auroral colour has disappeared, leaving Aurora beneath the ordinary polar dark."
          },
          {
            "id": "q60",
            "number": 60,
            "title": "What the Fault Log Cannot Hold",
            "context": "The formal log can preserve times, loads, alarms and decisions. It cannot fully hold the colour at the window, the sound beneath the floor or the uncertainty of the figure in the storm.",
            "statement": "I would want the final record to include the night's colours, sounds and unanswered details alongside the technical fault report.",
            "spectrumId": "self-fit-6",
            "assessment": {
              "visibility": "internal",
              "elementCode": "WO",
              "facet": "Aesthetics",
              "key": "+",
              "correctedScoreFormula": "raw"
            },
            "responseBranches": {
              "low": {
                "responses": [
                  1,
                  2
                ],
                "narrativeMeaning": "Low fit with the stated reaction",
                "transition": "You keep the final entry factual and leave interpretation for later analysis. The operational record stays compact, while the night's atmosphere remains outside it."
              },
              "mid": {
                "responses": [
                  3,
                  4
                ],
                "narrativeMeaning": "Partial or conditional fit with the stated reaction",
                "transition": "You complete the fault log and add a separate observation note about the light, pulse and unverified figure."
              },
              "high": {
                "responses": [
                  5,
                  6
                ],
                "narrativeMeaning": "High fit with the stated reaction",
                "transition": "You place colour, sound and uncertainty beside the technical record. More of the experience survives, while later readers must keep observation separate from proof."
              }
            },
            "convergence": "At 05:20, tracked lights appear through the thinning snow. Ridge reaches Aurora with medical heat, an independent radio, and a portable generator for the safe service inlet."
          }
        ],
        "closing": "The outer door opens onto white light, engine noise and Ridge colours. For the first time since the generator failed, responsibility begins to pass out of your hands."
      }
    ]
  },
  "finalReserve": {
    "id": "final-reserve",
    "scored": false,
    "insertAfterQuestionId": "q55",
    "insertAfterActId": "act-11",
    "branchInsertBeforeActId": "act-12",
    "title": "Narrative Decision — The Final Reserve",
    "note": "Unscored. This allocation changes material consequences only; it is never added to a personality score.",
    "prompt": "With one major load left, what will Aurora protect?",
    "options": [
      {
        "id": "safety",
        "title": "Protect the crew",
        "text": "Send the remaining reserve to refuge heat and safety monitoring.",
        "immediate": "The recorder drops to passive monitoring. Heat and the safety panel remain active until the reserve expires.",
        "act12Opening": "The refuge holds useful warmth after the generator stops. The crew is cold and exhausted, but the thermal margin is the strongest of the three outcomes.",
        "endingConsequence": {
          "rescueState": "All three show cold exposure and require evacuation, but they remain responsive when Ridge arrives.",
          "dataLegacy": "The signal record contains separated fragments. It proves that an anomaly occurred but cannot establish a complete repeating cycle."
        }
      },
      {
        "id": "discovery",
        "title": "Capture the signal",
        "text": "Send the remaining reserve to one uninterrupted scientific recording.",
        "immediate": "The refuge heater drops out. The recorder captures eleven continuous minutes before the generator stops.",
        "act12Opening": "The refuge cools rapidly after the generator stops. The crew enters the final wait with the smallest thermal margin and the clearest record.",
        "endingConsequence": {
          "rescueState": "All three are conscious but show more advanced cold exposure; Ridge begins active rewarming before evacuation.",
          "dataLegacy": "The eleven-minute record shows a repeatable structure and a consistent magnetic-to-acoustic delay, but it still cannot identify the source."
        }
      },
      {
        "id": "bounded",
        "title": "Make a bounded split",
        "text": "Record for exactly four minutes, then transfer the remaining reserve to refuge heat.",
        "immediate": "The recorder captures one partial sequence. Switching loss shortens the heating period, but the refuge receives one final thermal boost.",
        "act12Opening": "The refuge retains less warmth than under the safety plan but more than under the discovery plan. The data is stronger than a fragment and shorter than a full cycle.",
        "endingConsequence": {
          "rescueState": "All three require rewarming and evacuation. Their cold exposure falls between the other two outcomes.",
          "dataLegacy": "The four-minute record confirms the magnetic-to-acoustic sequence but ends before the repeating structure can be demonstrated."
        }
      }
    ]
  },
  "ending": {
    "rescue": "Ridge technicians isolate the damaged common bus and connect their portable generator only to Aurora's independent service inlet. Medical heat and communications return without re-energising the fault.\n\nAs ordinary electrical noise spreads through the station, the signal beneath the ice disappears.",
    "shared": "No camera or sensor ever confirms the figure Ilan reported in the whiteout.\n\nIn the tracked vehicle, Mira says that the first Sector C warning should have been escalated earlier. Ilan holds the data drive in both hands and says he will return when Aurora is safe.\n\nThrough the ice-covered window, the outpost becomes a dark shape beneath a colourless polar sky. Warmth begins to pull you towards sleep, but the night's evidence refuses to settle into a single explanation.\n\nThe pulse, the drifting instruments and the figure in the storm may have shared a cause—or none at all. Ice movement, damaged machinery, measurement interference and exhaustion remain plausible in different combinations. The record closes before those possibilities do.\n\nWhen the next watch returns to Aurora, what, if anything, will it hear beneath the ordinary noise?"
  }
};
