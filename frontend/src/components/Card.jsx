/**
 * Card — reusable content card per DESIGN.md feature-card spec
 * Background: surface-card (#fff), Border: 1px hairline (#e6e5e0), Radius: rounded-lg (12px), NO shadow
 */
export default function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`rounded-lg ${hover ? 'transition-colors duration-150' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--color-surface-card)',
        border: '1px solid var(--color-hairline)',
      }}
    >
      {children}
    </div>
  )
}
