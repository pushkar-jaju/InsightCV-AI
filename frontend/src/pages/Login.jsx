import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import api from "../services/api";
import { setAccessToken, setRefreshToken } from "../services/api";

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeIcon = ({ open }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {open ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </>
    )}
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── Animation variants ────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};
const errorVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

// ─── Feature list for left panel ──────────────────────────────────────────
const FEATURES = [
  { label: 'ATS Score Analysis', desc: 'Get a detailed ATS compatibility score for any resume.' },
  { label: 'Job Match Detection', desc: 'Compare your resume against any job description.' },
  { label: 'AI Career Coach',     desc: 'Get personalised advice from an AI career advisor.' },
]

// ─── Component ────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) setForm((f) => ({ ...f, email: saved }));
    setRememberMe(!!saved);
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      setAccessToken(data.accessToken || data.token);
      setRefreshToken(data.refreshToken);
      if (rememberMe) localStorage.setItem("rememberedEmail", form.email);
      else localStorage.removeItem("rememberedEmail");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Check your credentials.";
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/google", {
        credential: tokenResponse.credential,
        accessToken: tokenResponse.access_token,
      });
      setAccessToken(data.accessToken || data.token);
      setRefreshToken(data.refreshToken);
      toast.success("Logged in with Google successfully");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Google sign-in failed. Please try again.";
      setError(msg);
      triggerShake();
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or failed. Please try again.");
    triggerShake();
    setGoogleLoading(false);
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
    onNonOAuthError: () => setGoogleLoading(false),
  });

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
            style={{
              color: 'var(--color-ink)',
              fontSize: '36px',
              lineHeight: '1.2',
              letterSpacing: '-0.72px',
            }}>
            Your resume,<br />
            <span style={{ color: 'var(--color-primary)' }}>analysed</span> by AI.
          </h1>
          <p className="mb-10" style={{ color: 'var(--color-body)', fontSize: '16px', lineHeight: '1.6' }}>
            Get ATS scores, job match analysis, and career coaching — all in one place.
          </p>

          {/* Feature list */}
          <div className="space-y-5">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex gap-3">
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

        {/* Footer quote */}
        <p style={{ color: 'var(--color-muted-soft)', fontSize: '12px' }}>
          Trusted by job seekers worldwide.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12"
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
            <h2 className="font-normal" style={{ color: 'var(--color-ink)', fontSize: '26px', lineHeight: '1.25', letterSpacing: '-0.325px' }}>
              Welcome back
            </h2>
            <p className="mt-2" style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
              Sign in to your InsightCV AI account
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
                    <path fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--color-ink)' }}>
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-muted)' }}>
                    <EmailIcon />
                  </span>
                  <input
                    id="login-email"
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                    Password
                  </label>
                  <button type="button" className="text-xs transition-colors"
                    style={{ color: 'var(--color-primary)' }}>
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-muted)' }}>
                    <LockIcon />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field pl-10 pr-11"
                    placeholder="••••••••"
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
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2.5">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="remember-me" className="text-sm cursor-pointer select-none"
                  style={{ color: 'var(--color-muted)' }}>
                  Remember me
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff', height: '44px' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-primary-active)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
              >
                {loading && <SpinnerIcon />}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
              <span className="text-xs font-medium uppercase tracking-widest"
                style={{ color: 'var(--color-muted-soft)' }}>
                or
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
            </div>

            {/* Google Login */}
            <div className="w-full">
              {googleLoading ? (
                <div
                  className="w-full h-11 flex items-center justify-center gap-3 rounded-md text-sm font-medium cursor-wait"
                  style={{
                    border: '1px solid var(--color-hairline-strong)',
                    color: 'var(--color-muted)',
                    backgroundColor: 'var(--color-canvas-soft)',
                  }}
                >
                  <SpinnerIcon />
                  <span>Connecting to Google...</span>
                </div>
              ) : (
                <button
                  type="button"
                  id="google-login-btn"
                  onClick={() => { setGoogleLoading(true); loginWithGoogle(); }}
                  className="w-full h-11 flex items-center justify-center gap-3 rounded-md text-sm font-medium transition-colors duration-150"
                  style={{
                    border: '1px solid var(--color-hairline-strong)',
                    backgroundColor: 'var(--color-surface-card)',
                    color: 'var(--color-ink)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-card)' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              )}
            </div>

            <p className="text-center text-sm mt-5" style={{ color: 'var(--color-muted)' }}>
              Don't have an account?{" "}
              <Link to="/register" className="font-medium transition-colors"
                style={{ color: 'var(--color-primary)' }}>
                Create account
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
