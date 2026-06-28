import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AnalyticsCard from '../components/AnalyticsCard'
import ScoreChart from '../components/ScoreChart'
import SkeletonCard from '../components/SkeletonCard'
import SkeletonChart from '../components/SkeletonChart'
import SectionHeader from '../components/SectionHeader'
import api, { getAnalyticsSummary, getProfile } from '../services/api'

// ── Helper functions for ATS Breakdown ──
const getATSBreakdown = (report) => {
  if (report && report.atsBreakdown && report.atsBreakdown.keywordsMatch) {
    return report.atsBreakdown;
  }
  const score = report?.atsScore || 70;
  return {
    keywordsMatch: { score: Math.round(25 * (score / 100)), strengths: [], weaknesses: [] },
    skillsMatch: { score: Math.round(25 * (score / 100)), strengths: [], weaknesses: [] },
    experienceQuality: { score: Math.round(20 * (score / 100)), strengths: [], weaknesses: [] },
    formattingStructure: { score: Math.round(15 * (score / 100)), strengths: [], weaknesses: [] },
    educationRelevance: { score: Math.round(15 * (score / 100)), strengths: [], weaknesses: [] }
  };
};

const renderDashboardBreakdownRow = (title, catData, max) => {
  if (!catData) return null;
  const percentage = (catData.score / max) * 100;
  const barColor =
    percentage >= 80 ? '#1f8a65' :
    percentage >= 50 ? '#c08532' :
    '#cf2d56';

  return (
    <div className="space-y-1.5" key={title}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium" style={{ color: 'var(--color-body)' }}>{title}</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
          {catData.score}/{max}
        </span>
      </div>
      <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--color-hairline)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
};

// ── Timeline pastel pill for AI insight types ──
const INSIGHT_STYLES = {
  success: { bg: 'rgba(31,138,101,0.08)',  border: 'rgba(31,138,101,0.2)',  label: '#1f8a65',  val: '#0d5c41' },
  warning: { bg: 'rgba(192,133,50,0.08)',  border: 'rgba(192,133,50,0.2)',  label: '#c08532',  val: '#7a520d' },
  danger:  { bg: 'rgba(207,45,86,0.08)',   border: 'rgba(207,45,86,0.2)',   label: '#cf2d56',  val: '#9a1a38' },
  primary: { bg: 'rgba(245,78,0,0.06)',    border: 'rgba(245,78,0,0.18)',   label: '#f54e00',  val: '#b33800' },
  info:    { bg: 'rgba(159,187,224,0.15)', border: 'rgba(159,187,224,0.3)', label: '#4a7eb5',  val: '#1e4f7a' },
};

export default function Dashboard() {
  const [resumes, setResumes]     = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [userName, setUserName]   = useState('')
  const [loading, setLoading]     = useState(true)
  const [reportMap, setReportMap] = useState({})

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

        const reportResults = await Promise.allSettled(
          resumeList.map((r) => api.get(`/resumes/${r._id}/report`))
        )
        const map = {}
        resumeList.forEach((r, idx) => {
          const result = reportResults[idx]
          map[r._id] = result.status === 'fulfilled' ? result.value.data.report : null
        })
        setReportMap(map)
      } catch (err) {
        console.error('Fetch Dashboard Data Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const latestResume = resumes[0];
  const latestReport = latestResume ? reportMap[latestResume._id] : null;

  const renderLatestBreakdownCard = () => (
    <div
      className="rounded-lg p-6 flex flex-col justify-between flex-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary"
      style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-hairline)' }}
    >
      <div>
        <h3 className="font-medium text-sm truncate" style={{ color: 'var(--color-ink)' }}
          title={latestResume?.originalFileName}>
          {latestResume
            ? latestResume.originalFileName.slice(0, 32) + (latestResume.originalFileName.length > 32 ? '…' : '')
            : 'No resume'}
        </h3>
        <p className="text-xs mt-0.5 mb-4" style={{ color: 'var(--color-muted-soft)' }}>
          {latestResume
            ? `Uploaded ${new Date(latestResume.createdAt).toLocaleDateString()}`
            : 'Upload a resume to begin'}
        </p>

        {latestReport ? (
          <div className="space-y-3">
            {renderDashboardBreakdownRow("Keywords Match", getATSBreakdown(latestReport).keywordsMatch, 25)}
            {renderDashboardBreakdownRow("Skills Match", getATSBreakdown(latestReport).skillsMatch, 25)}
            {renderDashboardBreakdownRow("Experience Quality", getATSBreakdown(latestReport).experienceQuality, 20)}
            {renderDashboardBreakdownRow("Formatting & Structure", getATSBreakdown(latestReport).formattingStructure, 15)}
            {renderDashboardBreakdownRow("Education Relevance", getATSBreakdown(latestReport).educationRelevance, 15)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8 space-y-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-surface-strong)' }}>
              <svg className="w-5 h-5" fill="none" stroke="var(--color-muted)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--color-ink)' }}>
              {latestResume ? 'Pending Analysis' : 'No resumes yet'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {latestResume ? 'Analyze this resume to see categories' : 'Analyze your first resume to see categories'}
            </p>
          </div>
        )}
      </div>

      {latestResume && (
        <div className="pt-4 mt-auto">
          <Link
            to={`/upload?resumeId=${latestResume._id}`}
            className="w-full text-center py-2 px-3 text-xs font-medium rounded-md transition-all duration-150 active:scale-[0.98] block"
            style={{
              backgroundColor: 'var(--color-canvas-soft)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-hairline-strong)',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)' }}
          >
            {latestReport ? 'View Detailed Report →' : 'Analyze Now →'}
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Hero Band ── */}
      <div
        className="rounded-lg p-8"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-hairline)',
        }}
      >
        {/* Caption label */}
        <p className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'var(--color-muted)', letterSpacing: '0.88px' }}>
          Welcome back{userName ? ',' : ''}
        </p>
        <h1 className="font-normal mb-3"
          style={{
            color: 'var(--color-ink)',
            fontSize: '36px',
            lineHeight: '1.2',
            letterSpacing: '-0.72px',
          }}>
          {userName ? `${userName}.` : 'Hello.'}
        </h1>
        <p className="mb-6 max-w-md" style={{ color: 'var(--color-body)', fontSize: '15px' }}>
          Your AI-powered resume suite is ready. Upload a resume or run a job match to get started.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium text-sm transition-all duration-150 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary-active)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
          >
            Upload Resume
          </Link>
          <Link to="/job-match"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium text-sm transition-all duration-150 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-canvas-soft)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-hairline-strong)',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)' }}
          >
            Job Match
          </Link>
        </div>
      </div>

      {/* ── Analytics Cards ── */}
      <div>
        <SectionHeader title="Your Stats" subtitle="Based on all analyzed resumes" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
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

      {/* ── AI Insights ── */}
      {!loading && analytics?.aiInsights && analytics.aiInsights.length > 0 && (
        <div className="space-y-4">
          <SectionHeader title="AI Insights" subtitle="Real-time feedback & recommended actions" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.aiInsights.map((insight, idx) => {
              const s = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.info;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-lg"
                  style={{ backgroundColor: s.bg, border: `1px solid ${s.border}` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                    style={{ color: s.label, letterSpacing: '0.88px' }}>
                    {insight.title}
                  </p>
                  <p className="text-2xl font-semibold mb-1" style={{ color: s.val }}>
                    {insight.value}
                  </p>
                  <p className="text-xs leading-normal" style={{ color: 'var(--color-body)' }}>
                    {insight.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Chart & Latest Breakdown Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader title="Score Trend" subtitle="Your ATS scores over time" />
          {loading ? <SkeletonChart /> : <ScoreChart data={analytics?.scoreHistory || []} />}
        </div>
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          <SectionHeader title="Latest Breakdown" subtitle="Detailed scoring summary" />
          {loading ? (
            <div className="rounded-lg p-6 space-y-4 min-h-[250px]"
              style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-hairline)' }}>
              <div className="h-3.5 rounded shimmer w-1/2"/>
              <div className="h-2.5 rounded shimmer w-1/3"/>
              <div className="space-y-3.5 pt-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <div className="h-2.5 rounded shimmer w-1/3"/>
                      <div className="h-2.5 rounded shimmer w-10"/>
                    </div>
                    <div className="h-1.5 rounded-full shimmer w-full"/>
                  </div>
                ))}
              </div>
            </div>
          ) : renderLatestBreakdownCard()}
        </div>
      </div>

      {/* ── Resume List ── */}
      <div>
        <SectionHeader title="Your Resumes" />
        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => (
              <div key={i} className="rounded-lg px-5 py-4 flex items-center justify-between"
                style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-hairline)' }}>
                <div className="space-y-2">
                  <div className="h-3.5 rounded shimmer w-40"/>
                  <div className="h-2.5 rounded shimmer w-24"/>
                </div>
                <div className="h-8 rounded-md shimmer w-20"/>
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '2px dashed var(--color-hairline-strong)',
            }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--color-surface-strong)' }}>
              <svg className="w-6 h-6" fill="none" stroke="var(--color-muted)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-medium mb-1" style={{ color: 'var(--color-ink)' }}>No resumes analyzed yet</p>
            <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
              Upload your first resume to get an AI-powered ATS score
            </p>
            <Link to="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium text-sm transition-colors"
              style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary-active)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
            >
              Upload Resume →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {resumes.slice(0, 5).map((r) => {
              const existingReport = reportMap[r._id]
              const hasReport = Boolean(existingReport)
              return (
                <div
                  key={r._id}
                  className="rounded-lg px-5 py-4 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-primary"
                  style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-hairline)' }}
                >
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--color-ink)' }}>
                      {r.originalFileName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs" style={{ color: 'var(--color-muted-soft)' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                      {hasReport && (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-pill"
                          style={{ backgroundColor: 'rgba(31,138,101,0.1)', color: '#1f8a65' }}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd" />
                          </svg>
                          ATS {existingReport.atsScore ?? '—'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/upload?resumeId=${r._id}`}
                    className="text-xs font-medium px-4 py-2 rounded-md transition-colors duration-150"
                    style={{
                      backgroundColor: hasReport ? 'rgba(31,138,101,0.08)' : 'rgba(245,78,0,0.08)',
                      color: hasReport ? '#1f8a65' : 'var(--color-primary)',
                      border: hasReport ? '1px solid rgba(31,138,101,0.2)' : '1px solid rgba(245,78,0,0.2)',
                    }}
                  >
                    {hasReport ? 'View Analysis' : 'Analyze'}
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
