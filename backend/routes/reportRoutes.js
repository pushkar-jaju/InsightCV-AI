const express = require('express');
const router = express.Router();
const {
  generateResumeReport,
  generateJobMatchReport,
  generateComparisonReport,
} = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/resume/:resumeId', generateResumeReport);
router.get('/job-match/:resumeId', generateJobMatchReport);
router.get('/compare/:resumeId1/:resumeId2', generateComparisonReport);

module.exports = router;
