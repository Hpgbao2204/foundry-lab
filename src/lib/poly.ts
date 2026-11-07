/** Real-number polynomial helpers for widgets. Coefficients are [c0, c1, …] (lowest degree first). */

/** Value at x of the unique polynomial of degree < n through (xs[i], ys[i]) — Lagrange form. */
export function lagrangeEval(xs: number[], ys: number[], x: number): number {
  let sum = 0;
  for (let i = 0; i < xs.length; i++) {
    let term = ys[i]!;
    for (let j = 0; j < xs.length; j++) if (j !== i) term *= (x - xs[j]!) / (xs[i]! - xs[j]!);
    sum += term;
  }
  return sum;
}

/** Coefficients [c0, c1, …] of the interpolating polynomial (expands each Lagrange basis polynomial). */
export function lagrangeCoeffs(xs: number[], ys: number[]): number[] {
  const n = xs.length;
  const out = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let basis = [1]; // product of (x − xj)
    let den = 1;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const next = new Array<number>(basis.length + 1).fill(0);
      basis.forEach((c, k) => {
        next[k + 1]! += c;
        next[k]! -= c * xs[j]!;
      });
      basis = next;
      den *= xs[i]! - xs[j]!;
    }
    basis.forEach((c, k) => (out[k]! += (ys[i]! * c) / den));
  }
  return out;
}

/** Pretty string like "x² − 2x + 3" for small rational-ish coefficients. */
export function polyString(coeffs: number[]): string {
  const sup = (e: number) => (e === 1 ? '' : String(e).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]!));
  const fmt = (v: number) => {
    const r = Math.round(v * 1000) / 1000;
    for (const d of [1, 2, 3, 4, 6]) if (Math.abs(r * d - Math.round(r * d)) < 1e-9) return d === 1 ? String(Math.round(r)) : `${Math.round(r * d)}/${d}`;
    return r.toFixed(2);
  };
  const parts: string[] = [];
  for (let e = coeffs.length - 1; e >= 0; e--) {
    const c = coeffs[e]!;
    if (Math.abs(c) < 1e-9) continue;
    const mag = fmt(Math.abs(c));
    const body = e === 0 ? mag : `${mag === '1' ? '' : mag}x${sup(e)}`;
    parts.push(parts.length === 0 ? (c < 0 ? `−${body}` : body) : `${c < 0 ? ' − ' : ' + '}${body}`);
  }
  return parts.length ? parts.join('') : '0';
}
