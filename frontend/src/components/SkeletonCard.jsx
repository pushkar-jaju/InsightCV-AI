/** Skeleton pulse placeholder matching AnalyticsCard dimensions */
export default function SkeletonCard() {
  return (
    <div
      className="rounded-lg p-6 flex items-center gap-5"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        border: '1px solid var(--color-hairline)',
      }}
    >
      <div className="w-11 h-11 rounded-md flex-shrink-0 shimmer" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3 rounded shimmer w-2/3" />
        <div className="h-6 rounded shimmer w-1/2" />
      </div>
    </div>
  )
}
