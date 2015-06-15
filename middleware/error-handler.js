var config = require('config');
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
};

// Middleware for handling errors
module.exports = function errorHandler() {
    var isDevelopment = config.get('isDevelopment');
    
    return function errorHandler(err, req, res, next) {
        res.status(err.status || 500);
        
        // Log error
        getChildLogger(req, res).error(err);
        
        // Show view
        res.render('error', {
            message: err.message,
            // Only show stack traces in development
            error: isDevelopment ? err : {}
        });
    };
};