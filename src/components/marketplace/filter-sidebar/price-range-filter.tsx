import { MAX_MARKETPLACE_PREMIUM } from '@/hooks/marketplace/useMarketplaceFilters';

type PriceRangeFilterProps = {
  maximumPremium: number;
  onChange: (maximumPremium: number) => void;
};

const numberFormatter = new Intl.NumberFormat('en-NG');

export function PriceRangeFilter({ maximumPremium, onChange }: PriceRangeFilterProps) {
  return (
    <fieldset>
      <legend className="font-heading text-sm font-bold text-primary">Price range</legend>
      <label className="mt-3 block text-xs text-primary-light">
        <span>Monthly premium</span>
        <input
          type="range"
          min="0"
          max={MAX_MARKETPLACE_PREMIUM}
          step="500"
          value={maximumPremium}
          onChange={(event) => onChange(Number(event.target.value))}
          className="mt-3 block w-full accent-primary"
          aria-valuetext={`${numberFormatter.format(maximumPremium)} maximum monthly premium`}
        />
      </label>
      <div className="mt-1 flex justify-between text-xs font-medium text-primary">
        <span>0</span>
        <span>{numberFormatter.format(MAX_MARKETPLACE_PREMIUM)}</span>
      </div>
    </fieldset>
  );
}
