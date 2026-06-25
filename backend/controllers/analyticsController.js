const AnalysisReport = require("../models/AnalysisReport");

// ─────────────────────────────────────────────────────────────
// @desc    Get analytics summary for the logged-in user
// @route   GET /api/analytics/summary
// @access  Private
// ─────────────────────────────────────────────────────────────
const getAnalyticsSummary = async (req, res) => {
  try {
    const userId = req.user;

    // Fetch all reports for this user, sorted newest first
    const reports = await AnalysisReport.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const totalResumes = reports.length;

    // Average ATS score (exclude reports with no score)
    const scoredReports = reports.filter(
      (r) => typeof r.atsScore === "number"
    );
    const averageScore =
      scoredReports.length > 0
        ? Math.round(
            scoredReports.reduce((sum, r) => sum + r.atsScore, 0) /
              scoredReports.length
          )
        : 0;

    // Latest job match score (first report that has jobMatchAnalysis)
    const latestMatchReport = reports.find(
      (r) => r.jobMatchAnalysis && typeof r.jobMatchAnalysis.matchScore === "number"
    );
    const latestMatchScore = latestMatchReport
      ? latestMatchReport.jobMatchAnalysis.matchScore
      : null;

    // Last 10 ATS scores for the chart (oldest → newest for chart rendering)
    const scoreHistory = scoredReports
      .slice(0, 10)
      .reverse()
      .map((r) => ({
        date: new Date(r.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: r.atsScore,
      }));

    // Compile AI Insights
    const aiInsights = [];
    if (totalResumes > 0) {
      const latestReport = reports[0];

      // 1. ATS Progression (if multiple reports exist)
      if (scoredReports.length >= 2) {
        const scoreDiff = scoredReports[0].atsScore - scoredReports[1].atsScore;
        if (scoreDiff > 0) {
          aiInsights.push({
            title: "ATS Score Increased",
            value: `+${scoreDiff}%`,
            description: "Your resume optimization raised your ATS compatibility. Great job!",
            type: "success",
            icon: "trending-up"
          });
        } else if (scoreDiff < 0) {
          aiInsights.push({
            title: "ATS Score Decreased",
            value: `${scoreDiff}%`,
            description: "Your latest changes reduced ATS compatibility. Review missing keywords.",
            type: "danger",
            icon: "trending-down"
          });
        } else {
          aiInsights.push({
            title: "ATS Score Stable",
            value: "No Change",
            description: "Your ATS score remains the same as the previous version.",
            type: "info",
            icon: "minus"
          });
        }
      } else if (typeof latestReport.atsScore === "number") {
        aiInsights.push({
          title: "Resume Quality",
          value: `${latestReport.atsScore}/100`,
          description: latestReport.atsScore >= 75 ? "Excellent resume quality. Ready for submissions!" : "Your resume quality has room for improvement. Use AI Resume Rewriter.",
          type: latestReport.atsScore >= 75 ? "success" : "warning",
          icon: "sparkles"
        });
      }

      // 2. Missing Keywords
      if (latestReport.missingKeywords && latestReport.missingKeywords.length > 0) {
        aiInsights.push({
          title: "Missing Keywords Detected",
          value: `${latestReport.missingKeywords.length} terms`,
          description: `Add missing terms: ${latestReport.missingKeywords.slice(0, 3).join(", ")} to boost score.`,
          type: "warning",
          icon: "exclamation-triangle"
        });
      }

      // 3. Recommended Skills
      if (latestReport.skillGapAnalysis && latestReport.skillGapAnalysis.length > 0) {
        const skillsList = latestReport.skillGapAnalysis.slice(0, 3).map(s => s.skill).join(", ");
        aiInsights.push({
          title: "Next Skills to Learn",
          value: `${latestReport.skillGapAnalysis.length} skills`,
          description: `Fill your gaps by learning: ${skillsList}.`,
          type: "info",
          icon: "academic-cap"
        });
      }

      // 4. Job Match Role
      if (latestReport.jobMatchAnalysis) {
        aiInsights.push({
          title: "Recommended Job Role",
          value: `${latestReport.jobMatchAnalysis.matchScore}% Match`,
          description: `High match potential for the role: ${latestReport.jobMatchAnalysis.jobDescription.slice(0, 35)}...`,
          type: "primary",
          icon: "briefcase"
        });
      }
    } else {
      aiInsights.push({
        title: "Get Started",
        value: "No Resumes",
        description: "Upload and analyze your resume to generate personalized AI insights here.",
        type: "info",
        icon: "cloud-upload"
      });
    }

    return res.status(200).json({
      success: true,
      totalResumes,
      averageScore,
      latestMatchScore,
      scoreHistory,
      aiInsights,
    });

  } catch (error) {
    console.error("Analytics Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching analytics",
    });
  }
};

module.exports = { getAnalyticsSummary };
