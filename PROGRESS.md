# Progress

Living status of the build. Update this file at the end of every work session.
Last updated: 2026-11-08.

## Milestones (SPEC §11)

| # | Goal | Status |
|---|---|---|
| M1 | App shell, MDX lessons, glossary hover, IndexedDB, FSRS flashcards | ✅ done |
| M2 | Exercise engine (all types), hint ladder, generators, problem sets, mixed review | ✅ done (code exercise types are stubs until M6/M7) |
| M3 | Math content | ✅ core done — 19 lessons (logic, number theory, algebra, polynomials + NTT, elliptic curves, birthday bound, linear systems, benchmarking stats). Optional extras listed below |
| M4 | Crypto / ZK track | ⬜ |
| M5 | Systems Security track + Paper Decoder (offline) | ⬜ |
| M6 | Rust runner (local server + `cargo test`) + 6 katas | 🟡 6 Rust theory lessons written (basics chapter complete), runner not started |
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
| math | abstract-algebra | `math.algebra.subgroups-cosets` | 6 / 3 / 2 |
| math | abstract-algebra | `math.algebra.rings-fields` | 5 / 3 / 2 |
| math | abstract-algebra | `math.algebra.finite-fields` | 6 / 3 / 1 |
| math | polynomials | `math.poly.division-roots` | 5 / 3 / 2 |
| math | polynomials | `math.poly.lagrange-interpolation` | 6 / 3 / 1 |
| math | polynomials | `math.poly.schwartz-zippel` | 5 / 3 / 1 |
| math | polynomials | `math.poly.ntt` | 5 / 3 / 1 |
| math | elliptic-curves | `math.ec.reals` | 5 / 3 / 1 |
| math | elliptic-curves | `math.ec.finite-fields` | 6 / 3 / 1 |
| math | elliptic-curves | `math.ec.scalar-dlog` | 6 / 3 / 1 |
| math | probability | `math.prob.birthday` | 5 / 3 / 1 |
| math | linear-algebra | `math.linalg.systems-fp` | 5 / 3 / 1 |
| math | statistics | `math.stats.benchmarking` | 5 / 3 / 1 |
| rust | basics | `rust.basics.ownership` | 5 / 3 / 1 |
| rust | basics | `rust.basics.structs-traits` | 5 / 2 / 1 |
| rust | basics | `rust.basics.error-handling` | 6 / 3 / 1 |
| rust | basics | `rust.basics.iterators-closures` | 5 / 3 / 1 |
| rust | basics | `rust.basics.generics` | 5 / 3 / 1 |
| rust | basics | `rust.basics.lifetimes` | 5 / 3 / 1 |

Generators (`src/generators/index.ts`): `gcd`, `bezout`, `modInverse`, `negMod`, `mulAddMod`, `linearCongruence`, `fermatPow`, `elementOrder`, `crt2`, `addSubgroup`, `polyRemainder`, `shamir`, `ecAdd`, `linear2`.

Widgets usable in MDX (`mdxComponents` in `src/widgets/lesson-components.tsx`): `InterpolationPlot` (drag points, see the interpolating polynomial and f(0)), `EcAddPlot` (chord-and-tangent on y² = x³ − x + 1).
Curve arithmetic lives in `src/lib/ec.ts` (real + F_p, double-and-add, point counting); verify fns `ecAddX/Y`, `ecMulX/Y`, `ecCount`, `ecOrder`, `ecLog`.
Exercise prompts support fenced code blocks (```` ```rust ```` … ```` ``` ````) via `MathText`.
Answers in 𝔽_{2^k} are typed as bit strings ("011"); verify fns `gf2MulBits`/`xorBits` return the bit string read as a decimal number.
Hand-computed numbers of the algebra/polynomial/curve/NTT lessons are re-checked in `tests/algebra.test.ts` (probability in `tests/probability.test.ts`).
Display math must be written as `$$` on its own line, then the formula, then `$$` (single-line `$$…$$` renders inline) — `tests/mdx-lint.test.ts` enforces it.

## Next up (in order)

1. **M4 Crypto/ZK** (SPEC §8.2): commitments (Pedersen) → Schnorr protocol (completeness, special soundness, simulator) → provable security games (IND-CPA, EUF-CMA, negligible) → Fiat–Shamir (+ Frozen Heart bug) → arithmetization (R1CS) → sumcheck → KZG. Reuse `src/lib/ec.ts` and the Z_p subgroup tricks from the math track.
   Optional M3 extras: conditional probability/expectation/negligible functions, rank/eigen/SVD, calculus for ML.
2. **Rust:** next chapter could be "field & curve arithmetic" katas, but they need the M6 runner (see linker note below).
3. Then M4 (Crypto/ZK) and M5 (Systems Security).

Known gaps: no Playwright smoke test yet; main JS bundle is ~1.9 MB minified (all MDX is bundled eagerly — code-split per lesson later).
Rust snippets can be type-checked locally with `rustc --edition 2021 --emit=metadata file.rs`, but this machine has **no MSVC linker** (`link.exe`), so binaries cannot be built/run — the M6 runner needs Visual Studio Build Tools (or the GNU toolchain) installed first.

## How to continue in a new chat

Open Claude Code in this folder and say e.g. "làm tiếp theo PROGRESS.md". `CLAUDE.md` holds the rules; this file holds the state.
Before finishing a session: `npm test`, `npm run build`, update this file, commit, push.
