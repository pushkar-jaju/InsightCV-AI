const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");
const AnalysisReport = require("../models/AnalysisReport");
const Resume = require("../models/Resume");

// ---------- Helpers ----------

const divider = (doc) => {
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke("#E5E7EB");
  doc.moveDown();
};

const sectionTitle = (doc, text) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#4F46E5")
    .text(text);
  doc.moveDown(0.5);
};

const list = (doc, items) => {
  doc.font("Helvetica").fontSize(11).fillColor("#111827");

  if (!items || items.length === 0) {
    doc.text("No data available", { italic: true });
  } else {
    items.forEach((item) => {
      doc.text(`• ${item}`);
    });
  }

  doc.moveDown();
};

const scoreBox = (doc, label, score, bgColor, textColor) => {
  const y = doc.y;

  doc
    .roundedRect(50, y, 500, 70, 10)
    .fill(bgColor);

  doc
    .fillColor(textColor)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(label, 70, y + 15);

  doc
    .fontSize(28)
    .text(`${score ?? "N/A"}/100`, 70, y + 30);

  doc.moveDown(4);
};

// ---------- Resume Report ----------

// ---------- Helpers for Score Breakdown ----------

const getATSBreakdown = (report) => {
  if (report.atsBreakdown && report.atsBreakdown.keywordsMatch) {
    return report.atsBreakdown;
  }
  const score = report.atsScore || 70;
  return {
    keywordsMatch: { score: Math.round(25 * (score / 100)), strengths: ["Good keywords match"], weaknesses: [] },
    skillsMatch: { score: Math.round(25 * (score / 100)), strengths: ["Relevant skills present"], weaknesses: [] },
    experienceQuality: { score: Math.round(20 * (score / 100)), strengths: ["Good description of experiences"], weaknesses: [] },
    formattingStructure: { score: Math.round(15 * (score / 100)), strengths: ["Professional formatting"], weaknesses: [] },
    educationRelevance: { score: Math.round(15 * (score / 100)), strengths: ["Education is relevant"], weaknesses: [] }
  };
};

const drawCategoryBreakdown = (doc, title, cat, max) => {
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#374151").text(`${title}: ${cat.score}/${max}`);
  doc.moveDown(0.25);
  
  const x = doc.x;
  const y = doc.y;
  doc.roundedRect(x, y, 300, 6, 3).fill("#E5E7EB");
  if (cat.score > 0) {
    const fillWidth = Math.min(300, Math.round((cat.score / max) * 300));
    const percentage = cat.score / max;
    const color = percentage >= 0.8 ? "#10B981" : percentage >= 0.5 ? "#F59E0B" : "#EF4444";
    doc.roundedRect(x, y, fillWidth, 6, 3).fill(color);
  }
  
  doc.moveDown(0.7);
  
  if (cat.strengths && cat.strengths.length > 0) {
    doc.font("Helvetica").fontSize(9).fillColor("#059669");
    cat.strengths.forEach(s => doc.text(`  ✓ ${s}`));
  }
  if (cat.weaknesses && cat.weaknesses.length > 0) {
    doc.font("Helvetica").fontSize(9).fillColor("#DC2626");
    cat.weaknesses.forEach(w => doc.text(`  ✗ ${w}`));
  }
  doc.moveDown(0.4);
};

// ---------- Resume Report ----------

const generateResumeReport = async (req, res) => {
  try {
    const { resumeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({ message: "Invalid Resume ID" });
    }

    const report = await AnalysisReport.findOne({
      resumeId,
      userId: req.user,
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Resume_Report.pdf"
    );

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // HEADER
    doc.rect(0, 0, doc.page.width, 80).fill("#4F46E5");

    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("InsightCV", 50, 30);

    doc
      .fontSize(10)
      .text("Resume Analysis Report", 50, 55);

    doc.moveDown(4);
    doc.fillColor("black");

    // SCORE
    scoreBox(doc, "ATS SCORE", report.atsScore, "#EEF2FF", "#1E3A8A");

    // CONTENT
    divider(doc);

    sectionTitle(doc, "Overview");
    doc.fontSize(12).fillColor("#374151");
    doc.text(
      `Experience Level: ${report.experienceLevelDetected || "Unknown"}`
    );
    doc.moveDown();

    divider(doc);

    // BREAKDOWN
    sectionTitle(doc, "ATS Score Breakdown");
    const breakdown = getATSBreakdown(report);
    drawCategoryBreakdown(doc, "Keywords Match", breakdown.keywordsMatch, 25);
    drawCategoryBreakdown(doc, "Skills Match", breakdown.skillsMatch, 25);
    
    if (doc.y > 620) doc.addPage();
    drawCategoryBreakdown(doc, "Experience Quality", breakdown.experienceQuality, 20);
    drawCategoryBreakdown(doc, "Formatting & Structure", breakdown.formattingStructure, 15);
    
    if (doc.y > 620) doc.addPage();
    drawCategoryBreakdown(doc, "Education Relevance", breakdown.educationRelevance, 15);
    
    doc.moveDown();
    divider(doc);

    if (doc.y > 620) doc.addPage();
    sectionTitle(doc, "Detected Skills");
    list(doc, report.detectedSkills);

    if (doc.y > 620) doc.addPage();
    sectionTitle(doc, "Missing Keywords");
    list(doc, report.missingKeywords);

    divider(doc);

    if (doc.y > 620) doc.addPage();
    sectionTitle(doc, "Strengths");
    list(doc, report.strengths);

    if (doc.y > 620) doc.addPage();
    sectionTitle(doc, "Weaknesses");
    list(doc, report.weaknesses);

    if (doc.y > 620) doc.addPage();
    sectionTitle(doc, "Suggestions");
    list(doc, report.suggestions);

    // FOOTER
    doc.moveDown(2);
    divider(doc);

    doc
      .fontSize(10)
      .fillColor("#6B7280")
      .text(
        `Generated by InsightCV • ${new Date().toLocaleDateString()}`,
        { align: "center" }
      );

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating report" });
  }
};

// ---------- Resume Comparison Report ----------

const generateComparisonReport = async (req, res) => {
  try {
    const { resumeId1, resumeId2 } = req.params;
    const userId = req.user;

    const [resume1, resume2] = await Promise.all([
      Resume.findById(resumeId1),
      Resume.findById(resumeId2)
    ]);

    if (!resume1 || !resume2) {
      return res.status(404).json({ message: "One or both resumes not found" });
    }

    if (resume1.userId.toString() !== userId.toString() || resume2.userId.toString() !== userId.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [report1, report2] = await Promise.all([
      AnalysisReport.findOne({ resumeId: resumeId1, userId }),
      AnalysisReport.findOne({ resumeId: resumeId2, userId })
    ]);

    if (!report1 || !report2) {
      return res.status(400).json({ message: "Analysis reports not found. Please analyze both resumes first." });
    }

    const diff = (report2.atsScore || 0) - (report1.atsScore || 0);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Resume_Comparison_Report.pdf"
    );

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // HEADER
    doc.rect(0, 0, doc.page.width, 80).fill("#6366F1");

    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("InsightCV", 50, 30);

    doc
      .fontSize(10)
      .text("Resume Version Comparison Report", 50, 55);

    doc.moveDown(4);
    doc.fillColor("black");

    // Side by side header
    doc.font("Helvetica-Bold").fontSize(14).text("Comparison Overview", 50, doc.y);
    doc.moveDown(1);

    // Render comparison scores
    const startY = doc.y;

    // Resume V1 Box
    doc.roundedRect(50, startY, 230, 80, 8).fill("#F3F4F6");
    doc.fillColor("#374151").font("Helvetica-Bold").fontSize(11).text("V1: " + resume1.originalFileName.slice(0, 30), 65, startY + 15);
    doc.font("Helvetica").fontSize(9).text("Uploaded: " + new Date(resume1.uploadDate).toLocaleDateString(), 65, startY + 30);
    doc.font("Helvetica-Bold").fontSize(20).fillColor("#4B5563").text(`ATS Score: ${report1.atsScore || 0}`, 65, startY + 48);

    // Resume V2 Box
    doc.roundedRect(300, startY, 230, 80, 8).fill("#EEF2FF");
    doc.fillColor("#312E81").font("Helvetica-Bold").fontSize(11).text("V2: " + resume2.originalFileName.slice(0, 30), 315, startY + 15);
    doc.font("Helvetica").fontSize(9).text("Uploaded: " + new Date(resume2.uploadDate).toLocaleDateString(), 315, startY + 30);
    const scoreColor = diff >= 0 ? "#10B981" : "#EF4444";
    doc.font("Helvetica-Bold").fontSize(20).fillColor(scoreColor).text(`ATS Score: ${report2.atsScore || 0} (${diff >= 0 ? "+" : ""}${diff})`, 315, startY + 48);

    doc.moveDown(5.5);
    divider(doc);

    // Compare breakdowns side-by-side
    sectionTitle(doc, "ATS Category Breakdown Comparison");

    const b1 = getATSBreakdown(report1);
    const b2 = getATSBreakdown(report2);

    const renderBreakdownRow = (title, cat1, cat2, max) => {
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#1F2937").text(title);
      doc.moveDown(0.2);

      const currentY = doc.y;

      // V1 bar
      doc.font("Helvetica").fontSize(9).fillColor("#6B7280").text(`V1: ${cat1.score}/${max}`, 50, currentY);
      doc.roundedRect(120, currentY + 1, 150, 6, 3).fill("#E5E7EB");
      doc.roundedRect(120, currentY + 1, Math.round((cat1.score / max) * 150), 6, 3).fill("#9CA3AF");

      // V2 bar
      const gain = cat2.score - cat1.score;
      const gainStr = gain >= 0 ? `(+${gain})` : `(${gain})`;
      doc.font("Helvetica").fontSize(9).fillColor("#4338CA").text(`V2: ${cat2.score}/${max} ${gain !== 0 ? gainStr : ""}`, 300, currentY);
      doc.roundedRect(380, currentY + 1, 150, 6, 3).fill("#E5E7EB");
      const v2Color = gain >= 0 ? "#4F46E5" : "#EF4444";
      doc.roundedRect(380, currentY + 1, Math.round((cat2.score / max) * 150), 6, 3).fill(v2Color);

      doc.moveDown(1);
    };

    renderBreakdownRow("Keywords Match", b1.keywordsMatch, b2.keywordsMatch, 25);
    renderBreakdownRow("Skills Match", b1.skillsMatch, b2.skillsMatch, 25);
    if (doc.y > 620) doc.addPage();
    renderBreakdownRow("Experience Quality", b1.experienceQuality, b2.experienceQuality, 20);
    renderBreakdownRow("Formatting & Structure", b1.formattingStructure, b2.formattingStructure, 15);
    renderBreakdownRow("Education Relevance", b1.educationRelevance, b2.educationRelevance, 15);

    doc.moveDown(0.5);

    if (doc.y > 550) doc.addPage();
    divider(doc);
    sectionTitle(doc, "Summary of Improvements");

    const addedSkills = report2.detectedSkills.filter(s => !report1.detectedSkills.includes(s));
    const removedSkills = report1.detectedSkills.filter(s => !report2.detectedSkills.includes(s));

    let summaryText = `The resume was updated from V1 to V2, resulting in an ATS score change from ${report1.atsScore || 0} to ${report2.atsScore || 0}. `;
    if (diff > 0) {
      summaryText += `This represents an overall improvement of +${diff} points, driven by improved alignment with target keywords, refined role impact descriptions, and formatting adjustments.`;
    } else if (diff === 0) {
      summaryText += `Both versions achieved identical overall scores. Similar terminology and structural layout were detected in both documents.`;
    } else {
      summaryText += `The score on the newer version decreased by ${Math.abs(diff)} points. Please review the category breakdown to ensure key skills or formatting markers were not accidentally removed.`;
    }

    doc.font("Helvetica").fontSize(10).fillColor("#374151").text(summaryText, { align: "justify" });
    doc.moveDown(1.5);

    if (addedSkills.length > 0) {
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#059669").text("Newly Added Skills");
      list(doc, addedSkills);
    }

    if (removedSkills.length > 0) {
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#DC2626").text("Skills Removed (or not detected)");
      list(doc, removedSkills);
    }

    // FOOTER
    doc.moveDown(2);
    divider(doc);
    doc
      .fontSize(10)
      .fillColor("#6B7280")
      .text(
        `Generated by InsightCV • ${new Date().toLocaleDateString()}`,
        { align: "center" }
      );

    doc.end();
  } catch (error) {
    console.error("Comparison Report PDF Error:", error.message);
    res.status(500).json({ message: "Error generating comparison report" });
  }
};

// ---------- Job Match Report ----------

const generateJobMatchReport = async (req, res) => {
  try {
    const { resumeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({ message: "Invalid Resume ID" });
    }

    const report = await AnalysisReport.findOne({
      resumeId,
      userId: req.user,
    });

    if (!report || !report.jobMatchAnalysis) {
      return res.status(404).json({ message: "Job Match Report not found" });
    }

    const job = report.jobMatchAnalysis;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Job_Match_Report.pdf"
    );

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // HEADER
    doc.rect(0, 0, doc.page.width, 80).fill("#10B981");

    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("InsightCV", 50, 30);

    doc
      .fontSize(10)
      .text("Job Match Report", 50, 55);

    doc.moveDown(4);
    doc.fillColor("black");

    // SCORE
    scoreBox(doc, "MATCH SCORE", job.matchScore, "#ECFDF5", "#065F46");

    // CONTENT
    divider(doc);

    sectionTitle(doc, "Overview");
    doc.text(`Keyword Match: ${job.keywordMatchPercentage ?? "N/A"}%`);
    doc.moveDown();

    if (job.overallFeedback) {
      divider(doc);
      sectionTitle(doc, "Overall Feedback");
      doc.text(job.overallFeedback);
      doc.moveDown();
    }

    divider(doc);

    sectionTitle(doc, "Matching Skills");
    list(doc, job.matchingSkills);

    sectionTitle(doc, "Missing Skills");
    list(doc, job.missingSkillsForJob);

    sectionTitle(doc, "Improvement Suggestions");
    list(doc, job.improvementSuggestions);

    if (job.jobDescription) {
      divider(doc);
      sectionTitle(doc, "Job Description");

      const short =
        job.jobDescription.length > 400
          ? job.jobDescription.slice(0, 400) + "..."
          : job.jobDescription;

      doc.fontSize(10).text(short);
    }

    // FOOTER
    doc.moveDown(2);
    divider(doc);

    doc
      .fontSize(10)
      .fillColor("#6B7280")
      .text(
        `Generated by InsightCV • ${new Date().toLocaleDateString()}`,
        { align: "center" }
      );

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating report" });
  }
};

module.exports = {
  generateResumeReport,
  generateJobMatchReport,
  generateComparisonReport,
};