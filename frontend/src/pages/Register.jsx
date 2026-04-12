import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const EyeIcon = ({ open }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {open ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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

// ─── Password strength calculator ─────────────────────────────────────────────
const getStrength = (pw) => {
  let score = 0
  if (!pw) return { score: 0, label: '', color: '' }
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 3) return { score, label: 'Fair', color: 'bg-orange-400' }
  if (score === 4) return { score, label: 'Good', color: 'bg-yellow-400' }
  return { score, label: 'Strong', color: 'bg-emerald-400' }
}

// ─── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const errorVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
}

// ─── PasswordStrengthBar ──────────────────────────────────────────────────────
function PasswordStrengthBar({ password }) {
  const { score, label, color } = getStrength(password)
  if (!password) return null

  const bars = [1, 2, 3, 4, 5]
  const labelColor =
    score <= 2 ? 'text-red-400' :
    score === 3 ? 'text-orange-400' :
    score === 4 ? 'text-yellow-400' : 'text-emerald-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2"
    >
      <div className="flex items-center gap-1 mb-1">
        {bars.map((b) => (
          <div
            key={b}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${b <= score ? color : 'bg-white/10'}`}
          />
        ))}
        <span className={`text-xs font-semibold ml-1.5 ${labelColor}`}>{label}</span>
      </div>
      {/* Hint checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1.5">
        {[
          ['8+ characters', password.length >= 8],
          ['Uppercase letter', /[A-Z]/.test(password)],
          ['Lowercase letter', /[a-z]/.test(password)],
          ['Number', /[0-9]/.test(password)],
          ['Special character', /[^A-Za-z0-9]/.test(password)],
        ].map(([hint, met]) => (
          <div key={hint} className="flex items-center gap-1">
            <span className={`text-xs ${met ? 'text-emerald-400' : 'text-slate-600'}`}>
              {met ? '✓' : '○'}
            </span>
            <span className={`text-xs ${met ? 'text-slate-300' : 'text-slate-600'} transition-colors`}>
              {hint}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

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

    // Client-side password validation
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
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      })
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      setError(msg)
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 items-center justify-center p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />

        <motion.div
          className="relative z-10 text-white max-w-sm"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-xl shadow-lg">
              AI
            </div>
            <span className="text-2xl font-bold tracking-tight">InsightCV AI</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Start your AI-powered<br />career journey
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-10">
            Join thousands of job seekers who use InsightCV AI to land their dream roles faster.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '50K+', label: 'Resumes analyzed' },
              { value: '92%', label: 'ATS pass rate' },
              { value: '4.9★', label: 'User rating' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/60 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-12 overflow-y-auto scrollbar-thin">
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile logo */}
          <motion.div variants={itemVariants} className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-lg">
              AI
            </div>
            <span className="text-white font-bold text-xl tracking-tight">InsightCV AI</span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Create account</h1>
            <p className="text-slate-400 mt-2 text-sm">Start analyzing resumes with AI — free forever</p>
          </motion.div>

          {/* Glass card */}
          <motion.div
            variants={itemVariants}
            className={`glass-card rounded-2xl p-8 shadow-2xl ${shake ? 'animate-shake' : ''}`}
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
                  className="mb-5 flex items-center gap-2 p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-sm"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full name</label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <UserIcon />
                  </span>
                  <input
                    id="register-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    placeholder="Rohit Sharma"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <EmailIcon />
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    placeholder="rohit@example.com"
                  />
                </div>
              </div>

              {/* Password + Strength */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <LockIcon />
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <PasswordStrengthBar password={form.password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm password</label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <LockIcon />
                  </span>
                  <input
                    id="register-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className={`w-full pl-10 pr-11 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 transition-all duration-200 ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                        : form.confirmPassword && form.password === form.confirmPassword
                        ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500'
                        : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 mt-1.5"
                  >
                    Passwords do not match
                  </motion.p>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-emerald-400 mt-1.5"
                  >
                    ✓ Passwords match
                  </motion.p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-violet-500/25"
              >
                {loading && <SpinnerIcon />}
                {loading ? 'Creating account…' : 'Create Account'}
              </motion.button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>

          {/* Terms */}
          <motion.p variants={itemVariants} className="text-center text-xs text-slate-600 mt-6">
            By creating an account, you agree to our{' '}
            <span className="text-slate-500 hover:text-slate-400 cursor-pointer transition-colors">Terms of Service</span>
            {' '}and{' '}
            <span className="text-slate-500 hover:text-slate-400 cursor-pointer transition-colors">Privacy Policy</span>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
