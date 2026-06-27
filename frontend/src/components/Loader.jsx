export default function Loader({ message = 'Processing...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="relative w-10 h-10">
        {/* Track ring */}
        <div className="w-10 h-10 rounded-full border-2" style={{ borderColor: 'var(--color-hairline-strong)' }} />
        {/* Spinning arc */}
        <div
          className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: 'var(--color-primary)' }}
        />
      </div>
      <p
        className="text-sm font-medium"
        style={{ color: 'var(--color-muted)' }}
      >
        {message}
      </p>
    </div>
  )
}
