// ─── Base Primitives ──────────────────────────────────────────────
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-gray-200 animate-pulse"
          style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-full bg-gray-200 animate-pulse flex-shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white ${className}`}
    >
      <SkeletonAvatar size={36} />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="h-6 w-16 rounded-full bg-gray-200 animate-pulse" />
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-xl border border-gray-100 bg-white p-6 space-y-4 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
      </div>
      <div className="h-px bg-gray-100" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-3/5 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="h-10 w-full rounded-lg bg-gray-200 animate-pulse" />
    </div>
  );
}

// ─── Domain Skeletons ─────────────────────────────────────────────
export function PolicyCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-xl border border-gray-100 bg-white p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-5 w-28 rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="h-6 w-16 rounded-full bg-[#E4EDED] animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-12 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="h-9 flex-1 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-9 flex-1 rounded-lg bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

export function ClaimRowSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white"
    >
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-48 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="text-right space-y-1">
        <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
        <div className="h-5 w-16 rounded-full bg-[#E4EDED] animate-pulse" />
      </div>
    </div>
  );
}
