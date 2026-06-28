import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import api, {
  generateCareerGuidance,
  getCareerGuidanceByResume,
  getChatSessions,
  createChatSession,
  getChatMessages,
  sendMessage,
  deleteChatSession
} from '../services/api'
import Card from '../components/Card'
import Button from '../components/Button'
import Loader from '../components/Loader'
import CircularScore from '../components/CircularScore'
import Dropdown from '../components/Dropdown'
import ChatMessageFormatter from '../components/ChatMessageFormatter'
import {
  CareerRoadmapCard,
  SkillGapCard,
  PlacementReadinessCard,
  RecommendationCard
} from '../components/CareerCoachComponents'

const SUGGESTED_QUESTIONS = [
  "Improve My Resume",
  "Prepare Me For Java Interviews",
  "Suggest MCA Projects",
  "How Can I Get Placed At Amazon?",
]

export default function CareerCoach() {
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [careerGoal, setCareerGoal] = useState('Full Stack Web Developer')
  const [loadingGuidance, setLoadingGuidance] = useState(false)
  const [guidanceData, setGuidanceData] = useState(null)
  
  // Tabs: 'roadmap' | 'skillgap' | 'readiness' | 'learning' | 'chat'
  const [activeTab, setActiveTab] = useState('roadmap')

  // Chat States
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionPreviews, setSessionPreviews] = useState({})

  const chatEndRef = useRef(null)

  // Fetch initial resumes and chat sessions
  const fetchInitialData = async () => {
    try {
      const resumesRes = await api.get('/resumes')
      const list = resumesRes.data.resumes || []
      setResumes(list)
      if (list.length > 0) {
        setSelectedResumeId(list[0]._id)
      }
      
      // Load chats
      loadSessions()
    } catch (err) {
      toast.error('Failed to load initial components.')
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTab])

  // Fetch guidance when selected resume changes
  const loadExistingGuidance = async () => {
    if (!selectedResumeId) return
    try {
      const { data } = await getCareerGuidanceByResume(selectedResumeId)
      if (data.guidances && data.guidances.length > 0) {
        // Load the latest guidance generated
        setGuidanceData(data.guidances[0])
        setCareerGoal(data.guidances[0].careerGoal)
      } else {
        setGuidanceData(null)
      }
    } catch (err) {
      setGuidanceData(null)
    }
  }

  useEffect(() => {
    loadExistingGuidance()
  }, [selectedResumeId])

  // Load chat sessions from backend
  const loadSessions = async () => {
    try {
      setSessionsLoading(true)
      const { data } = await getChatSessions()
      const list = data.sessions || []
      setSessions(list)
      
      // Load last message previews in background asynchronously
      if (list.length > 0) {
        list.forEach(async (s) => {
          try {
            const res = await getChatMessages(s._id)
            const msgs = res.data.messages || []
            if (msgs.length > 0) {
              setSessionPreviews(prev => ({
                ...prev,
                [s._id]: msgs[msgs.length - 1].text
              }))
            }
          } catch (e) {
            console.error('Failed to load last message preview for session', s._id)
          }
        })
      }

      if (list.length > 0 && !activeSessionId) {
        // Set first session as active
        handleSelectSession(list[0]._id)
      }
    } catch (err) {
      toast.error('Failed to fetch chat logs.')
    } finally {
      setSessionsLoading(false)
    }
  }

  // Generate Career guidance via AI
  const handleGenerateGuidance = async (force = false) => {
    if (!selectedResumeId || !careerGoal.trim()) {
      toast.error('Resume selection and Career Goal are required.')
      return
    }
    try {
      setLoadingGuidance(true)
      const { data } = await generateCareerGuidance(selectedResumeId, careerGoal, force)
      setGuidanceData(data.guidance)
      toast.success(data.cached ? 'Guidance loaded from history.' : 'Custom Career Guidance generated! 🚀')
    } catch (err) {
      toast.error('Failed to generate career metrics.')
    } finally {
      setLoadingGuidance(false)
    }
  }

  // Chat session selection
  const handleSelectSession = async (sessionId) => {
    setActiveSessionId(sessionId)
    try {
      const { data } = await getChatMessages(sessionId)
      setMessages(data.messages || [])
    } catch (err) {
      toast.error('Failed to load message history.')
    }
  }

  // Create chat session
  const handleCreateSession = async (title = 'Career Discussion') => {
    try {
      const { data } = await createChatSession(title, selectedResumeId || null)
      setSessions((prev) => [data.session, ...prev])
      handleSelectSession(data.session._id)
      toast.success('New conversation started!')
    } catch (err) {
      toast.error('Failed to start chat session.')
    }
  }

  // Send Chat message
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText
    if (!text.trim()) return

    // If no active session, create one first
    let currentSessionId = activeSessionId
    if (!currentSessionId) {
      try {
        const { data } = await createChatSession(text.slice(0, 25) + '...', selectedResumeId || null)
        currentSessionId = data.session._id
        setSessions((prev) => [data.session, ...prev])
        setActiveSessionId(currentSessionId)
      } catch (err) {
        toast.error('Failed to initialize conversation thread.')
        return
      }
    }

    if (!textToSend) setInputText('')
    
    // Optimistic UI updates
    const userOptimisticMsg = {
      _id: `temp-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, userOptimisticMsg])

    try {
      setSendingMsg(true)
      const { data } = await sendMessage(currentSessionId, text)
      
      // Update actual messages from backend
      setMessages((prev) => 
        prev.filter((m) => !m._id.startsWith('temp-')).concat(data.assistantMessage)
      )
      
      // Refresh session lists to update timestamps
      loadSessions()
    } catch (err) {
      toast.error('Message failed to transmit.')
    } finally {
      setSendingMsg(false)
    }
  }

  // Suggested questions click handler
  const handleSuggestedClick = (question) => {
    handleSendMessage(question)
    setActiveTab('chat')
  }

  // Delete chat session
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this chat log permanently?')) return
    try {
      await deleteChatSession(sessionId)
      setSessions((prev) => prev.filter((s) => s._id !== sessionId))
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setMessages([])
      }
      toast.success('Session deleted.')
    } catch (err) {
      toast.error('Could not delete session.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div>
        <h1 className="text-2xl font-semibold text-ink ">AI Career Coach & chat</h1>
        <p className="text-muted  mt-1 text-sm">
          Get structural roadmap reviews, readiness metrics, skill gap maps, and chat dynamically about placement prep.
        </p>
      </div>

      {/* Inputs Configuration Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-1">
            {resumes.length === 0 ? (
              <p className="text-sm text-muted">
                No resumes uploaded. <Link to="/upload" className="text-primary font-semibold hover:underline">Upload here</Link>
              </p>
            ) : (
              <Dropdown
                label="Select Resume Reference"
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
              Target Career Goal
            </label>
            <input
              type="text"
              placeholder="e.g. Java Backend Developer, Data Scientist..."
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              className="w-full px-4 py-2 bg-canvas  border border-hairline  rounded-md text-ink  text-sm focus:outline-none focus:border-primary focus:ring-1"
            />
          </div>

          <Button
            onClick={() => handleGenerateGuidance(false)}
            disabled={resumes.length === 0 || loadingGuidance}
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
          >
            {loadingGuidance ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing specs...</span>
              </>
            ) : (
              <span>Generate Career Plan</span>
            )}
          </Button>
        </div>
      </Card>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-lg bg-surface border border-hairline">
        <span className="text-xs font-black text-muted  uppercase tracking-wider select-none pl-1 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-primary  animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Suggested prompts:
        </span>
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => handleSuggestedClick(q)}
            className="px-4 py-1.5 bg-surface border border-hairline hover:border-primary text-ink text-xs font-bold rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {q}
          </button>
        ))}
      </div>

      {loadingGuidance && (
        <div className="p-12 text-center bg-surface  rounded-lg border border-hairline-soft   flex flex-col items-center justify-center space-y-4">
          <Loader message="Career coach is mapping target curriculum steps, readiness percentages, and cert list recommendations..." />
        </div>
      )}

      {/* Main Feature Layout */}
      {!loadingGuidance && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* Chat Threads Sidebar */}
          <div className="xl:col-span-1 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline  pb-2">
              <h3 className="font-semibold text-ink  text-xs uppercase tracking-widest">Conversations</h3>
            </div>
            
            <Button
              onClick={() => handleCreateSession('Coaching Session')}
              variant="primary"
              className="w-full text-xs py-2.5 h-10"
              title="Start new chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Conversation</span>
            </Button>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
              {sessionsLoading && sessions.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-soft">Loading chat logs...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-soft italic">No conversations logged. Click button to begin.</div>
              ) : (
                sessions.map((s) => {
                  const isActive = activeSessionId === s._id
                  return (
                    <div
                      key={s._id}
                      onClick={() => {
                        handleSelectSession(s._id)
                        setActiveTab('chat')
                      }}
                      className={`flex items-start justify-between p-3.5 rounded-md cursor-pointer transition-all border group
                        ${isActive
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface border-hairline-soft text-body-text hover:bg-canvas/80 hover:border-hairline'
                        }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-xs truncate leading-tight pr-2">{s.title}</p>
                          <span className="text-[8px] text-muted-soft  whitespace-nowrap flex-shrink-0">
                            {new Date(s.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-soft  truncate leading-normal">
                          {sessionPreviews[s._id] || 'No messages yet...'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(e, s._id)}
                        className="p-1 rounded text-muted-soft hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete chat session"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Guidance Analysis Panel */}
          <div className="xl:col-span-3 space-y-6">
            {/* Tabs selector */}
            <div className="flex border-b border-hairline  overflow-x-auto scrollbar-none gap-2">
              <button
                onClick={() => setActiveTab('roadmap')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap uppercase tracking-wider transition-colors
                  ${activeTab === 'roadmap'
                    ? 'border-primary text-primary  '
                    : 'border-transparent text-muted-soft hover:text-gray-750'
                  }`}
              >
                Roadmap
              </button>
              <button
                onClick={() => setActiveTab('skillgap')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap uppercase tracking-wider transition-colors
                  ${activeTab === 'skillgap'
                    ? 'border-primary text-primary  '
                    : 'border-transparent text-muted-soft hover:text-gray-750'
                  }`}
              >
                Skill Gap
              </button>
              <button
                onClick={() => setActiveTab('readiness')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap uppercase tracking-wider transition-colors
                  ${activeTab === 'readiness'
                    ? 'border-primary text-primary  '
                    : 'border-transparent text-muted-soft hover:text-gray-750'
                  }`}
              >
                Readiness Score
              </button>
              <button
                onClick={() => setActiveTab('learning')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap uppercase tracking-wider transition-colors
                  ${activeTab === 'learning'
                    ? 'border-primary text-primary  '
                    : 'border-transparent text-muted-soft hover:text-gray-750'
                  }`}
              >
                Recommendations
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap uppercase tracking-wider transition-colors
                  ${activeTab === 'chat'
                    ? 'border-primary text-primary  '
                    : 'border-transparent text-muted-soft hover:text-gray-750'
                  }`}
              >
                AI Coach Chat
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className={`bg-surface  rounded-lg border border-hairline-soft   min-h-[350px] ${activeTab === 'chat' ? 'p-4 sm:p-5' : 'p-6'}`}>
              <AnimatePresence mode="wait">
                {/* 1. ROADMAP TAB */}
                {activeTab === 'roadmap' && (
                  <motion.div
                    key="roadmap"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div>
                      <h4 className="font-bold text-ink  text-base">Personalized Learning Node Roadmap</h4>
                      <p className="text-muted-soft text-xs mt-0.5">Sequential milestones to achieve your backend goal of: {careerGoal}</p>
                    </div>

                    {!guidanceData ? (
                      <div className="text-center py-12 text-muted-soft  italic text-sm bg-canvas/50  rounded-lg border border-dashed border-hairline ">
                        No roadmap loaded. Click 'Generate Career Plan' above.
                      </div>
                    ) : (
                      <CareerRoadmapCard steps={guidanceData.roadmap} />
                    )}
                  </motion.div>
                )}

                {/* 2. SKILL GAP TAB */}
                {activeTab === 'skillgap' && (
                  <motion.div
                    key="skillgap"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div>
                      <h4 className="font-bold text-ink  text-base">Skill Gap Mapping</h4>
                      <p className="text-muted-soft text-xs mt-0.5">Compare skills detected on your resume against critical gaps required.</p>
                    </div>

                    {!guidanceData ? (
                      <div className="text-center py-12 text-muted-soft  italic text-sm bg-canvas/50  rounded-lg border border-dashed border-hairline ">
                        No skill gap mapped. Click 'Generate Career Plan' above.
                      </div>
                    ) : (
                      <SkillGapCard current={guidanceData.skillGap.current} missing={guidanceData.skillGap.missing} />
                    )}
                  </motion.div>
                )}

                {/* 3. READINESS SCORE TAB */}
                {activeTab === 'readiness' && (
                  <motion.div
                    key="readiness"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div>
                      <h4 className="font-bold text-ink  text-base">Placement Readiness Score</h4>
                      <p className="text-muted-soft text-xs mt-0.5">Calculated overall placement readiness scores mapped across categories.</p>
                    </div>

                    {!guidanceData ? (
                      <div className="text-center py-12 text-muted-soft  italic text-sm bg-canvas/50  rounded-lg border border-dashed border-hairline ">
                        No readiness score evaluated. Click 'Generate Plan'.
                      </div>
                    ) : (
                      <PlacementReadinessCard
                        overall={guidanceData.readiness.overall}
                        technical={guidanceData.readiness.technical}
                        resume={guidanceData.readiness.resume}
                        interview={guidanceData.readiness.interview}
                      />
                    )}
                  </motion.div>
                )}

                {/* 4. LEARNING RECOMMENDATIONS TAB */}
                {activeTab === 'learning' && (
                  <motion.div
                    key="learning"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div>
                      <h4 className="font-bold text-ink  text-base">Learning Recommendations</h4>
                      <p className="text-muted-soft text-xs mt-0.5">Recommendations for technologies, projects, certs, and practice areas.</p>
                    </div>

                    {!guidanceData ? (
                      <div className="text-center py-12 text-muted-soft  italic text-sm bg-canvas/50  rounded-lg border border-dashed border-hairline ">
                        No recommendations compiled. Click 'Generate Career Plan'.
                      </div>
                    ) : (
                      <RecommendationCard
                        courses={guidanceData.learningRecommendations.technologies}
                        projects={guidanceData.learningRecommendations.projects}
                        certifications={guidanceData.learningRecommendations.certifications}
                        nextSteps={guidanceData.learningRecommendations.practiceAreas}
                      />
                    )}
                  </motion.div>
                )}

                {/* 5. CHATBOT TAB */}
                {activeTab === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex flex-col h-[600px] max-w-3xl mx-auto w-full"
                  >
                    {/* Chat Header */}
                    <div className="border-b border-hairline  pb-3 flex justify-between items-center flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <h4 className="font-bold text-ink  text-base">AI Career Coach</h4>
                      </div>
                      <span className="text-[12px] text-primary bg-primary/10 px-2.5 py-0.5 rounded font-semibold">
                        Active Resume Context Attached
                      </span>
                    </div>

                    {/* Messages panel */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
                      {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10 px-6 space-y-6">
                          {/* Modern Vector Style SVG */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/10  blur-2xl rounded-full scale-120 animate-pulse" />
                            <svg className="w-20 h-20 text-primary  relative z-10 animate-fade-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-ink  tracking-tight">Your AI Career Coach</h3>
                            <p className="text-muted  text-xs sm:text-sm max-w-sm leading-relaxed">
                              Analyze placement readiness, identify skill gaps, generate roadmap milestones, and chat dynamically about career guidance.
                            </p>
                          </div>

                          {/* Quick Action Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full pt-2">
                            <button
                              onClick={() => handleSendMessage("Improve My Resume")}
                              className="p-4 rounded-lg bg-surface  border border-hairline  hover:border-primary  text-left hover:scale-[1.01] active:scale-98 transition-all hover: hover:-500/5 group"
                            >
                              <p className="font-semibold text-xs text-primary  group-hover:text-primary :text-primary">Improve My Resume</p>
                              <p className="text-[13px] text-muted  mt-1 leading-normal">Identify resume keyword gaps, ATS compliance issues, and general styling adjustments.</p>
                            </button>

                            <button
                              onClick={() => handleSendMessage("Prepare Me For Java Interviews")}
                              className="p-4 rounded-lg bg-surface  border border-hairline  hover:border-primary  text-left hover:scale-[1.01] active:scale-98 transition-all hover: hover:-500/5 group"
                            >
                              <p className="font-semibold text-xs text-primary  group-hover:text-primary :text-primary">Prepare Me For Java Interviews</p>
                              <p className="text-[13px] text-muted  mt-1 leading-normal">Get simulated mock interview questions, DSA focus areas, and code snippets.</p>
                            </button>

                            <button
                              onClick={() => handleSendMessage("Suggest MCA Projects")}
                              className="p-4 rounded-lg bg-surface  border border-hairline  hover:border-primary  text-left hover:scale-[1.01] active:scale-98 transition-all hover: hover:-500/5 group"
                            >
                              <p className="font-semibold text-xs text-primary  group-hover:text-primary :text-primary">Suggest MCA Projects</p>
                              <p className="text-[13px] text-muted  mt-1 leading-normal">Explore full stack web application architectures and relevant database technologies.</p>
                            </button>

                            <button
                              onClick={() => handleSendMessage("How Can I Get Placed At Amazon?")}
                              className="p-4 rounded-lg bg-surface  border border-hairline  hover:border-primary  text-left hover:scale-[1.01] active:scale-98 transition-all hover: hover:-500/5 group"
                            >
                              <p className="font-semibold text-xs text-primary  group-hover:text-primary :text-primary">How Can I Get Placed At Amazon?</p>
                              <p className="text-[13px] text-muted  mt-1 leading-normal">Discover hiring timelines, online assessment patterns, and core principles.</p>
                            </button>
                          </div>
                        </div>
                      )}

                      {messages.map((m) => {
                        const isUser = m.sender === 'user'
                        return (
                          <div key={m._id} className={`flex gap-3.5 items-start ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            {!isUser && (
                              /* AI Avatar */
                              <div className="w-8 h-8 rounded-md bg-canvas-soft  text-primary  flex items-center justify-center flex-shrink-0  border border-hairline  mt-1">
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}

                            <div className={`flex flex-col max-w-[80%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                              <div
                                className={`rounded-lg px-4 py-2.5 text-[15px] leading-relaxed transition-all
                                  ${isUser
                                    ? 'text-white'
                                    : 'bg-canvas/90 text-ink border border-hairline'
                                  }`}
                                style={{
                                  backgroundColor: isUser ? 'var(--color-ink)' : 'var(--color-canvas/90)',
                                }}
                              >
                                {isUser ? (
                                  <p className="whitespace-pre-wrap">{m.text}</p>
                                ) : (
                                  <ChatMessageFormatter text={m.text} />
                                )}
                              </div>
                              
                              {/* Timestamp */}
                              <span className="text-[12px] text-muted-soft  mt-1 px-1">
                                {new Date(m.createdAt || m.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {isUser && (
                              /* User Avatar */
                              <div className="w-8 h-8 rounded-md bg-ink text-canvas flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-1">
                                ME
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Typing indicator */}
                      {sendingMsg && (
                        <div className="flex gap-3.5 items-start justify-start animate-fade-in">
                          <div className="w-8 h-8 rounded-md bg-canvas-soft  text-primary  flex items-center justify-center flex-shrink-0  border border-hairline  mt-1 animate-pulse">
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="bg-canvas/90  rounded-lg px-4 py-3 border border-hairline  flex items-center gap-1.5 ">
                            <span className="w-1.5 h-1.5 bg-primary  rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-primary  rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-primary  rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSendMessage()
                      }}
                      className="border-t border-hairline  pt-4 flex gap-2 flex-shrink-0"
                    >
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Type your message to the Career Coach..."
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          disabled={sendingMsg}
                          className="w-full pl-4 pr-12 py-3 bg-canvas  border border-hairline  rounded-md text-[15px] text-ink  placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-70"
                        />
                        <button
                          type="submit"
                          disabled={!inputText.trim() || sendingMsg}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary hover:bg-primary-active disabled:bg-surface-strong dark:disabled:bg-gray-800 text-white disabled:text-muted-soft rounded-lg transition-all active:scale-[0.95]"
                          title="Send message"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

