var config = require('config');

// Middleware for handling errors
module.exports = function errorHandler() {
    var isDevelopment = config.get('isDevelopment');
    
    return function errorHandler(err, req, res, next) {
        res.status(err.status || 500);
        
        // Show view
        res.render('error', {
            message: err.message,
            // Only show stack traces in development
            error: isDevelopment ? err : {}
        });
    };
};