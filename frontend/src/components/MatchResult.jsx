import CircularScore from './CircularScore'
import SkillsList from './SkillsList'
import Card from './Card'

export default function MatchResult({ data }) {
  if (!data) return null

  return (
    <div className="space-y-5">
      {/* Scores row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6 flex flex-col items-center">
          <CircularScore score={data.matchScore} label="Job Match Score" size="md" />
        </Card>
        {data.keywordMatchPercentage != null && (
          <Card className="p-6 flex flex-col items-center justify-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--color-muted)', letterSpacing: '0.88px' }}>
              Keyword Match
            </p>
            <p className="font-semibold" style={{ color: 'var(--color-ink)', fontSize: '44px' }}>
              {data.keywordMatchPercentage}
              <span style={{ color: 'var(--color-muted)', fontSize: '24px' }}>%</span>
            </p>
            <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--color-hairline)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{
                  width: `${data.keywordMatchPercentage}%`,
                  backgroundColor: 'var(--color-primary)',
                }}
              />
            </div>
          </Card>
        )}
      </div>

      {/* Matching skills */}
      <Card className="p-5">
        <h4 className="font-semibold mb-3" style={{ color: 'var(--color-ink)', fontSize: '14px' }}>
          Matching Skills
        </h4>
        <SkillsList items={data.matchingSkills} color="green" emptyMessage="No matching skills found" />
      </Card>

      {/* Missing skills */}
      <Card className="p-5">
        <h4 className="font-semibold mb-3" style={{ color: 'var(--color-ink)', fontSize: '14px' }}>
          Missing Skills for this Job
        </h4>
        <SkillsList items={data.missingSkillsForJob} color="red" emptyMessage="No missing skills — great match!" />
      </Card>

      {/* Improvement suggestions */}
      {data.improvementSuggestions?.length > 0 && (
        <Card className="p-5">
          <h4 className="font-semibold mb-3" style={{ color: 'var(--color-ink)', fontSize: '14px' }}>
            Improvement Suggestions
          </h4>
          <ul className="space-y-2.5">
            {data.improvementSuggestions.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm" style={{ color: 'var(--color-body)' }}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)' }} />
                {s}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Overall feedback */}
      {data.overallFeedback && (
        <div
          className="p-5 rounded-lg"
          style={{
            backgroundColor: 'rgba(245,78,0,0.04)',
            border: '1px solid rgba(245,78,0,0.15)',
          }}
        >
          <h4 className="font-semibold mb-2" style={{ color: 'var(--color-primary)', fontSize: '14px' }}>
            Overall Feedback
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
            {data.overallFeedback}
          </p>
        </div>
      )}
    </div>
  )
}
