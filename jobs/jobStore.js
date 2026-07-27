const jobs = new Map();

const createJob = (id) => {
  jobs.set(id, {
    id,
    status: "processing",
    createdAt: new Date().toISOString(),
    pdfBuffer: null,
    error: null,
  });
  return jobs.get(id);
};

const getJob = (id) => jobs.get(id) || null;

const completeJob = (id, pdfBuffer) => {
  const job = jobs.get(id);
  if (!job) return;
  job.status = "completed";
  job.pdfBuffer = pdfBuffer;
  job.completedAt = new Date().toISOString();
};

const failJob = (id, error) => {
  const job = jobs.get(id);
  if (!job) return;
  job.status = "failed";
  job.error = error.message || "Unknown error";
};

const listJobs = () =>
  Array.from(jobs.values()).map(({ id, status, createdAt, completedAt }) => ({
    id,
    status,
    createdAt,
    completedAt,
  }));

module.exports = { createJob, getJob, completeJob, failJob, listJobs };
