import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const EyeIcon = ({ open }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {open ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </>
    )}
  </svg>
)

const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

// ─── Password strength ────────────────────────────────────────────────────────
const getStrength = (pw) => {
  let score = 0
  if (!pw) return { score: 0, label: '', color: '' }
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { score, label: 'Weak',   color: 'var(--color-error)' }
  if (score <= 3) return { score, label: 'Fair',   color: '#c08532' }
  if (score === 4) return { score, label: 'Good',  color: '#1f8a65' }
  return { score, label: 'Strong', color: '#1f8a65' }
}

// ─── Animation variants ────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut', staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}
const errorVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}

// ─── Password Strength Bar ─────────────────────────────────────────────────
function PasswordStrengthBar({ password }) {
  const { score, label, color } = getStrength(password)
  if (!password) return null
  const bars = [1, 2, 3, 4, 5]

  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
      <div className="flex items-center gap-1 mb-2">
        {bars.map((b) => (
          <div
            key={b}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: b <= score ? color : 'var(--color-hairline)' }}
          />
        ))}
        <span className="text-xs font-semibold ml-2" style={{ color }}>{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {[
          ['8+ characters', password.length >= 8],
          ['Uppercase letter', /[A-Z]/.test(password)],
          ['Lowercase letter', /[a-z]/.test(password)],
          ['Number', /[0-9]/.test(password)],
          ['Special character', /[^A-Za-z0-9]/.test(password)],
        ].map(([hint, met]) => (
          <div key={hint} className="flex items-center gap-1">
            <span className="text-xs" style={{ color: met ? 'var(--color-semantic-success, #1f8a65)' : 'var(--color-hairline-strong)' }}>
              {met ? '✓' : '○'}
            </span>
            <span className="text-xs transition-colors" style={{ color: met ? 'var(--color-body)' : 'var(--color-muted-soft)' }}>
              {hint}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Feature list for left panel ──────────────────────────────────────────
const FEATURES = [
  { label: 'ATS Score Analysis', desc: 'Get a detailed ATS compatibility score for any resume.' },
  { label: 'Job Match Detection', desc: 'Compare your resume against any job description.' },
  { label: 'AI Career Coach',     desc: 'Get personalised advice from an AI career advisor.' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const strength = getStrength(form.password)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 450)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      triggerShake()
      return
    }
    if (strength.score < 4) {
      setError('Please choose a stronger password (Good or Strong rating)')
      triggerShake()
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password })
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      setError(msg)
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const confirmBorderColor =
    !form.confirmPassword ? 'var(--color-hairline-strong)' :
    form.password !== form.confirmPassword ? 'var(--color-error)' :
    'var(--color-semantic-success, #1f8a65)'

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-canvas)' }}>
      {/* ── Left editorial panel ── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-16"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          borderRight: '1px solid var(--color-hairline)',
        }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h8M2 12h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-semibold" style={{ color: 'var(--color-ink)', fontSize: '16px' }}>
            InsightCV AI
          </span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="font-normal mb-6"
            style={{ color: 'var(--color-ink)', fontSize: '36px', lineHeight: '1.2', letterSpacing: '-0.72px' }}>
            Start your AI-powered<br />
            <span style={{ color: 'var(--color-primary)' }}>career journey.</span>
          </h1>
          <p className="mb-10" style={{ color: 'var(--color-body)', fontSize: '16px', lineHeight: '1.6' }}>
            Join thousands of job seekers who use InsightCV AI to land their dream roles faster.
          </p>

          {/* Feature list */}
          <div className="space-y-5">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex gap-3 text-left">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--color-ink)', fontSize: '14px' }}>{f.label}</p>
                  <p className="mt-0.5" style={{ color: 'var(--color-muted)', fontSize: '13px' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'var(--color-muted-soft)', fontSize: '12px' }}>
          Free to use. No credit card required.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto scrollbar-thin"
        style={{ backgroundColor: 'var(--color-canvas)' }}>
        <motion.div
          className="w-full max-w-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile logo */}
          <motion.div variants={itemVariants} className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h8M2 12h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-semibold" style={{ color: 'var(--color-ink)', fontSize: '16px' }}>
              InsightCV AI
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="font-normal"
              style={{ color: 'var(--color-ink)', fontSize: '26px', lineHeight: '1.25', letterSpacing: '-0.325px' }}>
              Create account
            </h2>
            <p className="mt-2" style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
              Start analyzing resumes with AI — free forever
            </p>
          </motion.div>

          {/* Form card */}
          <motion.div
            variants={itemVariants}
            className={`rounded-lg p-7 ${shake ? 'animate-shake' : ''}`}
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-hairline)',
            }}
          >
            {/* Error banner */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="mb-5 flex items-center gap-2 p-3 rounded-md text-sm"
                  style={{
                    backgroundColor: 'rgba(207,45,86,0.08)',
                    border: '1px solid rgba(207,45,86,0.2)',
                    color: 'var(--color-error)',
                  }}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                  Full name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }}>
                    <UserIcon />
                  </span>
                  <input
                    id="register-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field pl-10"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }}>
                    <EmailIcon />
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }}>
                    <LockIcon />
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field pl-10 pr-11"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--color-muted)' }}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <PasswordStrengthBar password={form.password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                  Confirm password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }}>
                    <LockIcon />
                  </span>
                  <input
                    id="register-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="input-field pl-10 pr-11"
                    style={{ borderColor: confirmBorderColor }}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--color-muted)' }}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs mt-1.5" style={{ color: 'var(--color-error)' }}>
                    Passwords do not match
                  </motion.p>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs mt-1.5" style={{ color: '#1f8a65' }}>
                    ✓ Passwords match
                  </motion.p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff', height: '44px' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-primary-active)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
              >
                {loading && <SpinnerIcon />}
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: 'var(--color-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-medium transition-colors"
                style={{ color: 'var(--color-primary)' }}>
                Sign in
              </Link>
            </p>
          </motion.div>

          {/* Terms */}
          <motion.p variants={itemVariants} className="text-center text-xs mt-5"
            style={{ color: 'var(--color-muted-soft)' }}>
            By creating an account, you agree to our{' '}
            <span className="cursor-pointer" style={{ color: 'var(--color-muted)' }}>Terms of Service</span>
            {' '}and{' '}
            <span className="cursor-pointer" style={{ color: 'var(--color-muted)' }}>Privacy Policy</span>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
