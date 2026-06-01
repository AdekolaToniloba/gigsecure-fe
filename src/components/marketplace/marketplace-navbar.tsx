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
    <header className="flex min-h-24 items-center gap-4 border-b border-primary/10 bg-white px-8 shadow-sm">
      <label className="relative max-w-md flex-1">
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

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          disabled
          aria-label="Notifications coming soon"
          title="Notifications coming soon"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/15 text-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Bell aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled
          aria-label="Premiums coming soon"
          title="Premiums coming soon"
          className="flex h-10 items-center gap-3 rounded-sm border border-primary/20 px-3 text-sm text-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          <WalletCards aria-hidden="true" className="h-4 w-4" />
          <span>0 Premiums</span>
        </button>
        <button
          type="button"
          disabled
          title="Product tour coming soon"
          className="h-10 rounded-sm bg-primary px-7 text-xs font-semibold text-accent disabled:cursor-not-allowed disabled:opacity-90"
        >
          Take A Tour
        </button>
      </div>
    </header>
  );
}
