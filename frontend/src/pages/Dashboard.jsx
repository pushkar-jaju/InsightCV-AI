import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AnalyticsCard from '../components/AnalyticsCard'
import ScoreChart from '../components/ScoreChart'
import SkeletonCard from '../components/SkeletonCard'
import SkeletonChart from '../components/SkeletonChart'
import SectionHeader from '../components/SectionHeader'
import api, { getAnalyticsSummary, getProfile } from '../services/api'

export default function Dashboard() {
  const [resumes, setResumes]     = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [userName, setUserName]   = useState('')
  const [loading, setLoading]     = useState(true)
  const [reportMap, setReportMap] = useState({}) // resumeId -> report | null

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resumesRes, analyticsRes, profileRes] = await Promise.all([
          api.get('/resumes'),
          getAnalyticsSummary(),
          getProfile(),
        ])
        const resumeList = resumesRes.data.resumes || []
        setResumes(resumeList)
        setAnalytics(analyticsRes.data)
        setUserName(profileRes.data.user?.name?.split(' ')[0] || '')

        // Fetch report status for each resume in parallel
        const reportResults = await Promise.allSettled(
          resumeList.map((r) => api.get(`/resumes/${r._id}/report`))
        )
        const map = {}
        resumeList.forEach((r, idx) => {
          const result = reportResults[idx]
          map[r._id] = result.status === 'fulfilled' ? result.value.data.report : null
        })
        setReportMap(map)
      } catch {
        // silently ignore — dashboard is informational
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-7 text-white shadow-lg">
        <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back{userName ? ',' : ''}</p>
        <h1 className="text-3xl font-extrabold">{userName ? `${userName} 👋` : 'Welcome back! 👋'}</h1>
        <p className="text-indigo-200 mt-1.5 text-sm max-w-md">
          Your AI-powered resume analyzer is ready. Upload a resume or run a job match to get started.
        </p>
        <div className="flex gap-3 mt-5">
          <Link to="/upload"
            className="px-5 py-2.5 bg-white text-indigo-700 font-semibold text-sm rounded-xl hover:bg-indigo-50 transition-all hover:scale-[1.02] shadow-sm">
            Upload Resume
          </Link>
          <Link to="/job-match"
            className="px-5 py-2.5 bg-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/30 transition-all hover:scale-[1.02] border border-white/30">
            Job Match
          </Link>
        </div>
      </div>

      {/* ── Analytics Cards ── */}
      <div>
        <SectionHeader title="Your Stats" subtitle="Based on all analyzed resumes" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading ? (
            <>
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </>
          ) : (
            <>
              <AnalyticsCard
                title="Resumes Analyzed" value={analytics?.totalResumes ?? 0}
                color="indigo"
                icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
              <AnalyticsCard
                title="Average ATS Score"
                value={analytics?.totalResumes > 0 ? analytics.averageScore : null}
                suffix="/100" color="violet"
                icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
              <AnalyticsCard
                title="Latest Job Match" value={analytics?.latestMatchScore ?? null}
                suffix="/100" color="emerald"
                icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </>
          )}
        </div>
      </div>

      {/* ── Score Chart ── */}
      <div>
        <SectionHeader title="Score Trend" subtitle="Your ATS scores over time" />
        {loading ? <SkeletonChart /> : <ScoreChart data={analytics?.scoreHistory || []} />}
      </div>

      {/* ── Resume List ── */}
      <div>
        <SectionHeader title="Your Resumes" />
        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-5 py-4 flex items-center justify-between animate-pulse">
                <div className="space-y-2"><div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-40"/><div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-24"/></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"/>
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No resumes analyzed yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">Upload your first resume to get an AI-powered ATS score</p>
            <Link to="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all hover:scale-[1.02]">
              Upload Resume →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((r) => {
              const existingReport = reportMap[r._id]
              const hasReport = Boolean(existingReport)
              return (
                <div key={r._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-5 py-4 flex items-center justify-between hover:shadow-md transition-shadow duration-200">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{r.originalFileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                      {hasReport && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          ATS {existingReport.atsScore ?? '—'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/upload?resumeId=${r._id}`}
                    className={`text-sm font-medium px-4 py-2 rounded-xl transition-all hover:scale-[1.02] ${
                      hasReport
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                        : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                    }`}
                  >
                    {hasReport ? '👁 View Analysis' : '✨ Analyze'}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
