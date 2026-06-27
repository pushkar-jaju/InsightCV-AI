import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Loader from '../components/Loader'
import Card from '../components/Card'
import Button from '../components/Button'
import { getProfile, getAnalyticsSummary } from '../services/api'
import LogoutModal from '../components/LogoutModal'

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile]         = useState(null)
  const [totalResumes, setTotalResumes] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [showLogoutModal, setShowLogoutModal] = useState(false)

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

  const handleLogoutConfirm = () => {
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
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: 'var(--color-muted)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div>
        <h1 className="font-normal"
          style={{ color: 'var(--color-ink)', fontSize: '26px', lineHeight: '1.25', letterSpacing: '-0.325px' }}>
          My Profile
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Your account information and activity
        </p>
      </div>

      {loading ? <Loader message="Loading profile…" /> : error ? (
        <div
          className="p-4 rounded-md text-sm"
          style={{
            backgroundColor: 'rgba(207,45,86,0.08)',
            border: '1px solid rgba(207,45,86,0.2)',
            color: 'var(--color-error)',
          }}
        >
          {error}
        </div>
      ) : (
        <div className="space-y-5">
          <Card className="p-8">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-8">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4 flex-shrink-0"
                style={{ backgroundColor: 'var(--color-ink)' }}
              >
                <span className="font-semibold text-2xl" style={{ color: 'var(--color-canvas)' }}>
                  {initials}
                </span>
              </div>
              <h2 className="font-semibold" style={{ color: 'var(--color-ink)', fontSize: '22px' }}>
                {profile?.name}
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--color-muted)' }}>
                {profile?.email}
              </p>
            </div>

            {/* Info rows */}
            <div style={{ borderTop: '1px solid var(--color-hairline)' }}>
              {[
                { label: 'Full Name',        value: profile?.name },
                { label: 'Email Address',    value: profile?.email },
                { label: 'Member Since',     value: joinedDate },
                { label: 'Resumes Analyzed', value: totalResumes !== null ? totalResumes : '—', highlight: true },
              ].map(({ label, value, highlight }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-4"
                  style={{ borderBottom: '1px solid var(--color-hairline)' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                    {label}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: highlight ? 'var(--color-primary)' : 'var(--color-ink)' }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium text-sm transition-colors duration-150"
            style={{
              color: 'var(--color-error)',
              border: '1px solid var(--color-error)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(207,45,86,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  )
}
