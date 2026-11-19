# Requirements: Version Log

## How versioning works

- The **current** spec is always [REQUIREMENTS.md](REQUIREMENTS.md).
- Before a new version is made, the current file is copied unchanged to `archive/REQUIREMENTS_v<version>.md`. Archived files are never edited.
- Version numbers:
  - **Minor** (1.0 → 1.1): requirements added or changed within the same release scope.
  - **Major** (1.x → 2.0): the release scope changes, e.g. features move from "later versions" into scope.
- Every version gets an entry below (newest first), listing what changed and which requirement IDs were affected.

---

## v1.3, 2026-11-19 (current)

**Added: lesson length (§3.1, L-1 to L-7)**
- The user chooses 5, 10 or 15 minutes per lesson (L-1). The length covers Stages 0–3; Stage 4 has its own limit (L-2).
- The length controls the amount of content (grammar exercises, vocabulary items, dialogue turns, conversation exchanges); the level controls difficulty (L-3, L-4).
- The time is a guide, not a cutoff (L-5). Actual time spent is recorded to calibrate the estimates (L-6). The length is fixed per generated lesson (L-7).
- New **U-9**: profile default lesson length (10 minutes unless changed).
- New **S-4b**: the lesson length can be changed before generating a lesson.

**Changed**
- **G-1**: grammar lesson duration now follows the lesson length instead of "about 5–10 minutes".
- **V-1**: vocabulary count now depends on lesson length instead of level.
- **R-1**: dialogue turns are now 4–16, set by length and level.
- **F-4**: the Stage 4 limit is now about 3, 6 or 10 exchanges, depending on lesson length.
- §10 data model: `User.default_lesson_minutes`, `Lesson.length_minutes`.
- §12: new acceptance criterion 9.

Archived: [archive/REQUIREMENTS_v1.2.md](archive/REQUIREMENTS_v1.2.md)

## v1.2, 2026-11-19

**Added: styling and visual design (§8.1, DS-1 to DS-9)**
- Styling stack: Tailwind CSS v4 + shadcn/ui (DS-1).
- All design decisions live in one token file; a redesign means editing only that file (DS-2).
- Approved visual direction: minimal, immersive and conversation-first (DS-3), with white, black and grey plus one red accent (DS-4).
- Light by default; dark mode is opt-in, using dark grey and a heavier serif for readability (DS-5).
- Typography: Bodoni Moda serif for reading and all French text; Inter only for small labels (DS-6).
- An animated graphite-particle speaker as the conversation partner (DS-7), and the layout of the conversation screen (DS-8).
- Accessibility rules for contrast, keyboard use and reduced motion (DS-9).
- New acceptance criterion 8.

**Design history**
- Proposal 1 (shadcn/ui default look, colored themes, cards): rejected as too old-school and too complex.
- Proposal 2 (minimal black and white, serif, graphite speaker, based on the "Studio Grafite" reference): approved after one readability change (light by default; dark grey instead of black in dark mode).
- Visual reference: [docs/design/design-preview.html](../design/design-preview.html).

Archived: [archive/REQUIREMENTS_v1.1.md](archive/REQUIREMENTS_v1.1.md)

## v1.1, 2026-11-19

**Added: optional grammar lesson before each scenario (Stage 0)**
- New §5.0 *Stage 0: Grammar lesson* with requirements **G-1 to G-8**:
  - optional and skippable, and the user can return to it later (G-1)
  - the default topic is grammar typical for the user's CEFR level, fitted to the scenario; the user can override it (G-2)
  - an override applies to one lesson only; the next lesson goes back to the level-typical default (G-3)
  - content: explanation, form tables, examples, typical mistakes for German speakers, and exercises with AI feedback (G-4)
  - the dialogue uses the grammar focus, and Stage 3 feedback comments on it (G-5)
  - a reference grammar list per level and language, stored as data (G-6)
  - generated only when the lesson is opened, then stored (G-7)
  - progress is saved and shown on the dashboard (G-8)
- New **U-8**: profile setting "Offer grammar lessons" (default) or "Always skip".
- New **S-4a**: the proposed grammar focus is shown and can be changed before a lesson is generated.

**Changed**
- §1 vision and in-scope list, and the §3 flow diagram and lesson definition, now include Stage 0.
- **A-1**: grammar lessons and exercises added to the AI-generated content.
- **A-5**: notes that grammar content is generated when first opened.
- **P-3**: the dashboard shows grammar topics covered.
- §9: the language-agnostic design now also covers grammar topics and the reference grammar list.
- §10 data model: new `GrammarTopic` entity; new grammar fields on `User` and `Lesson`; `Attempt.stage` now includes `grammar`.
- §12: new acceptance criterion 7.

**Housekeeping**
- The spec moved from the project root to `docs/requirements/`. v1.0 is archived in `archive/`.

## v1.0, 2026-11-19

- First approved version: scenario selection, Stages 1–4, profiles, progress, AI provider layer, and design for later versions.
- All 8 open decisions resolved with the recommended defaults (see §13). The login method is email magic link; text-to-speech uses Azure.
- Archived: [archive/REQUIREMENTS_v1.0.md](archive/REQUIREMENTS_v1.0.md)
