import axios from 'axios'

// ─── Token storage (access token lives in memory for security) ──────────────
let _accessToken = localStorage.getItem('token') || null

export const setAccessToken = (token) => {
  _accessToken = token
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

export const getAccessToken = () => _accessToken

export const setRefreshToken = (token) => {
  if (token) localStorage.setItem('refreshToken', token)
  else localStorage.removeItem('refreshToken')
}

export const getRefreshToken = () => localStorage.getItem('refreshToken')

/** Clear all auth state and redirect to login */
export const clearAuth = () => {
  setAccessToken(null)
  setRefreshToken(null)
  window.location.href = '/login'
}

// ─── Axios instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor: attach access token ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response interceptor: auto-refresh on 401 ──────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config

    if (err.response?.status === 401 && !originalRequest._retry) {
      const refresh = getRefreshToken()

      // No refresh token → go to login
      if (!refresh) {
        clearAuth()
        return Promise.reject(err)
      }

      if (isRefreshing) {
        // Queue requests while refresh is in flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((e) => Promise.reject(e))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
          { refreshToken: refresh }
        )
        const newToken = data.accessToken || data.token
        setAccessToken(newToken)
        setRefreshToken(data.refreshToken)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        clearAuth()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api

// ─── Named helpers ──────────────────────────────
export const getAnalyticsSummary = () => api.get('/analytics/summary')
export const getProfile          = () => api.get('/auth/me')

// ─── AI Resume Rewriter ─────────────────────────
export const generateRewrite = (resumeId) => api.post('/rewrites/generate', { resumeId })
export const getRewriteHistory = (resumeId) => api.get(`/rewrites/history/${resumeId}`)
export const saveRewriteAsVersion = (resumeId, sections) => api.post('/rewrites/save-version', { resumeId, sections })

// ─── AI Interview Preparation ───────────────────
export const generateInterviewQuestions = (resumeId, difficulty, forceReGenerate = false) => 
  api.post('/interviews/generate', { resumeId, difficulty, forceReGenerate })
export const getInterviewPrepByResume = (resumeId) => api.get(`/interviews/resume/${resumeId}`)

// ─── AI Career Coach ────────────────────────────
export const generateCareerGuidance = (resumeId, careerGoal, force = false) => 
  api.post('/career/guidance', { resumeId, careerGoal, force })
export const getCareerGuidanceByResume = (resumeId) => api.get(`/career/guidance/${resumeId}`)

// ─── AI Chat Assistant ──────────────────────────
export const getChatSessions = () => api.get('/chats/sessions')
export const createChatSession = (title, resumeId = null) => api.post('/chats/sessions', { title, resumeId })
export const getChatMessages = (sessionId) => api.get(`/chats/sessions/${sessionId}/messages`)
export const sendMessage = (sessionId, text) => api.post(`/chats/sessions/${sessionId}/messages`, { text })
export const deleteChatSession = (sessionId) => api.delete(`/chats/sessions/${sessionId}`)

