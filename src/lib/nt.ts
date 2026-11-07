/** Number-theory helpers (bigint). Used by tests now, by generators in M2. */

export function mod(a: bigint, n: bigint): bigint {
  const r = a % n;
  return r < 0n ? r + n : r;
}

/** Returns [g, x, y] with a*x + b*y = g = gcd(a, b) (g ≥ 0). */
export function egcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  let [r0, r1] = [a, b];
  let [x0, x1] = [1n, 0n];
  let [y0, y1] = [0n, 1n];
  while (r1 !== 0n) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [x0, x1] = [x1, x0 - q * x1];
    [y0, y1] = [y1, y0 - q * y1];
  }
  return r0 < 0n ? [-r0, -x0, -y0] : [r0, x0, y0];
}

export function gcd(a: bigint, b: bigint): bigint {
  return egcd(a, b)[0];
}

export function modInverse(a: bigint, n: bigint): bigint | null {
  const [g, x] = egcd(mod(a, n), n);
  return g === 1n ? mod(x, n) : null;
}
