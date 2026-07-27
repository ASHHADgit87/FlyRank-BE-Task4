# FlyRank BE Task 4 — PDF Report Generator
A SQL-aggregated PDF report generator built for the FlyRank Backend AI Engineering internship (Week 7). It queries a sales dataset, aggregates it with real SQL, renders the results into a downloadable PDF, and does so through a background-job pattern: enqueue, process, poll status, download a link — never the raw file bytes.

---

## Architecture
| Layer | Responsibility |
|---|---|
| Data | Fixed in-memory sales dataset standing in for a real orders table |
| DB | In-memory SQLite (via sql.js/WASM) — real `GROUP BY`/`SUM`/`AVG` SQL, no disk writes |
| PDF | pdfkit renders the aggregated summary into a styled PDF buffer |
| Jobs | In-memory job store simulating enqueue → process → complete/fail |
| Controllers | Orchestrates job creation, status polling, and PDF download |
| Routes | Maps the report + job endpoints |

---

## Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/summary` | Aggregated sales JSON (no PDF, no job) |
| POST | `/reports` | Starts a report job, returns `202` with status/download links |
| GET | `/reports` | Lists all report jobs and their status |
| GET | `/reports/:id/status` | Job status: processing / completed / failed |
| GET | `/reports/:id/download` | Streams the generated PDF |
| GET | `/reports/scheduled/run` | Cron-triggered alias (used by Vercel's scheduled job) |

---

## Why sql.js instead of a native SQLite driver
`better-sqlite3` is a native binary — risky to trust on Vercel's serverless build. `sql.js` compiles SQLite to WebAssembly, so it runs as ordinary JS with zero native compilation, while still executing genuine SQL aggregation queries (`GROUP BY`, `SUM`, `AVG`) against an in-memory database rebuilt on each request.

## The background-job pattern
`POST /reports` returns immediately with a `jobId` and links — it does not wait for PDF generation, and never returns the file itself. The actual work (query → render) runs in a fire-and-forget async function, with progress tracked through `GET /reports/:id/status` until the client is handed a `downloadUrl`. This is the same shape a real queue (Redis/BullMQ) would use — the honest caveat is that the job store here is an in-memory `Map`, which resets on a serverless cold start. A production version would swap that Map for Redis or a database without touching the job or PDF logic at all.

## Scheduled generation (stretch)
`vercel.json` includes a Vercel Cron entry that hits `/reports/scheduled/run` daily, demonstrating the "on a schedule" stretch goal using Vercel's native cron feature — no extra service required.

---

## Live Demo

https://fly-rank-be-task4.vercel.app

---

## Creator & Developer

**Muhammad Ashhadullah Zaheer**

LinkedIn: https://www.linkedin.com/in/muhammad-ashhadullah-zaheer-41194a340/
