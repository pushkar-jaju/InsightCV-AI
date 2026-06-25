import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import api, { generateRewrite, getRewriteHistory, saveRewriteAsVersion } from '../services/api'
import Card from '../components/Card'
import Button from '../components/Button'
import Loader from '../components/Loader'
import Dropdown from '../components/Dropdown'

const PROGRESS_STEPS = [
  "Reading resume text...",
  "Analyzing ATS match keywords...",
  "Applying strong action verbs...",
  "Rewriting Professional Summary...",
  "Optimizing Skills segment...",
  "Enhancing project impact metrics...",
  "Finalizing formatting structure...",
]

export default function ResumeRewriter() {
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [rewriteData, setRewriteData] = useState(null)
  const [savingVersion, setSavingVersion] = useState(false)

  // Fetch all user resumes
  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resumes')
      const list = data.resumes || []
      setResumes(list)
      if (list.length > 0) {
        setSelectedResumeId(list[0]._id)
      }
    } catch (err) {
      toast.error('Failed to load resumes. Please refresh.')
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  // Simulate progress steps when loading
  useEffect(() => {
    let timer
    if (loading) {
      timer = setInterval(() => {
        setProgressStep((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev))
      }, 3500)
    } else {
      setProgressStep(0)
    }
    return () => clearInterval(timer)
  }, [loading])

  // Fetch rewrite if already cached on selection change
  useEffect(() => {
    if (!selectedResumeId) return
    const checkHistory = async () => {
      try {
        const { data } = await getRewriteHistory(selectedResumeId)
        if (data && data.rewrite) {
          setRewriteData(data.rewrite)
        } else {
          setRewriteData(null)
        }
      } catch (err) {
        setRewriteData(null)
      }
    }
    checkHistory()
  }, [selectedResumeId])

  const handleImproveResume = async () => {
    if (!selectedResumeId) {
      toast.error('Please select a resume first.')
      return
    }
    try {
      setLoading(true)
      const { data } = await generateRewrite(selectedResumeId)
      setRewriteData(data.rewrite)
      toast.success(data.cached ? 'Loaded previous improvement!' : 'Resume improved successfully! ✨')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to rewrite resume. Try text extraction first.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text, sectionName) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${sectionName} section to clipboard!`)
  }

  const handleDownload = () => {
    if (!rewriteData) return
    const sections = rewriteData.improvedSections
    const fullText = `
# PROFESSIONAL SUMMARY
${sections.summary || ""}

# TECHNICAL SKILLS
${sections.skills || ""}

# PROFESSIONAL EXPERIENCE
${sections.experience || ""}

# ACADEMIC PROJECTS
${sections.projects || ""}

# EDUCATION
${sections.education || ""}
`.trim()

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Improved_Resume_${selectedResumeId}.txt`)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
    toast.success('Resume downloaded! 📂')
  }

  const handleSaveAsVersion = async () => {
    if (!rewriteData) return
    try {
      setSavingVersion(true)
      const sections = rewriteData.improvedSections
      await saveRewriteAsVersion(selectedResumeId, sections)
      toast.success('Saved as a new resume version in your history! 🎉')
      fetchResumes()
    } catch (err) {
      toast.error('Failed to save improved version.')
    } finally {
      setSavingVersion(false)
    }
  }

  const sectionsToShow = [
    { key: 'summary', title: 'Professional Summary' },
    { key: 'skills', title: 'Technical Skills' },
    { key: 'experience', title: 'Work Experience' },
    { key: 'projects', title: 'Projects' },
    { key: 'education', title: 'Education' },
  ]

  const selectedResume = resumes.find(r => r._id === selectedResumeId)

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">AI Resume Rewriter</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Optimize, upgrade, and rewrite specific sections of your resume to make it ATS-friendly and professional
        </p>
      </div>

      {/* Select Resume Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 space-y-1">
            {resumes.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No resumes uploaded yet. <Link to="/upload" className="text-indigo-600 font-bold hover:underline">Upload one here</Link>.
              </p>
            ) : (
              <Dropdown
                label="Select Resume to Improve"
                value={selectedResumeId}
                onChange={(val) => setSelectedResumeId(val)}
                options={resumes.map(r => ({
                  value: r._id,
                  label: `${r.originalFileName} (Uploaded ${new Date(r.createdAt).toLocaleDateString()})`
                }))}
              />
            )}
          </div>
          <Button
            onClick={handleImproveResume}
            disabled={resumes.length === 0 || loading}
            className="sm:w-auto w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-2.5 px-6 font-semibold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Improving...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <span>Improve Resume</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Loading Progress State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
            </div>
            <p className="text-gray-700 dark:text-gray-200 font-bold text-lg animate-pulse">
              {PROGRESS_STEPS[progressStep]}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">
              This process takes up to 45 seconds as we build robust segment content.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side-by-side Result View */}
      {rewriteData && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-indigo-950 dark:text-indigo-200">AI Improved Version Complete</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                You can review updates, copy blocks, download the text file, or save as a new version.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-800 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download (.txt)
              </button>
              <button
                onClick={handleSaveAsVersion}
                disabled={savingVersion}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold hover:scale-[1.02] transition-all shadow-md disabled:bg-indigo-400"
              >
                {savingVersion ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save as New Version
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section Diff Cards */}
          <div className="space-y-6">
            {sectionsToShow.map(({ key, title }) => {
              const orig = rewriteData.originalSections[key]
              const impr = rewriteData.improvedSections[key]

              if (!orig && !impr) return null

              return (
                <Card key={key} hover={false} className="p-6 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-700 pb-3 mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      {title}
                    </h3>
                    <button
                      onClick={() => handleCopy(impr, title)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
                      title="Copy improved text"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Improved
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Original */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider">
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-400 text-[10px]">V1</span>
                        Current Content
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-750 rounded-xl text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed font-sans min-h-[100px]">
                        {orig || <span className="italic text-gray-300 dark:text-gray-600">Section not found in original resume.</span>}
                      </div>
                    </div>

                    {/* Improved */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px]">AI</span>
                        Improved Content (ATS-Friendly)
                      </div>
                      <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed font-sans min-h-[100px]">
                        {impr || <span className="italic text-gray-400">Improvement generated.</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
