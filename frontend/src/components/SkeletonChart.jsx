/** Skeleton pulse placeholder for the score chart */
export default function SkeletonChart() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-6" />
      <div className="h-52 bg-gray-100 dark:bg-gray-700 rounded-xl" />
    </div>
  )
}
