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
  baseURL: 'http://localhost:5000/api',
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
          'http://localhost:5000/api/auth/refresh-token',
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
