import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getProfile } from '../services/api'

// ─── Custom Icons ─────────────────────────────────────────────────────────────
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const StarsIcon = () => (
  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

// ─── FAQ Accordion Component ──────────────────────────────────────────────────
function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-hairline py-4">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left py-2 font-medium text-ink hover:text-primary transition-colors focus:outline-none"
      >
        <span className="text-base sm:text-lg">{question}</span>
        <span className="ml-4 flex-shrink-0 text-muted">
          {isOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-4 pt-2 text-body-text text-sm sm:text-base leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeFAQ, setActiveFAQ] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
      getProfile()
        .then((res) => {
          setProfile(res.data.user)
        })
        .catch((err) => {
          console.error('Error fetching profile on landing page:', err)
          localStorage.removeItem('token')
          setIsLoggedIn(false)
        })
    }
  }, [])

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const profileName = profile?.name || 'User'

  // Header scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      title: 'AI Resume Analyzer',
      desc: 'Scan your resume structure, keyword densities, and formatting against standard ATS rules instantly.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'ATS Score Analysis',
      desc: 'Get an overall compatibility grade of how well your resume matches parsing algorithms.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: 'Resume Rewriter',
      desc: 'Rewrite weak work experience descriptions into action-packed sentences with key metrics.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    },
    {
      title: 'Job Match Analysis',
      desc: 'Upload a job description and check the semantic compatibility match percentage with your resume.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'AI Career Coach',
      desc: 'Interact with an adaptive chatbot providing tailored advice on landing your target roles.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      title: 'Interview Q&A Generator',
      desc: 'Generate role-specific test questions derived straight from resume experience gaps.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Skill Gap Analysis',
      desc: 'Identify critical skills lacking in your portfolio relative to current market listings.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      title: 'Career Roadmap',
      desc: 'Plot custom skill acquisition timelines tailored specifically to bridge to higher positions.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      title: 'Analytics Dashboard',
      desc: 'Monitor resume updates, score progression, and interview preparation performance in real-time.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      )
    }
  ]

  const steps = [
    {
      number: '1',
      title: 'Create Account',
      desc: 'Securely register your account to begin managing multiple resume versions.'
    },
    {
      number: '2',
      title: 'Upload Resume',
      desc: 'Drop your resume (PDF or Word format) onto our secure scanning analysis pane.'
    },
    {
      number: '3',
      title: 'AI Analysis',
      desc: 'Our agentic algorithms parse formatting structure and cross-match job descriptions.'
    },
    {
      number: '4',
      title: 'Improve & Get Hired',
      desc: 'Follow clear rewrites, practice tailored interview questions, and secure callback offers.'
    }
  ]

  const benefits = [
    {
      title: 'Increase ATS Score',
      desc: 'Ensure parsing software identifies keywords and structures correctly without layout errors.'
    },
    {
      title: 'AI-Powered Suggestions',
      desc: 'Receive immediate semantic recommendations to optimize bullet point metrics and verb action.'
    },
    {
      title: 'Personalized Guidance',
      desc: 'Receive dynamic roadmaps tailored precisely to your specific experience profile.'
    },
    {
      title: 'Resume Optimization',
      desc: 'Adapt layout templates, content wording, and skill mappings directly for target jobs.'
    },
    {
      title: 'Interview Preparation',
      desc: 'Interact with AI mentors testing technical and behavioural concepts on customized mock logs.'
    },
    {
      title: 'Professional Reports',
      desc: 'Download clean feedback cards identifying format improvements and missing industry badges.'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Product Manager at Linear',
      avatarText: 'SJ',
      feedback: 'InsightCV AI completely changed how I approach my applications. By matching my bullet points directly to key metrics, my interview callback rate went from 10% to over 40% in just two weeks.'
    },
    {
      name: 'David Chen',
      role: 'Senior Software Engineer',
      avatarText: 'DC',
      feedback: 'The ATS score analyzer is incredibly thorough. It highlighted formatting errors and nesting layout bugs that standard parsers stumble on. The rewriter tool saved me hours of editing.'
    },
    {
      name: 'Elena Rodriguez',
      role: 'UX Designer at Vercel',
      avatarText: 'ER',
      feedback: 'The Career Coach felt like talking to a real mentor who knows exactly what design recruiters look for. It pointed out critical gaps in my skill presentation that standard tools missed.'
    }
  ]

  const faqs = [
    {
      q: 'Is my resume data secure?',
      a: 'Absolutely. We store all uploaded resumes securely using standard database encryption. Your personal data is never sold to third-party data brokers or external entities.'
    },
    {
      q: 'How does the ATS analyzer score resumes?',
      a: 'Our engine runs Simulated Parsing Routines which duplicate the algorithm structures of popular enterprise ATS systems. We grade formatting compatibility, keyword densities, and header layouts.'
    },
    {
      q: 'Can I use InsightCV AI for free?',
      a: 'Yes! Our free tier includes basic resume analysis scan counts and access to standard AI career coach tokens to get you started.'
    },
    {
      q: 'How does the Resume Rewriter function?',
      a: 'It scans your experience blocks for passive sentences and uses localized AI layers to reformat them using the XYZ formula (Accomplished [X], measured by [Y], by doing [Z]).'
    }
  ]

  const handleScrollTo = (id) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--color-canvas)' }}>
      {/* ─── Navigation Bar ────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-surface/90 backdrop-blur-md border-b border-hairline'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-primary">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h8M2 12h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-semibold text-ink text-lg tracking-tight">InsightCV AI</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-nav text-body-text hover:text-ink transition-colors font-medium">Home</button>
            <button onClick={() => handleScrollTo('features')} className="text-nav text-body-text hover:text-ink transition-colors font-medium">Features</button>
            <button onClick={() => handleScrollTo('about')} className="text-nav text-body-text hover:text-ink transition-colors font-medium">About</button>
            <button onClick={() => handleScrollTo('faq')} className="text-nav text-body-text hover:text-ink transition-colors font-medium">FAQ</button>
          </nav>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="text-nav text-body-text hover:text-ink transition-colors font-medium">
                  Dashboard
                </Link>
                <Link to="/profile" className="w-9 h-9 rounded-full flex items-center justify-center bg-ink border border-hairline relative group overflow-hidden transition-all duration-150 hover:border-primary" title="View Profile">
                  <span className="font-semibold text-xs text-canvas">
                    {initials}
                  </span>
                </Link>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary text-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-md text-body-text hover:text-ink hover:bg-canvas-soft transition-all"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* Mobile menu drawer overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/25 backdrop-blur-[2px]"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-64 ml-auto h-full flex flex-col p-6 z-50 shadow-xl border-l border-hairline bg-surface"
            >
              {/* Close Button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-md text-muted hover:text-ink hover:bg-canvas-soft transition-colors"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>

              <div className="flex flex-col gap-6 mt-12 flex-1">
                <button
                  onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}
                  className="text-left font-medium text-ink hover:text-primary transition-colors text-lg"
                >
                  Home
                </button>
                <button
                  onClick={() => handleScrollTo('features')}
                  className="text-left font-medium text-ink hover:text-primary transition-colors text-lg"
                >
                  Features
                </button>
                <button
                  onClick={() => handleScrollTo('about')}
                  className="text-left font-medium text-ink hover:text-primary transition-colors text-lg"
                >
                  About
                </button>
                <button
                  onClick={() => handleScrollTo('faq')}
                  className="text-left font-medium text-ink hover:text-primary transition-colors text-lg"
                >
                  FAQ
                </button>

                <div className="border-t border-hairline pt-6 flex flex-col gap-4 mt-auto">
                  {isLoggedIn ? (
                    <>
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="btn btn-primary w-full text-center"
                      >
                        Go to Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="btn btn-secondary w-full text-center"
                      >
                        View Profile ({profileName})
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="btn btn-secondary w-full text-center"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="btn btn-primary w-full text-center"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Main Content ──────────────────────────────────────────────────────── */}
      <main className="flex-1">
        {/* ─── Hero Section ───────────────────────────────────────────────────── */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 overflow-hidden border-b border-hairline">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            {/* Top Category Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="badge-pill mb-6 bg-surface-strong"
            >
              Introducing InsightCV AI
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-display-mega text-ink max-w-4xl font-normal leading-none"
            >
              Build a resume that gets past the machines. Get hired.
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-body-text max-w-2xl text-lg sm:text-xl font-normal leading-relaxed"
            >
              Optimize your resume for automated applicant tracking systems, rewrite passive bullet points with impact metrics, and practice mock interviews with your personalized AI Career Coach.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 items-center"
            >
              {isLoggedIn ? (
                <Link to="/dashboard" className="btn btn-primary h-11 px-6 rounded-md text-base w-full sm:w-auto">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary h-11 px-6 rounded-md text-base w-full sm:w-auto">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-secondary h-11 px-6 rounded-md text-base w-full sm:w-auto">
                    Sign In
                  </Link>
                  <Link to="/register" className="text-nav text-body-text hover:text-ink transition-colors font-medium sm:ml-2">
                    Create Free Account →
                  </Link>
                </>
              )}
            </motion.div>

            {/* Interactive Mockup Visual */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 w-full max-w-4xl card border border-hairline overflow-hidden relative"
              style={{ backgroundColor: 'var(--color-surface-card)' }}
            >
              {/* Mockup Header Bar */}
              <div className="h-10 border-b border-hairline bg-canvas-soft flex items-center justify-between px-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/40" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/20 border border-amber-400/40" />
                  <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/40" />
                </div>
                <div className="text-caption text-muted font-mono text-[11px]">insightcv-agentic-pipeline.js</div>
                <div className="w-12" />
              </div>

              {/* Mockup Panes Split */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[340px]">
                {/* Left Pane - Resume Scan */}
                <div className="md:col-span-5 border-r border-hairline p-5 flex flex-col gap-3 text-left">
                  <div className="text-caption-upper font-semibold text-muted text-[10px]">PARSED CV STRUCTURE</div>
                  <div className="p-3 border border-red-200 bg-red-50/20 rounded-lg">
                    <div className="text-xs font-semibold text-danger flex justify-between">
                      <span>Bullet Point 3 (Passive)</span>
                      <span className="font-mono">SCORE: 45/100</span>
                    </div>
                    <p className="text-xs font-mono text-body-text mt-1.5">
                      "Responsible for working on frontend React web applications and doing bug fixes."
                    </p>
                  </div>

                  <div className="p-3 border border-emerald-200 bg-emerald-50/20 rounded-lg">
                    <div className="text-xs font-semibold text-success flex justify-between">
                      <span>AI Rewritten (Metric-driven)</span>
                      <span className="font-mono">SCORE: 96/100</span>
                    </div>
                    <p className="text-xs font-mono text-body-text mt-1.5">
                      "Spearheaded React migration of 4 major client products, boosting frontend payload performance by 32%."
                    </p>
                  </div>
                </div>

                {/* Right Pane - Agent Timeline Stages */}
                <div className="md:col-span-7 p-6 bg-canvas-soft flex flex-col justify-between gap-5 text-left font-mono">
                  <div className="text-caption-upper font-semibold text-muted text-[10px]">MULTI-AGENT TIMELINE</div>

                  <div className="flex flex-col gap-3.5">
                    {/* thinking */}
                    <div className="flex items-center gap-3">
                      <span className="badge-pill pill-thinking shrink-0 text-[10px]">THINKING</span>
                      <span className="text-xs text-body-text">Scanning layout schema, font sizes, and nesting margins...</span>
                    </div>

                    {/* read */}
                    <div className="flex items-center gap-3">
                      <span className="badge-pill pill-read shrink-0 text-[10px]">READING</span>
                      <span className="text-xs text-body-text">Extracted 4 experience elements and parsed 18 technical keywords.</span>
                    </div>

                    {/* grep */}
                    <div className="flex items-center gap-3">
                      <span className="badge-pill pill-grep shrink-0 text-[10px]">GREPPING</span>
                      <span className="text-xs text-body-text">Checking matches for "Tailwind CSS", "React", and "Vite" configurations.</span>
                    </div>

                    {/* edit */}
                    <div className="flex items-center gap-3">
                      <span className="badge-pill pill-edit shrink-0 text-[10px]">EDITING</span>
                      <span className="text-xs text-body-text">Optimizing weak descriptions into standard metric-driven syntax.</span>
                    </div>

                    {/* done */}
                    <div className="flex items-center gap-3">
                      <span className="badge-pill pill-done shrink-0 text-[10px]">DONE</span>
                      <span className="text-xs text-success font-semibold">ATS validation completed successfully. Output ready.</span>
                    </div>
                  </div>

                  {/* Code Block footer */}
                  <div className="p-3 border border-hairline bg-surface rounded-lg mt-2">
                    <span className="text-caption font-mono text-ink block">
                      &#123; "atsScore": 96, "matchRatio": "92%", "status": "Optimized" &#125;
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── Features Section ───────────────────────────────────────────────── */}
        <section id="features" className="px-4 sm:px-6 lg:px-8 py-20 border-b border-hairline bg-surface">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-display-lg text-ink font-normal tracking-tight">
                An AI-powered suite for the modern job hunt.
              </h2>
              <p className="mt-4 text-body-text text-base sm:text-lg leading-relaxed">
                Unlock automated resumes, targeted keyword alignment scanners, and custom interview prep coaches within one single workspace.
              </p>
            </div>

            {/* Grid of 9 features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4, borderColor: 'var(--color-primary)' }}
                  transition={{ duration: 0.2 }}
                  className="card border border-hairline p-6 flex flex-col gap-4 text-left transition-colors bg-surface"
                >
                  <div className="w-10 h-10 rounded-md bg-canvas-soft border border-hairline flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-title-sm font-semibold text-ink">{feature.title}</h3>
                    <p className="mt-2 text-body-sm text-body-text leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works Section ───────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 border-b border-hairline" style={{ backgroundColor: 'var(--color-canvas)' }}>
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-display-lg text-ink font-normal tracking-tight">
                How It Works
              </h2>
              <p className="mt-4 text-body-text text-base">
                Four simple steps to optimize your resume and land your next role.
              </p>
            </div>

            {/* Timeline Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left relative">
                  {/* Step Connector line (Desktop only) */}
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-5 left-10 w-full h-[1px] bg-hairline-strong z-0" />
                  )}

                  {/* Step number badge */}
                  <div className="w-10 h-10 rounded-full border border-hairline-strong bg-surface flex items-center justify-center text-title-sm font-semibold text-ink relative z-10 shadow-sm mb-4">
                    {step.number}
                  </div>

                  <h3 className="text-title-sm font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-body-sm text-body-text leading-relaxed max-w-xs">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Benefits Section ───────────────────────────────────────────────── */}
        <section id="about" className="px-4 sm:px-6 lg:px-8 py-20 border-b border-hairline bg-surface">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-display-lg text-ink font-normal tracking-tight">
                Why Choose InsightCV AI
              </h2>
              <p className="mt-4 text-body-text text-base">
                Our features are built explicitly to match the hiring standards of modern tech and SaaS teams.
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex flex-col text-left gap-2 border-l border-hairline-strong pl-6 py-1">
                  <h3 className="text-title-sm font-semibold text-ink">{benefit.title}</h3>
                  <p className="text-body-sm text-body-text leading-relaxed mt-1">
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials Section ───────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 border-b border-hairline" style={{ backgroundColor: 'var(--color-canvas)' }}>
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-display-lg text-ink font-normal tracking-tight">
                Trusted by job seekers worldwide.
              </h2>
              <p className="mt-4 text-body-text text-base">
                See how job candidates are securing technical, design, and product interviews.
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="card border border-hairline p-6 flex flex-col justify-between text-left bg-surface"
                >
                  <p className="text-body-sm text-body-text italic leading-relaxed">
                    "{t.feedback}"
                  </p>
                  <div className="flex items-center gap-3.5 mt-6 pt-4 border-t border-hairline">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {t.avatarText}
                    </div>
                    <div>
                      <h4 className="text-title-sm font-semibold text-ink leading-none">{t.name}</h4>
                      <p className="text-[12px] text-muted font-medium mt-1">{t.role}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      <StarsIcon />
                      <StarsIcon />
                      <StarsIcon />
                      <StarsIcon />
                      <StarsIcon />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ Accordion Section ──────────────────────────────────────────── */}
        <section id="faq" className="px-4 sm:px-6 lg:px-8 py-20 border-b border-hairline bg-surface">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="text-display-lg text-ink font-normal tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-body-text text-base">
                Have questions about our security or how the AI scanner functions? Check standard details below.
              </p>
            </div>

            {/* Accordion list */}
            <div className="border-t border-hairline">
              {faqs.map((faq, idx) => (
                <FAQItem
                  key={idx}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={activeFAQ === idx}
                  onToggle={() => setActiveFAQ(activeFAQ === idx ? null : idx)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Final CTA Section ──────────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 py-24 text-center border-b border-hairline bg-canvas">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <h2 className="text-display-lg text-ink font-normal tracking-tight max-w-2xl leading-tight">
              Ready to accelerate your career?
            </h2>
            <p className="mt-4 text-body-text text-base max-w-md">
              Join thousands of job seekers who have successfully optimized their resume structure and aced mock interviews.
            </p>
            <div className="mt-8">
              <Link to="/register" className="btn btn-primary h-11 px-8 rounded-md text-base">
                Get Started Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-canvas border-t border-hairline px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo column */}
          <div className="col-span-2 flex flex-col gap-4 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-6.5 h-6.5 rounded-md flex items-center justify-center bg-primary shrink-0">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M2 8h8M2 12h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-semibold text-ink text-base tracking-tight">InsightCV AI</span>
            </div>
            <p className="text-body-sm text-body-text leading-relaxed max-w-xs">
              AI-powered resume optimization scoring, ATS alignment mapping, and mock coding coaches.
            </p>
            <p className="text-[12px] text-muted mt-4">
              &copy; {new Date().getFullYear()} InsightCV AI. All rights reserved.
            </p>
          </div>

          {/* About Links */}
          <div className="flex flex-col gap-3 text-left">
            <h4 className="text-caption-upper font-semibold text-ink text-[11px]">Company</h4>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-body-sm text-body-text hover:text-ink text-left transition-colors font-medium">Home</button>
            <button onClick={() => handleScrollTo('about')} className="text-body-sm text-body-text hover:text-ink text-left transition-colors font-medium">About</button>
            <button onClick={() => handleScrollTo('faq')} className="text-body-sm text-body-text hover:text-ink text-left transition-colors font-medium">FAQ</button>
          </div>

          {/* Features Links */}
          <div className="flex flex-col gap-3 text-left">
            <h4 className="text-caption-upper font-semibold text-ink text-[11px]">Product</h4>
            <button onClick={() => handleScrollTo('features')} className="text-body-sm text-body-text hover:text-ink text-left transition-colors font-medium">Features</button>
            <Link to="/login" className="text-body-sm text-body-text hover:text-ink transition-colors font-medium">Login</Link>
            <Link to="/register" className="text-body-sm text-body-text hover:text-ink transition-colors font-medium">Sign Up</Link>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col gap-3 text-left">
            <h4 className="text-caption-upper font-semibold text-ink text-[11px]">Legal</h4>
            <a href="#privacy" className="text-body-sm text-body-text hover:text-ink transition-colors font-medium">Privacy Policy</a>
            <a href="#terms" className="text-body-sm text-body-text hover:text-ink transition-colors font-medium">Terms of Service</a>
            <a href="#contact" className="text-body-sm text-body-text hover:text-ink transition-colors font-medium">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
