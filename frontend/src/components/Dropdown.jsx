import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dropdown({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = 'Select an option',
  icon,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((o) => o.value === value)

  const defaultIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors duration-150 disabled:opacity-60"
        style={{
          border: '1px solid var(--color-hairline-strong)',
          backgroundColor: 'var(--color-surface-card)',
          color: 'var(--color-ink)',
          height: '40px',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-hairline-strong)' }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
            {icon || defaultIcon}
          </div>
          <span className="font-medium truncate" style={{ color: selectedOption ? 'var(--color-ink)' : 'var(--color-muted-soft)' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: 'var(--color-muted)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-1.5 rounded-lg overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-hairline)',
            }}
          >
            <div className="max-h-60 overflow-y-auto w-full p-1.5 scrollbar-thin">
              {options.map((o) => {
                const isSelected = o.value === value
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { onChange(o.value); setIsOpen(false) }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors duration-100"
                    style={{
                      backgroundColor: isSelected ? 'rgba(245,78,0,0.06)' : 'transparent',
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-ink)',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <div className="flex items-center gap-2.5 w-full pr-3">
                      <div className="flex-shrink-0" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                        {icon || defaultIcon}
                      </div>
                      <span className="truncate flex-1 text-left font-medium">{o.label}</span>
                      {isSelected && (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          style={{ color: 'var(--color-primary)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
