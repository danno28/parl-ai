# parl.ai

*Speak first, learn later.* A browser-based, AI-driven app for learning French through real-life scenarios. The learner works through a grammar primer (optional), vocabulary, reading a dialogue aloud, speaking it from memory and, optionally, free conversation.

- **Requirements:** [docs/requirements/REQUIREMENTS.md](docs/requirements/REQUIREMENTS.md) (current version), with history in [CHANGELOG.md](docs/requirements/CHANGELOG.md)
- **Visual reference:** [docs/design/design-preview.html](docs/design/design-preview.html)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in BETTER_AUTH_SECRET and INVITED_EMAILS at least
npm run db:migrate           # creates the local database in .data/
npm run dev                  # http://localhost:3000
```

**Signing in locally:** open the app and enter an invited email. With `npm run dev` and `EMAIL_PROVIDER=console` (no email service), the page then shows a **Jetzt anmelden** button with the login link; the link is also printed in the server log. This shortcut never exists in a production build or once real emails are sent. Sessions last 60 days, so you rarely need to sign in again.

**Using it:** pick a scenario (or type your own), the length and your level on the home page. Claude writes the lesson (about 30 seconds) and it is saved to your account. Each lesson has three working stages: vocabulary, reading aloud, and speaking from memory with hints. Your position and every score are saved, so you can resume at any time. Without a microphone or Azure key, you can type your answers instead. In development without a Claude key, the home page offers a hand-written sample lesson.

**What needs which key:**
- Nothing extra: login, home page, and `/demo` with the browser's voice and a simulated score.
- `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`: the real French voice and real pronunciation scoring on `/demo`.
- Claude credentials (`ANTHROPIC_API_KEY` or `ant auth login`): AI tips on top of the scores, and lesson generation.
- `RESEND_API_KEY` + `EMAIL_FROM` with `EMAIL_PROVIDER=resend`: real login emails.

### Setting up Azure Speech

1. In the Azure portal, create a **Speech** resource (Azure AI services). Pick a region near you, e.g. *West Europe* or *France Central*. The free tier (F0) is enough to try it.
2. Open the resource → **Keys and Endpoint**. Copy *Key 1* and the *Location/Region* (e.g. `westeurope`).
3. Put them in `.env.local` as `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`, then restart `npm run dev`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse the database |

## Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (Radix), Drizzle ORM with PostgreSQL (embedded PGlite locally), Better Auth (magic link), Anthropic SDK, Azure Speech (REST), Zod, Vitest.

## Project structure

```
src/
  app/                  Routes. globals.css is THE theme file (DS-2); fonts.ts loads the typefaces.
  components/
    ui/                 shadcn/ui components (we own and restyle them)
    conversation/       Graphite speaker (DS-7), microphone button
    theme/              Light/dark handling (light by default, DS-5)
  config/               CEFR descriptors, lesson-length sizing (§3.1), languages, grammar reference lists (G-6)
  db/                   Drizzle schema (§10) and connection
  i18n/                 UI strings per native language (German in v1)
  lib/
    ai/                 Provider-neutral LLM interface + Claude implementation, per-task model/effort config
    speech/             Speech assessment interface + Azure provider (pronunciation scoring)
    tts/                Text-to-speech interface + Azure provider, with a per-sentence disk cache
    audio/              Browser side: 16 kHz WAV recorder, playback with browser-voice fallback
    auth.ts, session.ts Login (Better Auth, invite-only magic link) and session checks for API routes
    email.ts            Outgoing email: server log in development, Resend in production
    schemas/            Zod schemas for every structured AI output (A-2)
    lessons/            Lesson generation, Quizlet/CSV export and import
  prompts/              Versioned prompt templates (v1/), no hard-coded languages (A-7)
drizzle/                SQL migrations
docs/                   Requirements (versioned) and design reference
```

## Conventions

- **Styling:** components use roles only (`bg-background`, `text-muted-foreground`, `font-serif`, `text-live`), never raw colors or font names. All values live in `src/app/globals.css`.
- **AI:** call `getLLM()` or `generateValidated()` from `@/lib/ai`, always with a task name. Never import a provider SDK outside `src/lib/ai/providers/`.
- **Languages:** never hard-code "French" or "German" in logic or prompts. Use the language pair from `src/config/languages.ts`.
- **Prompts:** changing a prompt's behavior means a new version folder (`src/prompts/v2/`). Lessons store the prompt version used.
- **UI text:** every string goes in `src/i18n/messages/de.ts`.
