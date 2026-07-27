const outEl = document.getElementById("out");
const progressEl = document.getElementById("progress");

function setOutput(obj) {
  outEl.textContent = JSON.stringify(obj, null, 2);
}

async function viewSummary() {
  setOutput({ status: "loading summary..." });
  const res = await fetch("/reports/summary");
  setOutput(await res.json());
}

async function pollStatus(jobId, statusUrl) {
  progressEl.textContent = "Processing report…";
  progressEl.style.display = "block";

  for (let i = 0; i < 30; i += 1) {
    const res = await fetch(statusUrl);
    const json = await res.json();
    const { status, downloadUrl } = json.data;

    if (status === "completed") {
      progressEl.innerHTML = `Done — <a href="${downloadUrl}" target="_blank">Download PDF</a>`;
      setOutput(json);
      return;
    }
    if (status === "failed") {
      progressEl.textContent = "Report generation failed.";
      setOutput(json);
      return;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  progressEl.textContent = "Still processing — check back shortly.";
}

async function generateReport() {
  setOutput({ status: "starting job..." });
  const res = await fetch("/reports", { method: "POST" });
  const json = await res.json();
  setOutput(json);
  if (res.status === 202) {
    pollStatus(json.data.jobId, json.data.statusUrl);
  }
}

document.getElementById("btn-summary").addEventListener("click", viewSummary);
document
  .getElementById("btn-generate")
  .addEventListener("click", generateReport);
