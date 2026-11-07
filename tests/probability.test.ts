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
