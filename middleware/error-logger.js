var logger = require('../lib/logger');

// Gets a child logger of the main logger with extra context info added to the log record
function getChildLogger(req, res) {
    var extraInfo = {
        req: req,
        res: res,
        loggedIn: false,
        userId: null
    };
    
    // Include auth info if present
    if (req.session && req.session.auth) {
        extraInfo.loggedIn = req.session.auth.loggedIn;
        extraInfo.userId = req.session.auth.userId;
    }
    
    return logger.child(extraInfo);
}

// Function that returns middleware for logging errors
module.exports = function errorLogger() {
    return function errorLogger(err, req, res, next) {
        // Log error
        getChildLogger(req, res).error(err);
        
        // Next error handler
        next(err);
    };
};