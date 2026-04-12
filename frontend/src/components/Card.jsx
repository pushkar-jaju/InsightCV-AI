/**
 * Card — reusable content card
 * Props: className (string), hover (bool, default true), children
 */
export default function Card({ children, className = '', hover = true }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm
        ${hover ? 'hover:shadow-md transition-shadow duration-300' : ''}
        ${className}`}
    >
      {children}
    </div>
  )
}
