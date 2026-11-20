/** Shown instantly on navigation while the server prepares the page. */
export function PageSkeleton() {
  const bar = "animate-pulse rounded-lg bg-surface-2";
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-5">
      <div className="space-y-2">
        <div className={`${bar} h-7 w-48`} />
        <div className={`${bar} h-4 w-72 max-w-full`} />
      </div>
      <div className={`${bar} h-24 w-full rounded-2xl`} />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-4">
            <div className={`${bar} h-4 w-2/3`} />
            <div className={`${bar} mt-2 h-3 w-1/2`} />
          </div>
        ))}
      </div>
    </div>
  );
}
