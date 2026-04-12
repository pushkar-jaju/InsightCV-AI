const COLOR_MAP = {
  indigo: {
    badge: 'bg-indigo-100 dark:bg-indigo-900/40',
    icon: 'text-indigo-600 dark:text-indigo-400',
    accent: 'text-indigo-600 dark:text-indigo-400',
  },
  emerald: {
    badge: 'bg-emerald-100 dark:bg-emerald-900/40',
    icon: 'text-emerald-600 dark:text-emerald-400',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  violet: {
    badge: 'bg-violet-100 dark:bg-violet-900/40',
    icon: 'text-violet-600 dark:text-violet-400',
    accent: 'text-violet-600 dark:text-violet-400',
  },
}

export default function AnalyticsCard({ title, value, icon, color = 'indigo', suffix = '' }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.indigo
  const hasValue = value !== null && value !== undefined

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6
      flex items-center gap-5
      transition-all duration-300
      hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5
      cursor-default`}>
      {/* Icon badge */}
      <div className={`w-12 h-12 ${c.badge} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <svg className={`w-6 h-6 ${c.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        {hasValue ? (
          <p className={`text-3xl font-extrabold ${c.accent} leading-tight mt-0.5`}>
            {value}
            {suffix && <span className="text-lg ml-0.5 font-semibold">{suffix}</span>}
          </p>
        ) : (
          <p className="text-2xl font-bold text-gray-300 dark:text-gray-600 leading-tight mt-0.5">—</p>
        )}
      </div>
    </div>
  )
}
