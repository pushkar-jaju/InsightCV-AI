export default function ScoreCard({ score, label, color = 'success' }) {
  const colorMap = {
    indigo:  '#f54e00', // map to primary orange
    success: '#1f8a65',
    emerald: '#1f8a65',
    amber:   '#c08532',
    error:   '#cf2d56',
  }
  const strokeColor = colorMap[color] || '#f54e00'
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = ((score || 0) / 100) * circumference

  return (
    <div
      className="flex flex-col items-center gap-3 p-6 rounded-lg"
      style={{ backgroundColor: 'var(--color-canvas-soft)', border: '1px solid var(--color-hairline)' }}
    >
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none"
          stroke="var(--color-hairline)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      <div className="text-center -mt-4">
        <p className="text-3xl font-semibold" style={{ color: 'var(--color-ink)' }}>
          {score ?? '—'}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
      </div>
    </div>
  )
}
