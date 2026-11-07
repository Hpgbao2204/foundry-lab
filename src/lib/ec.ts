/** Elliptic curves y² = x³ + a·x + b — over the reals (widgets) and over F_p (exercises). */
import { mod, modInverse } from './nt';

export type RealPoint = { x: number; y: number } | null; // null = point at infinity O

/** Chord-and-tangent addition over ℝ. */
export function addReal(a: number, P: RealPoint, Q: RealPoint): RealPoint {
  if (!P) return Q;
  if (!Q) return P;
  const same = Math.abs(P.x - Q.x) < 1e-12;
  if (same && Math.abs(P.y + Q.y) < 1e-12) return null; // P = −Q (or a 2-torsion point doubled)
  const lam = same ? (3 * P.x * P.x + a) / (2 * P.y) : (Q.y - P.y) / (Q.x - P.x);
  const x = lam * lam - P.x - Q.x;
  return { x, y: lam * (P.x - x) - P.y };
}

export type ModPoint = [number, number] | null;

/** Addition on y² = x³ + a x + b over F_p (p prime). */
export function addMod(a: number, p: number, P: ModPoint, Q: ModPoint): ModPoint {
  if (!P) return Q;
  if (!Q) return P;
  const [x1, y1] = P, [x2, y2] = Q;
  const B = BigInt, n = B(p);
  if (x1 === x2 && mod(B(y1 + y2), n) === 0n) return null;
  const lam =
    x1 === x2
      ? mod(B(3 * x1 * x1 + a) * modInverse(mod(B(2 * y1), n), n)!, n)
      : mod(B(y2 - y1) * modInverse(mod(B(x2 - x1), n), n)!, n);
  const x3 = mod(lam * lam - B(x1) - B(x2), n);
  const y3 = mod(lam * (B(x1) - x3) - B(y1), n);
  return [Number(x3), Number(y3)];
}

/** k·P by double-and-add. */
export function mulMod(a: number, p: number, k: number, P: ModPoint): ModPoint {
  let R: ModPoint = null;
  let D = P;
  while (k > 0) {
    if (k & 1) R = addMod(a, p, R, D);
    D = addMod(a, p, D, D);
    k >>= 1;
  }
  return R;
}

/** All affine points of y² = x³ + a x + b over F_p (without O). */
export function pointsMod(a: number, b: number, p: number): [number, number][] {
  const out: [number, number][] = [];
  for (let x = 0; x < p; x++) for (let y = 0; y < p; y++) if ((((y * y - (x * x * x + a * x + b)) % p) + p) % p === 0) out.push([x, y]);
  return out;
}

export function onCurveMod(a: number, b: number, p: number, P: ModPoint): boolean {
  if (!P) return true;
  const [x, y] = P;
  return (((y * y - (x * x * x + a * x + b)) % p) + p) % p === 0;
}

/** Smallest k ≥ 1 with k·P = O. */
export function pointOrder(a: number, p: number, P: ModPoint): number {
  let R = P;
  for (let k = 1; k <= 4 * p + 10; k++) {
    if (!R) return k;
    R = addMod(a, p, R, P);
  }
  return 0;
}
