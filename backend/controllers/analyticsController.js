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

    return res.status(200).json({
      success: true,
      totalResumes,
      averageScore,
      latestMatchScore,
      scoreHistory,
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
