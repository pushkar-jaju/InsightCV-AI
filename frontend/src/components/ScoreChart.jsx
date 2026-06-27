import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-4 py-2.5 text-sm"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        border: '1px solid var(--color-hairline)',
      }}
    >
      <p className="mb-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
      <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>
        {payload[0].value}
        <span style={{ color: 'var(--color-muted)' }}> / 100</span>
      </p>
    </div>
  )
}

export default function ScoreChart({ data = [] }) {
  if (!data.length) {
    return (
      <div
        className="rounded-lg p-10 text-center"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-hairline)',
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: 'var(--color-surface-strong)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="var(--color-muted)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="font-medium text-sm" style={{ color: 'var(--color-ink)' }}>No score history yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Analyze a resume to see your score trend.</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        border: '1px solid var(--color-hairline)',
      }}
    >
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f54e00" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f54e00" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline-soft)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'var(--color-muted-soft)', fontFamily: 'Inter' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: 'var(--color-muted-soft)', fontFamily: 'Inter' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-hairline-strong)', strokeWidth: 1 }} />
          <Area
            type="monotone" dataKey="score"
            stroke="var(--color-primary)" strokeWidth={2}
            fill="url(#scoreGradient)"
            dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: 'var(--color-primary)', stroke: 'var(--color-canvas)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
