const { v4: uuidv4 } = require("uuid");
const {
  createJob,
  getJob,
  listJobs,
  completeJob,
  failJob,
} = require("../jobs/jobStore");
const { buildReportPdf } = require("../pdf/buildReportPdf");
const { getSalesSummary } = require("../db/salesQuery");
const { successResponse, errorResponse } = require("../utils/response");

const getSummary = async (req, res) => {
  const summary = await getSalesSummary();
  return successResponse(res, 200, "Sales summary computed", summary);
};

const createReport = async (req, res) => {
  const jobId = uuidv4();
  createJob(jobId);

  try {
    const summary = await getSalesSummary();
    const pdfBuffer = await buildReportPdf(summary);
    completeJob(jobId, pdfBuffer);
  } catch (err) {
    failJob(jobId, err);
  }

  return successResponse(res, 202, "Report generation started", {
    jobId,
    statusUrl: `/reports/${jobId}/status`,
    downloadUrl: `/reports/${jobId}/download`,
  });
};

const getReportStatus = (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return errorResponse(res, 404, "Report job not found");

  return successResponse(res, 200, "Report status retrieved", {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    completedAt: job.completedAt || null,
    error: job.error || null,
    downloadUrl:
      job.status === "completed" ? `/reports/${job.id}/download` : null,
  });
};

const downloadReport = (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return errorResponse(res, 404, "Report job not found");
  if (job.status === "processing")
    return errorResponse(res, 425, "Report is still processing");
  if (job.status === "failed")
    return errorResponse(res, 500, `Report generation failed: ${job.error}`);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="sales-report-${job.id}.pdf"`,
  );
  return res.send(job.pdfBuffer);
};

const listReportJobs = (req, res) =>
  successResponse(res, 200, "Report jobs retrieved", listJobs());

module.exports = {
  getSummary,
  createReport,
  getReportStatus,
  downloadReport,
  listReportJobs,
};
