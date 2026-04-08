import { Fragment } from 'react';

/**
 * Renders inline **bold** text as React elements.
 * Splits on `**` markers — odd-indexed segments are bold.
 */
export function renderInlineBold(text: string) {
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 !== 0) {
      return <strong key={index} className="font-semibold text-slate-800">{part}</strong>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
