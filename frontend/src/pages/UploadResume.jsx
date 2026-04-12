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

  // ── Auto-fetch saved report when a resumeId is already present in the URL ──
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
        // 404 means no report yet — show analyze button
        if (err.response?.status === 404) {
          setStep('analyze')
        } else {
          const msg = err.response?.data?.message || 'Failed to load report.'
          setError(msg)
          setStep('analyze')
        }
      } finally {
        setLoading(false)
        setStatusMsg('')
      }
    }

    fetchExistingReport()
  }, []) // run once on mount

  const handleUpload = async () => {
    if (!file) return
    setError('')
    setLoading(true)
    setStatusMsg('Uploading resume…')
    const toastId = toast.loading('Uploading resume…')
    try {
      const formData = new FormData()
      formData.append('resume', file)
      const { data } = await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Resume uploaded successfully!', { id: toastId })
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
      const msg = data.cached
        ? 'Analysis loaded from saved results 🎉'
        : 'Analysis complete! 🎉'
      toast.success(msg, { id: toastId })
    } catch (err) {
      const msg = err.response?.data?.message || 'Analysis failed.'
      toast.error(msg, { id: toastId })
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Re-analyze: delete old report then call AI fresh ──
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
      // Trigger analyze immediately
      setLoading(true)
      setStatusMsg('AI is re-analyzing your resume (10–30s)…')
      const { data } = await api.post(`/resumes/${resumeId}/analyze`)
      setReport(data.report)
      setStep('done')
      setActiveTab('Overview')
      toast.success('Re-analysis complete! 🎉', { id: toastId })
    } catch (err) {
      const msg = err.response?.data?.message || 'Re-analysis failed.'
      toast.error(msg, { id: toastId })
      setError(msg)
      setStep('done') // stay on done if delete failed
    } finally {
      setLoading(false)
      setIsReanalyzing(false)
    }
  }

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    const toastId = toast.loading('Generating PDF...')
    try {
      const response = await api.get(`/reports/resume/${resumeId}`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Resume_Analysis_Report.pdf')
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

  // ── Step label helper ──
  const stepKeys = ['upload', 'extract', 'analyze', 'done']
  const curStepIdx = step === 'loading' ? 0 : stepKeys.indexOf(step)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Upload &amp; Analyze Resume</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Get an AI-powered ATS score and skill breakdown</p>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-1">
        {['Upload', 'Extract', 'Analyze', 'Results'].map((s, i) => {
          const active = i <= curStepIdx
          return (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${active ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {i < curStepIdx ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>{s}</span>
              {i < 3 && <div className={`flex-1 h-0.5 w-5 mx-1 rounded-full transition-colors duration-300 ${i < curStepIdx ? 'bg-indigo-400' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
          )
        })}
      </div>

      {loading && <Loader message={statusMsg} />}

      {!loading && (
        <>
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>
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
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">Resume ready for analysis!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Text extracted. Click to run AI analysis (10–30s).</p>
              </div>
              <Button onClick={handleAnalyze} size="lg" className="mx-auto">
                ✨ Analyze with AI
              </Button>
            </Card>
          )}

          {step === 'done' && report && (
            <div className="space-y-5">
              {/* ATS Score */}
              <Card className="p-8 flex flex-col items-center gap-2">
                <CircularScore score={report.atsScore} label="ATS Score" size="lg" />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Experience Level: <span className="font-semibold text-gray-600 dark:text-gray-300">{report.experienceLevelDetected || '—'}</span></p>

                <div className="mt-4">
                  <Button 
                    onClick={handleDownloadReport} 
                    disabled={isDownloading}
                  >
                    {isDownloading ? 'Generating PDF...' : '📥 Download PDF Report'}
                  </Button>
                </div>

                {/* Re-analyze button */}
                <button
                  onClick={handleReanalyze}
                  disabled={isReanalyzing}
                  className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isReanalyzing ? 'Re-analyzing…' : 'Re-analyze Resume'}
                </button>
              </Card>

              {/* Tabbed Results */}
              <Card hover={false}>
                {/* Tab bar */}
                <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-700 px-4">
                  {TABS.map(tab => (
                    <button key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200
                        ${activeTab === tab
                          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-6 animate-fade-in">
                  {activeTab === 'Overview' && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Keyword Match</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                            <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-700"
                              style={{ width: `${report.keywordMatchPercentage || 0}%` }} />
                          </div>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 w-10 text-right">{report.keywordMatchPercentage ?? 0}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Missing Keywords</p>
                        <SkillsList items={report.missingKeywords} color="red" emptyMessage="No missing keywords — great coverage!" />
                      </div>
                    </div>
                  )}
                  {activeTab === 'Skills' && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">✅ Detected Skills</p>
                        <SkillsList items={report.detectedSkills} color="green" emptyMessage="No skills detected" />
                      </div>
                    </div>
                  )}
                  {activeTab === 'Suggestions' && (
                    <ul className="space-y-2.5">
                      {(report.suggestions || []).length === 0
                        ? <p className="text-sm text-gray-400 dark:text-gray-500 italic">No suggestions.</p>
                        : report.suggestions.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                            <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>{s}
                          </li>
                        ))}
                    </ul>
                  )}
                  {activeTab === 'Strengths' && (
                    <ul className="space-y-2.5">
                      {(report.strengths || []).length === 0
                        ? <p className="text-sm text-gray-400 italic dark:text-gray-500">No strengths listed.</p>
                        : report.strengths.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-emerald-700 dark:text-emerald-400">
                            <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>{s}
                          </li>
                        ))}
                    </ul>
                  )}
                  {activeTab === 'Weaknesses' && (
                    <ul className="space-y-2.5">
                      {(report.weaknesses || []).length === 0
                        ? <p className="text-sm text-gray-400 italic dark:text-gray-500">No weaknesses listed.</p>
                        : report.weaknesses.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-red-600 dark:text-red-400">
                            <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{s}
                          </li>
                        ))}
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
