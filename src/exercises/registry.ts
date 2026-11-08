import { egcd, gcd, mod, modInverse } from '../lib/nt';
import { addMod, mulMod, pointOrder, pointsMod } from '../lib/ec';
import type { Rational } from './parse';

const B = (n: number) => BigInt(n);

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

export function modPow(base: bigint, e: bigint, n: bigint): bigint {
  let r = 1n;
  base = mod(base, n);
  while (e > 0n) {
    if (e & 1n) r = mod(r * base, n);
    base = mod(base * base, n);
    e >>= 1n;
  }
  return r;
}

/** Multiplicative order of a mod n (gcd(a, n) must be 1), or 0 if none. */
export function elementOrder(a: number, n: number): number {
  if (gcd(B(a), B(n)) !== 1n) return 0;
  let x = a % n;
  for (let k = 1; k <= n; k++) {
    if (x === 1 % n) return k;
    x = (x * a) % n;
  }
  return 0;
}

/** Solve x ≡ a_i (mod n_i) by brute-force stepping (moduli need not be coprime). */
export function crt(pairs: number[]): number | null {
  let x = 0;
  let step = 1;
  for (let i = 0; i < pairs.length; i += 2) {
    const a = pairs[i]!;
    const n = pairs[i + 1]!;
    let k = 0;
    while (((x - a) % n + n) % n !== 0) {
      x += step;
      if (++k > n) return null;
    }
    step = (step * n) / Number(gcd(B(step), B(n)));
  }
  return x;
}

export function phi(n: number): number {
  let count = 0;
  for (let a = 1; a <= n; a++) if (gcd(B(a), B(n)) === 1n) count++;
  return count;
}

/** Number of lines a = q·b + r that Euclid writes, including the last one with r = 0. */
export function euclidSteps(a: number, b: number): number {
  let steps = 0;
  while (b !== 0) {
    [a, b] = [b, a % b];
    steps++;
  }
  return steps;
}

/** Carry-less multiply of bit-mask polynomials over F_2, reduced mod `poly`. */
export function gf2Mul(a: number, b: number, poly: number): number {
  const deg = 31 - Math.clz32(poly);
  let r = 0;
  while (b) {
    if (b & 1) r ^= a;
    b >>= 1;
    a <<= 1;
    if (a & (1 << deg)) a ^= poly;
  }
  return r;
}

/** Horner: f(x) mod n for coefficients [c_d, …, c_0]. */
export function polyEvalMod(coeffs: number[], x: number, n: number): number {
  let r = 0;
  for (const c of coeffs) r = (((r * x + c) % n) + n) % n;
  return r;
}

/** Lagrange interpolation over F_p: points as flat [x1, y1, x2, y2, …], evaluated at `at`. */
export function lagrangeMod(pts: number[], at: number, p: number): number {
  const P = B(p);
  let sum = 0n;
  for (let i = 0; i < pts.length; i += 2) {
    let num = 1n, den = 1n;
    for (let j = 0; j < pts.length; j += 2) {
      if (j === i) continue;
      num = mod(num * B(at - pts[j]!), P);
      den = mod(den * B(pts[i]! - pts[j]!), P);
    }
    sum = mod(sum + B(pts[i + 1]!) * num * modInverse(den, P)!, P);
  }
  return Number(sum);
}

/** Solve a·x + b ≡ c (mod p); returns x in [0, p) or null. */
export function solveLinear(a: number, b: number, c: number, p: number): bigint | null {
  const inv = modInverse(B(a), B(p));
  return inv === null ? null : mod((B(c) - B(b)) * inv, B(p));
}

/**
 * Verify functions: (...args) → expected answer. Used by `npm run verify-content`
 * to re-compute every numeric answer written in content/.
 */
export const VERIFY: Record<string, (...args: number[]) => bigint | number | null> = {
  gcd: (a, b) => gcd(B(a), B(b)),
  mod: (a, n) => mod(B(a), B(n)),
  modInverse: (a, n) => modInverse(B(a), B(n)),
  modPow: (a, e, n) => modPow(B(a), B(e), B(n)),
  mulAddMod: (a, b, c, n) => mod(B(a) * B(b) + B(c), B(n)),
  solveLinear: (a, b, c, p) => solveLinear(a, b, c, p),
  sumTo: (n) => (n * (n + 1)) / 2,
  order: (a, n) => elementOrder(a, n),
  /** crt(a1, n1, a2, n2, ...) → smallest x ≥ 0 satisfying every x ≡ ai (mod ni), or null */
  crt: (...pairs) => crt(pairs),
  countGenerators: (p) => {
    let c = 0;
    for (let a = 1; a < p; a++) if (elementOrder(a, p) === p - 1) c++;
    return c;
  },
  phi: (n) => phi(n),
  /** size of the cyclic subgroup <a> of (Z_n, +) = n / gcd(a, n) */
  addOrder: (a, n) => n / Number(gcd(B(a), B(n))),
  /** number of cosets of <a> in Z_p^* = (p − 1) / order(a) */
  mulIndex: (a, p) => (p - 1) / elementOrder(a, p),
  /** number of x in Z_n with x² ≡ x */
  idempotents: (n) => {
    let c = 0;
    for (let x = 0; x < n; x++) if ((x * x) % n === x) c++;
    return c;
  },
  /** a XOR b (addition in F_2[x]), as a bit string read in decimal */
  xorBits: (a, b) => Number((a ^ b).toString(2)),
  /** number of distinct nonzero squares x² mod n, x = 1..n−1 */
  qrCount: (n) => {
    const s = new Set<number>();
    for (let x = 1; x < n; x++) s.add((x * x) % n);
    s.delete(0);
    return s.size;
  },
  /** p^k */
  pow: (p, k) => p ** k,
  /** Pedersen commitment g^m · h^r mod p */
  pedersen: (p, g, h, m, r) => mod(modPow(B(g), B(m), B(p)) * modPow(B(h), B(r), B(p)), B(p)),
  /** smallest x ≥ 0 with g^x ≡ h (mod p), or null */
  dlogMod: (g, h, p) => {
    let x = 1 % p;
    for (let k = 0; k < p; k++) {
      if (x === h % p) return k;
      x = (x * g) % p;
    }
    return null;
  },
  /** Schnorr response s = k + c·x mod q */
  schnorrResponse: (k, c, x, q) => mod(B(k) + B(c) * B(x), B(q)),
  /** det [[a, b], [c, d]] mod p */
  det2Mod: (a, b, c, d, p) => mod(B(a * d - b * c), B(p)),
  /** solve a x + b y = e, c x + d y = f over F_p (det ≠ 0); which = 0 → x, 1 → y */
  solve2Mod: (a, b, e, c, d, f, p, which) => {
    const P = B(p);
    const inv = modInverse(mod(B(a * d - b * c), P), P);
    if (inv === null) return null;
    return which === 0 ? mod(B(e * d - b * f) * inv, P) : mod(B(a * f - e * c) * inv, P);
  },
  /** x (resp. y) of P + Q on y² = x³ + a x + b over F_p; null if P + Q = O */
  ecAddX: (a, p, x1, y1, x2, y2) => addMod(a, p, [x1!, y1!], [x2!, y2!])?.[0] ?? null,
  ecAddY: (a, p, x1, y1, x2, y2) => addMod(a, p, [x1!, y1!], [x2!, y2!])?.[1] ?? null,
  /** x (resp. y) of k·P */
  ecMulX: (a, p, k, x, y) => mulMod(a, p, k, [x, y])?.[0] ?? null,
  ecMulY: (a, p, k, x, y) => mulMod(a, p, k, [x, y])?.[1] ?? null,
  /** number of points of y² = x³ + a x + b over F_p, including O */
  ecCount: (a, b, p) => pointsMod(a, b, p).length + 1,
  /** order of the point (x, y) */
  ecOrder: (a, p, x, y) => pointOrder(a, p, [x, y]),
  /** smallest k ≥ 1 with k·(x, y) = (qx, qy) — a tiny discrete log */
  ecLog: (a, p, x, y, qx, qy) => {
    const n = pointOrder(a, p, [x, y]);
    for (let k = 1; k < n; k++) {
      const R = mulMod(a, p, k, [x, y]);
      if (R && R[0] === qx && R[1] === qy) return k;
    }
    return null;
  },
  /** polyEval(n, x, c_d, …, c_0) = f(x) mod n, coefficients from highest degree */
  polyEval: (n, x, ...coeffs) => polyEvalMod(coeffs, x, n),
  /** number of x in Z_n with f(x) ≡ 0, coefficients from highest degree */
  polyRootCount: (n, ...coeffs) => {
    let c = 0;
    for (let x = 0; x < n; x++) if (polyEvalMod(coeffs, x, n) === 0) c++;
    return c;
  },
  /** lagrangeMod(p, at, x1, y1, x2, y2, …) = value at `at` of the unique interpolating polynomial over F_p */
  lagrangeMod: (p, at, ...pts) => lagrangeMod(pts, at, p),
  /** nonzero zero divisors of Z_n: nonzero a with gcd(a, n) > 1 */
  zeroDivisors: (n) => n - 1 - phi(n),
  /** a · b in F_2[x] / (poly), all as bit masks; returned as the bit string read in decimal (x²+1 → 101) */
  gf2MulBits: (a, b, poly) => Number(gf2Mul(a, b, poly).toString(2)),
  /** a^e in F_2[x] / (poly), as a bit string read in decimal */
  gf2PowBits: (a, e, poly) => {
    let r = 1;
    for (let i = 0; i < e; i++) r = gf2Mul(r, a, poly);
    return Number(r.toString(2));
  },
  euclidSteps: (a, b) => euclidSteps(a, b),
  /** smallest prime p with 2^p − 1 composite */
  minCompositeMersenneExponent: () => {
    for (let p = 2; ; p++) if (isPrime(p) && !isPrime(2 ** p - 1)) return p;
  },
  /** smallest n ≥ 0 with n² + n + 41 composite */
  eulerPolyFirstComposite: () => {
    for (let n = 0; ; n++) if (!isPrime(n * n + n + 41)) return n;
  },
};

/** Check functions for answers that are not unique: (input, ...args) → accepted? */
export const CHECKS: Record<string, (input: Rational, ...args: number[]) => boolean> = {
  /** input is an x such that a·x + b·y = gcd(a, b) for some integer y */
  bezoutX: (r, a, b) => {
    if (r.q !== 1n) return false;
    const g = egcd(B(a), B(b))[0];
    return mod(g - B(a) * r.p, B(b)) === 0n;
  },
};
