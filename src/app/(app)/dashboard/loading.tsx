import Spinner from '@/components/ui/Spinner';

export default function DashboardLoading() {
  return (
    <div
      aria-label="Loading dashboard"
      className="flex h-64 items-center justify-center"
    >
      <Spinner size="lg" />
    </div>
  );
}
