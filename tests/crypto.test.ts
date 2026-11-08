/** Re-derives the numbers in the crypto/ZK lessons. */
import { describe, expect, it } from 'vitest';
import { VERIFY, modPow } from '../src/exercises/registry';

const P = 23n, Q = 11n;
const pw = (b: number, e: number) => Number(modPow(BigInt(b), BigInt(e), P));

describe('Pedersen lesson', () => {
  it('g = 2 and h = 3 have order 11 mod 23', () => {
    expect(pw(2, 11)).toBe(1);
    expect(pw(3, 11)).toBe(1);
  });
  it('commitments, homomorphism, equivocation with log_2 3 = 8', () => {
    const C = (m: number, r: number) => Number(VERIFY.pedersen!(23, 2, 3, m, r));
    expect(C(5, 7)).toBe(18);
    expect(C(2, 3)).toBe(16);
    expect(C(4, 1)).toBe(2);
    expect((18 * 16) % 23).toBe(C(7, 10));
    expect(C(7, 10)).toBe(12);
    expect(VERIFY.dlogMod!(2, 3, 23)).toBe(8);
    expect(C(1, 2)).toBe(18); // lesson: reopen to m' = 1
    expect(C(3, 10)).toBe(18); // exercise: reopen to m' = 3
  });
});

describe('Schnorr lesson', () => {
  it('worked example: x = 6, y = 18, k = 4, c = 2, s = 5', () => {
    expect(pw(2, 6)).toBe(18);
    const s = Number(VERIFY.schnorrResponse!(4, 2, 6, 11));
    expect(s).toBe(5);
    expect(pw(2, s)).toBe((16 * pw(18, 2)) % 23);
    expect(Number(VERIFY.schnorrResponse!(4, 5, 6, 11))).toBe(1);
    // extraction: (5 − 1)·(2 − 5)^{-1} mod 11
    const inv = Number(VERIFY.modInverse!(Number((((2n - 5n) % Q) + Q) % Q), 11));
    expect((4 * inv) % 11).toBe(6);
  });
  it('simulator: c = 1, s = 3 → t = 3 is accepting', () => {
    expect(Number(VERIFY.modInverse!(18, 23))).toBe(9);
    expect((pw(2, 3) * 9) % 23).toBe(3);
    expect(pw(2, 3)).toBe((3 * 18) % 23);
  });
  it('exercise numbers: x = 3, k = 7, c = 4 → accepted', () => {
    const y = pw(2, 3), t = pw(2, 7), s = Number(VERIFY.schnorrResponse!(7, 4, 3, 11));
    expect([y, t, s]).toEqual([8, 13, 8]);
    expect(pw(2, s)).toBe((t * pw(y, 4)) % 23);
  });
});
