import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import Loader from '../components/Loader'
import Card from '../components/Card'
import Button from '../components/Button'
import api from '../services/api'

export default function CompareResumes() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const id1 = searchParams.get('id1')
  const id2 = searchParams.get('id2')

  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!id1 || !id2) {
      setError('Please select two resumes from history to compare.')
      setLoading(false)
      return
    }

    const fetchComparison = async () => {
      try {
        setLoading(true)
        const { data } = await api.post('/resumes/compare', {
          resumeId1: id1,
          resumeId2: id2
        })
        setComparison(data.comparison)
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to compare resume versions.'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchComparison()
  }, [id1, id2])

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    const toastId = toast.loading('Generating comparison PDF...')
    try {
      const response = await api.get(`/reports/compare/${id1}/${id2}`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Resume_Version_Comparison_Report.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('Report downloaded! 🎉', { id: toastId })
    } catch (err) {
      toast.error('Failed to download comparison PDF.', { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  // Prepares data for Category Bar Chart
  const getChartData = () => {
    if (!comparison) return []
    
    const getBreakdown = (report) => {
      if (report.atsBreakdown && report.atsBreakdown.keywordsMatch) {
        return report.atsBreakdown
      }
      // Proportional fallback
      const score = report.atsScore || 70
      return {
        keywordsMatch: { score: Math.round(25 * (score / 100)) },
        skillsMatch: { score: Math.round(25 * (score / 100)) },
        experienceQuality: { score: Math.round(20 * (score / 100)) },
        formattingStructure: { score: Math.round(15 * (score / 100)) },
        educationRelevance: { score: Math.round(15 * (score / 100)) }
      }
    }

    const b1 = getBreakdown(comparison.resume1.report)
    const b2 = getBreakdown(comparison.resume2.report)

    return [
      { name: 'Keywords', V1: b1.keywordsMatch.score, V2: b2.keywordsMatch.score },
      { name: 'Skills', V1: b1.skillsMatch.score, V2: b2.skillsMatch.score },
      { name: 'Experience', V1: b1.experienceQuality.score, V2: b2.experienceQuality.score },
      { name: 'Formatting', V1: b1.formattingStructure.score, V2: b2.formattingStructure.score },
      { name: 'Education', V1: b1.educationRelevance.score, V2: b2.educationRelevance.score },
    ]
  }

  if (loading) return <Loader message="Analyzing resume versions side-by-side..." />
  if (error) return (
    <div className="max-w-2xl mx-auto space-y-4 py-8">
      <div className="p-4 bg-red-50 -900/30 border border-red-200 -800 text-red-700 -400 rounded-md text-sm">{error}</div>
      <Button onClick={() => navigate('/history')}>Back to History</Button>
    </div>
  )

  const { resume1, resume2, scoreDifference, addedSkills, removedSkills, keywordImprovements, experienceImprovements, summary } = comparison

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button onClick={() => navigate('/history')}
          className="flex items-center gap-1.5 text-sm text-muted  hover:text-primary  font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to History
        </button>

        <Button 
          onClick={handleDownloadPDF} 
          disabled={isDownloading}
          className="self-start sm:self-auto"
        >
          {isDownloading ? 'Generating PDF...' : '📥 Download Comparison Report'}
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-ink ">Resume Comparison</h1>
        <p className="text-muted  mt-1 text-sm">
          Track improvements, additions, and metric gains between two resume revisions
        </p>
      </div>

      {/* ── Side-by-Side Score Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-center">
        {/* Version 1 Card */}
        <Card hover={false} className="md:col-span-3 p-6 bg-canvas/50  border border-hairline-soft ">
          <p className="text-xs font-semibold text-muted-soft  uppercase tracking-widest">Original Version (V1)</p>
          <h2 className="text-lg font-bold text-ink  mt-1.5 truncate" title={resume1.name}>{resume1.name}</h2>
          <p className="text-xs text-muted-soft  mt-0.5">Uploaded {new Date(resume1.uploadDate).toLocaleDateString()}</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-ink ">{resume1.atsScore}</span>
            <span className="text-sm font-semibold text-muted-soft ">/ 100</span>
          </div>
        </Card>

        {/* Arrow/Difference Indicator */}
        <div className="md:col-span-1 flex flex-col items-center justify-center text-center">
          <div className="hidden md:block text-muted-soft ">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
          <span className={`mt-2 font-semibold text-lg px-3 py-1 rounded-full whitespace-nowrap
            ${scoreDifference >= 0 
              ? 'bg-emerald-50 -950/30 text-emerald-600 -400' 
              : 'bg-red-50 -950/30 text-red-600 -400'}`}
          >
            {scoreDifference >= 0 ? `+${scoreDifference}` : scoreDifference} ATS Score
          </span>
        </div>

        {/* Version 2 Card */}
        <Card hover={false} className="md:col-span-3 p-6 border-primary">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Revised Version (V2)</p>
          <h2 className="text-lg font-bold text-ink mt-1.5 truncate" title={resume2.name}>{resume2.name}</h2>
          <p className="text-xs text-muted-soft mt-0.5">Uploaded {new Date(resume2.uploadDate).toLocaleDateString()}</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-ink">{resume2.atsScore}</span>
            <span className="text-sm font-semibold text-muted">/ 100</span>
          </div>
        </Card>
      </div>

      {/* ── AI Summary & Improvement Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: AI summary */}
        <Card hover={false} className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-ink  flex items-center gap-2">
              <span>✨</span> AI Improvement Summary
            </h3>
            <p className="text-sm text-body-text  mt-3 leading-relaxed">
              {summary || 'Review the details below to see changes between resume versions.'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-hairline-soft  pt-5 mt-4">
            <div className="p-3 bg-canvas  rounded-md text-center">
              <span className="text-xs text-muted-soft ">V1 ATS Score</span>
              <p className="text-xl font-bold text-body-text  mt-0.5">{resume1.atsScore}/100</p>
            </div>
            <div className="p-3 bg-canvas border border-primary rounded-md text-center">
              <span className="text-xs text-primary font-semibold">V2 ATS Score</span>
              <p className="text-xl font-bold text-ink mt-0.5">{resume2.atsScore}/100</p>
            </div>
          </div>
        </Card>

        {/* Right column: Category Bar Chart */}
        <Card hover={false} className="p-6">
          <h3 className="text-base font-bold text-ink  mb-6">ATS Categories Comparison</h3>
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="-700" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 25]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgb(31, 41, 55)', color: '#fff', borderRadius: '12px', border: 'none' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="V1" fill="#a09c92" radius={[4, 4, 0, 0]} name="V1 Score" />
                <Bar dataKey="V2" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="V2 Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Skills & Category bulleted lists ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Added Skills Card */}
        <Card hover={false} className="p-6">
          <h3 className="font-bold text-emerald-600 -400 text-sm flex items-center gap-1.5">
            <span>✓</span> Newly Detected Skills
          </h3>
          {addedSkills.length === 0 ? (
            <p className="text-xs text-muted-soft  italic mt-3">No new skills detected on V2.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {addedSkills.map((s) => (
                <span key={s} className="px-2.5 py-1 bg-emerald-50 -950/30 text-emerald-600 -400 text-xs font-semibold rounded-lg">
                  {s}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Removed Skills Card */}
        <Card hover={false} className="p-6">
          <h3 className="font-bold text-red-500 -400 text-sm flex items-center gap-1.5">
            <span>✗</span> Removed (or undetected) Skills
          </h3>
          {removedSkills.length === 0 ? (
            <p className="text-xs text-muted-soft  italic mt-3">No skills were removed in V2.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {removedSkills.map((s) => (
                <span key={s} className="px-2.5 py-1 bg-red-50 -950/30 text-red-500 -400 text-xs font-semibold rounded-lg">
                  {s}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Detailed Improvements list ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Keywords Improvements */}
        <Card hover={false} className="p-6">
          <h3 className="font-bold text-ink  text-sm">Key Keyword Improvements</h3>
          {keywordImprovements.length === 0 ? (
            <p className="text-xs text-muted-soft  italic mt-3">No notable keyword changes.</p>
          ) : (
            <ul className="space-y-2.5 mt-3 text-xs sm:text-sm text-body-text ">
              {keywordImprovements.map((imp, idx) => (
                <li key={idx} className="flex gap-2.5">
                  <span className="text-primary">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Experience Improvements */}
        <Card hover={false} className="p-6">
          <h3 className="font-bold text-ink  text-sm">Key Experience / Formatting Improvements</h3>
          {experienceImprovements.length === 0 ? (
            <p className="text-xs text-muted-soft  italic mt-3">No notable experience changes.</p>
          ) : (
            <ul className="space-y-2.5 mt-3 text-xs sm:text-sm text-body-text ">
              {experienceImprovements.map((imp, idx) => (
                <li key={idx} className="flex gap-2.5">
                  <span className="text-primary">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

