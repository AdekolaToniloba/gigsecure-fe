type CategoryFilterProps = {
  categories: string[];
  selected: string[];
  onChange: (categories: string[]) => void;
};

export function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  function toggleCategory(category: string) {
    onChange(
      selected.includes(category)
        ? selected.filter((item) => item !== category)
        : [...selected, category]
    );
  }

  return (
    <fieldset>
      <legend className="font-heading text-sm font-bold text-primary">Categories</legend>
      <div className="mt-3 space-y-2">
        {categories.map((category) => (
          <label key={category} className="flex items-center gap-2 text-sm text-primary-light">
            <input
              type="checkbox"
              checked={selected.includes(category)}
              onChange={() => toggleCategory(category)}
              className="h-4 w-4 accent-primary"
            />
            <span>{category}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
