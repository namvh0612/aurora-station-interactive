import json
from pathlib import Path

CONTENT_PATH = Path("content/Aurora_Station_Content.js")
TEST_PATH = Path("tests.mjs")
PREFIX = "/* Edit this data file to update the story; no rebuild is required. */\nwindow.AURORA_STATION_DATA = "

source = CONTENT_PATH.read_text(encoding="utf-8")
assert source.startswith(PREFIX) and source.rstrip().endswith(";"), "Unexpected content wrapper"
data = json.loads(source[len(PREFIX):].rstrip()[:-1])
items = {item["id"]: item for act in data["story"]["acts"] for item in act["items"]}
assert len(items) == 60

before_signature = {
    qid: (
        item["number"],
        item["assessment"]["elementCode"],
        item["assessment"]["facet"],
        item["assessment"]["key"],
        item["assessment"]["correctedScoreFormula"],
    )
    for qid, item in items.items()
}

updates = {
    "q01": {
        "context": "Mira's gloved hand rests on the door. The Sector C entry lists the warning, but not what she checked or ruled out.",
        "statement": "I would keep Mira there until the handover showed what she had checked and what remained open.",
        "low": "You close the folder and mark the line for review. Mira leaves; the alarm history carries the missing detail.",
        "mid": "You add the last timestamps and one unresolved check. Mira answers, then leaves.",
        "high": "You ask Mira to list the checks, the causes she ruled out and the questions still open. Her rest begins a few minutes later.",
        "convergence": "The record now shows three brief spikes. Each cleared by itself, and none reached the trip limit.",
    },
    "q02": {
        "context": "The handover is complete. One boundary remains: what change should bring Mira back—the next heat spike, or heat plus an electrical shift?",
        "statement": "I would let Mira leave and rely on the written instruction to define that boundary.",
        "low": "You stop her at the door and ask. She gives you the boundary before leaving.",
        "mid": "You let her step into the corridor, then confirm the boundary over the radio.",
        "high": "You close the door and find the rule in the manual. It gives the trigger, but not Mira's reasoning.",
        "convergence": "A heat spike can be watched. A matching current change means Mira must return.",
    },
    "q06": {
        "context": "All values remain below their limits. On replay, the traces repeat the same spacing: magnetics, current, heat.",
        "statement": "I would treat the traces as separate readings and ignore their shared rhythm unless a limit was crossed.",
        "low": "You enlarge the traces and compare their spacing. A faint magnetic lead appears.",
        "mid": "You check the limits, then save a short replay that preserves the sequence.",
        "high": "You keep the response tied to individual readings. Ilan later notices the repeated rhythm.",
        "convergence": "The order is repeatable. It does not explain the fault, but it is not random noise.",
    },
    "q08": {
        "context": "Mira is back at the console. She knows the hardware; Ilan knows the old pattern; you hold the live picture.",
    },
    "q12": {
        "context": "The critical isolation checks are complete. The full checklist adds several lower-risk confirmations before the likely hot point.",
        "statement": "I would move to the suspected hot point before completing those remaining confirmations.",
        "low": "You finish the remaining confirmations, then open the cover with the full sequence complete.",
        "mid": "You complete only the checks that could still change the safety boundary, then move inward.",
        "high": "You move to the hot section while Mira tracks the deferred confirmations over the radio.",
        "convergence": "A portable meter shows leakage on the Sector C branch and a smaller pulse upstream.",
    },
    "q14": {
        "context": "Mira and Ilan cannot see the cabinet or your position. A pause on the radio leaves them with only the burnt smell and alarms.",
        "statement": "I would describe what I could see and what remained uncertain so they were not left imagining the corridor.",
        "low": "You keep the radio to measurements and commands. Their questions wait for a pause.",
        "mid": "You report what is visible at each decision point and leave the smaller uncertainties unspoken.",
        "high": "You give position, visible risk, uncertainty and next action before every change.",
        "convergence": "The branch can be isolated, but the upstream pulse keeps the main supply suspect.",
    },
    "q16": {
        "context": "The controller counts down from ninety. Mira reads voltage, frequency, load and oil pressure in the same measured voice.",
        "statement": "I would feel the countdown pushing me to act before the critical readings were complete.",
        "low": "You let the pressure pass through the room without becoming the order. Mira calls for a precise forty-percent cut.",
        "mid": "You ask only for the values that can still change the first action.",
        "high": "The falling number drives an immediate cut; you narrow it as Mira's readings arrive.",
        "convergence": "The same critical loads survive. The bus settles before the countdown reaches zero.",
    },
    "q17": {
        "context": "Emergency power is stable. Several checks could still change whether the main generator is attempted again tonight.",
        "statement": "I would keep the team moving through the checks that could still change the recovery plan before calling a pause.",
        "low": "You protect the stable state and call a short recovery break before deeper work.",
        "mid": "You complete the single check most likely to change the plan, then pause.",
        "high": "You finish the decision-relevant checks while the evidence is fresh, then release the team to rest.",
        "convergence": "The main generator cannot be restarted safely while the station is occupied.",
    },
    "q19": {
        "context": "The restart attempt ends. Mira stops speaking. Ilan stops asking questions. The room has lost any visible sense of progress.",
        "statement": "I would keep my response contained rather than mark the progress we had made.",
        "low": "You name what the team has already secured and give the next task a clear beginning.",
        "mid": "You keep the tone low but mark each completed step aloud.",
        "high": "You return to your own work without making the room's progress visible.",
        "convergence": "The room finds a working pace again, without any promise that the main generator will return.",
    },
    "q21": {
        "context": "Mira sets a small test budget for radio power and time. A low-power call, another antenna path or a field relay might still work.",
        "statement": "Within that fixed budget, I would try more than one plausible route to make contact.",
        "low": "You protect the budget for one conventional call path and stop when it fails.",
        "mid": "You test the two routes with the strongest evidence, then stop.",
        "high": "You use the fixed budget across several distinct, plausible routes and rule each one in or out.",
        "convergence": "No route reaches outside. Aurora must plan as if no answer is coming.",
    },
    "q27": {
        "context": "The major loads are off. A few small lights, chargers and heat leaks remain, each with an uncertain return.",
        "statement": "I would continue through the remaining small loads while each check still offered a plausible saving.",
        "low": "You stop after the major savings and begin the rest cycle.",
        "mid": "You test only the small changes with the clearest return.",
        "high": "You continue until the remaining checks no longer offer a credible saving. Several extra minutes appear in the estimate.",
        "convergence": "The survival setup may last until 04:10, if no new fault appears.",
    },
    "q29": {
        "context": "Checks, radio calls and small adjustments repeat. Between them, the room settles into long stretches of silence.",
        "statement": "I would let the quiet remain unbroken unless the work required speech.",
        "low": "You keep a low current of conversation moving between checks.",
        "mid": "You make brief contact at each handover and allow silence between them.",
        "high": "You leave the quiet intact and speak only when the task requires it.",
        "convergence": "The group stays functional. Ilan finds the same interval in the old anomaly file.",
    },
    "q30": {
        "context": "Frost creeps along the corridor seal. A check against the model shows refuge temperature and fuel still inside their trigger lines.",
        "statement": "After checking the frost, I would return to the routine without carrying the concern into every task.",
        "low": "The image of the frost stays with you. You reopen the calculation and begin checking assumptions again.",
        "mid": "You compare the trend with the trigger points, then take another check to settle your attention.",
        "high": "You register the concern, confirm the limits and return fully to the working rhythm.",
        "convergence": "The refuge remains in range. Beneath the floor, the pulse repeats clearly enough for the recorder.",
    },
    "q31": {
        "context": "The recorder can hold a compact safety record or fewer events in full detail. Mira wants the values; Ilan wants the complete pulse.",
        "statement": "I would give up some recording capacity to preserve the pulse's full rhythm and texture.",
        "low": "You keep the compact safety record and allow one short waveform.",
        "mid": "You preserve one complete group beside the summary.",
        "high": "You reserve enough capacity for the full shape, spacing, sound and room conditions around several groups.",
        "convergence": "The record confirms a repeatable delay from magnetic movement to sound.",
    },
    "q36": {
        "context": "Ilan's chair hits the wall. He points through the whiteout and says the same words again: someone is outside.",
        "statement": "If tension entered my voice, I would find it difficult to settle back into a factual check.",
        "low": "Your first reply sharpens, then settles. You ask for place, movement and duration.",
        "mid": "You pause long enough to turn the tension into a factual question.",
        "high": "The tension remains in your voice and keeps pulling the check back towards the fear in the room.",
        "convergence": "He identifies one point beyond the left window frame, but cannot separate movement from reflection.",
    },
    "q40": {
        "context": "Mira returns to the fuel trend. Ilan folds around the recorder. After the sighting, no one has acknowledged what just happened.",
        "statement": "I would call a brief human reset before asking the room to work together again.",
        "low": "You let the quiet hold until the next formal handover.",
        "mid": "You call a short reset for water, warmth and the next two tasks.",
        "high": "You bring everyone into a brief shared check-in, then restart the watch as one group.",
        "convergence": "A twenty-minute rotation begins. No second figure appears.",
    },
    "q41": {
        "context": "The alarms hold steady for a few seconds. Green and violet light moves across the ceiling, with a pale band none of you can name.",
    },
    "q44": {
        "context": "Ilan speaks only to the recorder. Mira speaks only to the panel. The two workstreams are drifting apart in the same room.",
        "statement": "I would use a clear, energetic summary to make the common task feel shared again.",
        "low": "You allow the separate focus to continue until the next deadline forces contact.",
        "mid": "You call one shared update, then return both people to their work.",
        "high": "You step between the stations, restate the common problem with visible energy and make each person answer the other.",
        "convergence": "The room returns to one operating picture as the fuel estimate drops again.",
    },
    "q45": {
        "context": "The pulse resembles a call: three groups, the same pause, then three again. The resemblance is immediate; intention is not measurable.",
        "statement": "I would notice the sense of presence without letting it displace the measured task.",
        "low": "The resemblance takes over the room. You check the walls and window before returning to the trace.",
        "mid": "You name the feeling, then bring your attention back to timing and amplitude.",
        "high": "You hold the unease beside the data and continue the measured check without narrowing your attention.",
        "convergence": "The pattern remains repeatable. Its source and meaning remain unknown.",
    },
    "q46": {
        "context": "The estimate is falling faster than before. Several assumptions are old, but only a few could still change the choice.",
        "statement": "I would keep working through the calculation until the decision-changing values were checked.",
        "low": "You accept the latest estimate and move directly to the choice.",
        "mid": "You verify the single assumption most likely to move the result.",
        "high": "You check every assumption that could still change the choice and leave the rest untouched.",
        "convergence": "The revised result changes little: one major load, about fifteen minutes.",
    },
    "q48": {
        "context": "Mira and Ilan hold accurate numbers and different blind spots. They keep directing their objections through you.",
        "statement": "I would bring them into a direct exchange so each could test the other's assumptions.",
    },
    "q50": {
        "context": "Mira says people may stop responding in the cold. Ilan says the signal may never return. The pressure in both voices is rising.",
        "statement": "Under that pressure, I would struggle to return to the written criteria.",
        "low": "You let the urgency register, then return to the criteria without carrying either voice into the comparison.",
        "mid": "The urgency pulls at you, but a deliberate pause returns your attention to the written limits.",
        "high": "The pressure keeps displacing the criteria, and the nearer loss begins to dominate the choice.",
        "convergence": "The plans remain unchanged. Only the emotional weight in the room has moved.",
    },
    "q51": {
        "context": "Mira's page carries three names under HEAT. Ilan's carries two years of dates under RECORD. Both still have to live with the outcome.",
        "statement": "I would keep the personal stakes outside the decision, even when they changed how each person could carry the outcome.",
        "low": "You name what each plan means to the person defending it before returning to the figures.",
        "mid": "You acknowledge the stakes briefly and keep them beside, not inside, the calculation.",
        "high": "You remove the personal history from the comparison and work only from measured outcomes.",
        "convergence": "Both people understand what the choice can and cannot account for.",
    },
    "q53": {
        "context": "The comparison grid shows a near tie. Two blank rows remain for consequences the current numbers do not capture.",
        "statement": "I would explore whether an unmeasured consequence could reverse the apparent advantage.",
        "low": "You keep the decision to outcomes that can be measured now.",
        "mid": "You name one uncertain consequence but give it less weight than the current figures.",
        "high": "You test several plausible hidden consequences and ask whether any could reverse the ranking.",
        "convergence": "No hidden consequence can be quantified, but none can be dismissed.",
    },
    "q54": {
        "context": "The final check is complete. No plan removes uncertainty, and the switch window is closing.",
        "statement": "I would keep my attention usable long enough to choose, even with uncertainty still present.",
        "low": "The remaining uncertainty keeps the choice open while you look for one more disqualifying fact.",
        "mid": "You state what remains unknown, steady the room and choose.",
        "high": "You hold the uncertainty without letting it become the decision, then call the plan.",
        "convergence": "A decision is reached. Mira confirms the switch sequence, but execution has not yet begun.",
    },
    "q55": {
        "context": "The plan has been chosen but not started. Mira's hand is on the switch; Ilan waits for the final instruction.",
        "statement": "I would keep the direction provisional until they had one last chance to challenge it.",
        "low": "You state the final direction and move directly to execution.",
        "mid": "You state the decision, allow one question about execution and close the discussion.",
        "high": "You present the direction as provisional and invite one final challenge before the switch moves.",
        "convergence": "The switching sequence begins under the chosen allocation.",
    },
    "q56": {
        "context": "All three must remain inside the heated refuge. The open question is how to arrange rest, watch and the cramped shared space.",
        "statement": "I would organise the refuge through one shared plan for rest, watch and warmth.",
        "low": "You keep everyone warm but let each person manage a separate routine and resting position.",
        "mid": "You share one warm zone and coordinate only at fixed checks.",
        "high": "You build one rotation that coordinates rest, radio watch, symptom checks and the limited space.",
        "convergence": "No one remains in an unheated part of the station, and every watch interval has an owner.",
    },
}

for qid, changes in updates.items():
    item = items[qid]
    for key in ("title", "context", "statement", "convergence"):
        if key in changes:
            item[key] = changes[key]
    for band in ("low", "mid", "high"):
        if band in changes:
            item["responseBranches"][band]["transition"] = changes[band]

data["contentVersion"] = "3.1.0-editorial-integrity"
data["narrativeDelivery"]["revision"] = "Senior editorial integrity pass: continuity, construct clarity, response neutrality and restrained hard-SF delivery."

after_signature = {
    qid: (
        item["number"],
        item["assessment"]["elementCode"],
        item["assessment"]["facet"],
        item["assessment"]["key"],
        item["assessment"]["correctedScoreFormula"],
    )
    for qid, item in items.items()
}
assert before_signature == after_signature, "Assessment mapping changed during editorial pass"
assert [items[f"q{i:02d}"]["number"] for i in range(1, 61)] == list(range(1, 61))

rendered = PREFIX + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
CONTENT_PATH.write_text(rendered, encoding="utf-8")

tests = TEST_PATH.read_text(encoding="utf-8")
tests = tests.replace(
    'assert.equal(data.contentVersion, "3.0.0-story-first-narrative");',
    'assert.equal(data.contentVersion, "3.1.0-editorial-integrity");',
)
marker = 'assert.match(data.narrativeDelivery.principle, /story on the surface/i);\n'
extra = '''assert.match(data.narrativeDelivery.revision, /continuity, construct clarity, response neutrality/i);\n\nconst editorialItems = Object.fromEntries(\n  data.story.acts.flatMap((act) => act.items).map((item) => [item.id, item]),\n);\nassert.doesNotMatch(editorialItems.q01.responseBranches.high.transition, /trigger for calling her back/i);\nassert.match(editorialItems.q02.context, /what change should bring Mira back/i);\nassert.match(editorialItems.q14.statement, /what remained uncertain/i);\nassert.match(editorialItems.q30.statement, /return to the routine/i);\nassert.match(editorialItems.q36.statement, /settle back into a factual check/i);\nassert.match(editorialItems.q53.context, /blank rows remain/i);\nassert.match(editorialItems.q54.convergence, /execution has not yet begun/i);\nassert.match(editorialItems.q55.convergence, /switching sequence begins/i);\nassert.match(editorialItems.q56.context, /All three must remain inside the heated refuge/i);\n'''
assert marker in tests
tests = tests.replace(marker, marker + extra)
TEST_PATH.write_text(tests, encoding="utf-8")

print(f"Updated {len(updates)} questions without changing assessment mappings.")
