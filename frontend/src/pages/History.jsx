import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Loader from '../components/Loader'
import Card from '../components/Card'
import api from '../services/api'
import Dropdown from '../components/Dropdown'

export default function History() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [selectedIds, setSelectedIds] = useState([])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/resumes/history')
      setHistory(data.history || [])
    } catch (err) {
      setError('Could not load resume history. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this resume and its analysis report?')) return
    const toastId = toast.loading('Deleting record...')
    try {
      await api.delete(`/resumes/${id}`)
      toast.success('Resume deleted successfully', { id: toastId })
      setHistory(prev => prev.filter(item => item._id !== id))
      setSelectedIds(prev => prev.filter(x => x !== id))
    } catch (err) {
      toast.error('Failed to delete resume history', { id: toastId })
    }
  }

  const handleDownloadFile = async (id, fileName) => {
    const toastId = toast.loading('Opening resume file...')
    try {
      const response = await api.get(`/resumes/${id}/file`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      toast.dismiss(toastId)
    } catch (err) {
      toast.error('Failed to open resume file', { id: toastId })
    }
  }

  const handleDownloadReport = async (id) => {
    const toastId = toast.loading('Generating report PDF...')
    try {
      const response = await api.get(`/reports/resume/${id}`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Resume_Analysis_Report_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('Report downloaded!', { id: toastId })
    } catch (err) {
      toast.error('Failed to download report', { id: toastId })
    }
  }

  const handleCheckboxChange = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 2) { toast.error('You can only select up to 2 resumes for comparison.'); return prev }
      return [...prev, id]
    })
  }

  const handleCompareClick = () => {
    if (selectedIds.length !== 2) return
    navigate(`/compare?id1=${selectedIds[0]}&id2=${selectedIds[1]}`)
  }

  const filteredHistory = history.filter(item =>
    item.originalFileName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const scoreA = a.report?.atsScore ?? -1
    const scoreB = b.report?.atsScore ?? -1
    if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt)
    if (sortBy === 'date-asc')  return new Date(a.createdAt) - new Date(b.createdAt)
    if (sortBy === 'name-asc')  return a.originalFileName.localeCompare(b.originalFileName)
    if (sortBy === 'name-desc') return b.originalFileName.localeCompare(a.originalFileName)
    if (sortBy === 'score-desc') return scoreB - scoreA
    if (sortBy === 'score-asc')  return scoreA - scoreB
    return 0
  })

  // ATS score style
  const scoreStyle = (score) =>
    score >= 80 ? { bg: 'rgba(31,138,101,0.1)', color: '#1f8a65' } :
    score >= 50 ? { bg: 'rgba(192,133,50,0.1)', color: '#c08532' } :
                  { bg: 'rgba(207,45,86,0.1)',  color: '#cf2d56' }

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-normal"
            style={{ color: 'var(--color-ink)', fontSize: '26px', lineHeight: '1.25', letterSpacing: '-0.325px' }}>
            Resume History
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            View all uploaded resume versions, analysis reports, and compare changes
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-colors duration-150 self-start"
          style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary-active)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
        >
          Upload New Resume
        </Link>
      </div>

      {/* Comparison Floating Banner */}
      {selectedIds.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg px-6 py-4 flex items-center gap-6 z-40 w-[90%] max-w-xl"
          style={{
            backgroundColor: 'var(--color-ink)',
            border: '1px solid var(--color-hairline-strong)',
          }}
        >
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--color-canvas)' }}>
              Compare Resume Versions
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-soft)' }}>
              Selected {selectedIds.length} of 2.{' '}
              {selectedIds.length === 2 ? 'Ready to compare!' : 'Select one more to compare.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'var(--color-canvas)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Clear
            </button>
            <button
              onClick={handleCompareClick}
              disabled={selectedIds.length !== 2}
              className="px-4 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)' }}
            >
              Compare Side-by-Side
            </button>
          </div>
        </div>
      )}

      {/* Search and Sort Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by resume name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
            style={{ height: '40px', fontSize: '14px' }}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--color-muted)' }}>
            Sort by
          </span>
          <div className="w-full md:w-48">
            <Dropdown
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'date-desc',  label: 'Newest Upload' },
                { value: 'date-asc',   label: 'Oldest Upload' },
                { value: 'name-asc',   label: 'Name (A-Z)' },
                { value: 'name-desc',  label: 'Name (Z-A)' },
                { value: 'score-desc', label: 'ATS Score (High-Low)' },
                { value: 'score-asc',  label: 'ATS Score (Low-High)' }
              ]}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              }
            />
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {loading ? (
        <Loader message="Loading history..." />
      ) : error ? (
        <div className="p-4 rounded-md text-sm"
          style={{
            backgroundColor: 'rgba(207,45,86,0.08)',
            border: '1px solid rgba(207,45,86,0.2)',
            color: 'var(--color-error)',
          }}>
          {error}
        </div>
      ) : sortedHistory.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--color-surface-strong)' }}>
            <svg className="w-6 h-6" fill="none" stroke="var(--color-muted)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: 'var(--color-ink)' }}>No resumes found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {searchTerm ? 'Try adjusting your search terms.' : 'Upload and analyze a resume to build history.'}
          </p>
        </Card>
      ) : (
        <Card hover={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-soft)' }}
                  className="text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5 w-12 text-center" style={{ color: 'var(--color-muted)', letterSpacing: '0.88px' }}>
                    Select
                  </th>
                  <th className="px-5 py-3.5" style={{ color: 'var(--color-muted)', letterSpacing: '0.88px' }}>Resume</th>
                  <th className="px-5 py-3.5" style={{ color: 'var(--color-muted)', letterSpacing: '0.88px' }}>Uploaded</th>
                  <th className="px-5 py-3.5 w-32" style={{ color: 'var(--color-muted)', letterSpacing: '0.88px' }}>ATS Score</th>
                  <th className="px-5 py-3.5 w-28" style={{ color: 'var(--color-muted)', letterSpacing: '0.88px' }}>Status</th>
                  <th className="px-5 py-3.5 w-44 text-right" style={{ color: 'var(--color-muted)', letterSpacing: '0.88px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map((item) => {
                  const hasReport = Boolean(item.report)
                  const isSelected = selectedIds.includes(item._id)
                  const sc = hasReport ? scoreStyle(item.report.atsScore) : null

                  return (
                    <tr
                      key={item._id}
                      className="transition-colors duration-100"
                      style={{ borderBottom: '1px solid var(--color-hairline-soft)' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {/* Select Checkbox */}
                      <td className="px-5 py-4 text-center">
                        {hasReport ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCheckboxChange(item._id)}
                            className="w-4 h-4 rounded cursor-pointer"
                            style={{ accentColor: 'var(--color-primary)' }}
                          />
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--color-muted-soft)' }}>—</span>
                        )}
                      </td>

                      {/* Resume Name */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleDownloadFile(item._id, item.originalFileName)}
                          className="text-left font-medium truncate max-w-xs sm:max-w-sm block transition-colors text-sm"
                          style={{ color: 'var(--color-ink)' }}
                          title="Click to open file"
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-primary)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink)' }}
                        >
                          {item.originalFileName}
                        </button>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-soft)' }}>
                          {(item.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </td>

                      {/* Uploaded Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-muted)' }}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                        <span className="text-xs ml-1.5" style={{ color: 'var(--color-muted-soft)' }}>
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* ATS Score */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {hasReport ? (
                          <span
                            className="inline-flex items-center font-semibold px-2.5 py-0.5 rounded-pill text-xs"
                            style={{ backgroundColor: sc.bg, color: sc.color }}
                          >
                            {item.report.atsScore} / 100
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--color-muted-soft)' }}>No Score</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-pill"
                          style={{
                            backgroundColor: hasReport ? 'rgba(31,138,101,0.1)' : 'rgba(192,133,50,0.1)',
                            color: hasReport ? '#1f8a65' : '#c08532',
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: hasReport ? '#1f8a65' : '#c08532' }} />
                          {hasReport ? 'Completed' : 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasReport ? (
                            <>
                              <Link
                                to={`/upload?resumeId=${item._id}`}
                                className="p-1.5 rounded-md transition-colors"
                                title="View Analysis"
                                style={{ color: 'var(--color-muted)' }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.color = 'var(--color-ink)'
                                  e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)'
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.color = 'var(--color-muted)'
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                              <button
                                onClick={() => handleDownloadReport(item._id)}
                                className="p-1.5 rounded-md transition-colors"
                                title="Download PDF Report"
                                style={{ color: 'var(--color-muted)' }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.color = 'var(--color-ink)'
                                  e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)'
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.color = 'var(--color-muted)'
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <Link
                              to={`/upload?resumeId=${item._id}`}
                              className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
                              style={{
                                backgroundColor: 'rgba(245,78,0,0.08)',
                                color: 'var(--color-primary)',
                              }}
                            >
                              Analyze
                            </Link>
                          )}
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 rounded-md transition-colors"
                            title="Delete Record"
                            style={{ color: 'var(--color-muted)' }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = 'var(--color-error)'
                              e.currentTarget.style.backgroundColor = 'rgba(207,45,86,0.06)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = 'var(--color-muted)'
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
