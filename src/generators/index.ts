import { egcd, gcd, mod, modInverse } from '../lib/nt';
import { elementOrder, isPrime, modPow } from '../exercises/registry';
import type { Exercise, NumericExercise } from '../exercises/types';
import { int, mulberry32, pick, type Rng } from './rng';

type Gen = (rng: Rng, params: Record<string, number>) => Omit<NumericExercise, 'id' | 'level' | 'type' | 'generator' | 'params'>;

const PRIMES = Array.from({ length: 200 }, (_, i) => i).filter(isPrime);

function primeBetween(rng: Rng, lo: number, hi: number): number {
  return pick(rng, PRIMES.filter((p) => p >= lo && p <= hi));
}

/** Lines "a = q · b + r" of the Euclidean algorithm, as LaTeX. */
export function euclidLines(a: number, b: number): string[] {
  const lines: string[] = [];
  while (b !== 0) {
    const q = Math.floor(a / b);
    const r = a % b;
    lines.push(`${a} = ${q} \\cdot ${b} + ${r}`);
    [a, b] = [b, r];
  }
  return lines;
}

const aligned = (lines: string[]) => `$$\\begin{aligned}${lines.map((l) => l.replace(' = ', ' &= ')).join(' \\\\ ')}\\end{aligned}$$`;

/** Two numbers with a non-trivial gcd most of the time. */
function gcdPair(rng: Rng, max: number): [number, number] {
  const g = pick(rng, [1, 2, 3, 4, 6, 7, 9, 11, 12, 13, 15, 18, 21]);
  let x: number, y: number;
  do {
    x = int(rng, 3, Math.floor(max / g));
    y = int(rng, 2, x - 1);
  } while (gcd(BigInt(x), BigInt(y)) !== 1n);
  return [g * x, g * y];
}

export const GENERATORS: Record<string, Gen> = {
  fermatPow: (rng) => {
    const p = primeBetween(rng, 5, 31);
    const a = int(rng, 2, p - 1);
    const e = int(rng, 50, 9999);
    const r = e % (p - 1);
    const ans = modPow(BigInt(a), BigInt(e), BigInt(p));
    return {
      prompt: `Compute $${a}^{${e}} \\bmod ${p}$.`,
      answer: String(ans),
      hints: [
        `${p} là số nguyên tố. Lũy thừa mod ${p} lặp lại với chu kỳ chia hết bao nhiêu?`,
        `Fermat: $${a}^{${p - 1}} \\equiv 1$, nên rút gọn số mũ theo mod ${p - 1}.`,
        `$${e} = ${Math.floor(e / (p - 1))} \\cdot ${p - 1} + ${r}$, nên chỉ cần tính $${a}^{${r}} \\bmod ${p}$.`,
      ],
      solution: `$${e} \\equiv ${r} \\pmod{${p - 1}}$, nên $${a}^{${e}} \\equiv ${a}^{${r}} \\equiv ${ans} \\pmod{${p}}$.`,
      verify: { fn: 'modPow', args: [a, e, p] },
    };
  },

  elementOrder: (rng) => {
    const p = primeBetween(rng, 5, 23);
    const a = int(rng, 2, p - 1);
    const k = elementOrder(a, p);
    const powers: number[] = [];
    for (let i = 1, x = a; i <= k; i++, x = (x * a) % p) powers.push(x);
    return {
      prompt: `What is the order of $${a}$ in $\\mathbb{Z}_{${p}}^*$?`,
      answer: String(k),
      hints: [
        `Order là số $k \\ge 1$ nhỏ nhất với $${a}^k \\equiv 1 \\pmod{${p}}$.`,
        `Lagrange: order phải chia hết $${p - 1}$. Chỉ cần thử các ước của ${p - 1}.`,
        `$${a}^1 = ${a}$, $${a}^2 \\equiv ${(a * a) % p}$, ...`,
      ],
      solution: `Các lũy thừa: $${powers.join(', ')}$. Lần đầu về 1 ở bước ${k}, nên order là ${k} (và $${k} \\mid ${p - 1}$).`,
      verify: { fn: 'order', args: [a, p] },
    };
  },
  gcd: (rng, p) => {
    const [a, b] = gcdPair(rng, p.max ?? 600);
    const g = Number(gcd(BigInt(a), BigInt(b)));
    const lines = euclidLines(a, b);
    return {
      prompt: `Compute $\\gcd(${a}, ${b})$.`,
      answer: String(g),
      hints: [
        'gcd không đổi khi thay cặp $(a, b)$ bằng $(b, a \\bmod b)$.',
        'Dùng thuật toán Euclid: chia lấy dư liên tục cho tới khi số dư bằng 0.',
        `Dòng đầu tiên: $${lines[0]}$.`,
      ],
      solution: `${aligned(lines)} Số dư khác 0 cuối cùng là $${g}$, nên $\\gcd(${a}, ${b}) = ${g}$.`,
      verify: { fn: 'gcd', args: [a, b] },
    };
  },

  bezout: (rng, p) => {
    const [a, b] = gcdPair(rng, p.max ?? 300);
    const [g, x, y] = egcd(BigInt(a), BigInt(b));
    return {
      prompt: `Find an integer $x$ such that $${a}x + ${b}y = \\gcd(${a}, ${b})$ for some integer $y$. Enter $x$.`,
      answer: String(x),
      check: { fn: 'bezoutX', args: [a, b] },
      hints: [
        'Đây là Bézout\'s identity — có vô số nghiệm, nhập một $x$ bất kỳ là được.',
        'Chạy Euclid, rồi thế ngược từ dòng cuối lên (Extended Euclid).',
        `Euclid bắt đầu bằng $${euclidLines(a, b)[0]}$.`,
      ],
      solution: `${aligned(euclidLines(a, b))} Thế ngược ta được $${g} = ${a} \\cdot (${x}) + ${b} \\cdot (${y})$. Vậy $x = ${x}$ (mọi $x + ${Number(b / Number(g))}t$ cũng đúng). Check: $${a} \\cdot (${x}) + ${b} \\cdot (${y}) = ${BigInt(a) * x + BigInt(b) * y}$.`,
    };
  },

  modInverse: (rng, p) => {
    const n = primeBetween(rng, p.minP ?? 11, p.maxP ?? 97);
    const a = int(rng, 2, n - 1);
    const inv = modInverse(BigInt(a), BigInt(n))!;
    const [, s, t] = egcd(BigInt(a), BigInt(n));
    const lines = euclidLines(n, a);
    return {
      prompt: `Find $${a}^{-1} \\bmod ${n}$.`,
      answer: String(inv),
      modulus: n,
      hints: [
        `Cần tìm $x$ sao cho $${a} \\cdot x \\equiv 1 \\pmod{${n}}$.`,
        `Dùng Extended Euclid cho $(${n}, ${a})$ để viết $1 = ${n}y + ${a}x$.`,
        `Bước đầu: $${lines[0]}$.`,
      ],
      solution: `${aligned(lines)} Thế ngược: $1 = ${a} \\cdot (${s}) + ${n} \\cdot (${t})$. Lấy mod ${n}: $${a}^{-1} \\equiv ${s} \\equiv ${inv}$. Check: $${a} \\cdot ${inv} = ${a * Number(inv)} = ${Math.floor((a * Number(inv)) / n)} \\cdot ${n} + 1$.`,
      verify: { fn: 'modInverse', args: [a, n] },
    };
  },

  negMod: (rng) => {
    const n = int(rng, 3, 29);
    const a = -int(rng, 1, 250);
    const r = mod(BigInt(a), BigInt(n));
    const q = (BigInt(a) - r) / BigInt(n);
    return {
      prompt: `Compute $${a} \\bmod ${n}$ (the result must be in $\\{0, \\dots, ${n - 1}\\}$).`,
      answer: String(r),
      hints: [
        'Kết quả của mod luôn nằm trong $[0, n)$, kể cả khi $a$ âm.',
        `Tìm bội của ${n} nhỏ hơn hoặc bằng ${a} gần nhất, rồi lấy hiệu.`,
        `Thử $${a} = ${q} \\cdot ${n} + r$ — tìm $r$.`,
      ],
      solution: `$${a} = (${q}) \\cdot ${n} + ${r}$, và $0 \\le ${r} < ${n}$, nên $${a} \\bmod ${n} = ${r}$. (Trong JS/Rust, \`${a} % ${n}\` cho $${Number(a) % n}$ — đó không phải mod toán học.)`,
      verify: { fn: 'mod', args: [a, n] },
    };
  },

  mulAddMod: (rng) => {
    const n = pick(rng, [7, 9, 10, 11, 12, 13]);
    const a = int(rng, 100, 999);
    const b = int(rng, 100, 999);
    const c = int(rng, 0, 999);
    const ra = a % n, rb = b % n, rc = c % n;
    const ans = (ra * rb + rc) % n;
    return {
      prompt: `Compute $(${a} \\cdot ${b} + ${c}) \\bmod ${n}$ without a calculator.`,
      answer: String(ans),
      hints: [
        'Không cần nhân số lớn: đồng dư tương thích với cộng và nhân.',
        'Rút gọn từng số mod $n$ trước, rồi mới nhân/cộng.',
        `$${a} \\equiv ${ra}$, $${b} \\equiv ${rb}$, $${c} \\equiv ${rc} \\pmod{${n}}$.`,
      ],
      solution: `$${a} \\equiv ${ra}$, $${b} \\equiv ${rb}$, $${c} \\equiv ${rc}$. Vậy $${ra} \\cdot ${rb} + ${rc} = ${ra * rb + rc} \\equiv ${ans} \\pmod{${n}}$.`,
      verify: { fn: 'mulAddMod', args: [a, b, c, n] },
    };
  },

  linearCongruence: (rng, p) => {
    const n = primeBetween(rng, p.minP ?? 7, p.maxP ?? 31);
    const a = int(rng, 2, n - 1);
    const b = int(rng, 1, n - 1);
    const c = int(rng, 0, n - 1);
    const inv = modInverse(BigInt(a), BigInt(n))!;
    const rhs = mod(BigInt(c - b), BigInt(n));
    const x = mod(rhs * inv, BigInt(n));
    return {
      prompt: `Solve $${a}x + ${b} \\equiv ${c} \\pmod{${n}}$.`,
      answer: String(x),
      modulus: n,
      hints: [
        'Giống giải phương trình bậc nhất, nhưng "chia" là nhân với nghịch đảo.',
        `Chuyển vế để được $${a}x \\equiv \\dots$, rồi tìm $${a}^{-1} \\bmod ${n}$.`,
        `$${a}x \\equiv ${c} - ${b} \\equiv ${rhs} \\pmod{${n}}$.`,
      ],
      solution: `$${a}x \\equiv ${rhs}$. Ta có $${a}^{-1} \\equiv ${inv} \\pmod{${n}}$ (vì $${a} \\cdot ${inv} = ${a * Number(inv)} \\equiv 1$). Nhân hai vế: $x \\equiv ${rhs} \\cdot ${inv} \\equiv ${x}$. Check: $${a} \\cdot ${x} + ${b} = ${a * Number(x) + b} \\equiv ${c} \\pmod{${n}}$.`,
      verify: { fn: 'solveLinear', args: [a, b, c, n] },
    };
  },
};

/**
 * Concrete instance of an exercise. Generator-backed exercises get fresh numbers
 * per seed; seed 0 keeps the authored (static) version when it has one.
 */
export function instantiate(ex: Exercise, seed: number): Exercise {
  if (!ex.generator) return ex;
  if (seed === 0 && ex.prompt) return ex;
  const gen = GENERATORS[ex.generator];
  if (!gen) throw new Error(`unknown generator ${ex.generator}`);
  const rng = mulberry32(seed);
  return { ...ex, type: 'numeric', ...gen(rng, ex.params ?? {}) } as NumericExercise;
}
