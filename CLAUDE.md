# forge-lab — notes for Claude

Study app built milestone by milestone from [SPEC.md](SPEC.md). Current state and the next tasks are in [PROGRESS.md](PROGRESS.md) — read it first, and update it at the end of each session.

## Commands

- `npm run dev` — dev server on 127.0.0.1:5173 (restart it after changing `tailwind.config.js`)
- `npm test` — all Vitest tests; `npm run verify-content` — content checks only
- `npm run build` — typecheck + production build (catches MDX syntax errors)

## Writing content

- **Tone:** for anyone curious, not only researchers. Open with a puzzle or everyday example, build intuition with small numbers you can compute by hand, show "aha" links between lessons. Do not force every lesson toward papers. `researchBridge` is shown as "Where it shows up" — real-world uses.
- **Language:** UI, headings, step labels ("Step 1", "Check"), exercise prompts and flashcard fronts in **simple English**. Theory explanations, intuition, hints and solutions in **Vietnamese**. Keep technical terms in English; wrap first use in `<Term en="...">` and add the term to `content/glossary.json`.
- **Lesson** = `content/<track>/<name>.mdx` with frontmatter (see SPEC §6.1), sections in this order: `<Why>`, `<Intuition>`, `<Definition>`/`<Theorem>`, `<Example>`, `<Pitfalls>`, `<Exercises />`, `<Summary>`. Max 10 minutes. Register it in `content/tracks.json` and `content/graph.json`.
- **Exercises** = `content/exercises/<track>/<lesson-id>.json`, ids prefixed with `<lesson-id>.`. Per lesson: 4–6 level A, 2–4 B, 1–2 C. Every exercise has exactly 3 hints (direction → tool → first step) + a solution. Numeric answers get a `verify: { fn, args }` from `src/exercises/registry.ts` so the math is re-computed by code. Generator-backed level-A exercises use `generator` (see `src/generators/index.ts`); every generator must pass `tests/generators.test.ts`.
- MDX gotchas: no bare `{` `}` or `<` in prose (put them in `$math$` or backticks); use `\mid` instead of `|` inside table cells.
- Double-check every number in worked examples; add a code check in tests when possible. Wrong math is worse than no math.

## Code map

- `src/engine/` — content loading, FSRS (`srs.ts`), progress, redo queue, problem sets / mixed review (`exercises.ts`)
- `src/exercises/` — exercise types, grading, number/expression parsing, verify & check function registry
- `src/generators/` — seeded exercise generators
- `src/widgets/` — lesson MDX components, `ExerciseCard` (hint ladder), `MathText`
- `src/app/pages/` — screens

## Git

Repo: https://github.com/Hpgbao2204/foundry-lab, branch `master`. Commit and push at the end of each chunk of work.
