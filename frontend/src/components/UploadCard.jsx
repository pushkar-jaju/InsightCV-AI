import { useRef, useState } from 'react'

export default function UploadCard({ onFileSelect, selectedFile }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') onFileSelect(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      className="rounded-lg p-10 text-center cursor-pointer transition-all duration-200"
      style={{
        border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-hairline-strong)'}`,
        backgroundColor: dragging ? 'rgba(245,78,0,0.04)' : 'var(--color-surface-card)',
      }}
    >
      <input
        ref={inputRef} type="file" accept=".pdf"
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files[0])}
      />
      <div className="flex flex-col items-center gap-4">
        {/* Upload icon */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-200"
          style={{
            backgroundColor: dragging ? 'rgba(245,78,0,0.1)' : 'var(--color-surface-strong)',
          }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke={dragging ? 'var(--color-primary)' : 'var(--color-muted)'}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        {selectedFile ? (
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--color-primary)' }}>
              {selectedFile.name}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              Click to change file
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium" style={{ color: 'var(--color-ink)' }}>
              Drag &amp; drop your PDF here
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              or click to browse — PDF only, max 5 MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
