import Button from '@/components/ui/Button';

type ApplyFiltersButtonProps = {
  onClick: () => void;
};

export function ApplyFiltersButton({ onClick }: ApplyFiltersButtonProps) {
  return (
    <Button type="button" onClick={onClick} className="w-full">
      Apply Filters
    </Button>
  );
}
