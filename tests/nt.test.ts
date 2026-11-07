import { describe, expect, it } from 'vitest';
import { egcd, gcd, mod, modInverse } from '../src/lib/nt';

describe('number theory helpers', () => {
  it('mod is always non-negative', () => {
    expect(mod(-7n, 3n)).toBe(2n);
    expect(mod(7n, 3n)).toBe(1n);
    expect(mod(-6n, 3n)).toBe(0n);
  });

  it('egcd satisfies Bézout on random inputs', () => {
    for (let i = 0; i < 500; i++) {
      const a = BigInt(Math.floor(Math.random() * 1e6) - 5e5);
      const b = BigInt(Math.floor(Math.random() * 1e6) - 5e5);
      if (a === 0n && b === 0n) continue;
      const [g, x, y] = egcd(a, b);
      expect(a * x + b * y).toBe(g);
      expect(g > 0n).toBe(true);
      expect(a % g).toBe(0n);
      expect(b % g).toBe(0n);
    }
  });

  it('modInverse is correct or null exactly when gcd ≠ 1', () => {
    for (let n = 2n; n < 60n; n++) {
      for (let a = 0n; a < n; a++) {
        const inv = modInverse(a, n);
        if (gcd(a, n) === 1n) expect(mod(a * inv!, n)).toBe(1n);
        else expect(inv).toBeNull();
      }
    }
  });
});

/** Mọi con số trong worked example của 3 lesson mẫu — tiền thân của `verify-content` (M3). */
describe('worked examples in content are correct', () => {
  it('proof-techniques: 2^11 − 1 = 23 · 89, và 2^p − 1 nguyên tố với p = 2,3,5,7', () => {
    expect(2 ** 11 - 1).toBe(23 * 89);
    const isPrime = (n: number) => n > 1 && [...Array(Math.floor(Math.sqrt(n)) - 1)].every((_, i) => n % (i + 2) !== 0);
    expect([2, 3, 5, 7].map((p) => isPrime(2 ** p - 1))).toEqual([true, true, true, true]);
    expect(isPrime(2047)).toBe(false);
  });

  it('proof-techniques: 1 + … + n = n(n+1)/2', () => {
    for (let n = 1; n < 200; n++) {
      let s = 0;
      for (let k = 1; k <= n; k++) s += k;
      expect(s).toBe((n * (n + 1)) / 2);
    }
  });

  it('gcd-euclid: gcd(48,18)=6; egcd(240,46) = (2, −9, 47); (14, −73) cũng là nghiệm', () => {
    expect(gcd(48n, 18n)).toBe(6n);
    expect(egcd(240n, 46n)).toEqual([2n, -9n, 47n]);
    expect(240n * 14n + 46n * -73n).toBe(2n);
  });

  it('mod-arith: 17⁻¹ mod 43 = 38; 5x+3 ≡ 7 (mod 11) ⇒ x = 3; 1234·5678 mod 10 = 2', () => {
    expect(modInverse(17n, 43n)).toBe(38n);
    expect(2n * 43n - 5n * 17n).toBe(1n);
    expect(modInverse(5n, 11n)).toBe(9n);
    expect(mod(9n * 4n, 11n)).toBe(3n);
    expect(mod(5n * 3n + 3n, 11n)).toBe(7n);
    expect((1234n * 5678n) % 10n).toBe(2n);
    expect(modInverse(2n, 6n)).toBeNull();
    expect(-7 % 3).toBe(-1);
  });
});
