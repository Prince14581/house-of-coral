/**
 * Standardized Response Wrapper
 */
const success = (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

const error = (res, message = 'An error occurred', statusCode = 500, details = null) => {
    res.status(statusCode).json({
        success: false,
        message,
        details,
        timestamp: new Date().toISOString()
    });
};

module.exports = { success, error };
