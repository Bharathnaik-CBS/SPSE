import React from 'react';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const highlightMatch = (text = '', query = '') => {
  const source = String(text || '');
  const needle = String(query || '').trim();

  if (!needle) {
    return source;
  }

  const regex = new RegExp(`(${escapeRegex(needle)})`, 'ig');
  const parts = source.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <mark
        key={`${part}-${index}`}
        className="rounded bg-cyan-200/80 px-0.5 text-slate-950 dark:bg-cyan-300/30 dark:text-cyan-100"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    )
  );
};
