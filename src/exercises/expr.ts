/**
 * Tiny expression language for `expression` exercises:
 * numbers, variables (letters, optional digits/underscore: x, y1, a_0), + - * / ^, parentheses,
 * implicit multiplication ("2x", "x(x+1)", "(x+1)(x-1)").
 * Equivalence is tested by evaluating both sides at random points (reals or F_p).
 */
import { mod, modInverse } from '../lib/nt';
import { normalizeInput } from './parse';
import { mulberry32 } from '../generators/rng';

export type Node =
  | { k: 'num'; v: number }
  | { k: 'var'; name: string }
  | { k: 'neg'; a: Node }
  | { k: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Node; b: Node };

type Tok = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string };

function tokenize(src: string): Tok[] {
  const s = normalizeInput(src);
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (c === ' ') {
      i++;
    } else if (/[0-9.]/.test(c)) {
      const m = /^\d*\.?\d+/.exec(s.slice(i))!;
      out.push({ t: 'num', v: Number(m[0]) });
      i += m[0].length;
    } else if (/[a-zA-Z]/.test(c)) {
      // single letter, optionally followed by _digits or digits: x, x1, a_0
      const m = /^[a-zA-Z](?:_?\d+)?/.exec(s.slice(i))!;
      out.push({ t: 'id', v: m[0].replace('_', '') });
      i += m[0].length;
    } else if ('+-*/^()'.includes(c)) {
      out.push({ t: 'op', v: c });
      i++;
    } else {
      throw new Error(`Unexpected character “${c}”`);
    }
  }
  return out;
}

export function parseExpr(src: string): Node {
  const toks = tokenize(src);
  let pos = 0;
  const peek = () => toks[pos];
  const isOp = (v: string) => peek()?.t === 'op' && peek()!.v === v;

  // expr := term (('+'|'-') term)*
  function expr(): Node {
    let a = term();
    while (isOp('+') || isOp('-')) {
      const op = toks[pos++]!.v as '+' | '-';
      a = { k: 'bin', op, a, b: term() };
    }
    return a;
  }
  // term := unary (('*'|'/'|implicit) unary)*
  function term(): Node {
    let a = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = toks[pos++]!.v as '*' | '/';
        a = { k: 'bin', op, a, b: unary() };
      } else if (peek() && (peek()!.t === 'num' || peek()!.t === 'id' || isOp('('))) {
        a = { k: 'bin', op: '*', a, b: power() };
      } else return a;
    }
  }
  // unary := '-' unary | '+' unary | power      (so -x^2 = -(x^2))
  function unary(): Node {
    if (isOp('-')) {
      pos++;
      return { k: 'neg', a: unary() };
    }
    if (isOp('+')) {
      pos++;
      return unary();
    }
    return power();
  }
  // power := atom ('^' unary)?   (right-assoc)
  function power(): Node {
    const a = atom();
    if (isOp('^')) {
      pos++;
      return { k: 'bin', op: '^', a, b: unary() };
    }
    return a;
  }
  function atom(): Node {
    const t = toks[pos++];
    if (!t) throw new Error('Expression ended too early');
    if (t.t === 'num') return { k: 'num', v: t.v };
    if (t.t === 'id') return { k: 'var', name: t.v };
    if (t.v === '(') {
      const e = expr();
      if (!isOp(')')) throw new Error('Missing “)”');
      pos++;
      return e;
    }
    throw new Error(`Unexpected “${t.v}”`);
  }

  if (toks.length === 0) throw new Error('Empty expression');
  const tree = expr();
  if (pos !== toks.length) throw new Error(`Unexpected “${(toks[pos] as Tok).v}”`);
  return tree;
}

export function variables(n: Node, acc = new Set<string>()): Set<string> {
  if (n.k === 'var') acc.add(n.name);
  else if (n.k === 'neg') variables(n.a, acc);
  else if (n.k === 'bin') {
    variables(n.a, acc);
    variables(n.b, acc);
  }
  return acc;
}

export function evalReal(n: Node, env: Record<string, number>): number {
  switch (n.k) {
    case 'num':
      return n.v;
    case 'var':
      return env[n.name] ?? NaN;
    case 'neg':
      return -evalReal(n.a, env);
    case 'bin': {
      const a = evalReal(n.a, env);
      const b = evalReal(n.b, env);
      switch (n.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        case '^': return a ** b;
      }
    }
  }
}

class DivByZero extends Error {}

/** Evaluate in F_p. Exponents must be non-negative integer constants. */
export function evalMod(n: Node, env: Record<string, bigint>, p: bigint): bigint {
  switch (n.k) {
    case 'num':
      if (!Number.isInteger(n.v)) throw new Error('Only integers in F_p');
      return mod(BigInt(n.v), p);
    case 'var':
      return env[n.name] ?? 0n;
    case 'neg':
      return mod(-evalMod(n.a, env, p), p);
    case 'bin': {
      if (n.op === '^') {
        const e = evalReal(n.b, {});
        if (!Number.isInteger(e) || e < 0) throw new Error('Exponent must be a non-negative integer constant');
        let base = evalMod(n.a, env, p);
        let r = 1n;
        let k = BigInt(e);
        while (k > 0n) {
          if (k & 1n) r = mod(r * base, p);
          base = mod(base * base, p);
          k >>= 1n;
        }
        return r;
      }
      const a = evalMod(n.a, env, p);
      const b = evalMod(n.b, env, p);
      switch (n.op) {
        case '+': return mod(a + b, p);
        case '-': return mod(a - b, p);
        case '*': return mod(a * b, p);
        case '/': {
          const inv = modInverse(b, p);
          if (inv === null) throw new DivByZero();
          return mod(a * inv, p);
        }
      }
    }
  }
}

export function equivalent(a: string, b: string, opts: { modulus?: number; trials?: number; seed?: number } = {}): boolean {
  const ea = parseExpr(a);
  const eb = parseExpr(b);
  const vars = [...new Set([...variables(ea), ...variables(eb)])];
  const rnd = mulberry32(opts.seed ?? 12345);
  const trials = opts.trials ?? 12;
  let valid = 0;

  for (let i = 0; i < trials * 3 && valid < trials; i++) {
    if (opts.modulus) {
      const p = BigInt(opts.modulus);
      const env: Record<string, bigint> = {};
      for (const v of vars) env[v] = BigInt(Math.floor(rnd() * opts.modulus));
      try {
        if (evalMod(ea, env, p) !== evalMod(eb, env, p)) return false;
        valid++;
      } catch (e) {
        if (e instanceof DivByZero) continue;
        throw e;
      }
    } else {
      const env: Record<string, number> = {};
      for (const v of vars) env[v] = (rnd() * 6 - 3) || 0.5;
      const x = evalReal(ea, env);
      const y = evalReal(eb, env);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        if (Number.isFinite(x) !== Number.isFinite(y)) return false;
        continue;
      }
      if (Math.abs(x - y) > 1e-7 * Math.max(1, Math.abs(x), Math.abs(y))) return false;
      valid++;
    }
  }
  return valid > 0;
}
