const PAGE_TITLES = {
  '/dashboard':     'Dashboard',
  '/upload':        'Resume Analyzer',
  '/history':       'Resume History',
  '/compare':       'Resume Comparison',
  '/job-match':     'Job Match',
  '/profile':       'Profile',
  '/rewrite':       'AI Resume Rewriter',
  '/interview-prep':'Interview Prep',
  '/career-coach':  'Career Coach',
}

export default function Header({ onMenuClick, pathname }) {
  const title = PAGE_TITLES[pathname] || 'InsightCV AI'

  return (
    <header
      className="sticky top-0 z-30 px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        borderBottom: '1px solid var(--color-hairline)',
      }}
    >
      {/* Left: hamburger + title with breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md transition-colors"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-muted uppercase" style={{ letterSpacing: '0.08em' }}>
            <span>Home</span>
            <span>/</span>
            <span style={{ color: 'var(--color-muted-soft)' }}>
              {PAGE_TITLES[pathname] || 'InsightCV AI'}
            </span>
          </div>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--color-ink)', marginTop: '2px' }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Right: wordmark */}
      <div className="flex items-center gap-2">
        <span className="text-caption-upper font-semibold hidden sm:block"
          style={{ color: 'var(--color-muted)', fontSize: '11px', letterSpacing: '0.88px', textTransform: 'uppercase' }}>
          InsightCV AI
        </span>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
      </div>
    </header>
  )
}
