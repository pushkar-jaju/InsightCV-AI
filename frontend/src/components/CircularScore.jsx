import { useEffect, useState } from 'react'

/**
 * CircularScore — animated SVG ring per DESIGN.md
 * Props: score (0-100), label, size ('sm'|'md'|'lg')
 */
const SIZE_MAP = {
  sm: { r: 36, wh: 90,  sw: 6,  textSize: '20px', labelSize: '12px' },
  md: { r: 54, wh: 130, sw: 9,  textSize: '36px', labelSize: '13px' },
  lg: { r: 70, wh: 160, sw: 11, textSize: '44px', labelSize: '14px' },
}

function scoreColor(score) {
  if (score === null || score === undefined) return '#cfcdc4' // hairline-strong
  if (score < 50)  return '#cf2d56' // semantic-error
  if (score <= 75) return '#c08532' // timeline-done / amber
  return '#1f8a65'                  // semantic-success
}

export default function CircularScore({ score, label = 'ATS Score', size = 'md' }) {
  const [displayed, setDisplayed] = useState(0)
  const { r, wh, sw, textSize, labelSize } = SIZE_MAP[size] || SIZE_MAP.md
  const cx = wh / 2
  const circumference = 2 * Math.PI * r
  const stroke = scoreColor(score)

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
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--color-hairline)" strokeWidth={sw} />
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
        <p
          className="font-semibold leading-none"
          style={{ fontSize: textSize, color: 'var(--color-ink)' }}
        >
          {score != null ? displayed : '—'}
        </p>
        <p
          className="mt-1 font-medium"
          style={{ fontSize: labelSize, color: 'var(--color-muted)' }}
        >
          {label}
        </p>
      </div>
    </div>
  )
}
