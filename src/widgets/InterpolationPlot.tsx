import { useState } from 'react';
import { lagrangeCoeffs, lagrangeEval, polyString } from '../lib/poly';

const W = 360;
const H = 240;
const X_MIN = -0.5, X_MAX = 4.5, Y_MIN = -6, Y_MAX = 10;
const sx = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
const sy = (y: number) => H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;

/**
 * Drag the y-values of points at x = 1, 2, (3, 4) and watch the unique polynomial of
 * degree < n through them. f(0) is highlighted — in Shamir secret sharing it is the secret.
 */
export function InterpolationPlot({ initial = [2, 3, 6] }: { initial?: number[] }) {
  const [ys, setYs] = useState<number[]>(initial);
  const xs = ys.map((_, i) => i + 1);
  const coeffs = lagrangeCoeffs(xs, ys);
  const f0 = lagrangeEval(xs, ys, 0);

  const path: string[] = [];
  for (let k = 0; k <= 200; k++) {
    const x = X_MIN + ((X_MAX - X_MIN) * k) / 200;
    const y = Math.max(Y_MIN - 50, Math.min(Y_MAX + 50, lagrangeEval(xs, ys, x)));
    path.push(`${k === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
  }

  const setY = (i: number, v: number) => setYs((old) => old.map((y, j) => (j === i ? v : y)));

  return (
    <div className="not-prose my-6 rounded-md border border-neutral-300 p-4 font-sans text-sm dark:border-neutral-700">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-neutral-500">Try it · interpolation</span>
        <button
          type="button"
          className="rounded border border-neutral-300 px-2 py-0.5 disabled:opacity-40 dark:border-neutral-700"
          disabled={ys.length <= 2}
          onClick={() => setYs((old) => old.slice(0, -1))}
        >
          − point
        </button>
        <button
          type="button"
          className="rounded border border-neutral-300 px-2 py-0.5 disabled:opacity-40 dark:border-neutral-700"
          disabled={ys.length >= 4}
          onClick={() => setYs((old) => [...old, 0])}
        >
          + point
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label="Interpolating polynomial plot">
        <clipPath id="interp-clip">
          <rect x={0} y={0} width={W} height={H} />
        </clipPath>
        {[0, 1, 2, 3, 4].map((x) => (
          <line key={`gx${x}`} x1={sx(x)} x2={sx(x)} y1={0} y2={H} className="stroke-neutral-200 dark:stroke-neutral-800" />
        ))}
        {[-4, -2, 2, 4, 6, 8].map((y) => (
          <line key={`gy${y}`} x1={0} x2={W} y1={sy(y)} y2={sy(y)} className="stroke-neutral-200 dark:stroke-neutral-800" />
        ))}
        <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} className="stroke-neutral-400" />
        <line x1={sx(0)} x2={sx(0)} y1={0} y2={H} className="stroke-neutral-400" />
        {[1, 2, 3, 4].map((x) => (
          <text key={`t${x}`} x={sx(x) + 3} y={sy(0) + 12} className="fill-neutral-500 text-[10px]">
            {x}
          </text>
        ))}
        <path d={path.join(' ')} fill="none" strokeWidth={2} className="stroke-accent" clipPath="url(#interp-clip)" />
        {ys.map((y, i) => (
          <circle key={i} cx={sx(xs[i]!)} cy={sy(y)} r={5} className="fill-neutral-800 dark:fill-neutral-100" />
        ))}
        {f0 >= Y_MIN && f0 <= Y_MAX && (
          <g>
            <rect x={sx(0) - 5} y={sy(f0) - 5} width={10} height={10} className="fill-accent" />
            <text x={sx(0) + 8} y={sy(f0) - 6} className="fill-accent text-[11px] font-semibold">
              f(0)
            </text>
          </g>
        )}
      </svg>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {ys.map((y, i) => (
          <label key={i} className="flex items-center gap-2">
            <span className="w-16 font-mono">f({xs[i]}) =</span>
            <input type="range" min={-4} max={8} step={1} value={y} onChange={(e) => setY(i, Number(e.target.value))} className="flex-1 accent-[rgb(var(--accent))]" />
            <span className="w-6 text-right font-mono">{y}</span>
          </label>
        ))}
      </div>
      <p className="mt-3">
        Degree ≤ {ys.length - 1}: <span className="font-mono">f(x) = {polyString(coeffs)}</span>
        <br />
        Secret <span className="font-mono">f(0) = {polyString([f0])}</span>
      </p>
    </div>
  );
}
