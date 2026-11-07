/** Re-derives the numbers in the probability lessons. */
import { describe, expect, it } from 'vitest';

const noCollision = (N: number, n: number) => {
  let p = 1;
  for (let i = 0; i < n; i++) p *= 1 - i / N;
  return p;
};

describe('birthday lesson', () => {
  it('tiny years: N=4,n=3 → 3/8; N=5,n=3 → 12/25', () => {
    expect(noCollision(4, 3)).toBeCloseTo(3 / 8, 12);
    expect(noCollision(5, 3)).toBeCloseTo(12 / 25, 12);
  });

  it('23 people: no-collision ≈ 0.4927; exponential approx ≈ 0.50; 22 or fewer < 50%', () => {
    expect(noCollision(365, 23)).toBeCloseTo(0.4927, 4);
    expect(noCollision(365, 22)).toBeGreaterThan(0.5);
    expect(1 - Math.exp(-(23 * 22) / 730)).toBeCloseTo(0.5, 2);
    expect(1.1774 * Math.sqrt(365)).toBeCloseTo(22.5, 1);
  });

  it('matching your birthday: 22 others ≈ 6%, about 253 people for 50%', () => {
    expect(1 - (364 / 365) ** 22).toBeCloseTo(0.0585, 3);
    expect(1 - (364 / 365) ** 252).toBeLessThan(0.5);
    expect(1 - (364 / 365) ** 253).toBeGreaterThan(0.5);
  });

  it('union bound reaches 1 at n = 1415 for N = 10^6', () => {
    const n = (() => { for (let n = 2; ; n++) if ((n * (n - 1)) / 2 >= 1e6) return n; })();
    expect(n).toBe(1415);
  });
});

describe('benchmarking lesson', () => {
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
    return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
  };
  const svar = (xs: number[]) => { const m = mean(xs); return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1); };
  it('worked example numbers', () => {
    expect(mean([10, 12, 11, 13, 54])).toBe(20);
    expect(median([10, 12, 11, 13, 54])).toBe(12);
    expect(mean([10, 12, 11, 13])).toBe(11.5);
    expect(svar([9, 11, 10, 12, 8])).toBe(2.5);
    expect(Math.sqrt(2.5)).toBeCloseTo(1.58, 2);
    expect(median([3, 8, 5, 10])).toBe(6.5);
    expect(1.96 * (5 / Math.sqrt(100))).toBeCloseTo(0.98, 10);
    expect((5000 / 25) ** 2).toBe(40000);
    expect((4000 / 20) ** 2).toBe(40000);
  });
});
