import { Link, useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
  },
  {
    to: '/upload',
    label: 'Upload Resume',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    ),
  },
  {
    to: '/job-match',
    label: 'Job Match',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
  },
]

export default function Sidebar({ open, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-700">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <span className="text-white font-extrabold text-sm">AI</span>
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">InsightCV AI</p>
          <p className="text-[10px] text-gray-400 leading-tight">AI-Powered Analyzer</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon }) => {
          const isActive = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
            >
              <svg className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {icon}
              </svg>
              <span>{label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-gray-100 dark:border-gray-700 pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay + drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          {/* Drawer */}
          <aside className="relative w-64 bg-white dark:bg-gray-800 flex flex-col h-full shadow-xl animate-slide-in z-50">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
