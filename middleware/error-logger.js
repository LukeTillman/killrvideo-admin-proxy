var logger = require('../lib/logger');

// Function that returns middleware for logging errors
module.exports = function errorLogger() {
    return function errorLogger(err, req, res, next) {
        // Log error
        logger.child({ req: req, res: res }).error(err);
        
        // Next error handler
        next(err);
    };
};