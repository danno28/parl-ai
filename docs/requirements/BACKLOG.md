# Backlog: open change requests

Requests recorded for the next working session. When one is done, move it into the spec (new version + changelog entry, see [CHANGELOG.md](CHANGELOG.md)) and delete it here.

State when recorded (2026-11-19): `main` has PRs #1 and #2. PR #3 (`feature/suggestions-grammar`: AI suggestions, grammar stage, lesson removal, more vocabulary, hands-free mic) is open with Auto-fix on. Start new work from `main` after #3 is merged.

---

## 1. Stricter pronunciation scoring

**Request:** The reading score (Stage 2) only varies between about 90 and 100, even when pronunciation is questionable. It should spread more and take points off for smaller errors.

**Where the score comes from today**
- Azure returns `PronScore`, `AccuracyScore`, `FluencyScore`, `CompletenessScore` and per-word scores (`src/lib/speech/azure.ts`, requested with `Granularity: "Word"`).
- `feedbackFromScores` uses Azure's `overall` directly; `evaluateReading` lets Claude set `score` freely (`src/lib/lessons/feedback.ts`, prompt in `src/prompts/v1/evaluate.ts`). Claude tends to be generous.

**Ideas to decide on**
- Compute the score in code instead of letting the LLM choose it. Claude then only writes the tips.
- Base it mainly on word and phoneme accuracy: request `Granularity: "Phoneme"`, deduct points per word below ~90 accuracy, weight the worst words more, and apply a curve so 80–90 raw maps lower.
- Make the labels stricter (e.g. "excellent" only ≥ 95 after the curve).
- Calibrate with a few real recordings: one careful, one sloppy, one with a clear error.

**Done when:** a sloppy read clearly scores lower (e.g. 60s–70s), one mispronounced word visibly costs points, and a careful read still scores high. Update R-4 in the spec.

## 2. Spoken pronunciation help in French, slowly

**Request:** Instead of only showing a written tip, the app should speak to the learner, in French and slowly, to show how to pronounce it better.

**Ideas to decide on**
- After a reading attempt, add a "Anhören" button (or play automatically) that speaks the problem word(s) slowly. The TTS rate is already supported (`speak()` with `rate`, `buildSsml` prosody).
- Option: syllable by syllable, then the whole word, then the full sentence at normal speed.
- Have Claude return a short French model phrase to speak (new schema field, e.g. `spokenModelTarget`). That could be the word, a minimal pair (*deux / douze*), or a short French instruction.
- **Open question:** should the spoken explanation itself be in French, or only the model words? At A1–A2 a spoken French explanation may be hard to follow. A reasonable default: German text on screen, French model words spoken slowly.
- Use Azure SSML (`<prosody rate>`, possibly `<break>` between syllables). Cache it like other TTS.

**Done when:** after a weak word, one tap, or auto-play, plays the word(s) slowly in French, then the sentence. Add a requirement next to R-4 in the spec.

## 3. More grammar practice per lesson, especially passé composé

**Request:** A way to practise each lesson's grammar in more depth, especially the passé composé.

**Ideas to decide on**
- A "Mehr üben" button at the end of the grammar stage that generates a new set of exercises on the same topic (new AI call, appended to `lessons.grammar_content` or stored separately).
- A standalone practice area outside lessons: pick a grammar topic and drill it with more exercise types (conjugation tables, sentence building, spoken answers).
- For the passé composé specifically: choosing *avoir* vs. *être*, past participles (regular and irregular), agreement with *être*, negation (*je n'ai pas …*), and reflexive verbs.
- Show progress per topic (exercise accuracy over time). This also covers the open dashboard part of G-8 / P-3.

**Done when:** from any lesson's grammar stage, and from a topic list, the learner can keep practising with fresh exercises, and accuracy per topic is shown. Add requirements in §5.0.

## 4. Grammar difficulty per CEFR level

**Request:** Grammar should match the level more closely. Example given: A2 should not yet include the passé composé. Use the CEFR as the guide.

**Important for the decision:** the CEFR itself describes what learners can *do* and contains no grammar lists. Level-by-level grammar inventories come from derived works: the "Référentiels" for French by Beacco et al., DELF syllabi and textbooks. Most of these place the **passé composé (with avoir and être) at A2**, and some introduce it at the end of A1. So removing it from A2 goes against the usual reference. Options to settle with the user:
- **a)** Keep the passé composé at A2 but split it: *avoir* forms in A2, *être* and agreement later, and teach it only after present-tense basics.
- **b)** Move it to B1 as requested, accepting the difference from the common references.
- **c)** Add an "early A2 / late A2" ordering, so the default topic for a new A2 learner starts with present tense, futur proche and partitive articles, and the passé composé appears only after those have been covered.

**Where:** `src/config/grammar/fr.ts` (reference list per level), `proposeGrammarFocus` in `src/lib/data/lessons.ts` (picks the next unused topic in list order), `CEFR_DESCRIPTORS` in `src/config/cefr.ts` (the level description sent with every prompt, which also allows the passé composé at A2).

**Also:** translate the reference topic names into German for display (they are shown in English on the home page and lesson overview today).

**Done when:** the A1/A2 lists and descriptors follow the chosen option, new A2 lessons only propose level-appropriate topics, and the reasoning is noted in G-6 in the spec.
