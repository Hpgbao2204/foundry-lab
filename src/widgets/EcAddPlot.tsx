import { useState } from 'react';
import { addReal, type RealPoint } from '../lib/ec';

const A = -1, B = 1; // y² = x³ − x + 1
const W = 360, H = 300;
const X_MIN = -2, X_MAX = 4, Y_MIN = -7, Y_MAX = 7;
const sx = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
const sy = (y: number) => H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;
const rhs = (x: number) => x * x * x + A * x + B;
const X0 = -1.3247; // real root of x³ − x + 1

function point(x: number, lower: boolean): RealPoint {
  const r = rhs(x);
  if (r < 0) return null;
  return { x, y: lower ? -Math.sqrt(r) : Math.sqrt(r) };
}

const fmt = (v: number) => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(3));
const show = (P: RealPoint) => (P ? `(${fmt(P.x)}, ${fmt(P.y)})` : 'O (point at infinity)');

/** Pick P and Q on y² = x³ − x + 1 and watch the chord (or tangent), the third point, and its reflection P + Q. */
export function EcAddPlot() {
  const [px, setPx] = useState(0);
  const [qx, setQx] = useState(1);
  const [pLow, setPLow] = useState(false);
  const [qLow, setQLow] = useState(false);
  const P = point(Math.max(px, X0), pLow);
  const Q = point(Math.max(qx, X0), qLow);
  const R = addReal(A, P, Q);
  const minusR = R ? { x: R.x, y: -R.y } : null;

  // curve: upper and lower branch
  const upper: string[] = [], lower: string[] = [];
  for (let k = 0; k <= 300; k++) {
    const x = X0 + ((X_MAX - X0) * k) / 300;
    const y = Math.sqrt(Math.max(0, rhs(x)));
    upper.push(`${k ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    lower.push(`${k ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(-y).toFixed(1)}`);
  }

  // line through P and Q (tangent if equal), drawn across the plot
  let line: [number, number, number, number] | null = null;
  if (P && Q) {
    const same = Math.abs(P.x - Q.x) < 1e-9;
    if (same && Math.abs(P.y + Q.y) < 1e-9) line = [sx(P.x), 0, sx(P.x), H];
    else {
      const lam = same ? (3 * P.x * P.x + A) / (2 * P.y) : (Q.y - P.y) / (Q.x - P.x);
      const f = (x: number) => P.y + lam * (x - P.x);
      line = [sx(X_MIN), sy(f(X_MIN)), sx(X_MAX), sy(f(X_MAX))];
    }
  }

  const Dot = ({ p, label, cls }: { p: RealPoint; label: string; cls: string }) =>
    p && p.y >= Y_MIN && p.y <= Y_MAX ? (
      <g>
        <circle cx={sx(p.x)} cy={sy(p.y)} r={5} className={cls} />
        <text x={sx(p.x) + 7} y={sy(p.y) - 7} className={`text-[11px] font-semibold ${cls}`}>
          {label}
        </text>
      </g>
    ) : null;

  const Control = ({ name, x, setX, low, setLow }: { name: string; x: number; setX: (v: number) => void; low: boolean; setLow: (v: boolean) => void }) => (
    <label className="flex items-center gap-2">
      <span className="w-6 font-mono">{name}</span>
      <input type="range" min={-1.3} max={3.5} step={0.05} value={x} onChange={(e) => setX(Number(e.target.value))} className="flex-1 accent-[rgb(var(--accent))]" />
      <span className="flex items-center gap-1 text-xs">
        <input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} /> lower
      </span>
    </label>
  );

  return (
    <div className="not-prose my-6 rounded-md border border-neutral-300 p-4 font-sans text-sm dark:border-neutral-700">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-neutral-500">
          <span className="uppercase tracking-widest">Try it</span> · <span className="font-mono">y² = x³ − x + 1</span>
        </span>
        <button type="button" className="rounded border border-neutral-300 px-2 py-0.5 dark:border-neutral-700" onClick={() => { setPx(0); setQx(1); setPLow(false); setQLow(false); }}>
          (0,1) + (1,1)
        </button>
        <button type="button" className="rounded border border-neutral-300 px-2 py-0.5 dark:border-neutral-700" onClick={() => { setPx(0); setQx(0); setPLow(false); setQLow(false); }}>
          doubling
        </button>
        <button type="button" className="rounded border border-neutral-300 px-2 py-0.5 dark:border-neutral-700" onClick={() => { setPx(1); setQx(1); setPLow(false); setQLow(true); }}>
          P + (−P)
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label="Elliptic curve point addition">
        <clipPath id="ec-clip">
          <rect x={0} y={0} width={W} height={H} />
        </clipPath>
        <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} className="stroke-neutral-300 dark:stroke-neutral-700" />
        <line x1={sx(0)} x2={sx(0)} y1={0} y2={H} className="stroke-neutral-300 dark:stroke-neutral-700" />
        <path d={upper.join(' ')} fill="none" strokeWidth={2} className="stroke-neutral-700 dark:stroke-neutral-300" clipPath="url(#ec-clip)" />
        <path d={lower.join(' ')} fill="none" strokeWidth={2} className="stroke-neutral-700 dark:stroke-neutral-300" clipPath="url(#ec-clip)" />
        {line && <line x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} strokeWidth={1.5} className="stroke-accent" clipPath="url(#ec-clip)" />}
        {R && minusR && <line x1={sx(R.x)} x2={sx(R.x)} y1={sy(minusR.y)} y2={sy(R.y)} strokeDasharray="4 3" className="stroke-neutral-500" clipPath="url(#ec-clip)" />}
        <Dot p={minusR} label="−(P+Q)" cls="fill-neutral-500" />
        <Dot p={R} label="P+Q" cls="fill-accent" />
        <Dot p={P} label="P" cls="fill-neutral-900 dark:fill-neutral-100" />
        <Dot p={Q} label="Q" cls="fill-neutral-900 dark:fill-neutral-100" />
      </svg>
      <div className="mt-3 grid gap-2">
        <Control name="P" x={px} setX={setPx} low={pLow} setLow={setPLow} />
        <Control name="Q" x={qx} setX={setQx} low={qLow} setLow={setQLow} />
      </div>
      <p className="mt-3 font-mono">
        P = {show(P)}
        <br />Q = {show(Q)}
        <br />P + Q = {show(R)}
      </p>
    </div>
  );
}
