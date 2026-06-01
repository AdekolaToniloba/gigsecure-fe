export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-primary/15 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
    >
      <div className="space-y-4 p-5">
        <div className="h-14 w-14 animate-pulse rounded-xl bg-[#F8EBCB]" />
        <div className="space-y-3">
          <div className="h-8 w-3/4 animate-pulse rounded bg-primary/10" />
          <div className="flex items-center gap-3">
            <div className="h-7 w-10 animate-pulse rounded bg-primary/10" />
            <div className="h-4 w-28 animate-pulse rounded bg-primary/10" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-primary/10" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-primary/10" />
          </div>
        </div>
      </div>
      <div className="border-t border-primary/10 px-5 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-primary/10" />
            <div className="h-5 w-20 animate-pulse rounded bg-primary/10" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-10 animate-pulse rounded bg-primary/10" />
            <div className="h-5 w-24 animate-pulse rounded bg-primary/10" />
          </div>
        </div>
        <div className="mt-5 h-10 w-full animate-pulse rounded-lg bg-primary/10" />
      </div>
    </div>
  );
}
