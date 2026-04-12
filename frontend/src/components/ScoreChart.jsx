import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl px-4 py-2.5 text-sm">
      <p className="text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="font-bold text-indigo-600 dark:text-indigo-400">{payload[0].value} / 100</p>
    </div>
  )
}

export default function ScoreChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No score history yet</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Analyze a resume to see your score trend here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey="score"
            stroke="#4f46e5" strokeWidth={2.5}
            fill="url(#scoreGradient)"
            dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#4f46e5', stroke: '#e0e7ff', strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
