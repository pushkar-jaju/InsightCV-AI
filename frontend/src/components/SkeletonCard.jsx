/** Skeleton pulse placeholder matching AnalyticsCard dimensions */
export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 flex items-center gap-5 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  )
}
