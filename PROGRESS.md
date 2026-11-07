# Progress

Living status of the build. Update this file at the end of every work session.
Last updated: 2026-11-08.

## Milestones (SPEC §11)

| # | Goal | Status |
|---|---|---|
| M1 | App shell, MDX lessons, glossary hover, IndexedDB, FSRS flashcards | ✅ done |
| M2 | Exercise engine (all types), hint ladder, generators, problem sets, mixed review | ✅ done (code exercise types are stubs until M6/M7) |
| M3 | Math content | 🟡 in progress — 6 math lessons |
| M4 | Crypto / ZK track | ⬜ |
| M5 | Systems Security track + Paper Decoder (offline) | ⬜ |
| M6 | Rust runner (local server + `cargo test`) + 6 katas | 🟡 2 Rust theory lessons written, runner not started |
| M7 | Pyodide + ML / DL track | ⬜ |
| M8 | Quantum + AI Trends | ⬜ |
| M9 | AI Tutor (optional) | ⬜ |

## Lessons so far

| Track | Chapter | Lesson id | Exercises (A/B/C) |
|---|---|---|---|
| math | logic | `math.logic.proof-techniques` | 5 / 4 / 2 |
| math | number-theory | `math.nt.gcd-euclid` | 6 / 3 / 2 |
| math | number-theory | `math.nt.mod-arith` | 6 / 4 / 2 |
| math | number-theory | `math.nt.fermat` | 5 / 3 / 1 |
| math | number-theory | `math.nt.crt` | 4 / 3 / 1 |
| math | abstract-algebra | `math.algebra.groups` | 5 / 3 / 1 |
| rust | basics | `rust.basics.ownership` | 5 / 3 / 1 |
| rust | basics | `rust.basics.structs-traits` | 5 / 2 / 1 |

Generators (`src/generators/index.ts`): `gcd`, `bezout`, `modInverse`, `negMod`, `mulAddMod`, `linearCongruence`, `fermatPow`, `elementOrder`, `crt2`.

## Next up (in order)

1. **Math, abstract algebra:** subgroups & cosets (full proof of Lagrange) → rings & fields → finite fields $\mathbb{F}_{p^k}$.
2. **Math, polynomials:** division & roots → Lagrange interpolation (with a small SVG widget) → Schwartz–Zippel.
3. **Math, elliptic curves:** over the reals (SVG point-addition widget) → over $\mathbb{F}_p$ (generator `ecAdd`) → scalar multiplication & discrete log.
4. **Rust basics:** error handling (`Result`, `?`) → iterators & closures → generics with trait bounds → lifetimes.
5. **Math:** probability (birthday bound!) → linear algebra → statistics for benchmarking; FFT/NTT.
6. Then M4 (Crypto/ZK) and M5 (Systems Security).

Known gaps: no Playwright smoke test yet; main bundle ~770 kB (all MDX frontmatter is loaded eagerly — split later).

## How to continue in a new chat

Open Claude Code in this folder and say e.g. "làm tiếp theo PROGRESS.md". `CLAUDE.md` holds the rules; this file holds the state.
Before finishing a session: `npm test`, `npm run build`, update this file, commit, push.
