/** SectionHeader — titled section with optional subtitle */
export default function SectionHeader({ title, subtitle, className = '' }) {
  return (
    <div className={`mb-5 ${className}`}>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}
