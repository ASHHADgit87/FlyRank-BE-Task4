const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const logger = require("./middleware/logger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const reportRoutes = require("./routes/reportRoutes");
const { successResponse, errorResponse } = require("./utils/response");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://vercel.live",
          "https://*.vercel-scripts.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [
          "'self'",
          "https://vercel.live",
          "https://*.vercel.app",
          "https://*.vercel-scripts.com",
        ],
        imgSrc: ["'self'", "data:", "https://vercel.live"],
      },
    },
  }),
);
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(logger);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    errorResponse(res, 429, "Too many requests, please try again later"),
});
app.use(limiter);

app.get("/", (req, res, next) => {
  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    return next();
  }
  return successResponse(res, 200, "FlyRank PDF Report Generator API", {
    name: "FlyRank PDF Report Generator",
    endpoints: [
      "GET /reports/summary",
      "POST /reports",
      "GET /reports",
      "GET /reports/:id/status",
      "GET /reports/:id/download",
    ],
  });
});

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "favicon.svg"));
});

app.use(reportRoutes);
app.use(express.static(path.join(__dirname, "public")));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
