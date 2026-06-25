import React from 'react'
import CircularScore from './CircularScore'

// ─── 1. CAREER ROADMAP CARD ──────────────────────────────────────────────────
export function CareerRoadmapCard({ steps }) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="my-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm space-y-5 animate-fade-in text-left">
      <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm flex-shrink-0">
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <h4 className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base tracking-tight leading-tight">Career Roadmap path</h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-none">Milestones recommendations by AI Coach</p>
        </div>
      </div>

      <div className="relative pl-7 border-l-2 border-indigo-100 dark:border-indigo-900 space-y-6">
        {steps.map((step, idx) => (
          <div key={idx} className="relative group transition-all">
            {/* Number badge on the left border */}
            <span className="absolute -left-[39px] top-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
              {idx + 1}
            </span>
            <div className="space-y-1">
              <h5 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {step.step || step.title}
              </h5>
              <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed font-normal">
                {step.description}
              </p>
              {step.technologies && step.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {step.technologies.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 2. SKILL GAP CARD ────────────────────────────────────────────────────────
export function SkillGapCard({ current = [], missing = [], recommended = [] }) {
  return (
    <div className="my-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm space-y-5 animate-fade-in text-left">
      <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm flex-shrink-0">
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h4 className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base tracking-tight leading-tight">Resume Skill Gap Analysis</h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-none">Verified resume skills vs target requirements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current Skills */}
        <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-extrabold text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Current Verified Skills
          </div>
          <div className="flex flex-wrap gap-1.5">
            {current.map((s) => (
              <span
                key={s}
                className="text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-emerald-950 text-emerald-850 dark:text-emerald-355 border border-emerald-200 dark:border-emerald-800 shadow-sm"
              >
                {s}
              </span>
            ))}
            {current.length === 0 && (
              <p className="text-xs italic text-gray-500 dark:text-gray-400">No skills parsed from resume.</p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="p-4 bg-amber-50/30 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl space-y-2.5">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-extrabold text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            Target Skills Gap (Needed)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((s) => (
              <span
                key={s}
                className="text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-amber-950 text-amber-850 dark:text-amber-355 border border-amber-200 dark:border-amber-800 shadow-sm"
              >
                {s}
              </span>
            ))}
            {missing.length === 0 && (
              <p className="text-xs italic text-gray-550 dark:text-gray-400">No skill gaps detected!</p>
            )}
          </div>
        </div>
      </div>

      {recommended && recommended.length > 0 && (
        <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-2">
          <div className="text-indigo-800 dark:text-indigo-300 font-extrabold text-xs">
            Recommended Actionable Skills to Pick Up:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recommended.map((s) => (
              <span
                key={s}
                className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-white dark:bg-indigo-900 text-indigo-750 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 shadow-sm"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 3. PLACEMENT READINESS CARD ──────────────────────────────────────────────
export function PlacementReadinessCard({ overall, technical, resume, interview }) {
  return (
    <div className="my-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm space-y-5 animate-fade-in text-left">
      <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="p-2 rounded-xl bg-purple-650 text-white shadow-sm flex-shrink-0">
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h4 className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base tracking-tight leading-tight">Placement Readiness Scores</h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-none">Evaluated performance stats across sectors</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
        <CircularScore score={overall} label="Overall Readiness" size="sm" />
        <CircularScore score={technical} label="Technical Skills" size="sm" />
        <CircularScore score={resume} label="Resume Quality" size="sm" />
        <CircularScore score={interview} label="Interview Prep" size="sm" />
      </div>
    </div>
  )
}

// ─── 4. RECOMMENDATION CARD ──────────────────────────────────────────────────
export function RecommendationCard({ courses = [], projects = [], certifications = [], nextSteps = [] }) {
  const hasContent = courses.length > 0 || projects.length > 0 || certifications.length > 0 || nextSteps.length > 0

  if (!hasContent) return null

  return (
    <div className="my-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm space-y-5 animate-fade-in text-left">
      <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm flex-shrink-0">
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h4 className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base tracking-tight leading-tight">AI Recommended Upgrades</h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-none">Next milestones & practice recommendations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Projects */}
        {projects.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl space-y-3 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Suggested Portfolio Projects
            </div>
            <div className="space-y-3">
              {projects.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="font-extrabold text-xs text-gray-900 dark:text-white">{p.title || p.name || p}</p>
                  {p.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-normal">{p.description}</p>
                  )}
                  {p.techStack && p.techStack.length > 0 && (
                    <p className="text-[10px] text-gray-400 font-bold">Tech Stack: {p.techStack.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses & Certs */}
        <div className="space-y-4">
          {courses.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl space-y-2 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Recommended Courses
              </div>
              <ul className="list-disc pl-4 text-xs text-gray-700 dark:text-gray-300 space-y-1.5 leading-relaxed font-normal">
                {courses.map((c, idx) => (
                  <li key={idx}>
                    {c.name ? (
                      <span>
                        <strong className="font-bold text-gray-800 dark:text-gray-200">{c.name}</strong>
                        {c.reason ? <span className="text-gray-550 dark:text-gray-400"> — {c.reason}</span> : ''}
                      </span>
                    ) : c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {certifications.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl space-y-2 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
                </svg>
                Certifications
              </div>
              <ul className="list-disc pl-4 text-xs text-gray-700 dark:text-gray-300 space-y-1 leading-relaxed font-normal">
                {certifications.map((cert, idx) => (
                  <li key={idx}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {nextSteps.length > 0 && (
        <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-2">
          <div className="text-indigo-800 dark:text-indigo-300 font-extrabold text-xs">
            Next Actionable Learning Steps:
          </div>
          <ol className="list-decimal pl-4 text-xs text-gray-700 dark:text-gray-300 space-y-1.5 leading-relaxed font-normal">
            {nextSteps.map((step, idx) => (
              <li key={idx} className="pl-0.5">{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
