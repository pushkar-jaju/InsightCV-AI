export default function ScoreCard({ score, label, color = 'indigo' }) {
  const colorMap = {
    indigo: { ring: 'stroke-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    emerald: { ring: 'stroke-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { ring: 'stroke-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  }
  const c = colorMap[color] || colorMap.indigo
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = ((score || 0) / 100) * circumference

  return (
    <div className={`flex flex-col items-center gap-3 p-6 rounded-2xl ${c.bg}`}>
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" className="stroke-gray-200" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          className={`${c.ring} transition-all duration-700`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center -mt-4">
        <p className={`text-4xl font-bold ${c.text}`}>{score ?? '—'}</p>
        <p className="text-sm text-gray-500 font-medium mt-1">{label}</p>
      </div>
    </div>
  )
}
