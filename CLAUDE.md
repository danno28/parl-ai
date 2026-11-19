@AGENTS.md

# Project notes

- The spec is `docs/requirements/REQUIREMENTS.md`. Requirement IDs (e.g. DS-2, L-3) are referenced in code comments. When requirements change: copy the current file to `docs/requirements/archive/REQUIREMENTS_v<version>.md` first, bump the version, and add an entry to `docs/requirements/CHANGELOG.md`.
- The visual reference is `docs/design/design-preview.html`. Follow it; change it first if the look changes.
- Conventions (styling tokens, AI provider layer, language-neutral prompts, i18n) are in README.md. Follow them.
- Before finishing a change: `npm run lint && npm run typecheck && npm test && npm run build`.
- Work on a branch and open a pull request; don't commit to `main` directly. The GitHub repo is danno28/parl-ai.
- The local PGlite database can only be opened by one process: stop the dev server before `npm run db:migrate`.
