const { getSalesSummary } = require("../db/salesQuery");
const { buildReportPdf } = require("../pdf/buildReportPdf");
const { completeJob, failJob } = require("./jobStore");

const runReportJob = async (jobId) => {
  try {
    const summary = await getSalesSummary();
    const pdfBuffer = await buildReportPdf(summary);
    completeJob(jobId, pdfBuffer);
  } catch (err) {
    failJob(jobId, err);
  }
};

module.exports = { runReportJob };
