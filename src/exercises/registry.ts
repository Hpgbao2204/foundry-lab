import { egcd, gcd, mod, modInverse } from '../lib/nt';
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
