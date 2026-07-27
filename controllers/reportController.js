const { v4: uuidv4 } = require("uuid");
const { getSalesSummary } = require("../db/salesQuery");
const { buildReportPdf } = require("../pdf/buildReportPdf");
const { successResponse, errorResponse } = require("../utils/response");

const getSummary = async (req, res) => {
  const summary = await getSalesSummary();
  return successResponse(res, 200, "Sales summary computed", summary);
};

const createReport = async (req, res) => {
  const jobId = uuidv4();

  await getSalesSummary();

  return successResponse(res, 202, "Report generated", {
    jobId,
    status: "completed",
    statusUrl: `/reports/${jobId}/status`,
    downloadUrl: `/reports/${jobId}/download`,
  });
};

const getReportStatus = (req, res) => {
  const { id } = req.params;
  return successResponse(res, 200, "Report status retrieved", {
    id,
    status: "completed",
    downloadUrl: `/reports/${id}/download`,
  });
};

const downloadReport = async (req, res) => {
  const summary = await getSalesSummary();
  const pdfBuffer = await buildReportPdf(summary);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="sales-report-${req.params.id}.pdf"`,
  );
  return res.send(pdfBuffer);
};

const listReportJobs = (req, res) =>
  successResponse(res, 200, "Report jobs endpoint", {
    note: "Job history is not tracked in this stateless deployment.",
  });

module.exports = {
  getSummary,
  createReport,
  getReportStatus,
  downloadReport,
  listReportJobs,
};
