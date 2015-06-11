var logger = require('../lib/logger');

function isAuthorized(req) {
    // Users who aren't logged in aren't authorized
    if (req.loggedIn !== true || !req.session.auth) {
        return false;
    } 
    
    // Check Google logins
    if (req.session.auth.google && req.session.auth.google.user.hd === 'datastax.com') {
        return true;
    }
    
    // TODO: Check GitHub logins
    
    return false;
}

var notAuthorizedToken = { message: 'Not authorized' };

// Middleware to check to see if a user is authorized to continue
module.exports = function authorization() {
    return function authorization(req, res, next) {
        // Check for authorization
        if (isAuthorized(req)) {
            next();
            return;
        }
        
        // Not authorized, so do an error callback with the token
        next(notAuthorizedToken);
    };
};

// Export the token so other modules can potentially check for it
module.exports.notAuthorizedToken = notAuthorizedToken;