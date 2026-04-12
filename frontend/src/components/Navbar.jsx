import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/upload',    label: 'Upload' },
    { to: '/job-match', label: 'Job Match' },
    { to: '/profile',   label: 'Profile' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">InsightCV AI</span>
          </Link>

          {token && (
            <div className="flex items-center gap-1">
              {navLinks.map(({ to, label }) => {
                const isActive = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="ml-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
