var _ = require('lodash');

function isAuthorized(req) {
    // No authentication means not allowed in
    if (req.isAuthenticated() !== true) {
        return false;
    }
    
    var allowedGroups = [];
    switch(req.user.provider) {
        case 'google':
            allowedGroups = [ 'datastax.com' ];
            break;
        case 'github':
            allowedGroups = [ 'riptano', 'datastax' ];
            break;
    }

    // See if the user is in one of the allowed groups    
    return _.intersection(req.user.groups, allowedGroups).length > 0;
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