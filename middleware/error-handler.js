var config = require('../conf');

// Middleware for handling errors
module.exports = function errorHandler() {
    
    // Default error handlers
    if (config.isDevelopment) {
        // Development error handler, will print stack traces
        return function errorHandler(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
               message: err.message,
               error: err
            });
        };
    }
    
    // Production error handler, hides stack traces
    return function errorHandler(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    };
};