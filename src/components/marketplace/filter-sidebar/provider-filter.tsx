import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ProviderRef } from '@/types/marketplace';

type ProviderFilterProps = {
  providers: ProviderRef[];
  selected: string[];
  onChange: (providerSlugs: string[]) => void;
};

const COLLAPSED_PROVIDER_COUNT = 4;

export function ProviderFilter({ providers, selected, onChange }: ProviderFilterProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const filteredProviders = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return query
      ? providers.filter((provider) => provider.name.toLowerCase().includes(query))
      : providers;
  }, [providers, searchValue]);
  const visibleProviders = isExpanded
    ? filteredProviders
    : filteredProviders.slice(0, COLLAPSED_PROVIDER_COUNT);
  const canToggle = filteredProviders.length > COLLAPSED_PROVIDER_COUNT;

  function toggleProvider(slug: string) {
    onChange(selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug]);
  }

  return (
    <fieldset>
      <legend className="font-heading text-sm font-bold text-primary">Provider</legend>
      <label className="relative mt-3 block">
        <span className="sr-only">Search providers</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-light"
        />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search Provider"
          className="h-10 w-full rounded-md border border-primary/20 pl-9 pr-3 text-sm text-primary outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </label>
      <div className="mt-4 max-h-40 space-y-3 overflow-y-auto pr-1">
        {visibleProviders.map((provider) => (
          <label key={provider.id} className="flex items-center gap-2 text-sm text-primary-light">
            <input
              type="checkbox"
              checked={selected.includes(provider.slug)}
              onChange={() => toggleProvider(provider.slug)}
              className="h-4 w-4 accent-primary"
            />
            <span>{provider.name}</span>
          </label>
        ))}
        {visibleProviders.length === 0 ? (
          <p role="status" className="text-xs text-primary-light">
            No providers match your search.
          </p>
        ) : null}
      </div>
      {canToggle ? (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          className="mt-4 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {isExpanded ? 'View less' : 'View more'}
        </button>
      ) : null}
    </fieldset>
  );
}
