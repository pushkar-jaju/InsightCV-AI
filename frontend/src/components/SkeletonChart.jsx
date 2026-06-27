/** Skeleton placeholder for the score chart */
export default function SkeletonChart() {
  return (
    <div
      className="rounded-lg p-6"
      style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-hairline)' }}
    >
      <div className="h-4 rounded shimmer w-36 mb-6" />
      <div className="h-52 rounded-md shimmer" />
    </div>
  )
}
