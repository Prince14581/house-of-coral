// middleware/errorMiddleware.js
const errorMiddleware = (err, req, res, next) => {
    // 1. Log the error internally (for your audit records)
    console.error(`[SYSTEM ERROR] ${new Date().toISOString()}:`, err.stack);

    // 2. Respond to the user gracefully, without exposing sensitive backend code
    res.status(500).json({
        success: false,
        message: "Service temporarily unavailable. Please try again later.",
        // Only include error details in development mode
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = errorMiddleware;
