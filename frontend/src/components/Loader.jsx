export default function Loader({ message = 'Processing...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 border-4 border-indigo-100 dark:border-indigo-900/50 rounded-full" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">{message}</p>
    </div>
  )
}
