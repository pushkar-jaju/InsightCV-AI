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
          <Card className="p-6 flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Keyword Match</p>
            <p className="text-5xl font-extrabold text-blue-600 dark:text-blue-400">{data.keywordMatchPercentage}%</p>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${data.keywordMatchPercentage}%` }} />
            </div>
          </Card>
        )}
      </div>

      {/* Matching skills */}
      <Card className="p-5">
        <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">✅ Matching Skills</h4>
        <SkillsList items={data.matchingSkills} color="green" emptyMessage="No matching skills found" />
      </Card>

      {/* Missing skills */}
      <Card className="p-5">
        <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">❌ Missing Skills for this Job</h4>
        <SkillsList items={data.missingSkillsForJob} color="red" emptyMessage="No missing skills — great match!" />
      </Card>

      {/* Improvement suggestions */}
      {data.improvementSuggestions?.length > 0 && (
        <Card className="p-5">
          <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">💡 Improvement Suggestions</h4>
          <ul className="space-y-2.5">
            {data.improvementSuggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>{s}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Overall feedback */}
      {data.overallFeedback && (
        <Card className="p-5 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800">
          <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">📋 Overall Feedback</h4>
          <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{data.overallFeedback}</p>
        </Card>
      )}
    </div>
  )
}
