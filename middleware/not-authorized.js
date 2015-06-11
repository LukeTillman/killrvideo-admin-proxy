var qs = require('querystring');
var authorization = require('./authorization');
var config = require('../conf');

// Returns middleware for handling a not authorized error
module.exports = function notAuthorized() {
    return function notAuthorized(err, req, res, next) {
        // If not a "Not Authorized" error, just move to the next handler
        if (err !== authorization.notAuthorizedToken) {
            next(err);
            return;
        }
        
        // If the request was an AJAX request, return a 403 Forbidden
        if (req.xhr) {
            res.sendStatus(403);
            return;
        }
        
        // If they aren't logged in, remember where they were trying to go and redirect them to the login page
        if (req.loggedIn !== true) {
            var redirectQs = qs.stringify({ redirectAfterLogin: req.protocol + '://' + req.get('host') + req.originalUrl });
            res.redirect('//' + config.domain + config.authentication.loginPath + '?' + redirectQs);
            return;
        }
        
        // Otherwise, they've logged in, but their account doesn't have access so just show a view
        res.render('notAuthorized');
    };
};