import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import UploadResume from './pages/UploadResume'
import JobMatch from './pages/JobMatch'
import Profile from './pages/Profile'
import History from './pages/History'
import CompareResumes from './pages/CompareResumes'
import ResumeRewriter from './pages/ResumeRewriter'
import InterviewPrep from './pages/InterviewPrep'
import CareerCoach from './pages/CareerCoach'

// Guard: redirect to /login if JWT not present, wrap in Layout
function PrivateRoute({ children }) {
  return localStorage.getItem('token')
    ? <Layout>{children}</Layout>
    : <Navigate to="/login" replace />
}

// Guard: redirect to /dashboard if already logged in
function PublicRoute({ children }) {
  return !localStorage.getItem('token') ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', fontSize: '14px', fontWeight: '500' },
            success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Private — wrapped in Layout */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/upload"    element={<PrivateRoute><UploadResume /></PrivateRoute>} />
          <Route path="/history"   element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/compare"   element={<PrivateRoute><CompareResumes /></PrivateRoute>} />
          <Route path="/job-match" element={<PrivateRoute><JobMatch /></PrivateRoute>} />
          <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/rewrite"   element={<PrivateRoute><ResumeRewriter /></PrivateRoute>} />
          <Route path="/interview-prep" element={<PrivateRoute><InterviewPrep /></PrivateRoute>} />
          <Route path="/career-coach"   element={<PrivateRoute><CareerCoach /></PrivateRoute>} />

          {/* Redirects */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

