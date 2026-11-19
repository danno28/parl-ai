# français

A browser-based, AI-driven app for learning French through real-life scenarios. The learner works through a grammar primer (optional), vocabulary, reading a dialogue aloud, speaking it from memory and, optionally, free conversation.

- **Requirements:** [docs/requirements/REQUIREMENTS.md](docs/requirements/REQUIREMENTS.md) (current version), with history in [CHANGELOG.md](docs/requirements/CHANGELOG.md)
- **Visual reference:** [docs/design/design-preview.html](docs/design/design-preview.html)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in keys
npm run db:migrate           # creates the local database in .data/
npm run dev                  # http://localhost:3000
```

Without any keys, the UI runs (home page and `/demo`). AI generation needs Claude credentials, and speech needs an Azure Speech key.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run TypeScript |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse the database |

## Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (Radix), Drizzle ORM with PostgreSQL (embedded PGlite locally), Anthropic SDK, Zod.

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
    speech/             Speech assessment interface + Azure provider (stub)
    tts/                Text-to-speech interface + Azure provider (stub)
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
