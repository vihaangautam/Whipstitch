import React from 'react';

// Renders the bounded markdown subset our LLM/research text actually produces:
// "# " / "## " headings, "- " bullets, "**bold**" spans, blank-line paragraph breaks.
// ponytail: no full CommonMark (tables, links, nesting) — add react-markdown if that's ever needed.
function inline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    chunk.startsWith('**') && chunk.endsWith('**') ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-slate-900">
        {chunk.slice(2, -2)}
      </strong>
    ) : (
      chunk
    )
  );
}

export default function MarkdownLite({ text, className = '' }) {
  if (!text) return null;
  const lines = text.split('\n');
  const blocks = [];
  let list = [];

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc list-outside pl-4 space-y-1">
          {list}
        </ul>
      );
      list = [];
    }
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return flushList();
    if (line.startsWith('## ')) {
      flushList();
      blocks.push(
        <h4 key={i} className="text-xs font-bold text-slate-900 uppercase tracking-wide mt-2 first:mt-0">
          {inline(line.slice(3), i)}
        </h4>
      );
    } else if (line.startsWith('# ')) {
      flushList();
      blocks.push(
        <h3 key={i} className="text-sm font-bold text-slate-900 mt-2 first:mt-0">
          {inline(line.slice(2), i)}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      list.push(<li key={i}>{inline(line.slice(2), i)}</li>);
    } else {
      flushList();
      blocks.push(
        <p key={i} className="text-slate-700">
          {inline(line, i)}
        </p>
      );
    }
  });
  flushList();

  return <div className={`space-y-1.5 ${className}`}>{blocks}</div>;
}
