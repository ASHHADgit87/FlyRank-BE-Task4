const express = require("express");
const {
  getSummary,
  createReport,
  getReportStatus,
  downloadReport,
  listReportJobs,
} = require("../controllers/reportController");

const router = express.Router();

router.get("/reports/summary", getSummary);
router.post("/reports", createReport);
router.get("/reports", listReportJobs);
router.get("/reports/:id/status", getReportStatus);
router.get("/reports/:id/download", downloadReport);
router.get('/reports/scheduled/run', createReport);
module.exports = router;
