// utils/catchAsync.js
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// In your controller, you wrap the function
// exports.getAllBranches = catchAsync(async (req, res) => { ... });

// In your main app.js, after all your routes
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR HANDLER:", err);
  // You can add more logic here to format the error based on its type
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message || "An unexpected server error occurred.",
  });
});
