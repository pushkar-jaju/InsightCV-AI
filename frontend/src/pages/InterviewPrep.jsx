import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import api, { generateInterviewQuestions, getInterviewPrepByResume } from '../services/api'
import Card from '../components/Card'
import Button from '../components/Button'
import Loader from '../components/Loader'
import Dropdown from '../components/Dropdown'

export default function InterviewPrep() {
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [loading, setLoading] = useState(false)
  const [prepData, setPrepData] = useState(null)
  const [allPreps, setAllPreps] = useState([]) // list of all preps generated for this resume
  const [activeTab, setActiveTab] = useState('technical')
  const [expandedIndex, setExpandedIndex] = useState(null)

  // Fetch resumes
  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resumes')
      const list = data.resumes || []
      setResumes(list)
      if (list.length > 0) {
        setSelectedResumeId(list[0]._id)
      }
    } catch (err) {
      toast.error('Failed to load resumes.')
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  // Load existing prep questions for selected resume
  const loadExistingPreps = async () => {
    if (!selectedResumeId) return
    try {
      const { data } = await getInterviewPrepByResume(selectedResumeId)
      setAllPreps(data.preps || [])
      // Default to matching active difficulty if it exists
      const match = data.preps.find(p => p.difficulty === difficulty)
      if (match) {
        setPrepData(match)
      } else {
        setPrepData(null)
      }
    } catch (err) {
      setAllPreps([])
      setPrepData(null)
    }
  }

  useEffect(() => {
    loadExistingPreps()
  }, [selectedResumeId])

  // Sync active prep when difficulty level toggles
  useEffect(() => {
    const match = allPreps.find(p => p.difficulty === difficulty)
    if (match) {
      setPrepData(match)
    } else {
      setPrepData(null)
    }
    setExpandedIndex(null)
  }, [difficulty, allPreps])

  const handleGenerate = async (force = false) => {
    if (!selectedResumeId) {
      toast.error('Please select a resume.')
      return
    }
    try {
      setLoading(true)
      setExpandedIndex(null)
      const { data } = await generateInterviewQuestions(selectedResumeId, difficulty, force)
      setPrepData(data.prep)
      toast.success(data.cached ? 'Loaded questions from cache!' : 'Generated interview questions! 🎯')
      // Refresh prep list
      const prepRes = await getInterviewPrepByResume(selectedResumeId)
      setAllPreps(prepRes.data.preps || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate questions. Make sure resume analysis is run.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text, type = 'Answer') => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${type} to clipboard!`)
  }

  const handleDownload = () => {
    if (!prepData) return
    let content = `# Interview Preparation Notes - ${difficulty.toUpperCase()}\n\n`
    
    const categories = [
      { key: 'technical', title: 'Technical Questions' },
      { key: 'project', title: 'Project-Based Questions' },
      { key: 'hr', title: 'HR & Behavioral Questions' },
      { key: 'scenario', title: 'System Design & Scenario Questions' }
    ]

    categories.forEach(({ key, title }) => {
      content += `## ${title}\n\n`
      const questions = prepData.categories[key] || []
      if (questions.length === 0) {
        content += `*No questions generated for this category.*\n\n`
      } else {
        questions.forEach((q, idx) => {
          content += `### Q${idx + 1}: ${q.question}\n`
          content += `**Model Answer:**\n${q.answer}\n\n`
        })
      }
    })

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Interview_Prep_${difficulty}_${selectedResumeId}.md`)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
    toast.success('Interview prep guide downloaded! 📜')
  }

  const categories = [
    { id: 'technical', label: 'Technical' },
    { id: 'project', label: 'Projects' },
    { id: 'hr', label: 'HR' },
    { id: 'scenario', label: 'Scenario-Based' },
  ]

  const activeQuestions = prepData?.categories?.[activeTab] || []

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink ">AI Interview Preparation</h1>
          <p className="text-muted  mt-1 text-sm">
            Generate personalized technical, architectural, behavioral, and HR questions based on your resume.
          </p>
        </div>
        {prepData && !loading && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleGenerate(true)}
            >
              🔄 Regenerate
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
            >
              📥 Download Prep Guide (.md)
            </Button>
          </div>
        )}
      </div>

      {/* Select Resume & Difficulty */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-1">
            {resumes.length === 0 ? (
              <p className="text-sm text-muted">
                No resumes uploaded yet. <Link to="/upload" className="text-primary hover:underline">Upload here</Link>
              </p>
            ) : (
              <Dropdown
                label="Select Resume"
                value={selectedResumeId}
                onChange={(val) => setSelectedResumeId(val)}
                options={resumes.map(r => ({
                  value: r._id,
                  label: r.originalFileName
                }))}
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-soft  uppercase tracking-wider">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 bg-canvas-soft  p-1 rounded-md">
              {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
                    ${difficulty === lvl
                      ? 'bg-surface  text-primary  '
                      : 'text-muted  hover:text-body-text '
                    }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => handleGenerate(false)}
            disabled={resumes.length === 0 || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Generating questions...</span>
              </>
            ) : (
              <span>Generate Questions</span>
            )}
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-surface  rounded-lg border border-hairline-soft   flex flex-col items-center justify-center space-y-4">
          <Loader message="AI is reading resume parameters and compiling recruitment guidelines..." />
        </div>
      )}

      {/* Generated Prep Screen */}
      {prepData && !loading && (
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex border-b border-hairline  overflow-x-auto scrollbar-none gap-2">
            {categories.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id)
                  setExpandedIndex(null)
                }}
                className={`py-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors
                  ${activeTab === id
                    ? 'border-primary text-primary  '
                    : 'border-transparent text-muted hover:text-gray-850 '
                  }`}
              >
                {label} ({prepData.categories[id]?.length || 0})
              </button>
            ))}
          </div>

          {/* Accordion Questions */}
          {activeQuestions.length === 0 ? (
            <Card className="p-8 text-center text-muted">
              No questions found under this category. Click 'Regenerate' to rebuild.
            </Card>
          ) : (
            <div className="space-y-3.5">
              {activeQuestions.map((q, idx) => {
                const isExpanded = expandedIndex === idx
                return (
                  <Card key={idx} hover={false} className="border border-hairline-soft  p-4 transition-all">
                    {/* Header */}
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="w-full flex items-center justify-between text-left gap-4"
                    >
                      <div className="space-y-1">
                        <span className="inline-flex items-center text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-primary text-white">
                          Question {idx + 1}
                        </span>
                        <p className="font-semibold text-ink  text-sm sm:text-base leading-tight">
                          {q.question}
                        </p>
                      </div>
                      <span className="p-1 rounded-lg bg-canvas  text-muted">
                        <svg
                          className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>

                    {/* Answer Block */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-3 border-t border-hairline-soft  space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-muted-soft  uppercase tracking-wider">
                              <span>Suggested Answer</span>
                              <button
                                onClick={() => handleCopy(q.answer, `Q${idx + 1} Answer`)}
                                className="text-primary  hover:underline flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" />
                                </svg>
                                Copy Answer
                              </button>
                            </div>
                            <div className="p-4 bg-canvas  rounded-md text-sm text-gray-750  leading-relaxed font-sans whitespace-pre-line border border-hairline-soft/50 ">
                              {q.answer}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* No questions placeholder */}
      {!prepData && !loading && (
        <Card className="p-12 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-muted  font-semibold">Select a resume and difficulty level</p>
          <p className="text-sm text-muted-soft  mt-1 mb-4">AI will scan skills and project contexts to assemble interview notes.</p>
          <Button
            onClick={() => handleGenerate(false)}
            disabled={resumes.length === 0}
            className="bg-primary text-white rounded-md font-semibold  inline-flex"
          >
            Start Generator →
          </Button>
        </Card>
      )}
    </div>
  )
}

