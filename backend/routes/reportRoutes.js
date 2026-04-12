const express = require('express');
const router = express.Router();
const {
  generateResumeReport,
  generateJobMatchReport
} = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/resume/:resumeId', generateResumeReport);
router.get('/job-match/:resumeId', generateJobMatchReport);

module.exports = router;
