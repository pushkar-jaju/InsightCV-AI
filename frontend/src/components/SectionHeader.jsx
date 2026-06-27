/** SectionHeader — titled section with optional subtitle per DESIGN.md typography */
export default function SectionHeader({ title, subtitle, className = '' }) {
  return (
    <div className={`mb-5 ${className}`}>
      <h2
        className="font-normal"
        style={{
          color: 'var(--color-ink)',
          fontSize: '22px',
          lineHeight: '1.3',
          letterSpacing: '-0.11px',
          fontWeight: '400',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="mt-1"
          style={{
            color: 'var(--color-muted)',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
