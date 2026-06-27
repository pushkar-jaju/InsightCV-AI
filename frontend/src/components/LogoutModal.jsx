import { motion, AnimatePresence } from 'framer-motion'

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px]"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="relative w-full max-w-sm overflow-hidden rounded-lg z-10"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-hairline)',
            }}
          >
            <div className="p-6">
              {/* Warning Icon */}
              <div
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full mb-4"
                style={{ backgroundColor: 'rgba(207,45,86,0.08)' }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="var(--color-error)"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                  />
                </svg>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3
                  className="font-semibold"
                  style={{ color: 'var(--color-ink)', fontSize: '18px', fontWeight: '600' }}
                >
                  Sign Out
                </h3>
                <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
                  Are you sure you want to sign out of InsightCV AI?
                </p>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full inline-flex justify-center items-center rounded-md text-sm font-medium px-4 py-2.5 transition-colors duration-150"
                  style={{
                    backgroundColor: 'var(--color-canvas-soft)',
                    color: 'var(--color-ink)',
                    border: '1px solid var(--color-hairline-strong)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-strong)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="w-full inline-flex justify-center items-center rounded-md text-sm font-medium px-4 py-2.5 transition-colors duration-150"
                  style={{
                    backgroundColor: 'var(--color-error)',
                    color: '#ffffff',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#b02347' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-error)' }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
