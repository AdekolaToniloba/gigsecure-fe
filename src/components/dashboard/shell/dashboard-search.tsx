'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export function DashboardSearch() {
  const [query, setQuery] = useState('');

  return (
    <form
      role="search"
      aria-label="Dashboard search"
      onSubmit={(event) => event.preventDefault()}
      className="min-w-0 flex-1 lg:max-w-[28.5rem]"
    >
      <label htmlFor="dashboard-search" className="sr-only">
        Search dashboard
      </label>
      <span id="dashboard-search-description" className="sr-only">
        Search text stays on this page and does not request results.
      </span>
      <div className="relative min-w-0">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-light"
        />
        <input
          id="dashboard-search"
          name="dashboard-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-describedby="dashboard-search-description"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search dashboard…"
          className="h-11 w-full min-w-0 rounded-lg border border-app-border bg-white pl-10 pr-3 text-sm text-primary outline-none transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </div>
    </form>
  );
}
