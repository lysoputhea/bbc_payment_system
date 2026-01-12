// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const morgan = require("morgan");
// const passport = require("passport");
// const rateLimit = require("express-rate-limit");

// // require("dotenv").config(); // Loads environment variables from .env file

// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config();
// }

// require("./config/passport")(passport);

// const authRoutes = require("./routes/auth");
// const dashboardRoutes = require("./routes/dashboard");
// const branchRoutes = require("./routes/branches");
// const studentRoutes = require("./routes/students");
// const classRoutes = require("./routes/classes");
// const courseRoutes = require("./routes/courses");
// const enrollmentRoutes = require("./routes/enrollments");
// const paymentRoutes = require("./routes/payments");
// const invoiceRoutes = require("./routes/invoices");
// const reportRoutes = require("./routes/reportRoutes");
// const userRoutes = require("./routes/users");

// const app = express();

// // app.use(cors({ origin: "*" }));
// app.use(helmet());
// app.use(morgan("combined"));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(passport.initialize());

// // Routes
// app.use("/api/", limiter); // Apply rate limiting to all API routes
// app.use("/api/auth", authRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/branches", branchRoutes);
// app.use("/api/students", studentRoutes);
// app.use("/api/classes", classRoutes);
// app.use("/api/courses", courseRoutes);
// app.use("/api/enrollments", enrollmentRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/invoices", invoiceRoutes);
// app.use("/api/reports", reportRoutes);
// app.use("/api/users", userRoutes);
// app.get("/health", (req, res) => res.status(200).send("OK"));

// // Middleware for CORS
// app.use(
//   cors({
//     origin: ["https://web.bbckpc.site"], // allow frontend
//   })
// );

// // 404 handler
// app.use((req, res, next) => {
//   res.status(404).json({
//     status: "error",
//     error: { code: 404, message: "Route not found" },
//   });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     status: "error",
//     error: { code: 500, message: "Something went wrong!" },
//   });
// });

// // Rate limiting middleware
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

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const passport = require("passport");
const rateLimit = require("express-rate-limit");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

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

/* ======================
   ✅ CORS (MUST BE FIRST)
====================== */
// app.use(
//   cors({
//     origin: ["https://web.bbckpc.site"],
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// Enable preflight
// app.options("*", cors());
app.use(cors({ origin: "*" }));

/* ======================
   Security & Parsers
====================== */
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

/* ======================
   Rate Limiter
====================== */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

/* ======================
   Routes
====================== */
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

app.get("/health", (req, res) => res.status(200).send("OK"));

/* ======================
   Errors
====================== */
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    error: { code: 404, message: "Route not found" },
  });
});

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
