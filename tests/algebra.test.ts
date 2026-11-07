/** Re-derives the hand-computed numbers in the abstract-algebra lessons. */
import { describe, expect, it } from 'vitest';
import { elementOrder, gf2Mul, lagrangeMod, phi, polyEvalMod } from '../src/exercises/registry';
import { lagrangeCoeffs, lagrangeEval, polyString } from '../src/lib/poly';
import { addMod, addReal, mulMod, onCurveMod, pointsMod, type RealPoint } from '../src/lib/ec';

describe('subgroups & cosets lesson', () => {
  it('cosets of ⟨2⟩ = {1,2,4} in Z_7^* are {1,2,4} and {3,5,6}; 5H = 3H', () => {
    const H = [1, 2, 4];
    const coset = (g: number) => H.map((h) => (g * h) % 7).sort((a, b) => a - b);
    expect(coset(1)).toEqual([1, 2, 4]);
    expect(coset(3)).toEqual([3, 5, 6]);
    expect(coset(5)).toEqual([3, 5, 6]);
  });

  it('jump-by-k on a 12-hour clock visits 12/gcd(k,12) spots — never 5', () => {
    const visits = (k: number) => new Set(Array.from({ length: 12 }, (_, i) => (i * k) % 12)).size;
    expect(visits(4)).toBe(3);
    expect(visits(3)).toBe(4);
    for (let k = 0; k < 12; k++) expect(visits(k)).not.toBe(5);
  });
});

describe('rings & fields lesson', () => {
  it('Z_12: units {1,5,7,11} are self-inverse, 7 zero divisors', () => {
    const units = Array.from({ length: 11 }, (_, i) => i + 1).filter((a) => elementOrder(a, 12) > 0);
    expect(units).toEqual([1, 5, 7, 11]);
    for (const u of units) expect((u * u) % 12).toBe(1);
    expect(11 - phi(12)).toBe(7);
    for (const [a, b] of [[2, 6], [3, 4], [8, 3], [9, 4], [10, 6]]) expect((a! * b!) % 12).toBe(0);
  });

  it('2x ≡ 1 has no solution mod 6, x = 4 mod 7; 2x ≡ 4 mod 6 has x = 2, 5', () => {
    expect([0, 1, 2, 3, 4, 5].filter((x) => (2 * x) % 6 === 1)).toEqual([]);
    expect([0, 1, 2, 3, 4, 5, 6].filter((x) => (2 * x) % 7 === 1)).toEqual([4]);
    expect([0, 1, 2, 3, 4, 5].filter((x) => (2 * x) % 6 === 4)).toEqual([2, 5]);
  });

  it('freshman’s dream holds in Z_p for small p', () => {
    for (const p of [2, 3, 5, 7]) for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) {
      expect((a + b) ** p % p).toBe((a ** p + b ** p) % p);
    }
  });
});

describe('finite fields lesson', () => {
  const M = 0b1011; // x³ + x + 1
  it('power table of x in F_8', () => {
    const table: number[] = [];
    for (let i = 1, r = 2; i <= 7; i++, r = gf2Mul(r, 2, M)) table.push(r);
    expect(table).toEqual([0b010, 0b100, 0b011, 0b110, 0b111, 0b101, 0b001]);
  });

  it('(x² + 1)(x + 1) = x² in F_8', () => {
    expect(gf2Mul(0b101, 0b011, M)).toBe(0b100);
  });

  it('x³ + x + 1 and x² + x + 1 have no roots in F_2; x² + 1 = (x + 1)²', () => {
    for (const x of [0, 1]) {
      expect((x ** 3 + x + 1) % 2).toBe(1);
      expect((x ** 2 + x + 1) % 2).toBe(1);
    }
    expect(gf2Mul(0b11, 0b11, 0b111 << 4)).toBe(0b101); // no reduction: plain (x+1)² over F_2
  });

  it('AES example: {57} + {83} = {d4}, {57} · {83} = {c1}', () => {
    expect(0x57 ^ 0x83).toBe(0xd4);
    expect(gf2Mul(0x57, 0x83, 0x11b)).toBe(0xc1);
  });
});

describe('polynomial lessons', () => {
  it('x³ + 2x + 1 ÷ (x − 2) over F_5: q = x² + 2x + 1, r = 3', () => {
    expect(polyEvalMod([1, 0, 2, 1], 2, 5)).toBe(3);
    // (x − 2)(x² + 2x + 1) + 3 = x³ − 3x + 1 ≡ x³ + 2x + 1
    for (let x = 0; x < 5; x++) expect(((((x - 2) * (x * x + 2 * x + 1) + 3) % 5) + 5) % 5).toBe(polyEvalMod([1, 0, 2, 1], x, 5));
  });

  it('x^p − x = ∏ (x − a) over F_p (checked for p = 3, 5 by evaluating everywhere)', () => {
    for (const p of [3, 5]) for (let x = 0; x < p; x++) {
      let prod = 1;
      for (let a = 0; a < p; a++) prod = (prod * (x - a + p)) % p;
      expect(prod).toBe((x ** p - x) % p);
    }
  });

  it('parabola through (1,2), (2,3), (3,6) is x² − 2x + 3 with f(0) = 3', () => {
    const c = lagrangeCoeffs([1, 2, 3], [2, 3, 6]).map((v) => Math.round(v * 1e9) / 1e9);
    expect(c).toEqual([3, -2, 1]);
    expect(lagrangeEval([1, 2, 3], [2, 3, 6], 0)).toBeCloseTo(3);
    expect(lagrangeEval([1, 2, 3], [2, 3, 6], 4)).toBeCloseTo(11);
    expect(lagrangeEval([1, 2, 3], [0, 1, 0], 0)).toBeCloseTo(-3);
    expect(lagrangeEval([1, 3], [5, 9], 0)).toBeCloseTo(3);
    expect(polyString([3, -2, 1])).toBe('x² − 2x + 3');
  });

  it('Shamir examples: F_11 line and F_13 parabola', () => {
    expect(lagrangeMod([1, 10, 2, 2], 0, 11)).toBe(7);
    expect(lagrangeMod([1, 8, 2, 0, 3, 7], 0, 13)).toBe(5);
    expect([1, 2, 3].map((x) => (5 + 2 * x + x * x) % 13)).toEqual([8, 0, 7]);
  });
});

describe('Schwartz–Zippel lesson', () => {
  const A = [2, 5, 1], B = [1, 1, 2];
  it('A and B over F_11 agree exactly at r = 2 and r = 5', () => {
    const agree = Array.from({ length: 11 }, (_, r) => r).filter((r) => polyEvalMod(A, r, 11) === polyEvalMod(B, r, 11));
    expect(agree).toEqual([2, 5]);
    expect(polyEvalMod(A, 2, 11)).toBe(8);
    expect(polyEvalMod(A, 3, 11)).toBe(1);
    expect(polyEvalMod(B, 3, 11)).toBe(3);
    expect(polyEvalMod(A, 7, 11)).toBe(2);
  });

  it('xy − 1 has 4 zeros in F_5²; 2^30 / 2^61 ≈ 4.7e-10', () => {
    let z = 0;
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) if ((x * y) % 5 === 1) z++;
    expect(z).toBe(4);
    expect(2 ** 30 / 2 ** 61).toBeCloseTo(4.66e-10, 11);
  });
});

describe('elliptic curve lessons', () => {
  it('over ℝ: (0,1)+(1,1) = (−1,−1); 2(0,1) = (1/4, −7/8); (1,1)+(3,5) = (0,1); (−1,−1)+(3,5) = 2P', () => {
    const close = (P: RealPoint, x: number, y: number) => {
      expect(P!.x).toBeCloseTo(x, 12);
      expect(P!.y).toBeCloseTo(y, 12);
    };
    close(addReal(-1, { x: 0, y: 1 }, { x: 1, y: 1 }), -1, -1);
    close(addReal(-1, { x: 0, y: 1 }, { x: 0, y: 1 }), 0.25, -0.875);
    close(addReal(-1, { x: 1, y: 1 }, { x: 3, y: 5 }), 0, 1);
    close(addReal(-1, { x: -1, y: -1 }, { x: 3, y: 5 }), 0.25, -0.875);
    expect(addReal(-1, { x: 1, y: 0 }, { x: 1, y: 0 })).toBeNull(); // y² = x³ − x, 2-torsion
  });

  it('over F_5: y² = x³ + x + 1 has 9 points and (0,1) runs through all of them', () => {
    expect(pointsMod(1, 1, 5)).toEqual([[0, 1], [0, 4], [2, 1], [2, 4], [3, 1], [3, 4], [4, 2], [4, 3]]);
    const table = Array.from({ length: 9 }, (_, i) => mulMod(1, 5, i + 1, [0, 1]));
    expect(table).toEqual([[0, 1], [4, 2], [2, 1], [3, 4], [3, 1], [2, 4], [4, 3], [0, 4], null]);
    expect(addMod(1, 5, [2, 1], [3, 4])).toEqual([4, 3]);
    expect(pointsMod(2, 3, 7).length + 1).toBe(6);
    for (const P of pointsMod(1, 1, 5)) expect(onCurveMod(1, 1, 5, mulMod(1, 5, 4, P))).toBe(true);
  });
});

describe('scalar multiplication lesson', () => {
  const G: [number, number] = [5, 1];
  it('y² = x³ + 2x + 2 over F_17 has 19 points and G = (5,1) has order 19', () => {
    expect(pointsMod(2, 2, 17).length + 1).toBe(19);
    expect(mulMod(2, 17, 19, G)).toBeNull();
  });

  it('multiples table matches the lesson', () => {
    const want = [[5, 1], [6, 3], [10, 6], [3, 1], [9, 16], [16, 13], [0, 6], [13, 7], [7, 6], [7, 11], [13, 10], [0, 11], [16, 4], [9, 1], [3, 16], [10, 11], [6, 14], [5, 16]];
    want.forEach((P, i) => expect(mulMod(2, 17, i + 1, G)).toEqual(P));
  });

  it('ECDH: 3·(7G) = 7·(3G) = 2G = (6,3); 4·6 = 24 ≡ 5 → (9,16)', () => {
    expect(mulMod(2, 17, 3, mulMod(2, 17, 7, G))).toEqual([6, 3]);
    expect(mulMod(2, 17, 7, mulMod(2, 17, 3, G))).toEqual([6, 3]);
    expect(mulMod(2, 17, 24, G)).toEqual([9, 16]);
  });

  it('2^128 / 1e18 per second ≈ 1e13 years', () => {
    const years = 2 ** 128 / 1e18 / (365.25 * 24 * 3600);
    expect(years).toBeGreaterThan(1e13);
    expect(years).toBeLessThan(1.2e13);
  });
});
