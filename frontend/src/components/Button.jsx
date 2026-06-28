/**
 * Button — unified button component per DESIGN.md
 * Props: variant ('primary'|'secondary'|'download'|'danger'|'ghost'), size ('sm'|'md'|'lg'), children, className, ...rest
 */

const VARIANTS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  download:  'btn-download',
  danger:    'btn-danger',
  ghost:     'bg-transparent hover:bg-canvas-soft text-body-text',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm h-8',
  md: 'px-[18px] py-[10px] text-btn h-10',
  lg: 'px-5 py-3 text-btn h-11',
}

export default function Button({ variant = 'primary', size = 'md', children, className = '', disabled, ...rest }) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-md
        transition-all duration-150 active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  )
}
