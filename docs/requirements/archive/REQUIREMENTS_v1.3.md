# French Learning App: Requirements v1.3

Status: **Approved, 2026-11-19.** All open decisions were resolved with the recommended defaults (see §13).
Version history: [CHANGELOG.md](CHANGELOG.md). Earlier versions are kept unchanged in [archive/](archive/).

---

## 1. Vision and scope

A browser-based, AI-driven app that teaches French through concrete real-life scenarios ("at the bakery", "at the dentist", "on vacation"). For each scenario, the learner goes through a fixed sequence: learn the vocabulary, read a dialogue aloud, then reproduce it from memory. The learner can optionally start with a short grammar lesson and finish with free conversation.

**v1 language pair:** French (target) from German (native). The language pair is a parameter everywhere in the code and data model, never hard-coded (see §9).

### In scope for v1
- User profiles with saved progress
- Scenario selection: AI-suggested, user-typed, or generated from an uploaded vocabulary list
- Stage 0: optional, skippable grammar lesson before the scenario (see §5.0)
- Stage 1: vocabulary list with Quizlet-compatible download
- Stage 2: guided reading dialogue with pronunciation feedback
- Stage 3: speaking dialogue from memory, with hints
- Stage 4: free conversation (optional, see §5.4)
- A pluggable AI provider layer (Claude as the default)

### Out of scope for v1 (but designed for, see §9)
- Choosing other target or native languages
- In-app flashcards and quizzes (Quizlet replacement)
- Rewards, points and gamification
- Native mobile apps (the web app should still work in mobile browsers)

---

## 2. Users and profiles

| ID | Requirement |
|---|---|
| U-1 | A user can register and log in by **email magic link** (no passwords to store). |
| U-2 | The profile stores the display name, native language (`de`), target language (`fr`), current CEFR level, and preferred feedback language. |
| U-3 | The user sets their level manually from **A1, A2, B1, B2, C1, C2**. They can change it at any time, and can also override it for a single scenario. |
| U-4 | The user chooses the **feedback language**: German (default) or French. At A1–A2, German is strongly recommended. |
| U-5 | The user can delete their account and all of their data (GDPR). |
| U-6 | The app is **personal / invite-only**: only invited email addresses can register. There is no public sign-up. This keeps API costs, abuse protection and legal overhead small. |
| U-7 | The interface language for v1 is **German**. |
| U-8 | Profile setting **Grammar lessons**: "Offer before each scenario" (default) or "Always skip". Either way, a single lesson's grammar lesson can still be opened or skipped. |
| U-9 | Profile setting **Default lesson length**: 5, 10 (default) or 15 minutes (see §3.1). |

---

## 3. Learning flow overview

```
Choose scenario ──► Stage 0: Grammar (optional) ──► Stage 1: Vocabulary ──► Stage 2: Reading dialogue ──► Stage 3: Speaking dialogue ──► Stage 4: Free conversation (optional)
```

- One **Lesson** = one scenario at one level, with one **grammar focus**. It contains a vocabulary list and one dialogue, both generated once and then **stored**. Stages 2 and 3 use exactly the same content as Stage 1. The dialogue deliberately uses the grammar focus, whether or not the grammar lesson was taken.
- Stages are completed in order. The user can **skip ahead** at any time; the app only recommends the order.
- The user can **regenerate** a lesson (new dialogue, same scenario) or **repeat** an existing one.
- A lesson can be paused at any point and resumed later at the same dialogue line (see §7).

### 3.1 Lesson length

| ID | Requirement |
|---|---|
| L-1 | The user chooses how long a lesson should take: **5, 10 or 15 minutes**. The profile default (U-9) is preselected, and it can be changed for a single lesson before it is generated (S-4b). |
| L-2 | The length is the estimated time for **Stages 0–3**, with the grammar lesson included. Skipping grammar makes the lesson correspondingly shorter. Stage 4 is open-ended and has its own limit (F-4). |
| L-3 | The length controls **how much** content is generated; the CEFR level controls **how difficult** it is. Target amounts: |

| | 5 min | 10 min | 15 min |
|---|---|---|---|
| Grammar (Stage 0, if taken) | 1 rule, 2 exercises | 1 rule, 3–4 exercises | 1 rule, 5–6 exercises |
| Vocabulary (Stage 1) | 6–8 items | 10–14 items | 15–20 items |
| Dialogue turns (Stages 2 and 3) | 4–6 (2–3 user lines) | 8–10 (4–5 user lines) | 12–16 (6–8 user lines) |
| Free conversation (Stage 4) | about 3 exchanges | about 6 exchanges | about 10 exchanges |

| ID | Requirement |
|---|---|
| L-4 | Within these ranges, the AI adjusts for level. At higher levels, sentences are longer, so the AI chooses fewer, richer turns in the same time. |
| L-5 | The time is a guide, not a hard limit. The app never cuts the user off; it shows the estimated time remaining in the lesson. |
| L-6 | The actual time spent per lesson and stage is recorded (P-6). It is used to calibrate the target amounts so the 5/10/15-minute estimates become accurate over time. |
| L-7 | A lesson's length is fixed once it is generated. Choosing "Repeat" or "Regenerate" (§3) offers the length choice again. |

---

## 4. Scenario selection

| ID | Requirement |
|---|---|
| S-1 | **Suggested scenarios:** the app suggests 6–8 scenarios that fit the user's level. They are grouped by everyday category (shopping, health, travel, work, social, admin) and exclude scenarios the user has already completed. A "Show me others" button generates a new set. |
| S-2 | **Custom scenario:** the user types a free-text scenario. The AI normalizes it into a title and a short description, and asks for clarification only if it is unusable. |
| S-3 | **From a vocabulary list:** the user uploads or pastes a list in Quizlet export format (see §5.1.3). The AI proposes 1–3 scenarios that use as many of the words as possible, and shows which words each scenario covers. Words that fit no scenario are listed separately. The user picks one scenario. |
| S-4 | Before generating, the user can choose **their role** in the dialogue (e.g. customer or baker), plus **register** (formal *vous* / informal *tu*). By default, the AI picks what is natural for the scenario. |
| S-4a | Before generating, the app also shows the proposed **grammar focus** for the lesson and lets the user change it (see G-2). |
| S-4b | Before generating, the user can also change the **lesson length**: 5, 10 or 15 minutes (see §3.1). |
| S-5 | Generated content is checked against the user's level: sentence length, tenses and vocabulary must fit the CEFR level (see §6.3). |

---

## 5. Stages

### 5.0 Stage 0: Grammar lesson (optional)

| ID | Requirement |
|---|---|
| G-1 | Before Stage 1, the app offers a short grammar lesson, sized to the lesson length (L-3). It is **optional**: a "Skip grammar" button goes straight to Stage 1, and the user can return to the grammar lesson later from the lesson overview. Skipping has no effect on scores. |
| G-2 | **Choosing the grammar focus.** By default, the AI picks one topic from the **typical grammar for the user's CEFR level** (see G-6) that fits the scenario. Example: A1 bakery → *je voudrais* + partitive articles (*du, de la, des*). The user can override it: either choose another topic from the level list, choose from other levels' lists, or type a topic (e.g. "passé composé with *être*"). A topic above the user's level shows a warning but is allowed. |
| G-3 | **The override applies only to the current lesson.** The next lesson goes back to the default: a level-typical topic. The app prefers topics the user has not yet covered, and repeats topics where the user's exercise scores were weak. |
| G-4 | **Content of a grammar lesson:** |
|  | • a short explanation in the feedback language (German by default) |
|  | • forms in a compact table where useful (e.g. conjugations, articles) |
|  | • 3–5 example sentences taken from or matching the scenario, with translations and audio (TTS) |
|  | • typical mistakes, especially for German speakers (e.g. *ich habe Hunger* → *j'ai faim*, not *je suis faim*) |
|  | • 3–6 short practice exercises (fill in the blank, transform the sentence, translate), typed or spoken, with AI feedback on each answer |
| G-5 | **Link to the scenario:** the dialogue uses the grammar focus in at least 2–3 of the user's lines. In Stage 3, the feedback specifically comments on whether the grammar focus was used correctly. |
| G-6 | **Reference grammar list per level:** for each target language, a stored list of the grammar topics typical for each CEFR level (A1–C2). It is data, not code, and is passed to the AI as guidance. The AI still writes all lesson content and judges all answers (A-1). |
| G-7 | The grammar lesson content is generated **only when the user opens it**, so a skipped lesson costs nothing. Once generated, it is stored with the lesson. |
| G-8 | Grammar topics covered and exercise results are saved (see §7) and shown on the dashboard. |

### 5.1 Stage 1: Vocabulary

| ID | Requirement |
|---|---|
| V-1 | The app shows the scenario's vocabulary list. The number of items depends on the lesson length (L-3): **6–8 items for 5 minutes, 10–14 for 10, and 15–20 for 15.** |
| V-2 | Each item has: French term, German translation, part of speech, and an example sentence (in French, from the dialogue). Optional fields: a short note (irregular plural, false friend, etc.) and an audio button (TTS). |
| V-3 | **French nouns always include the article** ("la baguette", "le pain", "l'addition (f)"). Where the article does not show the gender (l', les), the gender is added. |
| V-4 | Vocabulary may include short phrases and chunks ("je voudrais…", "ça fait combien ?"), not just single words. At A1–A2, chunks are preferred. |
| V-5 | **Every vocabulary item appears in the Stage 2 dialogue**, and the dialogue uses no important words that are missing from the list. |
| V-6 | **Download** buttons: |
|  | • **Quizlet (TSV):** 2 columns, `French<TAB>German`, no header row, UTF-8. This can be pasted straight into Quizlet's import. |
|  | • **CSV:** French, German, example sentence (for Excel/Anki). |
|  | • **Copy to clipboard** in Quizlet format (the quickest way to paste into Quizlet). |
| V-7 | The user marks Stage 1 as done ("I've learned these"). v1 does not test the vocabulary in-app. |

#### 5.1.3 Import format (for S-3)
- Accept pasted text or a `.txt`/`.tsv`/`.csv` file.
- Separators: tab (Quizlet default), comma, or semicolon, detected automatically. One pair per line.
- Column order: French then German by default, with a "swap columns" toggle.
- Show a preview of the parsed list before generating. Maximum 100 items.

### 5.2 Stage 2: Reading dialogue (guided)

| ID | Requirement |
|---|---|
| R-1 | The dialogue has **4–16 turns**, depending on the lesson length (L-3) and level (L-4). The app plays the counterpart; the user plays their chosen role. |
| R-2 | **App turn:** the line is shown in French and played aloud (TTS). The user can replay it, play it **slowly**, and reveal the German translation. |
| R-3 | **User turn:** the target French sentence is shown (German translation can be revealed). The user presses *Record*, speaks, and presses *Stop* (or recording stops automatically on silence). |
| R-4 | **Feedback** after each user turn: |
|  | • an overall score (0–100) and a label (e.g. "Excellent / Good / Try again") |
|  | • the words that were recognized incorrectly or missed, highlighted in the sentence |
|  | • 1–2 concrete, actionable tips (e.g. "the *-ent* in *ils parlent* is silent"), in the feedback language |
|  | • the option to play the model pronunciation and to **retry** |
| R-5 | The user can retry any line as often as they like, or move on regardless of the score. The best and the latest attempt are saved. |
| R-6 | At the end, a **summary** shows the score per line, the average, and the 3 most common issues. |
| R-7 | A text-input fallback is available if the microphone is unavailable. In that case, only spelling is checked. |

> **Technical note: how pronunciation feedback works.** Claude cannot listen to audio directly. Pronunciation feedback is built from two parts:
> 1. a **speech service** that turns the recording into text and, ideally, gives per-word and per-sound pronunciation scores
> 2. **the LLM**, which compares that result with the target sentence and writes the human-readable feedback and tips
>
> **Decided:** the v1 speech service is **Azure Speech "Pronunciation Assessment"**. It scores accuracy, fluency and completeness per word and per sound in French, which gives real pronunciation feedback rather than only "did the transcript match". It costs roughly cents per minute. A cheaper fallback is speech-to-text only (e.g. the browser's built-in recognition, or Whisper). That can detect wrong or missing words, but not *how* well something was pronounced. Either way, this sits behind a `SpeechProvider` interface (see §8).

### 5.3 Stage 3: Speaking dialogue (from memory)

| ID | Requirement |
|---|---|
| D-1 | Same dialogue and same flow as Stage 2, but the user's line is **not shown**. Instead, the app shows a short **situational cue** in German, e.g. *"Bestelle zwei Croissants."* ("Order two croissants.") |
| D-2 | The user answers freely. The answer does **not** need to match the original wording. It is judged on: (a) is the meaning appropriate to the situation, (b) grammar, (c) use of the target vocabulary, (d) pronunciation (if the speech service supports it). |
| D-3 | **Hints, revealed in steps** (each step is one click): |
|  | 1. key words (2–3 French words from the target line) |
|  | 2. the first few words of the sentence |
|  | 3. the full original sentence |
| D-4 | Hint usage is recorded for each turn. It lowers the turn score and prepares for future rewards. |
| D-5 | Feedback shows what the user said (transcript), corrections (with the corrected sentence), and the original line for comparison. |
| D-6 | **The dialogue stays consistent:** if the user's answer is acceptable but differs from the script (e.g. orders 3 croissants instead of 2), the app's next line **adapts** naturally to it. This means each app turn in Stage 3 is generated live by the AI, using the scripted line as guidance. |
| D-7 | Summary at the end, as in R-6, plus the number of hints used. |

### 5.4 Stage 4: Free conversation (optional)

| ID | Requirement |
|---|---|
| F-1 | An open-ended, spoken role-play within the same scenario. The AI keeps its role, reacts naturally, and may introduce small complications (e.g. "we're out of baguettes"). |
| F-2 | The AI adapts its language to the user's level. |
| F-3 | Corrections are **not** made during the conversation, so the flow isn't interrupted. A summary at the end lists errors, corrections, and new useful phrases. The user can add those phrases to their vocabulary list. |
| F-4 | The user can end at any time. The AI steers toward a natural ending after about 3, 6 or 10 exchanges, depending on the lesson length (L-3). The user can carry on past that point. |
| F-5 | Stage 4 is available at every level, labeled as "recommended from B1". |

---

## 6. AI requirements

| ID | Requirement |
|---|---|
| A-1 | All teaching content and judgments are produced by the LLM, not by rules: scenarios, grammar lessons and exercises, vocabulary, dialogues, cues, hints, answer evaluation, feedback text and conversation. Deterministic code is limited to plumbing: parsing, storage, score aggregation, and checking that AI output has the right structure. |
| A-2 | Generated lessons are returned as **structured JSON** that follows a defined schema (vocabulary items, dialogue turns with speaker/role, French text, German translation, cue, hints). The output is checked against the schema and automatically retried once if invalid. |
| A-3 | **CEFR control:** every prompt includes the level and a short description of what that level means (allowed tenses, sentence length, vocabulary range). |
| A-4 | French content must be correct standard French (France), with correct accents, typographic spacing before `? ! : ;`, and natural, idiomatic phrasing. |
| A-5 | Content is generated **once per lesson and cached** (the grammar lesson on first opening, see G-7). Only the evaluation steps (feedback, adaptive dialogue lines, free conversation) call the AI live. |
| A-6 | **Latency targets:** lesson generation under 20 s (with a progress indicator; results stream in where possible); feedback per turn under 4 s; next conversational reply under 3 s. |
| A-7 | All prompts live in **versioned prompt templates**, separate from the code, with placeholders for target language, native language, level and scenario. They contain no hard-coded "French" or "German". |
| A-8 | Cost guardrails: a per-user daily limit on AI calls, and AI usage logged per user and lesson. |

---

## 7. Progress and persistence

| ID | Requirement |
|---|---|
| P-1 | Progress is saved **automatically after every meaningful event**: stage completed, each recorded turn with its score, hint usage, and lesson finished. There is no "save" button. |
| P-2 | An unfinished lesson can be resumed on any device at the exact turn where the user left off. |
| P-3 | A **dashboard** shows: lessons in progress, completed lessons (with average scores per stage), the total number of vocabulary items learned, grammar topics covered (with their exercise scores), and recently missed words or sounds. |
| P-4 | Lesson history: the user can reopen any past lesson, re-download its vocabulary, and repeat any stage. |
| P-5 | **Audio recordings are never stored**, only transcripts and scores. |
| P-6 | Every scored event is stored as a raw, timestamped **learning event**, so points and rewards can later be calculated from history after the fact (see §9). |

---

## 8. Architecture requirements

| ID | Requirement |
|---|---|
| T-1 | **Browser-only for the user:** a web application with nothing to install. Supports current Chrome, Edge and Safari, on desktop and mobile. Firefox is supported as far as the chosen speech service allows. |
| T-2 | Served over HTTPS; the browser only allows microphone access over HTTPS. |
| T-3 | **API keys are never sent to the browser.** All AI and speech calls go through the app's own backend. |
| T-4 | **Provider abstraction:** three interfaces, each with one implementation in v1. Which provider and model to use is set in configuration, not code. |
|  | • `LLMProvider`: v1 implementation **Claude** (Anthropic API). Needs text generation, structured/JSON output, and streaming. Others (OpenAI, Gemini, Mistral…) can be added later as further implementations. |
|  | • `SpeechProvider` (speech-to-text + pronunciation assessment): v1 per §5.2 |
|  | • `TTSProvider` (text-to-speech): v1 implementation **Azure neural TTS** (same vendor as speech assessment), with natural French voices. Generated audio is cached per sentence. |
| T-5 | Different tasks can use different models, set in configuration. For example, a faster model for per-turn feedback and the most capable model for lesson generation. |
| T-6 | **Tech stack:** TypeScript end to end, **Next.js** (frontend and API routes), **PostgreSQL**. The exact hosting provider and auth library are chosen at project setup. |

### 8.1 Styling and visual design

Visual reference (approved 2026-11-19): [docs/design/design-preview.html](../design/design-preview.html). Any change to the visual direction is made in that file first and logged in the changelog.

| ID | Requirement |
|---|---|
| DS-1 | **Styling stack:** Tailwind CSS v4 and shadcn/ui. shadcn/ui components are copied into the repo (built on Radix primitives), so we own and can restyle them. |
| DS-2 | **One token file:** all colors, fonts, font weights, corner radius and spacing are defined as CSS variables in a single theme file (`app/globals.css`). Components refer only to roles (e.g. `bg-background`, `text-muted`, `font-serif`), never to raw color values or font names. **A complete redesign must be possible by editing only the token file.** |
| DS-3 | **Visual direction:** minimal and immersive, built around the conversation. Lots of white space, large type, thin separator lines. No decorative boxes, card shadows or ornaments. Each screen focuses on one thing. |
| DS-4 | **Colors:** white background, black text, and greys for secondary text. There is a single accent (red), used only for a recording microphone and for marking errors. |
| DS-5 | **Light by default:** the app opens in black on white, even when the device is set to dark mode. Dark mode is opt-in (profile setting and a toggle). It uses a dark grey background (not black), off-white text, and a heavier serif weight for readability. |
| DS-6 | **Typography:** Bodoni Moda (serif) for everything the user reads, especially all French text. Inter (sans-serif) only for small labels and short German helper text. French text in conversation screens is at least 22 px. |
| DS-7 | **The speaker:** in Stages 2–4, the conversation partner is shown as an animated cloud of graphite particles. It moves while the partner speaks (in sync with TTS playback), settles while the user is recording, and replays the line when tapped. It is drawn on a canvas, pauses when off-screen, and is static when the device asks for reduced motion. |
| DS-8 | **Conversation screen layout:** from top to bottom: a thin progress line, the speaker, the partner's line in large type, quiet text links (replay, slow, translate), the user's line or cue, and one round microphone button. Feedback appears below without leaving the screen. |
| DS-9 | **Accessibility:** text meets WCAG AA contrast in both modes; every control is usable by keyboard and has a visible focus state; all animation respects reduced-motion settings. |

---

## 9. Designed now for later versions

Each of these needs v1 to make the listed design choices, even though the feature itself is not built yet:

| Later feature | What v1 must already do |
|---|---|
| **Choose the language to learn** | `target_language` (ISO code) is stored on the profile, lesson, vocabulary item, grammar topic and every event. Prompts take the language as a parameter. Pronunciation and TTS voices are chosen per language. The reference grammar list (G-6) exists per language. |
| **Choose the native language** | `native_language` works the same way. All UI text is in translation files (i18n) from day one, even if only German or English exists. Download column headers and column order follow the language pair. |
| **Quizlet-style flashcards and quizzes** | Vocabulary items are stored as separate records (not only inside the lesson's JSON), with an ID per user and item. The data model has room for spaced-repetition fields (e.g. `ease`, `interval`, `due_at`, `review_count`), even if unused. |
| **Rewards and points** | A raw learning-events log (P-6), with scores, hint usage, retries, time taken and streak-relevant timestamps. Points rules can then be added and applied retroactively. |

---

## 10. Core data model (sketch)

- **User**: id, email, display_name, native_language, target_language, cefr_level, feedback_language, grammar_preference (`offer` | `skip`), default_lesson_minutes (5 | 10 | 15), created_at
- **Scenario**: id, title, description, category, source (`suggested` | `custom` | `vocab_import`), target_language, native_language
- **GrammarTopic**: id, target_language, cefr_level, title, description, source (`reference` | `custom`)
- **Lesson**: id, user_id, scenario_id, cefr_level, length_minutes (5 | 10 | 15), user_role, register, grammar_topic_id, grammar_overridden (bool), grammar_content_json (null until opened), grammar_status (`not_started` | `skipped` | `done`), content_json, prompt_version, model_id, status, current_stage, current_turn
- **VocabularyItem**: id, lesson_id, term_target, term_native, part_of_speech, gender, example, note (+ reserved SRS fields)
- **DialogueTurn**: id, lesson_id, index, speaker (`app` | `user`), text_target, text_native, cue_native, hints[]
- **Attempt**: id, user_id, lesson_id, turn_id (or exercise_id for grammar), stage (`grammar` | `reading` | `speaking` | `conversation`), transcript, scores (overall/accuracy/fluency/…), hints_used, feedback_json, created_at
- **LearningEvent**: id, user_id, type, payload_json, created_at

---

## 11. Non-functional requirements

- **Privacy/GDPR:** minimal personal data; the data-processing implications of sending audio and text to AI and speech providers are documented; account and data deletion are available (U-5).
- **Accessibility:** works with the keyboard alone, readable contrast, and every audio item also has text.
- **Reliability:** if the AI or speech service is unavailable, show a clear error with a "retry" option. Progress made so far is never lost.
- **Observability:** AI calls are logged (model, prompt version, latency, token cost) without storing audio.

---

## 12. Acceptance criteria for v1 (summary)

1. I can register, set A2, pick a suggested scenario, and get a vocabulary list. Nouns include articles, and the list downloads as TSV and imports into Quizlet without editing.
2. I can paste a Quizlet list and get scenario proposals that use those words.
3. In Stage 2, the app reads its lines aloud. I can record mine and get word-level feedback with tips within ~4 s. I can retry.
4. In Stage 3, I see only a German cue, can use 3 levels of hints, and a correct-but-different answer is accepted.
5. I can close the browser mid-dialogue and resume on another device at the same line.
6. Switching the LLM to another provider requires only a new provider implementation and a configuration change. No prompt or UI code changes.
7. Before a scenario, I'm offered a grammar lesson on a topic typical for my level and relevant to the scenario. I can skip it with one click, or change the topic. The next lesson goes back to a level-typical topic. The dialogue uses the grammar focus, and Stage 3 feedback comments on it.
8. The app matches the approved visual reference (§8.1). Changing values in the token file (e.g. accent color or font) changes every screen, with no edits to components.
9. I can choose 5, 10 or 15 minutes for a lesson. A 5-minute A2 lesson has about 6–8 words and 2–3 lines for me to speak; a 15-minute one has about 15–20 words and 6–8 lines.

---

## 13. Decisions log (resolved 2026-11-19)

| # | Decision | Outcome |
|---|---|---|
| 1 | Personal/invite-only vs public sign-up (U-6) | Personal / invite-only |
| 2 | Speech service for pronunciation (§5.2) | Azure Pronunciation Assessment |
| 3 | TTS voice quality (T-4) | Cloud TTS, cached |
| 4 | Stage 3 dialogue adapts to the user's answer (D-6) | Yes |
| 5 | Stage 4 availability (F-5) | Everyone, "recommended from B1" |
| 6 | Optionally store audio recordings (P-5) | No |
| 7 | UI language for v1 | German |
| 8 | Tech stack and hosting (T-6) | TypeScript / Next.js / Postgres |
