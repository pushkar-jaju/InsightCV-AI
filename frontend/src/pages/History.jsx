import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Loader from '../components/Loader'
import Card from '../components/Card'
import Button from '../components/Button'
import api from '../services/api'

export default function History() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [selectedIds, setSelectedIds] = useState([])
  const [deletingId, setDeletingId] = useState(null)

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

  useEffect(() => {
    fetchHistory()
  }, [])

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
      const response = await api.get(`/resumes/${id}/file`, {
        responseType: 'blob'
      })
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
      const response = await api.get(`/reports/resume/${id}`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Resume_Analysis_Report_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('Report downloaded! 🎉', { id: toastId })
    } catch (err) {
      toast.error('Failed to download report', { id: toastId })
    }
  }

  const handleCheckboxChange = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id)
      }
      if (prev.length >= 2) {
        toast.error('You can only select up to 2 resumes for comparison.')
        return prev
      }
      return [...prev, id]
    })
  }

  const handleCompareClick = () => {
    if (selectedIds.length !== 2) return
    navigate(`/compare?id1=${selectedIds[0]}&id2=${selectedIds[1]}`)
  }

  // Search & Filter
  const filteredHistory = history.filter(item => 
    item.originalFileName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const scoreA = a.report?.atsScore ?? -1
    const scoreB = b.report?.atsScore ?? -1

    if (sortBy === 'date-desc') {
      return new Date(b.createdAt) - new Date(a.createdAt)
    }
    if (sortBy === 'date-asc') {
      return new Date(a.createdAt) - new Date(b.createdAt)
    }
    if (sortBy === 'name-asc') {
      return a.originalFileName.localeCompare(b.originalFileName)
    }
    if (sortBy === 'name-desc') {
      return b.originalFileName.localeCompare(a.originalFileName)
    }
    if (sortBy === 'score-desc') {
      return scoreB - scoreA
    }
    if (sortBy === 'score-asc') {
      return scoreA - scoreB
    }
    return 0
  })

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Resume History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            View all uploaded resume versions, analysis reports, and compare changes
          </p>
        </div>
        <Link to="/upload" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all hover:scale-[1.02] self-start sm:self-auto">
          Upload New Resume
        </Link>
      </div>

      {/* Comparison Floating Banner */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-900/90 dark:bg-gray-800/95 backdrop-blur border border-indigo-500/30 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 z-40 w-[90%] max-w-xl animate-slide-up">
          <div className="flex-1">
            <p className="text-sm font-bold">Compare Resume Versions</p>
            <p className="text-xs text-indigo-200 dark:text-gray-400 mt-0.5">
              Selected {selectedIds.length} of 2. {selectedIds.length === 2 ? 'Ready to compare!' : 'Select one more to compare.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg border border-white/20 text-xs font-semibold hover:bg-white/10 transition-colors"
            >
              Clear
            </button>
            <button 
              onClick={handleCompareClick}
              disabled={selectedIds.length !== 2}
              className="px-4 py-1.5 bg-white text-indigo-700 disabled:bg-white/50 disabled:text-indigo-900/50 disabled:cursor-not-allowed font-semibold text-xs rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Compare Side-by-Side
            </button>
          </div>
        </div>
      )}

      {/* Search and Sort Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by resume name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          >
            <option value="date-desc">Newest Upload</option>
            <option value="date-asc">Oldest Upload</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="score-desc">ATS Score (High-Low)</option>
            <option value="score-asc">ATS Score (Low-High)</option>
          </select>
        </div>
      </Card>

      {/* Main Content */}
      {loading ? (
        <Loader message="Loading history..." />
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
          {error}
        </div>
      ) : sortedHistory.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No resumes found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {searchTerm ? 'Try adjusting your search terms.' : 'Upload and analyze a resume to build history.'}
          </p>
        </Card>
      ) : (
        <Card hover={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/60 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-4 w-12 text-center">Compare</th>
                  <th className="px-5 py-4">Resume Name</th>
                  <th className="px-5 py-4">Uploaded</th>
                  <th className="px-5 py-4 w-32">ATS Score</th>
                  <th className="px-5 py-4 w-28">Status</th>
                  <th className="px-5 py-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {sortedHistory.map((item) => {
                  const hasReport = Boolean(item.report)
                  const isSelected = selectedIds.includes(item._id)
                  
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      {/* Compare Checkbox */}
                      <td className="px-5 py-4 text-center">
                        {hasReport ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCheckboxChange(item._id)}
                            className="w-4 h-4 rounded border-gray-300 bg-gray-50 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer accent-indigo-600"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 dark:text-gray-600 cursor-not-allowed">—</span>
                        )}
                      </td>

                      {/* Resume Name */}
                      <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-200">
                        <button
                          onClick={() => handleDownloadFile(item._id, item.originalFileName)}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors font-semibold truncate max-w-xs sm:max-w-sm block"
                          title="Click to open file"
                        >
                          {item.originalFileName}
                        </button>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-normal">
                          Size: {(item.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </td>

                      {/* Uploaded Date */}
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                        <span className="text-gray-400 dark:text-gray-600 text-xs ml-1.5">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* ATS Score */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {hasReport ? (
                          <span className={`inline-flex items-center font-extrabold px-2.5 py-0.5 rounded-full text-xs
                            ${item.report.atsScore >= 80 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                              : item.report.atsScore >= 50 
                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' 
                              : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'}`}
                          >
                            {item.report.atsScore} / 100
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-600 font-medium">No Score</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md
                          ${hasReport 
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${hasReport ? 'bg-emerald-500' : 'bg-amber-500'}`} />
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
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
                                title="View Analysis"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                              <button
                                onClick={() => handleDownloadReport(item._id)}
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
                                title="Download PDF Report"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <Link
                              to={`/upload?resumeId=${item._id}`}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                              title="Analyze Now"
                            >
                              Analyze
                            </Link>
                          )}
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                            title="Delete Record"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
