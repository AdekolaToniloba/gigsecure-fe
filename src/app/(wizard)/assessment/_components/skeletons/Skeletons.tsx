export function StepSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Title */}
      <div className="h-8 w-56 bg-gray-200 rounded-lg mb-3" />
      <div className="h-4 w-80 bg-gray-100 rounded mb-8" />

      {/* Question 1 */}
      <div className="mb-7">
        <div className="h-4 w-64 bg-gray-200 rounded mb-3" />
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-full bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Question 2 */}
      <div className="mb-7">
        <div className="h-4 w-48 bg-gray-200 rounded mb-3" />
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Question 3 */}
      <div className="mb-7">
        <div className="h-4 w-72 bg-gray-200 rounded mb-3" />
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex justify-between pt-6 border-t border-gray-100 mt-8">
        <div className="h-11 w-24 bg-gray-100 rounded-lg" />
        <div className="h-11 w-28 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="w-[240px] flex-shrink-0 animate-pulse">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="h-3 w-24 bg-gray-200 rounded mb-5" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-2.5 w-16 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Hero card */}
      <div className="h-52 w-full bg-gray-200 rounded-2xl" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>

      {/* Insights */}
      <div className="space-y-3">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-full bg-gray-100 rounded-lg" />
        ))}
      </div>

      {/* Exposure grid */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
