export default function SkillsList({ items = [], color = 'green', emptyMessage = 'None found' }) {
  const colorMap = {
    green: { bg: 'rgba(31,138,101,0.08)', text: '#1f8a65' },
    red:   { bg: 'rgba(207,45,86,0.08)', text: '#cf2d56' },
    blue:  { bg: 'rgba(159,187,224,0.2)', text: '#3a6fa8' },
    gray:  { bg: 'var(--color-surface-strong)', text: 'var(--color-muted)' },
  }
  const style = colorMap[color] || colorMap.gray

  if (!items.length) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--color-muted-soft)' }}>
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="px-3 py-1 rounded-pill text-xs font-semibold"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          {item}
        </span>
      ))}
    </div>
  )
}
