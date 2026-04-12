/**
 * Button — unified button component
 * Props: variant ('primary'|'secondary'|'danger'|'ghost'), size ('sm'|'md'|'lg'), children, className, ...rest
 */

const VARIANTS = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-200 dark:hover:shadow-indigo-900',
  secondary: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600',
  danger: 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({ variant = 'primary', size = 'md', children, className = '', disabled, ...rest }) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-xl
        transition-all duration-200
        hover:scale-[1.03] active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  )
}
