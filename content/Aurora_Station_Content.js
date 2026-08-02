/* Edit this data file to update the story; no rebuild is required. */
window.AURORA_STATION_DATA = {
  "schemaVersion": "1.0.0",
  "contentVersion": "9.0.0-polar-observatory",
  "id": "aurora-station",
  "title": "Aurora Station",
  "subtitle": "The Final Watch",
  "language": "en",
  "runtimeContract": {
    "platform": "Static HTML/CSS/JavaScript",
    "dataLoading": "Classic scripts; works from file:// and GitHub Pages",
    "modules": [
      "content/Aurora_Station_Content.js",
      "core.js",
      "pdf-export.js",
      "audio.js",
      "app.js"
    ],
    "renderer": "One cumulative #story document rendered append-only",
    "persistence": "Browser localStorage with in-memory fallback; answers, journey and preferences stored separately",
    "export": "Direct personalised story PDF and multi-page profile PDF downloads"
  },
  "assessment": {
    "model": "Five behavioural currents and fifteen components",
    "scoredItemCount": 60,
    "actCount": 12,
    "itemsPerAct": 5,
    "spectrum": {
      "id": "agreement-5",
      "min": 1,
      "max": 5,
      "positions": [
        1,
        2,
        3,
        4,
        5
      ],
      "leftAnchor": "Disagree strongly",
      "rightAnchor": "Agree strongly",
      "responseLabels": [
        "Disagree strongly",
        "Disagree a little",
        "Neutral; no opinion",
        "Agree a little",
        "Agree strongly"
      ],
      "bands": {
        "low": [
          1,
          2
        ],
        "mid": [
          3
        ],
        "high": [
          4,
          5
        ]
      }
    },
    "scoring": {
      "keyedScore": "keyed = reverse ? 6 - raw : raw",
      "facetScore": "mean of the four keyed items assigned to the facet",
      "domainScore": "mean of the twelve keyed items assigned to the domain",
      "narrativeKey": "Narrative branches always use the raw response: 1-2 low, 3 mid, 4-5 high. Reverse keying never affects narrative selection.",
      "normalisation": "chartPosition = (score - 1) / 4",
      "noTotalScore": "There is no overall personality score and no domain or facet weighting.",
      "negativeEmotionalityRule": "Score Negative Emotionality directly. Do not silently invert it. If Emotional Stability is displayed it must be labelled as 6 - Negative Emotionality."
    },
    "methodNote": "Narrative self-reflection on an established five-domain structure: five domains, fifteen facets, four statements per facet and balanced keying, answered on a five-point agreement scale. The statements are written for Aurora Station rather than taken from a published instrument, so this is not a validated measure.",
    "itemsPerDomain": 12,
    "itemsPerFacet": 4,
    "interpretationBands": [
      {
        "id": "lower",
        "max": 2.49,
        "label": "Lower self-reported expression"
      },
      {
        "id": "balanced",
        "max": 3.49,
        "label": "Context-dependent or balanced expression"
      },
      {
        "id": "higher",
        "max": 5.0,
        "label": "Higher self-reported expression"
      }
    ],
    "bandNote": "These display bands are interface rules. They are not norms, and they do not compare you with anyone.",
    "domains": {
      "extraversion": {
        "code": "extraversion",
        "name": "Extraversion",
        "colour": "#C9485B",
        "focus": "Social engagement, influence and active energy",
        "facets": [
          "Sociability",
          "Assertiveness",
          "Energy Level"
        ],
        "interpretation": {
          "higher": "Your responses suggest a generally higher tendency toward social engagement, expression and active energy.",
          "balanced": "Your responses suggest that social engagement, expression and energy varied with the situation rather than holding at one level.",
          "lower": "Your responses suggest a generally lower tendency toward social engagement, with influence expressed more quietly and energy held in reserve."
        },
        "guidance": {
          "higher": {
            "advantage": "You put energy into a room and make your engagement legible. People can tell where you are and what you think, which is worth a great deal at three in the morning.",
            "overextension": "Visible energy fills space. The quieter reading in the room may never be offered, and you may not notice it was there.",
            "reflection": "In the last difficult conversation you were part of, who did not speak, and would you have noticed if they had wanted to?"
          },
          "balanced": {
            "advantage": "You move between speaking and listening according to what the moment needs rather than by habit.",
            "overextension": "A flexible setting can become an unclear one. In a room waiting for someone to commit, availability is not the same as direction.",
            "reflection": "When you hold back, is it a reading of the room or a way of staying uncommitted?"
          },
          "lower": {
            "advantage": "You conserve social energy and choose your moment, so what you do say tends to carry weight.",
            "overextension": "Waiting for the right moment can mean the decision closes before your view enters it.",
            "reflection": "What would have to be true for you to speak earlier than feels comfortable?"
          }
        }
      },
      "agreeableness": {
        "code": "agreeableness",
        "name": "Agreeableness",
        "colour": "#3D8B5C",
        "focus": "Compassion, respectful interaction and interpersonal trust",
        "facets": [
          "Compassion",
          "Respectfulness",
          "Trust"
        ],
        "interpretation": {
          "higher": "Your responses suggest a generally higher tendency toward compassion, respectful interaction and trust in others' intentions.",
          "balanced": "Your responses suggest that compassion, respectfulness and trust were extended selectively rather than uniformly.",
          "lower": "Your responses suggest a generally lower tendency toward accommodation, with more scepticism and more willingness to hold a position against others."
        },
        "guidance": {
          "higher": {
            "advantage": "You keep people in contact with one another and notice what a decision costs the person carrying it.",
            "overextension": "Protecting the working relationship can postpone a disagreement that the situation actually needs.",
            "reflection": "Which unspoken disagreement are you currently carrying on someone else's behalf?"
          },
          "balanced": {
            "advantage": "You extend cooperation where it is earned rather than uniformly, which keeps trust meaningful.",
            "overextension": "Selective warmth can read as inconsistency to people who do not know the rule you are using.",
            "reflection": "Do the people around you know what earns your trust, or only that some have it?"
          },
          "lower": {
            "advantage": "You hold a position against pressure and are willing to say the thing that makes a room uncomfortable.",
            "overextension": "A room that has stopped volunteering information is harder to read, and you may be the reason it stopped.",
            "reflection": "When did someone last change your mind, and what did they have to do to manage it?"
          }
        }
      },
      "conscientiousness": {
        "code": "conscientiousness",
        "name": "Conscientiousness",
        "colour": "#B07A2E",
        "focus": "Structure, productive persistence and dependability",
        "facets": [
          "Organization",
          "Productiveness",
          "Responsibility"
        ],
        "interpretation": {
          "higher": "Your responses suggest a generally higher tendency toward structure, sustained effort and dependability.",
          "balanced": "Your responses suggest that structure and persistence were applied where they mattered and relaxed elsewhere.",
          "lower": "Your responses suggest a generally lower tendency toward formal structure, with more flexibility and less attachment to sequence."
        },
        "guidance": {
          "higher": {
            "advantage": "You turn intent into sequence and leave a record the next person can actually use.",
            "overextension": "A sequence can outlive the situation it was designed for and become the thing being defended.",
            "reflection": "Which of your current procedures would you keep if you were designing them again today?"
          },
          "balanced": {
            "advantage": "You apply structure where it earns its cost and let it go where it does not.",
            "overextension": "Judgement calls about when structure applies are hard to hand over. Others may not be able to predict you.",
            "reflection": "Could someone else run your work from your notes, or only from you?"
          },
          "lower": {
            "advantage": "You stay adaptable and are not held by a plan that has stopped describing the situation.",
            "overextension": "Without a sequence, the slow and unglamorous parts are the ones that quietly go unrecorded.",
            "reflection": "What is currently held only in your head, and what happens if you are not there tomorrow?"
          }
        }
      },
      "negativeEmotionality": {
        "code": "negativeEmotionality",
        "name": "Negative Emotionality",
        "colour": "#5A6BB0",
        "focus": "Frequency and intensity of worry, low mood and emotional reactivity",
        "facets": [
          "Anxiety",
          "Depression",
          "Emotional Volatility"
        ],
        "interpretation": {
          "higher": "Your responses suggest more frequent or more intense worry, low mood and emotional reactivity during the watch.",
          "balanced": "Your responses suggest that worry, low mood and reactivity arrived in some situations and not others.",
          "lower": "Your responses suggest less frequent or less intense worry, low mood and emotional reactivity during the watch."
        },
        "guidance": {
          "higher": {
            "advantage": "You register strain early. Discomfort is information, and you receive it before others do.",
            "overextension": "Early signal is exhausting to carry. Sustained alertness costs something even when nothing arrives.",
            "reflection": "Which of tonight's worries turned out to be signal, and which were the cost of watching?"
          },
          "balanced": {
            "advantage": "Difficulty reaches you without taking the room over. You feel the pressure and can still work inside it.",
            "overextension": "A moderate reading can be misread as indifference by people who need the strain named aloud.",
            "reflection": "When you absorb pressure quietly, does the room read that as steadiness or as distance?"
          },
          "lower": {
            "advantage": "Conditions can move a long way before your own state becomes part of the problem.",
            "overextension": "Low reactivity can miss the point at which a situation genuinely has changed, and can leave others feeling unmet.",
            "reflection": "Who around you was more affected than you were, and did you notice at the time?"
          }
        }
      },
      "openMindedness": {
        "code": "openMindedness",
        "name": "Open-Mindedness",
        "colour": "#6C4F9E",
        "focus": "Intellectual, aesthetic and imaginative engagement",
        "facets": [
          "Intellectual Curiosity",
          "Aesthetic Sensitivity",
          "Creative Imagination"
        ],
        "interpretation": {
          "higher": "Your responses suggest a generally higher tendency toward intellectual, aesthetic and imaginative engagement.",
          "balanced": "Your responses suggest that curiosity, aesthetic attention and invention appeared in some moments and were set aside in others.",
          "lower": "Your responses suggest a generally lower tendency to pursue abstraction, aesthetic detail or invention when a direct route was available."
        },
        "guidance": {
          "higher": {
            "advantage": "You keep more than one explanation alive and notice the pattern before it has a name.",
            "overextension": "Exploration can delay closure, and a weak signal can be given more attention than the evidence supports.",
            "reflection": "What evidence would be enough for you to stop looking and commit?"
          },
          "balanced": {
            "advantage": "You open the frame when the situation is genuinely unclear and close it when it is not.",
            "overextension": "The decision to explore or to close is made privately, so others may not see the reasoning that produced it.",
            "reflection": "When you stop exploring, do you say so, or does the room simply notice you have moved on?"
          },
          "lower": {
            "advantage": "You filter quickly toward evidence that can support a decision now, which protects attention under load.",
            "overextension": "A fast filter removes the unfamiliar option early, sometimes before it had a chance to prove itself.",
            "reflection": "Which possibility did you dismiss tonight without testing, and what would testing have cost?"
          }
        }
      }
    },
    "facets": {
      "Sociability": {
        "name": "Sociability",
        "domain": "extraversion",
        "meaning": "Preference for approaching and engaging with others"
      },
      "Assertiveness": {
        "name": "Assertiveness",
        "domain": "extraversion",
        "meaning": "Willingness to express views, influence others and take the lead"
      },
      "Energy Level": {
        "name": "Energy Level",
        "domain": "extraversion",
        "meaning": "Enthusiasm, activity and positively activated energy"
      },
      "Compassion": {
        "name": "Compassion",
        "domain": "agreeableness",
        "meaning": "Emotional concern for other people's welfare"
      },
      "Respectfulness": {
        "name": "Respectfulness",
        "domain": "agreeableness",
        "meaning": "Regard for others' rights and restraint of antagonistic behaviour"
      },
      "Trust": {
        "name": "Trust",
        "domain": "agreeableness",
        "meaning": "General expectation that other people have positive intentions"
      },
      "Organization": {
        "name": "Organization",
        "domain": "conscientiousness",
        "meaning": "Preference for order, structure and neatness"
      },
      "Productiveness": {
        "name": "Productiveness",
        "domain": "conscientiousness",
        "meaning": "Persistence, efficiency and work toward goals"
      },
      "Responsibility": {
        "name": "Responsibility",
        "domain": "conscientiousness",
        "meaning": "Reliability and commitment to duties and obligations"
      },
      "Anxiety": {
        "name": "Anxiety",
        "domain": "negativeEmotionality",
        "meaning": "Tendency toward worry, tension and fear"
      },
      "Depression": {
        "name": "Depression",
        "domain": "negativeEmotionality",
        "meaning": "Tendency toward sadness, discouragement and low mood; not a clinical diagnosis"
      },
      "Emotional Volatility": {
        "name": "Emotional Volatility",
        "domain": "negativeEmotionality",
        "meaning": "Mood instability, irritability and emotional reactivity"
      },
      "Intellectual Curiosity": {
        "name": "Intellectual Curiosity",
        "domain": "openMindedness",
        "meaning": "Interest in ideas, abstraction and complex thinking"
      },
      "Aesthetic Sensitivity": {
        "name": "Aesthetic Sensitivity",
        "domain": "openMindedness",
        "meaning": "Engagement with art, beauty, music and literature"
      },
      "Creative Imagination": {
        "name": "Creative Imagination",
        "domain": "openMindedness",
        "meaning": "Originality, imagination and inventive thinking"
      }
    },
    "phases": {
      "baseline": {
        "id": "baseline",
        "label": "Baseline",
        "shortLabel": "Before",
        "acts": [
          1,
          2,
          3,
          4
        ],
        "window": "21:58 – 22:55",
        "description": "The handover and the first Sector C fault, worked through ordinary procedure and contained."
      },
      "pressure": {
        "id": "pressure",
        "label": "Under pressure",
        "shortLabel": "Pressure",
        "acts": [
          5,
          6,
          7,
          8
        ],
        "window": "22:56 – 03:50",
        "description": "Base unreachable, heat rationed, an unexplained signal beneath the ice and hours in the whiteout."
      },
      "recovery": {
        "id": "recovery",
        "label": "After pressure",
        "shortLabel": "Recovery",
        "acts": [
          9,
          10,
          11,
          12
        ],
        "window": "03:50 – 05:20",
        "description": "The storm breaks, the last reserve is committed, and the station waits for Ridge."
      }
    },
    "phaseNote": "Stretch readings are an Aurora Station narrative interpretation of the same responses. They are not separate measurements and they have no norms.",
    "phaseOrder": [
      "baseline",
      "pressure",
      "recovery"
    ],
    "roles": {
      "pathfinder": {
        "id": "pathfinder",
        "name": "The Pathfinder",
        "shortName": "Pathfinder",
        "domain": "openMindedness",
        "basis": "Open-Mindedness",
        "inverse": false,
        "element": "Wood",
        "colour": "#3dcd58",
        "colourNight": "#3dcd58",
        "colourPaper": "#237a35",
        "contribution": "Explores possibilities and reframes uncertainty.",
        "reading": "keeping more than one explanation alive and looking for the route that has not been tried",
        "inGroup": "finds the option a group has not yet considered",
        "missionFunction": "Keep unexplored routes visible before the watch closes on one explanation.",
        "brings": "Alternative readings of the same evidence, and the patience to hold them open while the data is still thin.",
        "watchFor": "Exploration can outlast its usefulness. A watch that keeps reopening the question never reaches the point of acting on it.",
        "actionTitle": "OPEN ONE MORE ROUTE",
        "action": "Name one plausible explanation the room has not yet said aloud, then set the evidence that would close it."
      },
      "catalyst": {
        "id": "catalyst",
        "name": "The Catalyst",
        "shortName": "Catalyst",
        "domain": "extraversion",
        "basis": "Extraversion",
        "inverse": false,
        "element": "Fire",
        "colour": "#b10043",
        "colourNight": "#e0175c",
        "colourPaper": "#b10043",
        "contribution": "Creates momentum and mobilises others.",
        "reading": "putting energy into the room and making your engagement visible to the people in it",
        "inGroup": "raises the level of a room when the work needs momentum",
        "missionFunction": "Turn a stalled room into a moving one and keep the work visible between people.",
        "brings": "Momentum, and the willingness to be the first voice when the silence has stopped being useful.",
        "watchFor": "Momentum can occupy the space other people needed in order to think. The room can end up moving at your pace rather than the problem's.",
        "actionTitle": "MAKE ROOM AFTER MOVING",
        "action": "Once the direction is set, leave a deliberate pause in which someone else can change it."
      },
      "steward": {
        "id": "steward",
        "name": "The Steward",
        "shortName": "Steward",
        "domain": "agreeableness",
        "basis": "Agreeableness",
        "inverse": false,
        "element": "Earth",
        "colour": "#e47f00",
        "colourNight": "#e47f00",
        "colourPaper": "#a35a00",
        "contribution": "Maintains trust, cooperation and human connection.",
        "reading": "keeping people in contact with one another and protecting the working relationship",
        "inGroup": "holds a group together when the work starts to pull people apart",
        "missionFunction": "Keep the people in contact with each other while the work pulls them apart.",
        "brings": "Attention to what a decision costs the person carrying it, and the conditions cooperation actually needs.",
        "watchFor": "Protecting the relationship can delay a necessary disagreement. Some decisions cost trust in the short term and are still correct.",
        "actionTitle": "NAME THE HUMAN COST",
        "action": "Say plainly who carries the weight of the current plan, then ask whether they can."
      },
      "architect": {
        "id": "architect",
        "name": "The Architect",
        "shortName": "Architect",
        "domain": "conscientiousness",
        "basis": "Conscientiousness",
        "inverse": false,
        "element": "Metal",
        "colour": "#9fa0a4",
        "colourNight": "#9fa0a4",
        "colourPaper": "#5c6166",
        "contribution": "Creates structure and dependable execution.",
        "reading": "holding sequence and finishing what the situation started",
        "inGroup": "turns an intention into something that actually gets carried through",
        "missionFunction": "Turn intent into a sequence that survives being handed to someone else.",
        "brings": "Order, follow-through, and a record that means the next watch does not begin from nothing.",
        "watchFor": "Structure can outlive the situation it was built for. A sequence held past its usefulness becomes the thing being defended.",
        "actionTitle": "SET THE STOPPING RULE",
        "action": "Define the condition that would tell you the current sequence is no longer the right one."
      },
      "sentinel": {
        "id": "sentinel",
        "name": "The Sentinel",
        "shortName": "Sentinel",
        "domain": "negativeEmotionality",
        "basis": "Emotional Stability",
        "inverse": true,
        "element": "Water",
        "colour": "#42b4e6",
        "colourNight": "#42b4e6",
        "colourPaper": "#10688f",
        "contribution": "Maintains calm, awareness and resilience under pressure.",
        "reading": "staying level while the situation moves and keeping your own state out of the problem",
        "inGroup": "gives others something steady to work against when conditions are not steady",
        "missionFunction": "Hold a steady reading while the conditions around it stop being steady.",
        "brings": "Calm that other people can work against, and attention that stays on the instrument rather than the alarm.",
        "watchFor": "Steadiness can read as distance. A room under strain sometimes needs the pressure acknowledged before it is absorbed.",
        "actionTitle": "SAY WHAT IS UNRESOLVED",
        "action": "Name the one risk still open and the evidence that would show it is controlled."
      }
    },
    "roleOrder": [
      "pathfinder",
      "catalyst",
      "steward",
      "architect",
      "sentinel"
    ],
    "roleNote": "Aurora Roles are mission contributions derived from your own responses. They are not fixed personality types. All five sit on the same one-to-five scale, they do not total anything, and no role is better than another.",
    "elements": {
      "wood": {
        "id": "wood",
        "name": "Wood",
        "role": "pathfinder",
        "keywords": "Initiating, creative, unconventional, visionary",
        "shadow": "Many ideas, and no one left to finalise them"
      },
      "fire": {
        "id": "fire",
        "name": "Fire",
        "role": "catalyst",
        "keywords": "Spreading, driving, energetic, active",
        "shadow": "Impulsive and loud, and short of depth"
      },
      "earth": {
        "id": "earth",
        "name": "Earth",
        "role": "steward",
        "keywords": "Bonding, mediating, nurturing, steadying",
        "shadow": "Avoids conflict, and is reluctant on the hard calls"
      },
      "metal": {
        "id": "metal",
        "name": "Metal",
        "role": "architect",
        "keywords": "Disciplined, exacting, completing, quality-led",
        "shadow": "Rigid and perfectionist, and slow to adapt"
      },
      "water": {
        "id": "water",
        "name": "Water",
        "role": "sentinel",
        "keywords": "Calm, analytical, deep, adaptable",
        "shadow": "Passive and detached, and prone to over-analysis"
      }
    },
    "cycles": {
      "generating": [
        "water",
        "wood",
        "fire",
        "earth",
        "metal"
      ],
      "controlling": {
        "wood": "earth",
        "earth": "water",
        "water": "fire",
        "fire": "metal",
        "metal": "wood"
      },
      "note": "The five elements are used here for the shape of a relationship between contributions, and for nothing else. No part of your reading is derived from a date of birth."
    },
    "roleMapping": {
      "The Pathfinder": "Open-Mindedness",
      "The Catalyst": "Extraversion",
      "The Steward": "Agreeableness",
      "The Architect": "Conscientiousness",
      "The Sentinel": "6 - Negative Emotionality"
    },
    "shiftThresholds": {
      "ignore": 0.25,
      "subtle": 0.25,
      "notable": 0.5,
      "blend": 0.15,
      "secondary": 0.3
    },
    "suitability": {
      "formula": "0.60 * overallRoleScore + 0.25 * pressureRoleScore + 0.15 * facetFloor",
      "weights": {
        "overall": 0.6,
        "pressure": 0.25,
        "facetFloor": 0.15
      },
      "facetFloorNote": "The lowest supporting facet score for that role, so a strong average cannot hide an unsupported component.",
      "recommendedFormula": "Profile Suitability + Team Composition + Mission Requirement",
      "recommendedNote": "Profile suitability describes the fit your own responses support. A recommended role also depends on what the team already has and what the mission needs, neither of which a solo journey can know.",
      "tieTolerance": 0.15,
      "stableChange": 0.25
    },
    "whyTemplates": {
      "single": "{role} is the contribution your responses supported most consistently: strongly across the watch as a whole, and still present in the hours when the station was least predictable.",
      "blend": "{roles} sat close enough together that the record does not separate them. Read them as one contribution with two hands rather than a first and second place.",
      "supported": "It also held up underneath: the components behind it were present rather than carried by a single strong answer.",
      "uneven": "One component behind it was noticeably thinner than the others, which is worth knowing before you lean on it."
    },
    "instruments": {
      "extraversion": {
        "name": "Room Meter",
        "reads": "how much of you enters the room"
      },
      "agreeableness": {
        "name": "Tether Gauge",
        "reads": "what holds between people"
      },
      "conscientiousness": {
        "name": "Sequence Recorder",
        "reads": "whether the order holds"
      },
      "negativeEmotionality": {
        "name": "Strain Trace",
        "reads": "what the night costs you"
      },
      "openMindedness": {
        "name": "Aperture Dial",
        "reads": "how wide the frame stays"
      }
    }
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
        "opening": "Mira waits by the door while snow runs sideways across the glass. The handover is complete except for four words about Sector C. There is no trigger, no next check and no note of what she has already ruled out.",
        "items": [
          {
            "id": "q01",
            "bfiItem": 1,
            "number": 1,
            "act": 1,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Sociability",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who enjoys keeping conversations going with other people.",
            "context": "Mira zips her coat. Ilan has not left the window. The handover folder sits closed beneath the lamp and no one has spoken for a while.",
            "convergence": "At 22:02 the outer door seals. Two people remain awake in a station built for twenty.",
            "narrative": {
              "low": "You let the quiet hold. Mira signs, nods once and goes. The room keeps its own company until the outer door seals.",
              "mid": "You say enough to close the handover cleanly, then let the silence come back. Ilan stays at the window.",
              "high": "You keep the three of you talking until the last minute—the storm, the ridge, the winter list. Mira leaves mid-sentence, almost smiling."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q02",
            "bfiItem": 2,
            "number": 2,
            "act": 1,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Compassion",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who feels genuine concern when another person is struggling.",
            "context": "Mira has spent four seasons repairing what the cold loosens. Tonight her hands are slower than her voice, and the last line of her handover is four unfinished words.",
            "convergence": "The four words stay on the page either way. SECTOR C INTERMITTENT — MONITOR.",
            "narrative": {
              "low": "You take the folder and go straight to the line. Whatever the season cost her is hers to carry south.",
              "mid": "You register how thin she looks, note it, and return to the page. The unresolved check matters more right now.",
              "high": "You ask how she is, and mean it. She answers briefly, but something in her shoulders drops before she lifts her bag."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q03",
            "bfiItem": 3,
            "number": 3,
            "act": 1,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Organization",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who often begins work without first putting things into order.",
            "context": "The handover is a stack: alarm history, a printed check sheet, a handwritten page and one unresolved line. Nothing is numbered.",
            "convergence": "The console holds at nominal. Outside, the wind changes pitch against the west wall.",
            "narrative": {
              "low": "You lay the pages out and number what is still open before anything else. There is exactly one item, and numbering it does not make it any less unfinished.",
              "mid": "You skim the stack, keep the shape of it in your head, and move on. It will hold for now.",
              "high": "You leave the stack as it is. The night will sort itself, and the pages can wait until something asks for them."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q04",
            "bfiItem": 4,
            "number": 4,
            "act": 1,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Anxiety",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who remains fairly calm when an unresolved problem is present.",
            "context": "SECTOR C INTERMITTENT — MONITOR. No trigger value. No next check. No record of what has already been ruled out.",
            "convergence": "Somewhere inside the wall, metal answers the wind with a small click.",
            "narrative": {
              "low": "The unfinished line sits behind everything you do. You return to the panel twice more than the schedule asks.",
              "mid": "It stays with you, but at a distance—a thing to watch rather than a thing to carry.",
              "high": "You file it as one open item, no more urgent than any other, and let your attention settle back into the ordinary shape of the watch."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q05",
            "bfiItem": 5,
            "number": 5,
            "act": 1,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Aesthetic Sensitivity",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who is rarely affected by unusual light, sound or beauty.",
            "context": "The lamp throws the control room into one warm circle. Beyond it the corridor runs grey, and the window has gone the colour of old paper.",
            "convergence": "The lamp holds its circle. Nothing on the panel has moved.",
            "narrative": {
              "low": "You notice all of it—the paper-coloured glass, the way the lamp gives out at the doorway. None of it goes in the log, and all of it stays with you.",
              "mid": "The room registers as a room. Once, briefly, the light across the glass catches you.",
              "high": "The room is a room. You check what needs checking and let the rest of it stay furniture."
            },
            "contextPhase": "baseline"
          }
        ],
        "closing": "At 22:06, the console gives one soft tone. The temperature line jumps twice. This time the current line moves with it.",
        "contextPhase": "baseline"
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
            "bfiItem": 6,
            "number": 6,
            "act": 2,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Assertiveness",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who speaks up clearly about what should be done.",
            "context": "The tone repeats. Ilan looks up from the magnetic record and waits. Nothing in the handover says which check comes first.",
            "convergence": "The history opens on three brief spikes, each one cleared without reaching the trip limit.",
            "narrative": {
              "low": "You wait to see what he suggests. He offers the magnetic channel, and you follow it.",
              "mid": "You name two options and let him choose between them. He takes the second.",
              "high": "You state the order aloud—alarm history first, then the channel—and the room organises itself around it."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q07",
            "bfiItem": 7,
            "number": 7,
            "act": 2,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Respectfulness",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who treats others with consideration during disagreement.",
            "context": "Ilan disagrees. He thinks the spikes are an artefact of the sensor, and he says so twice, the second time more sharply.",
            "convergence": "Both readings go into the record. Neither of you can rule the other out yet.",
            "narrative": {
              "low": "You cut across him. The sharpness in your voice ends the discussion faster than the argument does.",
              "mid": "You hold your position without heat, though you do not invite him to expand on his.",
              "high": "You let him finish, restate his objection back to him, then set your reading beside it. The room stays workable."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q08",
            "bfiItem": 8,
            "number": 8,
            "act": 2,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Productiveness",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who tends to postpone demanding work until later.",
            "context": "A full cross-check against the magnetic record takes about forty minutes. Nothing requires it before the midnight call.",
            "convergence": "22:14. The temperature line is flat. The current line is not.",
            "narrative": {
              "low": "You start it now, while the evidence is fresh, and let the rest of the watch move around it.",
              "mid": "You begin the first half and mark where to resume. The remainder can wait for a quieter hour.",
              "high": "You note it as a task for later. There will be time before dawn, and nothing is trending."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q09",
            "bfiItem": 9,
            "number": 9,
            "act": 2,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Depression",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who regains optimism after an unsuccessful attempt.",
            "context": "The first pass returns clean. Whatever moved the current line has left no signature the standard tools can see.",
            "convergence": "The second pass is queued. Outside, the storm loses its rhythm for a moment, then finds it again.",
            "narrative": {
              "low": "Something in you closes a little. If the obvious check finds nothing, the night is probably going to stay unreadable.",
              "mid": "You accept the null result without much feeling either way and set up the second pass.",
              "high": "A clean first pass narrows the field. You start the second with the sense that the answer is still in reach."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q10",
            "bfiItem": 10,
            "number": 10,
            "act": 2,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Intellectual Curiosity",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who wants to understand how and why things work.",
            "context": "The alarm has cleared. The question of why a temperature spike and a current spike arrived in the same second has not been asked by anyone but you.",
            "convergence": "At 22:18 the panel reports a temperature rise behind the Sector C wall. This one does not clear.",
            "narrative": {
              "low": "It cleared. You close the entry and move to the next item on the sheet.",
              "mid": "You note the coincidence in the log without following it, and leave the question where anyone could pick it up.",
              "high": "You go looking for the mechanism—what could couple heat and current in the same instant—and the search opens more than it closes."
            },
            "contextPhase": "baseline"
          }
        ],
        "closing": "The corridor tightens around the beam of your lamp. Frost coats the pipes. The air grows warmer with every step towards Sector C.",
        "contextPhase": "baseline"
      },
      {
        "id": "act-03",
        "number": 3,
        "title": "Heat Behind the Panel",
        "time": "22:20–22:41",
        "opening": "Heat comes through the cabinet door even through your glove. A burnt-plastic smell hangs in the corridor. The local indicator stays green, as if nothing behind the panel has changed. Ilan reaches Mira on the short-range set while she is still inside the pass. She does not ask a second question. The vehicle turns.",
        "items": [
          {
            "id": "q11",
            "bfiItem": 11,
            "number": 11,
            "act": 3,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Energy Level",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who seldom feels eager or energised by a discovery.",
            "context": "The wall panel is warm. Behind it, somewhere, is the first physical thing the night has offered instead of a number.",
            "convergence": "The panel comes away. Warm air, the smell of hot insulation, and no flame.",
            "narrative": {
              "low": "Something in you lifts. Whatever is behind the panel is real, and you want to be the one to reach it.",
              "mid": "You feel the pull of it briefly, then set it aside and fetch the tools.",
              "high": "It is another task. You collect what is needed and open the panel without any particular quickening."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q12",
            "bfiItem": 12,
            "number": 12,
            "act": 3,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Trust",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who often assumes that other people have overlooked something.",
            "context": "Mira's sheet says this run was inspected six weeks ago and passed. The insulation in front of you has been hot for long enough to discolour.",
            "convergence": "Either way the run has to be traced by hand. You start at the junction and work outward.",
            "narrative": {
              "low": "You take the inspection as sound and look for what has changed since. Six weeks is time enough for a new fault.",
              "mid": "You keep the earlier check in mind without leaning on it, and verify the section yourself.",
              "high": "You assume the inspection was cursory. Whatever passed six weeks ago probably should not have."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q13",
            "bfiItem": 13,
            "number": 13,
            "act": 3,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Responsibility",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who follows agreed responsibilities even when shortcuts are available.",
            "context": "The isolation procedure has eleven steps. Steps four through seven are slow, and the fault is almost certainly past them.",
            "convergence": "The section comes down cleanly. Ilan holds the light steady while the run cools.",
            "narrative": {
              "low": "You jump to step eight. The time saved is real, and so is the step you did not verify.",
              "mid": "You compress the middle steps rather than skip them, and note which ones were shortened.",
              "high": "You work the sequence as written, all eleven steps, and the slow ones take exactly as long as they always do."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q14",
            "bfiItem": 14,
            "number": 14,
            "act": 3,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Emotional Volatility",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who experiences noticeable changes in mood.",
            "context": "The temperature behind the wall climbs, holds, drops, climbs again. Each movement takes about ninety seconds.",
            "convergence": "At 22:39 the readings settle. The run is isolated and the wall begins, slowly, to give back its heat.",
            "narrative": {
              "low": "Your state stays level through all of it. The numbers move; you do not.",
              "mid": "The rises tighten something in you and the falls release it, but not by much.",
              "high": "Each climb pulls you up with it and each fall drops you. By the fourth cycle you can hear it in your own voice."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q15",
            "bfiItem": 15,
            "number": 15,
            "act": 3,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Creative Imagination",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who creates practical solutions when standard options are unavailable.",
            "context": "The correct clamp is in the external store, and the external store is on the far side of the storm.",
            "convergence": "The circuit is isolated. Whatever caused the heat is now behind a break in the line.",
            "narrative": {
              "low": "You go for the store. The walk costs eleven minutes and the storm takes most of the warmth you had.",
              "mid": "You make do with a partial arrangement and accept that it will need redoing properly in daylight.",
              "high": "You build something out of a spare bracket and two lengths of strap. It is not in any manual, and it holds."
            },
            "contextPhase": "baseline"
          }
        ],
        "closing": "The Sector C branch begins to cool. Headlights swing across the window as Mira's vehicle comes back onto the pad, and the road closes behind her. Then a dull impact travels through the floor. The main generator trips, and the station returns in emergency red.",
        "contextPhase": "baseline"
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
            "bfiItem": 16,
            "number": 16,
            "act": 4,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Sociability",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who tends to remain quiet around other people.",
            "context": "Ninety seconds. Three things need doing and three people to do them, and nobody has said who takes which. Mira is still in outdoor gear. The room fills with the sound of the plant and very little else.",
            "convergence": "At the end of it all three tasks are done. None of you could say precisely in what order.",
            "narrative": {
              "low": "You talk the whole way through it—positions, timings, what you are seeing—and the talk is what keeps all three of you aligned.",
              "mid": "You speak when something needs saying and not otherwise.",
              "high": "You work in silence. Ilan learns where you are from the sound of your movements rather than your voice."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q17",
            "bfiItem": 17,
            "number": 17,
            "act": 4,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Compassion",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who feels little concern for difficulties caused by another person's mistake.",
            "context": "The escalation should have gone to Hobart at the first spike. It did not, and the person who did not send it is three metres away, reading values off a panel she turned back for.",
            "convergence": "The record will show the gap regardless. You log the time and move on.",
            "narrative": {
              "low": "You think about how the end of a long season narrows what a person can see, and the anger does not really arrive.",
              "mid": "You set the question of fault aside. It can be answered later, by someone else.",
              "high": "Someone made this harder than it needed to be. That sits with you while you work."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q18",
            "bfiItem": 18,
            "number": 18,
            "act": 4,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Organization",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who prefers to organise different tasks into a clear sequence.",
            "context": "Isolation, ventilation and the log all need attention inside the same ninety seconds.",
            "convergence": "Ninety seconds later the air moves again and the panel reads within limits.",
            "narrative": {
              "low": "You move between all three as each one calls, and afterwards the log has a gap you cannot reconstruct.",
              "mid": "You keep isolation and ventilation separated and let the log take whatever is left.",
              "high": "You fix the order before you start—isolation, ventilation, log—and hold it even when the middle one wants to jump the queue."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q19",
            "bfiItem": 19,
            "number": 19,
            "act": 4,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Anxiety",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who becomes tense while a difficult situation remains unresolved.",
            "context": "There is a point in the sequence where the ventilation is open and the isolation is not yet complete. It lasts about twenty seconds.",
            "convergence": "22:55. The Sector C wall is cool enough to touch. Nothing has caught fire.",
            "narrative": {
              "low": "You pass through it the way you pass through any other step, and only notice afterwards that it was the dangerous one.",
              "mid": "You feel it while it lasts and let it go when the step closes.",
              "high": "Those twenty seconds arrive in your hands and your breathing, and they do not leave when the step does."
            },
            "contextPhase": "baseline"
          },
          {
            "id": "q20",
            "bfiItem": 20,
            "number": 20,
            "act": 4,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Aesthetic Sensitivity",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who pays attention to meaningful patterns in sound and atmosphere.",
            "context": "As the load shifts, the machinery under the floor moves through a series of tones—low, then higher, then a long sustained note.",
            "convergence": "The sustained note thins and stops. In the quiet after it, the radio does not answer Hobart.",
            "narrative": {
              "low": "You use the sound as a signal and nothing more. When it changes, you check the panel.",
              "mid": "You catch yourself listening once, then return to the readings.",
              "high": "You listen to the whole sequence. Later you will not be able to explain why it mattered, only that you would know it again."
            },
            "contextPhase": "baseline"
          }
        ],
        "closing": "At 22:55, the red lights hold steady. The long-range radio rack remains dark. Aurora can no longer reach Hobart.",
        "contextPhase": "baseline"
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
            "bfiItem": 21,
            "number": 21,
            "act": 5,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Assertiveness",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who is comfortable taking charge when direction is needed.",
            "context": "The midnight call cannot be made. Mira has four seasons here and no watch to stand; the handover is signed in your name. Nothing in it says which of those two facts decides who is in charge once the radio goes.",
            "convergence": "The retry schedule is set for every twenty minutes. The first attempt returns nothing but the carrier.",
            "narrative": {
              "low": "You wait for the shape of it to settle. Ilan begins allocating tasks, and the night acquires a lead by default.",
              "mid": "You take the parts that are clearly yours and leave the rest open.",
              "high": "You say that you are running the watch until Hobart is back, and set the first three tasks before anyone can disagree."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q22",
            "bfiItem": 22,
            "number": 22,
            "act": 5,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Respectfulness",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who tends to challenge others rather than let a poor decision pass.",
            "context": "Ilan proposes climbing to the mast in the storm to check the feed. The wind is running at a speed that has already closed the road.",
            "convergence": "The mast stays unchecked. The retry schedule runs on.",
            "narrative": {
              "low": "You set out the wind figures and let him reach the conclusion himself. He withdraws the idea without either of you naming it a bad one.",
              "mid": "You say it will not work and give one reason. He accepts the reason.",
              "high": "You take the plan apart in front of him, point by point, until there is nothing left of it. He does not raise another idea for some time."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q23",
            "bfiItem": 23,
            "number": 23,
            "act": 5,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Productiveness",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who has difficulty beginning a task when several problems remain open.",
            "context": "The schedule is dull work: twenty minutes of waiting, ninety seconds of calling, a line in the log. It will run all night.",
            "convergence": "Every attempt returns the same silence. The Ridge team, wherever they are, is not answering either.",
            "narrative": {
              "low": "You start it immediately and keep it exactly. The log fills with identical entries.",
              "mid": "You start it, miss one slot while working elsewhere, and pick it up again.",
              "high": "You keep finding something more pressing. The first two slots pass before the schedule really begins."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q24",
            "bfiItem": 24,
            "number": 24,
            "act": 5,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Depression",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who remains secure in my judgement when external support is unavailable.",
            "context": "There is no one outside the station left to confirm a decision against. Whatever is decided tonight is decided here.",
            "convergence": "23:11. The storm is at its heaviest and the station is entirely alone.",
            "narrative": {
              "low": "Without someone to check against, your own reasoning starts to sound thinner than it did an hour ago.",
              "mid": "You proceed, with a quiet reservation you do not voice.",
              "high": "You find the ground is still under you. The absence of Hobart removes a confirmation, not a capability."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q25",
            "bfiItem": 25,
            "number": 25,
            "act": 5,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Intellectual Curiosity",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who avoids exploring speculative or abstract explanations.",
            "context": "Ilan starts talking about the magnetic record—old readings, a pattern he has been chasing for two seasons, why tonight might matter to it.",
            "convergence": "At 23:15 the outer temperature drops four degrees in under a minute. No one is looking at the panel when it happens.",
            "narrative": {
              "low": "You follow him into it. For twenty minutes the storm is somewhere else, and the argument is genuinely interesting.",
              "mid": "You listen without joining in, and bring it back to the panel when the slot comes round.",
              "high": "You steer it back to the schedule. Whatever the record means, it does not change what has to be done in the next hour."
            },
            "contextPhase": "pressure"
          }
        ],
        "closing": "The heating screen shows three zones and enough power for one loop. Outside that loop, the station will begin to freeze.",
        "contextPhase": "pressure"
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
            "bfiItem": 26,
            "number": 26,
            "act": 6,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Energy Level",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who is usually less active than the people around me.",
            "context": "Every non-essential load has to be found, listed and switched down by hand. It takes hours and covers most of the station.",
            "convergence": "By 23:30 the draw is down by a third. It is not enough to change the arithmetic.",
            "narrative": {
              "low": "You take the longest share of the building and are still moving when the others sit down.",
              "mid": "You divide it evenly and keep pace with him through most of it.",
              "high": "You settle into the slower share. Ilan covers more ground, and neither of you remarks on it."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q27",
            "bfiItem": 27,
            "number": 27,
            "act": 6,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Trust",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who lets go of resentment after another person makes a mistake.",
            "context": "The gap in the record is now four hours old and has shaped every decision since. It will be in the report, and the person who left it is working two rooms away.",
            "convergence": "The handover folder goes back under the lamp, closed.",
            "narrative": {
              "low": "It stays with you. Something in how you read the rest of the handover has changed.",
              "mid": "You set it down for tonight and leave the question open for daylight.",
              "high": "You let it go. It was the end of a long season, and the report can be written without a name attached to the failure."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q28",
            "bfiItem": 28,
            "number": 28,
            "act": 6,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Responsibility",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who sometimes becomes careless once the main work is complete.",
            "context": "The large loads are down. What remains is a long tail of small ones—corridor lighting, standby heaters, instruments nobody is reading.",
            "convergence": "Frost begins to show on the inner face of the corridor wall.",
            "narrative": {
              "low": "You work the tail to the end, item by item, including the ones that save almost nothing.",
              "mid": "You take the worthwhile ones and leave the rest.",
              "high": "You stop when the returns get small. Several standby loads keep drawing quietly for the rest of the night."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q29",
            "bfiItem": 29,
            "number": 29,
            "act": 6,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Emotional Volatility",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who remains emotionally steady when conditions become disturbing.",
            "context": "It is a thin white line where the wall meets the floor, and it was not there an hour ago.",
            "convergence": "The frost line does not retreat. By 23:40 it has widened by the breadth of a finger.",
            "narrative": {
              "low": "The sight of it goes through you. For a while afterwards your attention keeps returning to that line.",
              "mid": "You register what it means, feel it briefly, and go back to the list.",
              "high": "You note it as data—rate, location, implication—and it does not follow you out of the corridor."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q30",
            "bfiItem": 30,
            "number": 30,
            "act": 6,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Creative Imagination",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who has difficulty generating options beyond those already available.",
            "context": "The standard rationing list was written for a station with a working generator. Tonight it is being applied to something else.",
            "convergence": "The reserve figure is recalculated. However it is read, it is smaller than the night is long.",
            "narrative": {
              "low": "You find three things the list never anticipated, including one that buys nearly an hour.",
              "mid": "You add a couple of obvious items and leave the structure of the list intact.",
              "high": "You work the list as written. It was drawn up by people with more time than you have tonight."
            },
            "contextPhase": "pressure"
          }
        ],
        "closing": "The last fans wind down. In the new silence, three slow knocks pass through the floor, followed by a long pause.",
        "contextPhase": "pressure"
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
            "bfiItem": 31,
            "number": 31,
            "act": 7,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Sociability",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who holds back from discussion even when I have something to contribute.",
            "context": "Ilan has the signal on the speaker. It repeats with a period of about eleven seconds, and he wants to talk about every part of it.",
            "convergence": "The period is stable to within a tenth of a second. Nothing in the station makes that noise.",
            "narrative": {
              "low": "You are in it with him from the first minute, thinking out loud, finishing each other's sentences over the sound of it.",
              "mid": "You contribute when you are certain and stay quiet otherwise.",
              "high": "You keep your observations to yourself. Some of them turn out to have been the useful ones."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q32",
            "bfiItem": 32,
            "number": 32,
            "act": 7,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Compassion",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who willingly interrupts my own work to help another person.",
            "context": "Ilan has been waiting two seasons for something like this and his hands are not steady enough to set the gain.",
            "convergence": "The recorder runs clean. Whatever this is, there will be a record of it.",
            "narrative": {
              "low": "You leave him to it and continue with the reserve calculation. The first minute of the recording is unusable.",
              "mid": "You set the gain for him and return to your own work.",
              "high": "You stay with it until the levels are right, then stay a little longer, and the calculation waits."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q33",
            "bfiItem": 33,
            "number": 33,
            "act": 7,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Organization",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who keeps records neat and understandable for other people.",
            "context": "Times, gain settings, ambient conditions, every change made and when. None of it is required by any procedure.",
            "convergence": "00:40. The pulse continues. The reserve figure has not improved.",
            "narrative": {
              "low": "You keep it in your head and write down the times that seem important. Some of them are not the right ones.",
              "mid": "You log the changes and let the conditions go unrecorded.",
              "high": "You keep it properly—every setting, every adjustment, ruled and timed—because whoever reads this will not be able to ask you."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q34",
            "bfiItem": 34,
            "number": 34,
            "act": 7,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Anxiety",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who continues worrying about an uncertain signal or event.",
            "context": "There is no procedure for an unidentified periodic source beneath a station in a storm.",
            "convergence": "01:10. Ilan goes to check the east corridor and does not come back for some time.",
            "narrative": {
              "low": "Once the recorder is running the question becomes an interesting one rather than a worrying one.",
              "mid": "It surfaces now and then between tasks and goes again.",
              "high": "It stays underneath everything—the eleven seconds, the ice, the absence of any explanation—for the rest of the night."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q35",
            "bfiItem": 35,
            "number": 35,
            "act": 7,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Aesthetic Sensitivity",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who notices patterns that are worth preserving for their own sake.",
            "context": "Under the speaker noise there is a shape to it—a rise, a hold, a fall—that repeats without ever being quite identical.",
            "convergence": "The recording continues. Eleven seconds, and eleven again, under the floor.",
            "narrative": {
              "low": "It is a periodic signal. You record its parameters and leave the rest alone.",
              "mid": "You notice the shape and mention it once, then return to measuring it.",
              "high": "You keep a clean channel of it running longer than the analysis needs, because some of what is in it will not survive being reduced to numbers."
            },
            "contextPhase": "pressure"
          }
        ],
        "closing": "The recorder falls back to low power. Under the red lights, the next knock seems closer than the last, though the measured level has not changed.",
        "contextPhase": "pressure"
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
            "bfiItem": 36,
            "number": 36,
            "act": 8,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Assertiveness",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who finds it difficult to influence another person's interpretation.",
            "context": "Ilan says there was a figure in the whiteout, upright, about thirty metres out, and that it did not move like drifting snow.",
            "convergence": "The camera covering that approach recorded snow and nothing else.",
            "narrative": {
              "low": "You get him seated, get the account written down in order, and by the end of it he is describing rather than insisting.",
              "mid": "You calm him partly. He agrees to the checks without agreeing to the reading.",
              "high": "Nothing you say lands. He holds his account exactly as first given, and the verification proceeds around him."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q37",
            "bfiItem": 37,
            "number": 37,
            "act": 8,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Respectfulness",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who can become abrupt with others while under pressure.",
            "context": "It is 01:40, the sector sweep has found nothing twice, and Ilan asks you to run it a third time.",
            "convergence": "The third sweep is clean. So is the fourth, which nobody asked for.",
            "narrative": {
              "low": "You run it again without comment. Whatever it costs you does not reach him.",
              "mid": "You agree, and something in how you agree tells him what it is costing.",
              "high": "You tell him what you think of a third sweep. He runs it himself, alone, and does not ask again."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q38",
            "bfiItem": 38,
            "number": 38,
            "act": 8,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Productiveness",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who continues working until an important task is fully completed.",
            "context": "Full clearance means every external approach, every camera arc and both storm doors. In this wind it takes over an hour.",
            "convergence": "Whatever Ilan saw, no instrument on the station saw it with him.",
            "narrative": {
              "low": "You clear what can be reached from inside and let the rest stand as unverified.",
              "mid": "You cover most of it and leave the furthest arc for daylight.",
              "high": "You take it to the end, every arc and both doors, and finish at 03:20 with nothing found and nothing left unchecked."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q39",
            "bfiItem": 39,
            "number": 39,
            "act": 8,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Depression",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who tends to feel low after prolonged difficult conditions.",
            "context": "Two hours of searching in a wind that removes sound, in a light that removes distance, for something that was probably never there.",
            "convergence": "At 03:50 the storm breaks apart, and the sky above Aurora Station opens.",
            "narrative": {
              "low": "You come in cold and hungry and otherwise unchanged.",
              "mid": "Something of it comes inside with you and thins out over the next half hour.",
              "high": "It settles into you—the grey, the noise, the pointlessness of it—and it is still there when the wind drops."
            },
            "contextPhase": "pressure"
          },
          {
            "id": "q40",
            "bfiItem": 40,
            "number": 40,
            "act": 8,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Intellectual Curiosity",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who keeps several complex explanations under consideration.",
            "context": "Exhaustion, drifting snow, a shadow thrown by the mast light, a person who cannot be there. None of them can be ruled out from inside.",
            "convergence": "The account goes into the log as reported and unverified. It stays that way.",
            "narrative": {
              "low": "You settle on exhaustion and stop there. It is the explanation that requires the least of you.",
              "mid": "You hold two possibilities and let the rest go.",
              "high": "You keep all four alive, weight them differently as the evidence comes in, and refuse to close on any of them."
            },
            "contextPhase": "pressure"
          }
        ],
        "closing": "At 03:50, the wind drops below its peak. Green light spills across the snow, and every surviving instrument begins to drift.",
        "contextPhase": "pressure"
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
            "bfiItem": 41,
            "number": 41,
            "act": 9,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Energy Level",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who retains energy for further work after a demanding period.",
            "context": "03:52. You have been awake for twenty-two hours and the aurora has just come over the ridge.",
            "convergence": "Green, and then a band of red above it, moving across the whole northern sky.",
            "narrative": {
              "low": "You are running on the last of it. What gets done in the next hour gets done slowly.",
              "mid": "There is enough left for what is needed and not much beyond it.",
              "high": "Something about the light returns a measure of it. You go back to the panel moving faster than you have for an hour."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q42",
            "bfiItem": 42,
            "number": 42,
            "act": 9,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Trust",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who is cautious about trusting another person's intentions.",
            "context": "Ilan asks for the magnetometer to stay powered through the display. It is not a large load, but nothing tonight is free.",
            "convergence": "The magnetometer stays powered. Its trace begins to move with the light overhead.",
            "narrative": {
              "low": "You take the request at face value—it is the reason he came south—and approve it.",
              "mid": "You approve it and note the draw.",
              "high": "You wonder how much of this is the station's night and how much of it is his career, and you say yes with the question still open."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q43",
            "bfiItem": 43,
            "number": 43,
            "act": 9,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Responsibility",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who follows an agreed schedule despite distractions.",
            "context": "A reading is due every fifteen minutes. Outside the window, the sky is doing something that most people who winter here never see.",
            "convergence": "The instrument drift is small but it is there, and it starts when the display does.",
            "narrative": {
              "low": "The reading is missed. It did not, in the end, matter.",
              "mid": "You take it late, but you take it.",
              "high": "It goes in on time, at the height of it, taken with your back to the window."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q44",
            "bfiItem": 44,
            "number": 44,
            "act": 9,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Emotional Volatility",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who keeps strong emotional reactions under control.",
            "context": "Twenty-two hours awake, a station running on its reserve, and the most extraordinary thing any of you will see this year is happening overhead.",
            "convergence": "The band of red thins and the green comes down to the ridge line.",
            "narrative": {
              "low": "It gets through. For a minute or two you are not much use to anyone, and Ilan does not mention it afterwards.",
              "mid": "You feel it move in you and hold most of it.",
              "high": "You take it in and stay level. The reading is due in four minutes and you are there for it."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q45",
            "bfiItem": 45,
            "number": 45,
            "act": 9,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Creative Imagination",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who finds it difficult to imagine an unfamiliar explanation.",
            "context": "A magnetic disturbance overhead. An acoustic period beneath the ice. Between them, a delay that stays roughly constant.",
            "convergence": "The delay is measured at just under four seconds. It does not vary.",
            "narrative": {
              "low": "You sketch three mechanisms in the margin of the log, two of which are almost certainly wrong and one of which is not.",
              "mid": "You can see the shape of a connection without being able to fill it in.",
              "high": "Nothing comes. Two facts stay two facts, and the space between them stays empty."
            },
            "contextPhase": "recovery"
          }
        ],
        "closing": "The reserve is now measured in minutes. Mira asks for heat. Ilan asks for one uninterrupted recording.",
        "contextPhase": "recovery"
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
            "bfiItem": 46,
            "number": 46,
            "act": 10,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Sociability",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who prefers to talk through a problem with another person.",
            "context": "How much reserve is left, what it will carry and for how long. The arithmetic is not difficult and the result is not good.",
            "convergence": "Fifteen minutes of running. Banked into the refuge loop it holds four hours above freezing; spent on the recorder it buys eleven minutes. Not both.",
            "narrative": {
              "low": "You work it alone on paper and put the figure in front of him when it is finished.",
              "mid": "You check the inputs with him and do the rest yourself.",
              "high": "You run the whole thing out loud, every assumption spoken, and he catches an error in the third line that you would not have found."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q47",
            "bfiItem": 47,
            "number": 47,
            "act": 10,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Compassion",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who can disregard the emotional cost of a decision to other people.",
            "context": "One of the options ends the recording. Ilan has not said anything about it, which is itself a kind of statement.",
            "convergence": "The figure comes out the same either way. It is the choosing that is hard.",
            "narrative": {
              "low": "You cannot separate them. What this means for him is in the room whether or not it belongs in the arithmetic.",
              "mid": "You keep the two apart while calculating and let them meet afterwards.",
              "high": "You work the reserve as a reserve. What it costs anyone is a separate question, and you do not open it here."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q48",
            "bfiItem": 48,
            "number": 48,
            "act": 10,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Organization",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who leaves my working materials disorganised after finding an answer.",
            "context": "Three sheets, two of them with corrections, and a set of assumptions that exist only in the order they were written down.",
            "convergence": "04:04. The figure is on the board where all three of you can see it.",
            "narrative": {
              "low": "You copy the whole thing out clean, assumptions first, so that the number can be checked by someone who was not here.",
              "mid": "You tidy the final page and leave the working sheets as they are.",
              "high": "You have the number. The sheets stay where they fell, and by morning nobody could reconstruct how it was reached."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q49",
            "bfiItem": 49,
            "number": 49,
            "act": 10,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Anxiety",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who rarely experiences fear when resources become critically limited.",
            "context": "Below a certain figure the station stops being a building and becomes a container of air that is getting colder.",
            "convergence": "No one says the word emergency. The word is not required for the situation to be one.",
            "narrative": {
              "low": "The fear is there and it is specific: the frost line, the hours, the distance to the Ridge camp.",
              "mid": "It is present without being loud.",
              "high": "You look at the number and it stays a number. What has to happen next is clear enough to work with."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q50",
            "bfiItem": 50,
            "number": 50,
            "act": 10,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Aesthetic Sensitivity",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who finds aesthetic qualities distracting rather than meaningful.",
            "context": "With the main loads down, the building has a different acoustic. Longer silences, and a low note under everything that was never audible before.",
            "convergence": "04:06. The reserve will support one major load. There are two that matter and a third that is neither.",
            "narrative": {
              "low": "You find yourself listening to it, and it enters the record of the night as clearly as any reading.",
              "mid": "You notice it and put it aside.",
              "high": "It is background. There is a decision to make and it does not need a soundtrack."
            },
            "contextPhase": "recovery"
          }
        ],
        "closing": "No calculation removes the loss. The only question left is what Aurora will protect.",
        "contextPhase": "recovery"
      },
      {
        "id": "act-11",
        "number": 11,
        "title": "Two Paths and a Narrow Third",
        "time": "04:06–04:20",
        "opening": "Three plans lie beneath the red lamp: heat, recording, or a timed split. Each saves something. Each abandons something. Mira keeps one finger on the fuel estimate. Ilan keeps both hands around the data drive.",
        "items": [
          {
            "id": "q51",
            "bfiItem": 51,
            "number": 51,
            "act": 11,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Assertiveness",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who prefers another person to make the final decision.",
            "context": "Protect the crew, capture the signal, or split the reserve between them. Three paths, and the watch is yours.",
            "convergence": "You know which way each of them is leaning. Neither has said it outright.",
            "narrative": {
              "low": "You take it. Whatever follows, it will have been your decision and you say so aloud before making it.",
              "mid": "You decide, but only after he has said what he would do.",
              "high": "You would hand it to him if you could. The handover is signed in your name, and that settles it whether you want it settled or not."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q52",
            "bfiItem": 52,
            "number": 52,
            "act": 11,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Respectfulness",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who remains courteous when presenting a difficult decision.",
            "context": "There are six minutes before the load has to be committed, and one of the three options ends two seasons of Ilan's work.",
            "convergence": "He says he understands. It is not clear whether that is agreement.",
            "narrative": {
              "low": "It comes out flat and fast. He hears the decision and not much of the reasoning.",
              "mid": "You state it plainly and answer the questions he asks.",
              "high": "You put it to him properly—what you are choosing, why, and what it costs—and you do it in a voice that has room in it for his answer."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q53",
            "bfiItem": 53,
            "number": 53,
            "act": 11,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Productiveness",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who moves an important decision toward completion efficiently.",
            "context": "Every minute spent deciding is a minute of reserve spent on lighting the room in which the decision is being made.",
            "convergence": "04:12. The switch is thrown. The station commits.",
            "narrative": {
              "low": "The discussion runs past its usefulness. When the decision comes, some of what it was meant to protect has already gone.",
              "mid": "You close it in reasonable time, with one circuit more than it needed.",
              "high": "You take it to a decision inside four minutes, and the two minutes saved go into the load."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q54",
            "bfiItem": 54,
            "number": 54,
            "act": 11,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Depression",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who feels the emotional weight of a difficult outcome.",
            "context": "Whichever path is taken, something that mattered to someone in this room stops tonight and does not resume.",
            "convergence": "The unchosen paths close quietly. Nothing marks the moment except the log entry.",
            "narrative": {
              "low": "You make the choice and the loss stays a fact rather than a weight.",
              "mid": "It sits on you for a while after the switch and then eases.",
              "high": "It comes down and stays. For the rest of the night there is a flatness underneath everything you do."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q55",
            "bfiItem": 55,
            "number": 55,
            "act": 11,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Intellectual Curiosity",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who has little interest in the wider meaning of an immediate decision.",
            "context": "Ilan starts to say something about what it means that a station chooses between keeping people warm and keeping a record. He does not finish it.",
            "convergence": "04:16. The reserve begins to run down against the load you chose. What is left after it is the refuge, the dark, and the wait.",
            "narrative": {
              "low": "You pick the thread up and follow it with him for a while. It is the most interesting conversation of the night.",
              "mid": "You let him finish and do not take it further.",
              "high": "You bring it back to the schedule. Whatever it means can be worked out somewhere warmer."
            },
            "contextPhase": "recovery"
          }
        ],
        "closing": "By 04:20, the wind has dropped below the travel limit. Thirty kilometres south, Ridge starts its vehicles. No voice reaches Aurora.",
        "contextPhase": "recovery"
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
            "bfiItem": 56,
            "number": 56,
            "act": 12,
            "positionInAct": 1,
            "domain": "extraversion",
            "facet": "Energy Level",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who expresses enthusiasm visibly during a difficult wait.",
            "context": "A cooling room, no way to know how long the wait will be, and nothing to do but stay awake and stay warm.",
            "convergence": "05:02. The refuge is at four degrees. None of you has slept.",
            "narrative": {
              "low": "You conserve everything, including your voice. The time passes in a kind of grey economy.",
              "mid": "You keep things moving when they slow and let them slow again.",
              "high": "You keep something alive in the room—talk, a plan for the morning, an argument about nothing—and the temperature does not drop any slower for it, but the time does pass."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q57",
            "bfiItem": 57,
            "number": 57,
            "act": 12,
            "positionInAct": 2,
            "domain": "agreeableness",
            "facet": "Trust",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who generally expects other people to act with good intentions.",
            "context": "The Ridge team is south of here, beyond radio range, on a road that closes in whiteout. They may or may not know anything is wrong.",
            "convergence": "The road opened at some point in the last hour. None of you knows this yet.",
            "narrative": {
              "low": "You plan for nobody coming. It is the assumption that keeps the refuge plan honest.",
              "mid": "You hope for it and prepare as though it will not happen.",
              "high": "You take it as given that they will come the moment the road opens, and something in the room is easier for it."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q58",
            "bfiItem": 58,
            "number": 58,
            "act": 12,
            "positionInAct": 3,
            "domain": "conscientiousness",
            "facet": "Responsibility",
            "reverse": true,
            "spectrumId": "agreement-5",
            "statement": "I am someone who allows routine responsibilities to slip during prolonged uncertainty.",
            "context": "There is still a log to keep, a temperature to record every half hour, and a radio to try. None of it changes anything.",
            "convergence": "05:14. Something that is not the wind comes through on the handheld.",
            "narrative": {
              "low": "Every entry goes in on the half hour, in a hand that gets worse and never stops.",
              "mid": "Most of them go in. One half hour passes unrecorded.",
              "high": "The log thins out and then stops. The last hour of Aurora Station is not written down by anyone."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q59",
            "bfiItem": 59,
            "number": 59,
            "act": 12,
            "positionInAct": 4,
            "domain": "negativeEmotionality",
            "facet": "Emotional Volatility",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who reacts strongly when an emotionally significant event occurs.",
            "context": "A voice, badly broken, giving a callsign that is almost certainly Ridge.",
            "convergence": "Ridge acknowledges. They have been on the road since the wind dropped and they are minutes away, with a portable generator and a tracked vehicle.",
            "narrative": {
              "low": "You acknowledge, give position and status, and your voice does not change at all.",
              "mid": "Something goes through you and you keep it out of the transmission.",
              "high": "It takes you completely for a moment—relief, or something less simple than relief—and Ilan has to take the handset."
            },
            "contextPhase": "recovery"
          },
          {
            "id": "q60",
            "bfiItem": 60,
            "number": 60,
            "act": 12,
            "positionInAct": 5,
            "domain": "openMindedness",
            "facet": "Creative Imagination",
            "reverse": false,
            "spectrumId": "agreement-5",
            "statement": "I am someone who looks for an original way to record or represent an experience.",
            "context": "The official record will have times, readings and decisions. It will not have the eleven seconds, the figure, or the colour of the sky at 03:50.",
            "convergence": "The last entry is timed 05:20. The watch is over.",
            "narrative": {
              "low": "You complete the standard log. It is accurate, and it is all that is required.",
              "mid": "You add a short note at the end for whoever reads it next.",
              "high": "You write a second account beside the first—the sound, the light, the things that were seen and not verified—because the standard form has nowhere to put them."
            },
            "contextPhase": "recovery"
          }
        ],
        "closing": "The outer door opens into white headlamps, engine noise and blue Ridge jackets. For the first time that night, responsibility begins to leave your hands.",
        "contextPhase": "recovery"
      }
    ],
    "auroraAct": 9,
    "auroraNote": "The aurora is a narrative event. It is invisible everywhere except Act 9, where the storm breaks and the sky opens, and it fades before the rescue team arrives."
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
    "revision": "Every statement targets one component with an explicit keying direction, and the Act scenes are unchanged.",
    "reveal": "Revealed by sentence, short paragraph or narrative beat into one cumulative document. Nothing already revealed is replaced or removed."
  },
  "prelude": {
    "steps": [
      {
        "id": "identity",
        "label": "PRELUDE / 01",
        "heading": "Identify the watchkeeper",
        "intro": "Aurora Station is placed into unattended mode at dawn. Before the handover is signed, the log needs the name of whoever holds the final overnight watch.",
        "fieldLabel": "WATCHKEEPER NAME",
        "placeholder": "Enter your name",
        "note": "Stored in this browser only. It appears in your story, your profile and both downloads.",
        "error": "Please enter your name to continue.",
        "primary": "Continue"
      },
      {
        "id": "calibration",
        "label": "PRELUDE / 02",
        "heading": "Calibrate your response",
        "intro": "Each statement describes how you generally tend to think, feel or behave. Choose how strongly you agree or disagree. Try the scale once here.",
        "statement": "I am someone who likes to know what is expected before starting something new.",
        "note": "This practice response is not recorded, not scored and not part of the sixty.",
        "primary": "Continue",
        "back": "Back"
      },
      {
        "id": "orientation",
        "label": "PRELUDE / 03",
        "heading": "Before the watch begins",
        "intro": "Twelve Acts. Five reflections in each. The story continues from whatever you choose.",
        "guidance": [
          "There are no right or wrong responses, and a higher one is not better.",
          "Answer as you generally are, not as an ideal watchkeeper would.",
          "The midpoint is a valid answer, not a way of avoiding one."
        ],
        "disclaimer": "This is a subjective self-report. It is not a diagnosis, a clinical test, an intelligence test or an ability assessment, and it must not be used for employment selection or performance decisions.",
        "primary": "Begin the Watch",
        "back": "Back"
      }
    ]
  },
  "instrument": {
    "basis": "Five-domain structure",
    "status": "Narrative self-reflection, not a clinical instrument",
    "statusNote": "The statements are written for Aurora Station. This is a reflection built on an established five-domain structure, not a validated or clinically administered assessment.",
    "attribution": "The five-domain, fifteen-facet structure this reflection is built on comes from the Big Five Inventory-2 by Christopher J. Soto and Oliver P. John. The statements here are written for Aurora Station and are not their items.",
    "reference": "https://www.colby.edu/academics/departments-and-programs/psychology/research-opportunities/personality-lab/the-bfi-2/",
    "paper": "https://escholarship.org/content/qt16x6n05t/qt16x6n05t.pdf",
    "permission": "The official resource grants personal and research use. Confirm separate permission before any commercial use."
  },
  "completion": {
    "heading": "The watch is complete",
    "lines": [
      "All sixty reflections have been recorded.",
      "Your story remains available above."
    ],
    "profileAction": "View Watchkeeper Profile",
    "storyAction": "Download Story"
  },
  "results": {
    "eyebrow": "AURORA STATION",
    "heading": "Observation report",
    "classification": "WATCHKEEPER RECORD · NOT A CLINICAL INSTRUMENT",
    "openingTitle": "The watch is complete",
    "openingBridge": "The last signal settles into silence. What remains is not a verdict, but a record of how you moved through uncertainty.",
    "openingBody": "Sixty observations were recorded across twelve hours of a station that stopped behaving predictably. What follows reads them back: what you reached for first, what changed when the situation stopped cooperating, and what returned once it was over.",
    "disclaimer": "This describes self-reported tendencies within one story. It is not a diagnosis, a measure of ability, or a prediction of how you would act anywhere else, and it must not be used for selection or performance decisions.",
    "chapters": [
      {
        "id": "role",
        "index": "I",
        "title": "The contribution",
        "eyebrow": "SECTION I · CONTRIBUTION"
      },
      {
        "id": "shift",
        "index": "II",
        "title": "What the night moved",
        "eyebrow": "SECTION II · MOVEMENT"
      },
      {
        "id": "currents",
        "index": "III",
        "title": "The five currents",
        "eyebrow": "SECTION III · SPECTRUMS"
      },
      {
        "id": "detail",
        "index": "IV",
        "title": "Reading each current",
        "eyebrow": "SECTION IV · DETAIL"
      },
      {
        "id": "relations",
        "index": "V",
        "title": "What supports and what checks",
        "eyebrow": "SECTION V · RELATIONS"
      },
      {
        "id": "close",
        "index": "VI",
        "title": "Closing the record",
        "eyebrow": "SECTION VI · CLOSE"
      }
    ],
    "roleIntro": "One contribution the record supports most clearly. It is a reading of this night, not a fixed type.",
    "notATypeStatement": "Your Aurora Role is the contribution your profile is best placed to make. It is not a fixed personality type, and it is not a limit on what you are able to do.",
    "labels": {
      "missionFunction": "Mission function",
      "brings": "What you bring",
      "watchFor": "Watch for",
      "action": "Mission action",
      "why": "Why this role",
      "basis": "Behavioural current",
      "advantage": "Potential advantage",
      "overextension": "Possible overextension",
      "reflection": "Reflection",
      "instrument": "Instrument",
      "facets": "Facets",
      "observations": "Observations"
    },
    "shiftIntro": "The same five contributions, read separately across three stretches of the watch. The instrument holds one scale throughout; only the distance along each axis changes.",
    "shiftStableCopy": "Little moved. Across the three stretches no contribution shifted far enough to read as a change, which suggests your approach was not especially sensitive to how difficult the night became.",
    "currentsIntro": "Five behavioural currents, each a range rather than a score to win. Neither end is better, and the centre is a real position rather than a missing answer.",
    "detailIntro": "Each current read in full: what it was doing, what it is likely to give you, what it can cost, and one question worth sitting with.",
    "relationsIntro": "Contributions do not sit apart from one another. Read from the one your record supports most clearly, this is which contribution yours tends to feed, which one tends to feed yours, and which one holds it in check when it runs long. None of it is a compatibility rating, and none of it says who to work with.",
    "relationsNote": "These relationships come from the five elements: an old way of describing how forces feed and restrain one another, used here only for the shape of the relationship. Everything about you in this report comes from your own sixty responses.",
    "relationsLabels": {
      "supports": "Your contribution tends to feed",
      "supportedBy": "Tends to be fed by",
      "checks": "You tend to hold in check",
      "checkedBy": "Tends to hold you in check",
      "cycleGenerating": "Feeding",
      "cycleControlling": "Checking",
      "keywords": "Reads as",
      "shadow": "When it runs long",
      "yours": "Yours"
    },
    "relationsCopy": {
      "supports": "When your contribution is working, it tends to create the conditions {role} needs. Offering it deliberately is usually more useful than waiting to be asked.",
      "supportedBy": "{role} tends to create the conditions yours needs. When your own reading feels thin, this is the contribution worth having near you.",
      "checks": "Your contribution tends to restrain {role} when that one runs long. Used well this is a useful brake; used constantly it becomes friction.",
      "checkedBy": "{role} tends to restrain yours when yours runs long. That is a check rather than an obstacle, and it is easier to accept before it is needed than during."
    },
    "radar": {
      "heading": "Contribution across the watch",
      "states": [
        {
          "id": "baseline",
          "label": "Routine",
          "phase": "baseline"
        },
        {
          "id": "pressure",
          "label": "Degraded",
          "phase": "pressure"
        },
        {
          "id": "recovery",
          "label": "Post-event",
          "phase": "recovery"
        }
      ],
      "tableCaption": "Contribution readings and change from the previous stretch",
      "stableLabel": "steady",
      "columns": {
        "role": "Contribution",
        "score": "Reading",
        "change": "Change",
        "previous": "Previous"
      },
      "note": "This records how the contributions available to you moved with the situation. It does not record a personality becoming a different one."
    },
    "pager": {
      "previous": "Previous",
      "next": "Next",
      "position": "Chapter {index} of {total}"
    },
    "actions": {
      "profilePdf": "Download observation report",
      "storyPdf": "Download the night's record",
      "returnToStory": "Return to the watch",
      "restart": "Begin a new watch"
    },
    "restartConfirm": "Begin a new watch?\n\nThis clears the watchkeeper name, every recorded observation, the story and this report. Your sound setting is kept.",
    "privacy": "Your name and your responses stay in this browser. Aurora Station has no backend and sends nothing anywhere.",
    "summaryTemplates": {
      "consistencyAnchored": "Across the watch your pattern stayed anchored in {overall}: {reading}. It was the tendency most available to you at the start and it did not give that position up, even as the conditions around it changed. That kind of consistency is not the same as rigidity. It suggests a way of working you return to by default, and which the rest of your responses arranged themselves around.",
      "consistencyMoved": "Across the watch the most available tendency changed hands. You opened anchored in {starting}, and by the hardest hours {pressure} had moved ahead of it. That does not mean one replaced the other. It suggests that what you reach for first is sensitive to what the situation is asking, and that more than one way of working was genuinely available to you.",
      "adaptationShift": "Reading the routine stretch against the worst of the night, {pressure} became more visible in your responses: {reading}. This reads as an adjustment rather than a personality change—the kind of shift that shows what you lean on when the ordinary approach stops being enough. {recoveryClause}",
      "adaptationRecede": "Reading the routine stretch against the worst of the night, {pressure} receded furthest from your responses: {reading}. This reads as an adjustment rather than a personality change—the kind of shift that shows what gives way first when the ordinary approach stops being enough. {recoveryClause}",
      "adaptationStable": "Pressure did not move you far. Through the worst of the night your responses stayed close to the pattern you began with, and they stayed close to it again once the situation became bounded. That steadiness is a finding in itself: it suggests your approach is not especially reactive to how difficult conditions become, for better and for worse.",
      "recoveryReturned": "Once the pressure eased, the pattern came back towards where it started.",
      "recoveryRetained": "Once the pressure eased, the adjustment mostly stayed.",
      "recoveryNew": "Once the pressure eased, the pattern settled somewhere new.",
      "contribution": "In a group, a pattern like this tends to {contribution}. That is a contribution rather than a role you must occupy: it describes what other people are likely to be able to rely on from you, and it says nothing about what you are unable to do. The tendencies that sat lower here are not deficits, and they can be deliberately reached for when a situation calls for them."
    },
    "reflectionPrompt": "When the next situation stops behaving predictably, which of these do you want to reach for first, and which one would you rather not lose while you do?"
  },
  "observation": {
    "label": "OBSERVATION SEQUENCE",
    "unitLabel": "OBS",
    "ofLabel": "OF",
    "idleLabel": "SEQUENCE NOT STARTED",
    "completeLabel": "SEQUENCE COMPLETE",
    "actLabel": "ACT",
    "stationLabel": "AURORA STATION",
    "watchLabel": "FINAL WATCH",
    "phaseLabels": {
      "baseline": "ROUTINE",
      "pressure": "DEGRADED",
      "recovery": "POST-EVENT"
    }
  }
};
