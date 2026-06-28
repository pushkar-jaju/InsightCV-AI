import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import UploadCard from '../components/UploadCard'
import Loader from '../components/Loader'
import CircularScore from '../components/CircularScore'
import SkillsList from '../components/SkillsList'
import Button from '../components/Button'
import Card from '../components/Card'
import api from '../services/api'

const TABS = ['Overview', 'Skills', 'Suggestions', 'Strengths', 'Weaknesses']

const getATSBreakdown = (report) => {
  if (report?.atsBreakdown?.keywordsMatch) return report.atsBreakdown
  const score = report?.atsScore || 70
  return {
    keywordsMatch:      { score: Math.round(25 * (score / 100)), strengths: [], weaknesses: [] },
    skillsMatch:        { score: Math.round(25 * (score / 100)), strengths: [], weaknesses: [] },
    experienceQuality:  { score: Math.round(20 * (score / 100)), strengths: [], weaknesses: [] },
    formattingStructure:{ score: Math.round(15 * (score / 100)), strengths: [], weaknesses: [] },
    educationRelevance: { score: Math.round(15 * (score / 100)), strengths: [], weaknesses: [] },
  }
}

const renderBreakdownCategory = (title, cat, max) => {
  if (!cat) return null
  const pct = (cat.score / max) * 100
  const barColor = pct >= 80 ? '#1f8a65' : pct >= 50 ? '#c08532' : '#cf2d56'

  return (
    <div
      key={title}
      className="rounded-lg p-4 space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-surface-card"
      style={{ backgroundColor: 'var(--color-canvas-soft)', border: '1px solid var(--color-hairline)' }}
    >
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm" style={{ color: 'var(--color-ink)' }}>{title}</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-md"
          style={{ backgroundColor: 'var(--color-surface-strong)', color: 'var(--color-ink)' }}
        >
          {cat.score} / {max}
        </span>
      </div>
      <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--color-hairline)' }}>
        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
        {cat.strengths?.length > 0 && (
          <div className="space-y-1">
            <span className="font-semibold" style={{ color: '#1f8a65' }}>✓ Strengths</span>
            <ul className="list-disc pl-3 space-y-0.5" style={{ color: 'var(--color-body)' }}>
              {cat.strengths.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        {cat.weaknesses?.length > 0 && (
          <div className="space-y-1">
            <span className="font-semibold" style={{ color: '#cf2d56' }}>✗ Weaknesses</span>
            <ul className="list-disc pl-3 space-y-0.5" style={{ color: 'var(--color-body)' }}>
              {cat.weaknesses.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UploadResume() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [file, setFile]         = useState(null)
  const [resumeId, setResumeId] = useState(searchParams.get('resumeId') || '')
  const [report, setReport]     = useState(null)
  const [step, setStep]         = useState(resumeId ? 'loading' : 'upload')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const rid = searchParams.get('resumeId')
    if (!rid) return
    const fetchExistingReport = async () => {
      setLoading(true)
      setStatusMsg('Loading analysis…')
      try {
        const { data } = await api.get(`/resumes/${rid}/report`)
        setReport(data.report)
        setStep('done')
        setActiveTab('Overview')
      } catch (err) {
        setStep(err.response?.status === 404 ? 'analyze' : 'analyze')
        if (err.response?.status !== 404) setError(err.response?.data?.message || 'Failed to load report.')
      } finally {
        setLoading(false)
        setStatusMsg('')
      }
    }
    fetchExistingReport()
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setError('')
    setLoading(true)
    setStatusMsg('Uploading resume…')
    const toastId = toast.loading('Uploading resume…')
    try {
      const formData = new FormData()
      formData.append('resume', file)
      const { data } = await api.post('/resumes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Resume uploaded!', { id: toastId })
      setResumeId(data.resume._id)
      setStep('extract')
      setStatusMsg('Extracting text from PDF…')
      await handleExtract(data.resume._id, toastId)
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed.'
      toast.error(msg, { id: toastId })
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleExtract = async (id, toastId) => {
    const rid = id || resumeId
    setLoading(true)
    setStatusMsg('Extracting text from PDF…')
    try {
      await api.post(`/resumes/${rid}/extract`)
      setStep('analyze')
      setStatusMsg('Text extracted! Ready to analyze.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Extraction failed.'
      toast.error(msg, { id: toastId })
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    setError('')
    setLoading(true)
    setStatusMsg('AI is analyzing your resume (10–30s)…')
    const toastId = toast.loading('AI is analyzing your resume…')
    try {
      const { data } = await api.post(`/resumes/${resumeId}/analyze`)
      setReport(data.report)
      setStep('done')
      setActiveTab('Overview')
      toast.success(data.cached ? 'Analysis loaded from saved results!' : 'Analysis complete!', { id: toastId })
    } catch (err) {
      const msg = err.response?.data?.message || 'Analysis failed.'
      toast.error(msg, { id: toastId })
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReanalyze = async () => {
    if (!window.confirm('This will delete the current report and run a fresh AI analysis. Continue?')) return
    setIsReanalyzing(true)
    setError('')
    const toastId = toast.loading('Deleting old report…')
    try {
      await api.delete(`/resumes/${resumeId}/report`)
      toast.loading('Running fresh AI analysis…', { id: toastId })
      setReport(null)
      setStep('analyze')
      setIsReanalyzing(false)
      setLoading(true)
      setStatusMsg('AI is re-analyzing your resume (10–30s)…')
      const { data } = await api.post(`/resumes/${resumeId}/analyze`)
      setReport(data.report)
      setStep('done')
      setActiveTab('Overview')
      toast.success('Re-analysis complete!', { id: toastId })
    } catch (err) {
      const msg = err.response?.data?.message || 'Re-analysis failed.'
      toast.error(msg, { id: toastId })
      setError(msg)
      setStep('done')
    } finally {
      setLoading(false)
      setIsReanalyzing(false)
    }
  }

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    const toastId = toast.loading('Generating PDF...')
    try {
      const response = await api.get(`/reports/resume/${resumeId}`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Resume_Analysis_Report.pdf')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('Report downloaded!', { id: toastId })
    } catch {
      toast.error('Failed to download report.', { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  const stepKeys = ['upload', 'extract', 'analyze', 'done']
  const curStepIdx = step === 'loading' ? 0 : stepKeys.indexOf(step)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
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
          Resume Analyzer
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Get an AI-powered ATS score and skill breakdown
        </p>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-1">
        {['Upload', 'Extract', 'Analyze', 'Results'].map((s, i) => {
          const done   = i < curStepIdx
          const active = i === curStepIdx
          return (
            <div key={s} className="flex items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
                style={{
                  backgroundColor: done || active ? 'var(--color-primary)' : 'var(--color-surface-strong)',
                  color: done || active ? '#ffffff' : 'var(--color-muted)',
                }}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: done || active ? 'var(--color-primary)' : 'var(--color-muted-soft)' }}
              >{s}</span>
              {i < 3 && (
                <div
                  className="flex-1 h-0.5 w-5 mx-1 rounded-full transition-colors duration-300"
                  style={{ backgroundColor: i < curStepIdx ? 'var(--color-primary)' : 'var(--color-hairline)' }}
                />
              )}
            </div>
          )
        })}
      </div>

      {loading && <Loader message={statusMsg} />}

      {!loading && (
        <>
          {error && (
            <div
              className="p-3 rounded-md text-sm"
              style={{
                backgroundColor: 'rgba(207,45,86,0.08)',
                border: '1px solid rgba(207,45,86,0.2)',
                color: 'var(--color-error)',
              }}
            >
              {error}
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <UploadCard onFileSelect={setFile} selectedFile={file} />
              <Button onClick={handleUpload} disabled={!file} size="lg" className="w-full">
                Upload Resume
              </Button>
            </div>
          )}

          {step === 'analyze' && !report && (
            <Card className="p-8 text-center space-y-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'rgba(31,138,101,0.1)' }}
              >
                <svg className="w-8 h-8" fill="none" stroke="#1f8a65" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-base font-medium" style={{ color: 'var(--color-ink)' }}>
                  Resume ready for analysis!
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                  Text extracted. Click to run AI analysis (10–30s).
                </p>
              </div>
              <Button onClick={handleAnalyze} size="lg" className="mx-auto">
                Analyze with AI →
              </Button>
            </Card>
          )}

          {step === 'done' && report && (
            <div className="space-y-5">
              {/* ATS Score Card */}
              <Card className="p-8 flex flex-col items-center gap-2 relative">
                {/* Download button */}
                <button
                  onClick={handleDownloadReport}
                  disabled={isDownloading}
                  className="absolute top-4 right-4 p-2 rounded-md transition-colors disabled:opacity-50"
                  title="Download Report"
                  style={{ color: 'var(--color-muted)', border: '1px solid var(--color-hairline)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {isDownloading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </button>

                <CircularScore score={report.atsScore} label="ATS Score" size="lg" />
                <p className="text-xs mt-2" style={{ color: 'var(--color-muted-soft)' }}>
                  Experience Level:{' '}
                  <span className="font-semibold" style={{ color: 'var(--color-body)' }}>
                    {report.experienceLevelDetected || '—'}
                  </span>
                </p>

                <button
                  onClick={handleReanalyze}
                  disabled={isReanalyzing}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ color: 'var(--color-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-error)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isReanalyzing ? 'Re-analyzing…' : 'Re-analyze Resume'}
                </button>
              </Card>

              {/* Tabbed Results */}
              <Card hover={false}>
                {/* Tab bar */}
                <div
                  className="flex overflow-x-auto px-4"
                  style={{ borderBottom: '1px solid var(--color-hairline)' }}
                >
                  {TABS.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200"
                      style={{
                        borderBottomColor: activeTab === tab ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-muted)',
                      }}
                      onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--color-ink)' }}
                      onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--color-muted)' }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-6 animate-fade-in">
                  {activeTab === 'Overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderBreakdownCategory("Keywords Match",       getATSBreakdown(report).keywordsMatch,       25)}
                        {renderBreakdownCategory("Skills Match",          getATSBreakdown(report).skillsMatch,          25)}
                        {renderBreakdownCategory("Experience Quality",    getATSBreakdown(report).experienceQuality,    20)}
                        {renderBreakdownCategory("Formatting & Structure",getATSBreakdown(report).formattingStructure,  15)}
                        {renderBreakdownCategory("Education Relevance",   getATSBreakdown(report).educationRelevance,   15)}
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-ink)' }}>Missing Keywords</p>
                        <SkillsList items={report.missingKeywords} color="red" emptyMessage="No missing keywords — great coverage!" />
                      </div>
                    </div>
                  )}
                  {activeTab === 'Skills' && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-ink)' }}>Detected Skills</p>
                        <SkillsList items={report.detectedSkills} color="green" emptyMessage="No skills detected" />
                      </div>
                    </div>
                  )}
                  {activeTab === 'Suggestions' && (
                    <ul className="space-y-2.5">
                      {(report.suggestions || []).length === 0
                        ? <p className="text-sm italic" style={{ color: 'var(--color-muted-soft)' }}>No suggestions.</p>
                        : report.suggestions.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-sm" style={{ color: 'var(--color-body)' }}>
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: 'var(--color-primary)' }} />
                            {s}
                          </li>
                        ))
                      }
                    </ul>
                  )}
                  {activeTab === 'Strengths' && (
                    <ul className="space-y-2.5">
                      {(report.strengths || []).length === 0
                        ? <p className="text-sm italic" style={{ color: 'var(--color-muted-soft)' }}>No strengths listed.</p>
                        : report.strengths.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-sm">
                            <span className="mt-0.5 flex-shrink-0" style={{ color: '#1f8a65' }}>✓</span>
                            <span style={{ color: 'var(--color-body)' }}>{s}</span>
                          </li>
                        ))
                      }
                    </ul>
                  )}
                  {activeTab === 'Weaknesses' && (
                    <ul className="space-y-2.5">
                      {(report.weaknesses || []).length === 0
                        ? <p className="text-sm italic" style={{ color: 'var(--color-muted-soft)' }}>No weaknesses listed.</p>
                        : report.weaknesses.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-sm">
                            <span className="mt-0.5 flex-shrink-0" style={{ color: '#cf2d56' }}>✗</span>
                            <span style={{ color: 'var(--color-body)' }}>{s}</span>
                          </li>
                        ))
                      }
                    </ul>
                  )}
                </div>
              </Card>

              <div className="text-center">
                <Button variant="ghost" onClick={() => { setStep('upload'); setFile(null); setReport(null); setResumeId('') }}>
                  Analyze another resume →
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
