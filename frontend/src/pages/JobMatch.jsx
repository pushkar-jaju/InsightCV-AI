import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import MatchResult from '../components/MatchResult'
import Loader from '../components/Loader'
import Card from '../components/Card'
import Button from '../components/Button'
import api from '../services/api'

// ─── Status constants ───────────────────────────────────────────────────────
const STATUS = {
  IDLE:      'idle',      // no saved match, ready to analyze
  CACHED:    'cached',    // saved match loaded from DB — show "View" mode
  ANALYZING: 'analyzing', // AI call in progress
  ERROR:     'error',
}

export default function JobMatch() {
  const navigate = useNavigate()

  // ── Form state ─────────────────────────────────────────────────────────────
  const [resumes, setResumes]               = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jobDescription, setJobDescription] = useState('')

  // ── Page state ─────────────────────────────────────────────────────────────
  const [status, setStatus]         = useState(STATUS.IDLE)
  const [result, setResult]         = useState(null)
  const [fetchingResumes, setFetchingResumes] = useState(true)
  const [checkingCache, setCheckingCache]     = useState(false)
  const [error, setError]           = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const dropdownRef = useRef(null)

  // ─── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ─── 1. Load all resumes on mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const { data } = await api.get('/resumes')
        const list = data.resumes || []
        setResumes(list)
        if (list.length > 0) setSelectedResumeId(list[0]._id)
      } catch {
        setError('Could not load resumes. Please upload one first.')
      } finally {
        setFetchingResumes(false)
      }
    }
    fetchResumes()
  }, [])

  // ─── 2. When resume selection changes → check DB for saved match ───────────
  const checkSavedMatch = useCallback(async (resumeId) => {
    if (!resumeId) return
    setCheckingCache(true)
    setResult(null)
    setStatus(STATUS.IDLE)
    setError('')
    try {
      const { data } = await api.get(`/resumes/${resumeId}/job-match`)
      if (data.success && data.jobMatchAnalysis) {
        setResult(data.jobMatchAnalysis)
        setJobDescription(data.jobMatchAnalysis.jobDescription || '')
        setStatus(STATUS.CACHED)
      }
    } catch (err) {
      // 404 = no saved match yet — that's fine, stay IDLE
      if (err.response?.status !== 404) {
        console.error('Error checking saved job match:', err.message)
      }
      setStatus(STATUS.IDLE)
    } finally {
      setCheckingCache(false)
    }
  }, [])

  useEffect(() => {
    if (selectedResumeId) checkSavedMatch(selectedResumeId)
  }, [selectedResumeId, checkSavedMatch])

  // ─── 3. Run AI analysis (new or forced re-analyze) ─────────────────────────
  const runAnalysis = async (forceReAnalyze = false) => {
    if (!selectedResumeId || !jobDescription.trim()) return
    setError('')
    setStatus(STATUS.ANALYZING)
    const toastId = toast.loading(
      forceReAnalyze ? 'Re-analyzing with AI…' : 'AI is comparing your resume…'
    )
    try {
      const { data } = await api.post(
        `/resumes/${selectedResumeId}/match-job`,
        { jobDescription, forceReAnalyze }
      )
      setResult(data.jobMatchAnalysis)
      setStatus(STATUS.CACHED)

      if (data.cached) {
        toast.success('Loaded from saved analysis ⚡', { id: toastId })
      } else {
        toast.success(
          forceReAnalyze ? 'Re-analysis saved! 🔄' : 'Job match analysis complete! 🎯',
          { id: toastId }
        )
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Job match analysis failed.'
      toast.error(msg, { id: toastId })
      setError(msg)
      setStatus(STATUS.ERROR)
    }
  }

  // ─── 4. Clear result to enter fresh analysis ────────────────────────────────
  const handleNewAnalysis = () => {
    setResult(null)
    setJobDescription('')
    setStatus(STATUS.IDLE)
  }

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    const toastId = toast.loading('Generating PDF...')
    try {
      const response = await api.get(`/reports/job-match/${selectedResumeId}`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Job_Match_Analysis_Report.pdf')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('Report downloaded! 🎉', { id: toastId })
    } catch(err) {
      toast.error('Failed to download report.', { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  // ─── Derived flags ──────────────────────────────────────────────────────────
  const isAnalyzing  = status === STATUS.ANALYZING
  const hasSavedMatch = status === STATUS.CACHED && result !== null

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* ── Back button ── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Job Match Analysis</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Compare your resume against any job description with AI
        </p>
      </div>

      {fetchingResumes ? (
        <Loader message="Loading your resumes…" />
      ) : (
        <>
          {/* ── Error banner ── */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* ── Saved match banner ── */}
          {hasSavedMatch && (
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl">
              <div className="flex items-center gap-2.5">
                <span className="text-emerald-600 dark:text-emerald-400 text-lg">✅</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Saved match loaded instantly
                  </p>
                </div>
              </div>
              <button
                onClick={handleNewAnalysis}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 font-medium underline transition-colors"
              >
                New analysis
              </button>
            </div>
          )}

          <Card className="p-6 space-y-5">
            {/* ── Resume selector ── */}
            {resumes.length > 0 ? (
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Resume
                </label>
                <button
                  type="button"
                  disabled={isAnalyzing || checkingCache}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-all disabled:opacity-60 shadow-sm hover:border-gray-300 dark:hover:border-gray-500"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="font-medium truncate">
                      {resumes.find(r => r._id === selectedResumeId)?.originalFileName || 'Select a resume'}
                    </span>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="max-h-60 overflow-y-auto w-full p-1.5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 custom-scrollbar">
                        {resumes.map((r) => {
                          const isSelected = r._id === selectedResumeId;
                          return (
                            <button
                              key={r._id}
                              type="button"
                              onClick={() => {
                                setSelectedResumeId(r._id)
                                setDropdownOpen(false)
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                            >
                              <div className="flex items-center gap-3 w-full pr-4">
                                <svg className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="truncate flex-1 text-left">{r.originalFileName}</span>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">No resumes found.</p>
                <Button variant="secondary" size="sm" onClick={() => navigate('/upload')}>
                  Upload a resume first →
                </Button>
              </div>
            )}

            {/* ── Job description textarea ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Job Description
                <span className="text-gray-400 font-normal ml-1">(paste the full job posting)</span>
              </label>
              <textarea
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={isAnalyzing || checkingCache || hasSavedMatch}
                placeholder="Paste the job description here…"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors disabled:opacity-60"
              />
            </div>

            {/* ── Action buttons ── */}
            {checkingCache ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Checking for saved analysis…
              </div>
            ) : hasSavedMatch ? (
              /* Saved match exists — show Re-analyze option */
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => runAnalysis(true)}
                  disabled={isAnalyzing}
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                      Re-analyzing…
                    </>
                  ) : '🔄 Re-analyze Match'}
                </Button>
                <Button
                  onClick={() => {
                    document.getElementById('match-results')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  size="lg"
                  className="flex-1"
                >
                  📊 View Match Results
                </Button>
              </div>
            ) : (
              /* No saved match — primary analyze button */
              <Button
                onClick={() => runAnalysis(false)}
                disabled={isAnalyzing || !selectedResumeId || !jobDescription.trim() || checkingCache}
                size="lg"
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Analyzing (10–30s)…
                  </>
                ) : '🔍 Analyze Job Match'}
              </Button>
            )}
          </Card>

          {/* ── Loading indicator ── */}
          {isAnalyzing && (
            <Loader message="AI is comparing your resume with the job description…" />
          )}

          {/* ── Results ── */}
          {result && !isAnalyzing && (
            <div id="match-results" className="animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Match Results</h2>
                <Button 
                  onClick={handleDownloadReport} 
                  disabled={isDownloading}
                  size="sm"
                >
                  {isDownloading ? 'Generating PDF...' : '📥 Download PDF'}
                </Button>
              </div>
              <MatchResult data={result} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
