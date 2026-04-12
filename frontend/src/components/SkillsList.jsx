export default function SkillsList({ items = [], color = 'green', emptyMessage = 'None found' }) {
  const colorMap = {
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-700',
  }
  const tagClass = colorMap[color] || colorMap.gray

  if (!items.length) {
    return <p className="text-sm text-gray-400 italic">{emptyMessage}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`px-3 py-1 rounded-full text-xs font-semibold ${tagClass}`}>
          {item}
        </span>
      ))}
    </div>
  )
}
