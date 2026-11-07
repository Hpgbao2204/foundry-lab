import { mod, modInverse } from '../lib/nt';

/** Normalise unicode math typing: − → -, · × → *, superscripts, spaces. */
export function normalizeInput(s: string): string {
  return s
    .trim()
    .replace(/[−–—]/g, '-')
    .replace(/[·×⋅∙]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '^' + [...m].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
    .replace(/\s+/g, ' ');
}

/** Exact rational p/q with q > 0, as bigints. */
export interface Rational {
  p: bigint;
  q: bigint;
}

function bgcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

export function rational(p: bigint, q: bigint): Rational {
  if (q === 0n) throw new Error('division by zero');
  if (q < 0n) [p, q] = [-p, -q];
  const g = bgcd(p, q) || 1n;
  return { p: p / g, q: q / g };
}

/**
 * Parse "42", "-3", "3/4", "0.25", "≡ 5", "5 mod 7", "x = 5" into an exact rational.
 * Returns null when the text is not a number.
 */
export function parseNumber(raw: string): Rational | null {
  let s = normalizeInput(raw).replace(/^[a-zA-Z]\s*=\s*/, '').replace(/^≡\s*/, '');
  s = s.replace(/\s*\(?\s*mod\s+\d+\s*\)?\s*$/i, '').replace(/\s+/g, '');
  let m = /^([+-]?\d+)\/([+-]?\d+)$/.exec(s);
  if (m) {
    if (BigInt(m[2]!) === 0n) return null;
    return rational(BigInt(m[1]!), BigInt(m[2]!));
  }
  m = /^([+-]?)(\d*)\.(\d+)$/.exec(s);
  if (m) {
    const q = 10n ** BigInt(m[3]!.length);
    const p = BigInt((m[2] || '0') + m[3]!);
    return rational(m[1] === '-' ? -p : p, q);
  }
  if (/^[+-]?\d+$/.test(s)) return { p: BigInt(s), q: 1n };
  return null;
}

/** Reduce a rational into Z_n (needs gcd(q, n) = 1). */
export function rationalMod(r: Rational, n: bigint): bigint | null {
  const inv = modInverse(r.q, n);
  return inv === null ? null : mod(r.p * inv, n);
}

export function numbersEqual(a: Rational, b: Rational, modulus?: number): boolean {
  if (modulus) {
    const n = BigInt(modulus);
    const x = rationalMod(a, n);
    const y = rationalMod(b, n);
    return x !== null && x === y;
  }
  return a.p === b.p && a.q === b.q;
}
