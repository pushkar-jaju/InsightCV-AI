import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import api from "../services/api";
import { setAccessToken, setRefreshToken } from "../services/api";

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const EmailIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const EyeIcon = ({ open }) => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {open ? (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </>
    ) : (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
        />
      </>
    )}
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

// ─── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const errorVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Restore remembered email
  useEffect(() => {
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) setForm((f) => ({ ...f, email: saved }));
    setRememberMe(!!saved);
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  // ─── Email / password login ────────────────────────────────────────────────
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
      const msg =
        err.response?.data?.message || "Login failed. Check your credentials.";
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ─── Google login success ──────────────────────────────────────────────────
  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/google", {
        credential: tokenResponse.credential, // Original approach fallback
        accessToken: tokenResponse.access_token, // New implicit flow approach
      });

      setAccessToken(data.accessToken || data.token);
      setRefreshToken(data.refreshToken);

      toast.success("Logged in with Google successfully 🎉");
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Google sign-in failed. Please try again.";
      setError(msg);
      triggerShake();
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Google login error ────────────────────────────────────────────────────
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
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 items-center justify-center p-12">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-indigo-300/10 rounded-full blur-2xl" />

        <motion.div
          className="relative z-10 text-white max-w-sm"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-xl shadow-lg">
              AI
            </div>
            <span className="text-2xl font-bold tracking-tight">InsightCV AI</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Analyze resumes
            <br />
            with the power of AI
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-10">
            Get detailed insights, ATS scores, and job match analysis — all
            powered by cutting-edge AI.
          </p>

          {/* Feature pills */}
          {[
            "⚡ ATS Score Analysis",
            "🎯 Job Match Detection",
            "📊 Skill Insights",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-white/85 text-sm font-medium">{f}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-12">
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile logo */}
          <motion.div
            variants={itemVariants}
            className="flex lg:hidden items-center gap-2 mb-8 justify-center"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-lg">
              AI
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              InsightCV AI
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Sign in to your InsightCV AI account
            </p>
          </motion.div>

          {/* Glass card */}
          <motion.div
            variants={itemVariants}
            className={`glass-card rounded-2xl p-8 shadow-2xl ${shake ? "animate-shake" : ""}`}
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
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email address
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <EmailIcon />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <LockIcon />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    placeholder="••••••••"
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
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2.5">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer accent-indigo-500"
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm text-slate-400 cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading || googleLoading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-indigo-500/25"
              >
                {loading && <SpinnerIcon />}
                {loading ? "Signing in…" : "Sign In"}
              </motion.button>
            </form>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                or
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* ── Google Login ── */}
            <div className="w-full relative flex items-center justify-center min-h-[44px]">
              {googleLoading ? (
                <div className="w-full h-[40px] flex items-center justify-center gap-3 rounded-full border border-slate-600/50 bg-[#131314] text-slate-200 text-[14px] font-medium shadow-sm animate-pulse cursor-wait transition-all">
                  <SpinnerIcon className="animate-spin h-4 w-4 text-slate-400" />
                  <span className="tracking-wide">Connecting to Google...</span>
                </div>
              ) : (
                <button
                  type="button"
                  id="google-login-btn"
                  onClick={() => {
                    setGoogleLoading(true);
                    loginWithGoogle();
                  }}
                  className="w-full h-[40px] flex items-center justify-center gap-3 rounded-full border border-slate-700/50 hover:border-slate-600 bg-[#131314] text-slate-200 text-[14px] font-medium shadow-sm hover:shadow-md hover:bg-[#1a1a1c] active:scale-[0.98] transition-all duration-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="tracking-wide">Continue with Google</span>
                </button>
              )}
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
              >
                Create account
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
