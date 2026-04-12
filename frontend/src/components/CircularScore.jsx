import { useEffect, useState } from 'react'

/**
 * CircularScore — animated SVG ring with auto-color
 * Props: score (0-100), label, size ('sm'|'md'|'lg')
 */
const SIZE_MAP = {
  sm: { r: 36, wh: 90,  sw: 7,  textSize: 'text-xl', labelSize: 'text-xs' },
  md: { r: 54, wh: 130, sw: 10, textSize: 'text-4xl', labelSize: 'text-sm' },
  lg: { r: 70, wh: 160, sw: 12, textSize: 'text-5xl', labelSize: 'text-sm' },
}

function scoreColor(score) {
  if (score === null || score === undefined) return { stroke: '#d1d5db', text: 'text-gray-400' }
  if (score < 50)  return { stroke: '#ef4444', text: 'text-red-500' }
  if (score <= 75) return { stroke: '#f59e0b', text: 'text-amber-500' }
  return { stroke: '#10b981', text: 'text-emerald-500' }
}

export default function CircularScore({ score, label = 'Score', size = 'md' }) {
  const [displayed, setDisplayed] = useState(0)
  const { r, wh, sw, textSize, labelSize } = SIZE_MAP[size] || SIZE_MAP.md
  const cx = wh / 2
  const circumference = 2 * Math.PI * r
  const { stroke, text } = scoreColor(score)

  // Animate from 0 → score
  useEffect(() => {
    if (score == null) return
    const target = Math.min(Math.max(score, 0), 100)
    let frame
    let current = 0
    const step = () => {
      current = Math.min(current + 2, target)
      setDisplayed(current)
      if (current < target) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const offset = circumference - (displayed / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={wh} height={wh} className="-rotate-90">
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} className="dark:stroke-gray-700" />
        {/* Progress */}
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.4s ease' }}
        />
      </svg>
      <div className="text-center -mt-2">
        <p className={`font-extrabold leading-none ${textSize} ${text}`}>
          {score != null ? displayed : '—'}
        </p>
        <p className={`font-medium text-gray-500 dark:text-gray-400 mt-1 ${labelSize}`}>{label}</p>
      </div>
    </div>
  )
}
