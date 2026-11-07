# foundry-lab

A local-first study app for re-learning the math behind crypto/ZK, systems security, Rust, ML, and quantum computing.
Theory is short and readable; the core is **exercises with step-by-step hints** (no answer until you ask twice).

The full design is in [SPEC.md](SPEC.md) (package name: `forge-lab`).

## Run

```bash
npm install
npm run dev            # http://127.0.0.1:5173
npm test               # unit tests (Vitest)
npm run verify-content # re-computes every numeric answer in content/
npm run build
```

Everything is stored in your browser (IndexedDB). There is no login and no server.

## What is in it

- **Lessons** (MDX + KaTeX): Why it matters → Intuition → Definition/Theorem → Worked example → Common pitfalls → Exercises → Summary. Hover a term to see its Vietnamese explanation.
- **Exercises**, levels A (compute) / B (understand) / C (prove). Types: numeric (mod p, fractions), expression, multiple choice, true/false + why, fill the steps, order the proof, write a proof (rubric self-check).
- **Hint ladder**: direction → tool → first step → full solution. Exercises that needed hint 3+ come back after 3 days.
- **Generators**: endless fresh numbers for gcd, Bézout, modular inverse, linear congruences, etc.
- **Flashcards** with FSRS spaced repetition, chapter **problem sets**, a **weekly mixed review**, notes with Markdown export, JSON backup.

## Adding content

No code changes needed:

- Lesson: `content/<track>/<name>.mdx`, then list its id in `content/tracks.json` and `content/graph.json`.
- Exercises: `content/exercises/<track>/<lesson-id>.json`.
- Terms: `content/glossary.json`.

The tests check the structure, the A/B/C counts, the glossary, and recompute answers.

## Milestones

| | | |
|---|---|---|
| M1 | App shell, MDX lessons, glossary, FSRS flashcards | ✅ |
| M2 | Exercise engine, hint ladder, generators, problem sets | ✅ |
| M3 | Math content (logic → elliptic curves → probability → linear algebra → statistics) | next |
| M4 | Crypto / ZK track | |
| M5 | Systems Security track + Paper Decoder | |
| M6 | Rust runner + katas | |
| M7 | Pyodide + ML / DL track | |
| M8 | Quantum + AI Trends | |
| M9 | AI Tutor (optional) | |
