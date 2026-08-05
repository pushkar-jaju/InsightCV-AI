import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import MatchResult from '../components/MatchResult'
import Loader from '../components/Loader'
import Card from '../components/Card'
import Button from '../components/Button'
import api from '../services/api'
import Dropdown from '../components/Dropdown'

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
  const [isDownloading, setIsDownloading] = useState(false)


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

      {/* ── Page header ── */}
      <div>
        <h1 className="font-normal"
          style={{ color: 'var(--color-ink)', fontSize: '26px', lineHeight: '1.25', letterSpacing: '-0.325px' }}>
          Job Match Analysis
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Compare your resume against any job description with AI
        </p>
      </div>

      {fetchingResumes ? (
        <Loader message="Loading your resumes…" />
      ) : (
        <>
          {/* ── Error banner ── */}
          {error && (
            <div className="p-3 rounded-md text-sm"
              style={{ backgroundColor: 'rgba(207,45,86,0.08)', border: '1px solid rgba(207,45,86,0.2)', color: 'var(--color-error)' }}>
              {error}
            </div>
          )}

          {/* ── Saved match banner ── */}
          {hasSavedMatch && (
            <Card className="flex items-center justify-between p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(31, 138, 101, 0.1)' }}>
                  <svg className="w-3 h-3" fill="none" stroke="var(--color-success)" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                    Saved match loaded instantly
                  </span>
                  <span className="hidden sm:inline text-xs" style={{ color: 'var(--color-muted)' }}>
                    &bull; Showcasing previous results
                  </span>
                </div>
              </div>
              <button
                onClick={handleNewAnalysis}
                className="text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{ color: 'var(--color-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)' }}
              >
                New analysis &rarr;
              </button>
            </Card>
          )}

          <Card className="p-6 space-y-5">
            {/* ── Resume selector ── */}
            {resumes.length > 0 ? (
              <Dropdown
                label="Select Resume"
                value={selectedResumeId}
                disabled={isAnalyzing || checkingCache}
                onChange={(val) => setSelectedResumeId(val)}
                options={resumes.map(r => ({
                  value: r._id,
                  label: r.originalFileName
                }))}
              />
            ) : (
              <div className="text-center py-6">
                <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>No resumes found.</p>
                <Button variant="secondary" size="sm" onClick={() => navigate('/upload')}>
                  Upload a resume first →
                </Button>
              </div>
            )}

            {/* ── Job description textarea ── */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                Job Description
                <span className="font-normal ml-1" style={{ color: 'var(--color-muted)' }}>(paste the full job posting)</span>
              </label>
              <textarea
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={isAnalyzing || checkingCache || hasSavedMatch}
                placeholder="Paste the job description here…"
                className="textarea-field disabled:opacity-60"
              />
            </div>

            {/* ── Action buttons ── */}
            {checkingCache ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
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
                <h2 className="font-normal"
                  style={{ color: 'var(--color-ink)', fontSize: '22px', lineHeight: '1.3', letterSpacing: '-0.11px' }}>
                  Match Results
                </h2>
                <Button
                  onClick={handleDownloadReport}
                  disabled={isDownloading}
                  size="sm"
                >
                  {isDownloading ? 'Generating PDF...' : 'Download PDF'}
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
