'use client';

import type { MouseEvent } from 'react';

type AppSkipLinkProps = {
  targetId: string;
};

export function AppSkipLink({ targetId }: AppSkipLinkProps) {
  function moveFocusToMain(event: MouseEvent<HTMLAnchorElement>) {
    const main = document.getElementById(targetId);

    if (!main) return;

    event.preventDefault();
    main.focus();
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={moveFocusToMain}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-slate-950 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      Skip to dashboard content
    </a>
  );
}
