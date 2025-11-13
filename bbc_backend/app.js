const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const passport = require("passport");
// const rateLimit = require("express-rate-limit");

require("dotenv").config();
require("./config/passport")(passport);

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const branchRoutes = require("./routes/branches");
const studentRoutes = require("./routes/students");
const classRoutes = require("./routes/classes");
const courseRoutes = require("./routes/courses");
const enrollmentRoutes = require("./routes/enrollments");
const paymentRoutes = require("./routes/payments");
const invoiceRoutes = require("./routes/invoices");
const reportRoutes = require("./routes/reportRoutes");
const userRoutes = require("./routes/users");

const app = express();

// Rate limiting middleware
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: {
//     status: "error",
//     error: {
//       code: 429,
//       message: "Too many requests from this IP, please try again later.",
//     },
//   },
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

// Apply rate limiting to all API routes
// app.use("/api/", limiter);

// Middleware
app.use(helmet());

app.use(
  cors({
    origin: ["http://localhost", "http://localhost:80"], // allow frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// app.use(cors({ origin: "*" }));

app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    error: { code: 404, message: "Route not found" },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    error: { code: 500, message: "Something went wrong!" },
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
