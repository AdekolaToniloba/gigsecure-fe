'use client';

import { Bell, Search, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMarketplaceFilters } from '@/hooks/marketplace/useMarketplaceFilters';

const SEARCH_DEBOUNCE_MS = 350;

export function MarketplaceNavbar() {
  const { filters, updateSearch } = useMarketplaceFilters();

  return (
    <MarketplaceNavbarContent
      key={filters.q ?? ''}
      initialSearchValue={filters.q ?? ''}
      updateSearch={updateSearch}
    />
  );
}

type MarketplaceNavbarContentProps = {
  initialSearchValue: string;
  updateSearch: (query: string) => void;
};

function MarketplaceNavbarContent({
  initialSearchValue,
  updateSearch,
}: MarketplaceNavbarContentProps) {
  const [searchValue, setSearchValue] = useState(initialSearchValue);

  useEffect(() => {
    const timeout = window.setTimeout(() => updateSearch(searchValue), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [searchValue, updateSearch]);

  return (
    <header className="sticky top-0 z-30 flex min-h-20 flex-col gap-3 border-b border-primary/10 bg-white px-4 py-4 shadow-sm sm:min-h-24 sm:flex-row sm:items-center sm:gap-4 sm:px-6 lg:static lg:px-8">
      <label className="relative w-full min-w-0 sm:max-w-md sm:flex-1">
        <span className="sr-only">Search marketplace plans</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-light"
        />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search..."
          className="h-11 w-full rounded-md border border-primary/20 bg-white pl-10 pr-3 text-sm text-primary outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </label>

      <div className="hidden w-full min-w-0 items-center gap-2 overflow-x-auto pb-1 sm:ml-auto sm:flex sm:w-auto sm:gap-3 sm:overflow-visible sm:pb-0">
        <button
          type="button"
          disabled
          aria-label="Notifications coming soon"
          title="Notifications coming soon"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/15 text-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Bell aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled
          aria-label="Premiums coming soon"
          title="Premiums coming soon"
          className="flex h-10 shrink-0 items-center gap-2 rounded-sm border border-primary/20 px-3 text-sm text-primary disabled:cursor-not-allowed disabled:opacity-70 sm:gap-3"
        >
          <WalletCards aria-hidden="true" className="h-4 w-4" />
          <span>0 Premiums</span>
        </button>
        <button
          type="button"
          disabled
          title="Product tour coming soon"
          className="h-10 shrink-0 rounded-sm bg-primary px-4 text-xs font-semibold text-accent disabled:cursor-not-allowed disabled:opacity-90 sm:px-7"
        >
          Take A Tour
        </button>
      </div>
    </header>
  );
}
