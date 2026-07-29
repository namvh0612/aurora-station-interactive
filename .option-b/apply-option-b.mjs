import fs from 'node:fs';
import vm from 'node:vm';

const path = 'content/Aurora_Station_Content.js';
const source = fs.readFileSync(path, 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const data = sandbox.window.AURORA_STATION_DATA;
const items = data.story.acts.flatMap((act) => act.items);

const updates = {
1:{context:"Mira's note lists three Sector C spikes. Her completed checks sit across the alarm history and a handwritten page.",statement:"I would want the completed checks and open questions organised clearly before taking over."},
2:{context:"The written procedure gives one safe return trigger. Mira's own threshold is slightly more cautious.",statement:"I would use the written boundary without asking Mira to restate her judgement."},
3:{context:"Ilan watches the storm while the old Sector C records remain open beside him. His recorder check is unfinished.",statement:"I would notice how the shutdown was affecting Ilan and invite him to speak."},
4:{context:"Sensor noise explains most of the trace. One feature still matches Ilan's older anomaly.",statement:"I would keep another plausible explanation in mind while testing the familiar one."},
5:{context:"Sector C remains unresolved. The rest of Aurora continues through its normal watch cycle.",statement:"I would return my attention to the wider watch without dwelling on Sector C."},
6:{context:"All readings remain below their limits. The traces repeat the same order and spacing.",statement:"I would focus on the defined limits rather than the pattern formed by the traces."},
7:{context:"The event has cleared. Its cleanest data is still available before the next shutdown task begins.",statement:"I would begin the cross-check while the evidence was still fresh."},
8:{context:"Mira knows the hardware, Ilan knows the archive and you hold the live readings.",statement:"I would form my own view before combining it with theirs."},
9:{context:"The inspection window is closing. Mira and Ilan are ready, but neither has started moving.",statement:"I would make my energy and urgency visible enough to start the group moving."},
10:{context:"A second spike drives the alarm red for less than a second. The tone stops.",statement:"I would return my attention to the evidence quickly after the alarm."},
11:{context:"The cabinet is hot while its local indicator remains green. A direct measurement is ready.",statement:"I would stay with the most familiar explanation until direct evidence challenged it."},
12:{context:"The likely hot point is behind the front cover. The checklist begins with several wider checks.",statement:"I would move towards the suspected point before completing the full sequence."},
13:{context:"Mira watches the generator, Ilan watches the trace and you hold the isolation switch.",statement:"I would state clearly who controlled each role and the final switch."},
14:{context:"Mira and Ilan cannot see the corridor. They can only hear your breathing and short radio calls.",statement:"I would notice when their uncertainty needed a brief reassuring update."},
15:{context:"The burnt smell grows stronger. The next isolation step is ready and no flame is visible.",statement:"I would keep most of my attention on the next confirmed step."},
16:{context:"The backup catches unevenly. Mira is still reading the values that will shape the first cut.",statement:"I would feel pressure to act before the critical readings were complete."},
17:{context:"Emergency power is stable. Several useful diagnostic checks remain, and the team has not rested.",statement:"I would continue purposeful checks before taking a break."},
18:{context:"Mira tests the generator, Ilan follows the traces and you manage the live loads.",statement:"I would coordinate the three workstreams through one shared plan."},
19:{context:"The restart attempt ends. Mira and Ilan become quiet while the generator note fills the room.",statement:"I would let the room recover without trying to lift its mood."},
20:{context:"Before each correction, the generator changes pitch and a vibration reaches the console.",statement:"I would include the changing sound and vibration in the diagnosis."},
21:{context:"The long-range route is dead. Several low-power communication paths remain technically possible.",statement:"I would explore less conventional ways to make contact before accepting the isolation."},
22:{context:"The static changes from minute to minute. A fixed call schedule sits beside the radio.",statement:"I would retry when conditions seemed favourable rather than follow the fixed schedule."},
23:{context:"Mira expects contact to return soon. Ilan speaks as though rescue is already moving.",statement:"I would state the present situation and the next priority plainly."},
24:{context:"Mira becomes still. Ilan turns to the window. The heating screen is waiting.",statement:"I would keep the update task-focused and check on them at the next pause."},
25:{context:"The radio cannot be repaired here. Heat, shelter and local monitoring can still be managed.",statement:"I would return most of my attention to what remained under local control."},
26:{context:"Mira marks the control room, Ilan marks the refuge and you hold a third workable plan.",statement:"I would bring the different views into one discussion before fixing the heat allocation."},
27:{context:"The major loads are off. Several small lights, chargers and heat leaks remain.",statement:"I would keep looking for useful small savings after the main work was complete."},
28:{context:"The final fan stops. In the quiet, a faint grouped sound enters through the floor.",statement:"I would stay with the instruments rather than turn towards the unfamiliar sound."},
29:{context:"Checks and radio calls repeat. Between them, the room becomes quiet and inward.",statement:"I would let each person manage their own social energy during the routine."},
30:{context:"Frost reaches the door seal. The refuge remains within its limits, but the sight unsettles the room.",statement:"I would regain focus after noticing the frost and continue with the agreed checks."},
31:{context:"Mira wants the safety values. Ilan wants the full shape, spacing and sound of the pulse.",statement:"I would preserve the signal's rhythm and sensory detail in the record."},
32:{context:"The pulse may return at any time. Mira asks for a duration, power limit and stop conditions.",statement:"I would agree the limits before switching the recorder on."},
33:{context:"Ilan keeps both hands on the recorder case. He has spent two years returning to these traces.",statement:"I would acknowledge what the opportunity meant to Ilan before setting the limit."},
34:{context:"Mira asks for twenty minutes. Ilan asks for forty. Neither adds new information.",statement:"I would set the operating limit myself when the discussion stopped moving."},
35:{context:"With the fans silent, the pulse seems to rise through your boots rather than the speakers.",statement:"I would experience the unknown source as personally threatening."},
36:{context:"Ilan points into the whiteout. Your first reply comes out sharper than you intended.",statement:"I would recover an even tone before continuing the verification."},
37:{context:"Ilan is cold and frightened. He keeps looking at the same point in the glass.",statement:"I would acknowledge his fear before deciding what he had seen."},
38:{context:"Reflection, ice, camera error, exhaustion and a real figure remain possible.",statement:"I would keep more than one explanation in mind while the checks ran."},
39:{context:"The first camera and door checks show no entry. Nine additional checks remain.",statement:"I would be ready to stop after the first checks showed nothing."},
40:{context:"Mira returns to fuel. Ilan folds around the recorder. The room separates into three silences.",statement:"I would create a shared rhythm that brought the group back into contact."},
41:{context:"Green and violet light moves across the ceiling while the alarm band stays red.",statement:"I would take a few seconds to absorb the aurora's colour and scale."},
42:{context:"Several instrument baselines begin to drift. The fixed observation list remains beside the screen.",statement:"I would keep the same observation order while the instruments drifted."},
43:{context:"Mira watches survival systems. Ilan watches the signal. Their tasks no longer overlap naturally.",statement:"I would let them remain separate and coordinate mainly at planned handovers."},
44:{context:"Mira and Ilan speak only to their own instruments. Neither hears the other's latest number.",statement:"I would make my engagement visible enough to reconnect the room."},
45:{context:"The pulse repeats like a call. The resemblance raises unease, though the measurements remain stable.",statement:"I would steady my attention and continue treating the pulse as measured data."},
46:{context:"The fuel estimate is falling faster than before. Some assumptions may still be wrong.",statement:"I would recheck the parts of the calculation most likely to change the decision."},
47:{context:"Mira's heat plan and Ilan's recording plan are complete. A third approach remains possible.",statement:"I would compare the two complete plans before developing another option."},
48:{context:"Mira and Ilan hold different assumptions. Both are ready to answer one direct question from the other.",statement:"I would invite them to test each other's assumptions openly."},
49:{context:"The same figures return louder each time. The switch sequence is waiting.",statement:"I would interrupt the repetition and take control of the final exchange."},
50:{context:"Mira names the danger of cold. Ilan names the loss of the signal. The pressure rises.",statement:"I would recover from the emotional pull and return to the decision criteria."},
51:{context:"Mira's page carries three names under HEAT. Ilan's carries two years of dates under RECORD.",statement:"I would keep the personal meaning separate from the measurable comparison."},
52:{context:"The three plans use different units and assumptions. A blank grid waits on the console.",statement:"I would place all three plans into the same structure before choosing."},
53:{context:"The immediate figures are close. Several consequences remain uncertain and may appear only later.",statement:"I would consider less-visible consequences before closing the decision."},
54:{context:"No plan removes every risk. The final comparison is complete and the switch window is closing.",statement:"I would steady myself enough to commit while uncertainty remained."},
55:{context:"The choice is made. Mira and Ilan understand it, but one final challenge is still possible.",statement:"I would present the direction as provisional until they had one last chance to challenge it."},
56:{context:"The smallest warm room can hold all three. The sleeping positions and watch roles still need agreement.",statement:"I would work with the others to arrange one shared refuge plan."},
57:{context:"No powered system can be changed. Radio listening and survival checks still remain.",statement:"I would stop the regular routine and conserve energy until conditions changed."},
58:{context:"Between radio checks, the chemical light barely moves. Silence hides how alert each person remains.",statement:"I would keep a quiet conversation moving through the wait."},
59:{context:"Ridge is thirty-four minutes away. Relief enters the room before the rescue team does.",statement:"I would settle back into the next routine quickly after hearing Ridge's voice."},
60:{context:"The fault log holds times, loads and alarms, but not the light or the knocks.",statement:"I would record the night's colours, sounds and unanswered details beside the technical report."}
};

for (const item of items) {
  const update = updates[item.number];
  if (!update) throw new Error(`Missing Option B update for Q${item.number}`);
  item.context = update.context;
  item.statement = update.statement;
  item.assessment.constructContract = {
    format: 'single-statement Likert 1-6',
    targetFacet: item.assessment.facet,
    keyDirection: item.assessment.key,
    contextRule: 'Neutral narrative context; no preferred response stated',
    responseRule: 'Rate how closely the statement matches the player’s likely response'
  };
}

data.contentVersion = '4.0.0-option-b-likert-balanced';
data.assessment.methodNote = 'Narrative-adapted Big Five OCEAN self-report using one behavioural statement per item and a six-point Likert self-fit scale. This adaptation requires empirical validation before normative or diagnostic claims.';
data.narrativeDelivery.principle = 'The system remains analytical underneath; the reader experiences a story on the surface, while each statement remains a neutral single-construct Likert item.';

const output = `/* Edit this data file to update the story; no rebuild is required. */\nwindow.AURORA_STATION_DATA = ${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(path, output);
