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
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">AI Interview Preparation</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Generate personalized technical, architectural, behavioral, and HR questions based on your resume.
          </p>
        </div>
        {prepData && !loading && (
          <div className="flex gap-2">
            <button
              onClick={() => handleGenerate(true)}
              className="px-4 py-2 border border-gray-255 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              🔄 Regenerate
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold hover:scale-[1.02] transition-all shadow-md"
            >
              📥 Download Prep Guide (.md)
            </button>
          </div>
        )}
      </div>

      {/* Select Resume & Difficulty */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-1">
            {resumes.length === 0 ? (
              <p className="text-sm text-gray-500">
                No resumes uploaded yet. <Link to="/upload" className="text-indigo-600 hover:underline">Upload here</Link>
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
            <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
              {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
                    ${difficulty === lvl
                      ? 'bg-white dark:bg-gray-700 text-indigo-650 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-450 hover:text-gray-700 dark:hover:text-gray-350'
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
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-2.5 font-semibold shadow-md flex items-center justify-center gap-2"
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
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-750 shadow-sm flex flex-col items-center justify-center space-y-4">
          <Loader message="AI is reading resume parameters and compiling recruitment guidelines..." />
        </div>
      )}

      {/* Generated Prep Screen */}
      {prepData && !loading && (
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-none gap-2">
            {categories.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id)
                  setExpandedIndex(null)
                }}
                className={`py-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors
                  ${activeTab === id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-850 dark:hover:text-gray-300'
                  }`}
              >
                {label} ({prepData.categories[id]?.length || 0})
              </button>
            ))}
          </div>

          {/* Accordion Questions */}
          {activeQuestions.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              No questions found under this category. Click 'Regenerate' to rebuild.
            </Card>
          ) : (
            <div className="space-y-3.5">
              {activeQuestions.map((q, idx) => {
                const isExpanded = expandedIndex === idx
                return (
                  <Card key={idx} hover={false} className="border border-gray-100 dark:border-gray-700/50 p-4 transition-all">
                    {/* Header */}
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="w-full flex items-center justify-between text-left gap-4"
                    >
                      <div className="space-y-1">
                        <span className="inline-flex items-center text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                          Question {idx + 1}
                        </span>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-tight">
                          {q.question}
                        </p>
                      </div>
                      <span className="p-1 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500">
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
                          <div className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-700/50 space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                              <span>Suggested Answer</span>
                              <button
                                onClick={() => handleCopy(q.answer, `Q${idx + 1} Answer`)}
                                className="text-indigo-600 dark:text-indigo-450 hover:underline flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" />
                                </svg>
                                Copy Answer
                              </button>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-sm text-gray-750 dark:text-gray-300 leading-relaxed font-sans whitespace-pre-line border border-gray-100/50 dark:border-gray-750">
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
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-semibold">Select a resume and difficulty level</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">AI will scan skills and project contexts to assemble interview notes.</p>
          <Button
            onClick={() => handleGenerate(false)}
            disabled={resumes.length === 0}
            className="bg-indigo-650 text-white rounded-xl font-semibold shadow-sm inline-flex"
          >
            Start Generator →
          </Button>
        </Card>
      )}
    </div>
  )
}
