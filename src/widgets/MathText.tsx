import katex from 'katex';
import { Fragment, memo, type ReactNode } from 'react';

/** Render a string with $inline$, $$display$$ math, `code` and **bold**. Content strings come from content/. */
function renderMath(tex: string, display: boolean): string {
  return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore' });
}

const TOKEN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|`[^`]+`|\*\*[^*]+\*\*)/g;

export const MathText = memo(function MathText({ text, className, block = false }: { text: string; className?: string; block?: boolean }) {
  const parts = text.split(TOKEN);
  const nodes: ReactNode[] = parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith('$$')) return <span key={i} className="block" dangerouslySetInnerHTML={{ __html: renderMath(p.slice(2, -2), true) }} />;
    if (p.startsWith('$') && p.length > 1) return <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(p.slice(1, -1), false) }} />;
    if (p.startsWith('`')) return <code key={i} className="rounded bg-neutral-100 px-1 font-mono text-[0.88em] dark:bg-neutral-800">{p.slice(1, -1)}</code>;
    if (p.startsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    return <Fragment key={i}>{p}</Fragment>;
  });
  const Tag = block ? 'div' : 'span';
  return <Tag className={className}>{nodes}</Tag>;
});
