import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Loader from '../components/Loader'
import Card from '../components/Card'
import Button from '../components/Button'
import { getProfile, getAnalyticsSummary } from '../services/api'

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile]         = useState(null)
  const [totalResumes, setTotalResumes] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, analyticsRes] = await Promise.all([
          getProfile(),
          getAnalyticsSummary(),
        ])
        setProfile(profileRes.data.user)
        setTotalResumes(analyticsRes.data.totalResumes)
      } catch {
        setError('Could not load profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    toast.success('Logged out successfully')
    setTimeout(() => navigate('/login'), 600)
  }

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Your account information and activity</p>
      </div>

      {loading ? <Loader message="Loading profile…" /> : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>
      ) : (
        <div className="space-y-5">
          <Card className="p-8">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
                <span className="text-white text-2xl font-extrabold">{initials}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">{profile?.email}</p>
            </div>

            {/* Info rows */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {[
                { label: 'Full Name', value: profile?.name },
                { label: 'Email Address', value: profile?.email },
                { label: 'Member Since', value: joinedDate },
                { label: 'Resumes Analyzed', value: totalResumes !== null ? totalResumes : '—', highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between items-center py-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
                  <span className={`text-sm font-bold ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-100'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Button variant="danger" size="lg" className="w-full" onClick={handleLogout}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </div>
      )}
    </div>
  )
}
