// Icon badge color by variant — using DESIGN.md semantic tokens
const BADGE_STYLE = {
  indigo: { badge: 'var(--color-surface-strong)', icon: 'var(--color-ink)' },
  emerald: { badge: 'rgba(31,138,101,0.1)', icon: 'var(--color-success)' },
  violet: { badge: 'rgba(192,168,221,0.25)', icon: '#7c5cbf' },
  amber: { badge: 'rgba(192,133,50,0.12)', icon: '#b87a20' },
}

export default function AnalyticsCard({ title, value, icon, color = 'indigo', suffix = '' }) {
  const c = BADGE_STYLE[color] ?? BADGE_STYLE.indigo
  const hasValue = value !== null && value !== undefined

  return (
    <div
      className="rounded-lg p-6 flex items-center gap-5 transition-colors duration-150"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        border: '1px solid var(--color-hairline)',
      }}
    >
      {/* Icon badge */}
      <div
        className="w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: c.badge }}
      >
        <svg className="w-5 h-5" fill="none" stroke={c.icon} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>

      <div>
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--color-muted)' }}
        >
          {title}
        </p>
        {hasValue ? (
          <p
            className="text-2xl leading-tight mt-0.5 font-semibold"
            style={{ color: 'var(--color-ink)' }}
          >
            {value}
            {suffix && (
              <span className="text-base ml-0.5" style={{ color: 'var(--color-muted)' }}>
                {suffix}
              </span>
            )}
          </p>
        ) : (
          <p className="text-2xl leading-tight mt-0.5 font-medium" style={{ color: 'var(--color-hairline-strong)' }}>
            —
          </p>
        )}
      </div>
    </div>
  )
}
