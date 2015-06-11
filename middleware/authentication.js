var everyauth = require('everyauth');
var express = require('express');
var logger = require('../lib/logger');
var config = require('../conf');

// Create a "user" object used by everyauth and logs the successful login
function createUserAndLog(accessMethod, emailAddress, additionalData) {
    logger.accessLogger.info('Successful login', {
        loginMethod: accessMethod,
        emailAddress: emailAddress,
        metadata: additionalData
    });
    return { id: emailAddress };
}

// Middleware that authenticates a user or handles authentication-related tasks
module.exports = function authentication(setupRoutes) {
    // If we're not setting up routes, we just need everyauth middleware that will pull any
    // authentication information out of the session
    if (!setupRoutes) {
        return everyauth.middleware({ autoSetupRoutes: false });
    }
    
    // Where to redirect a user after a successful login
    var postLoginPath = '/auth/postLogin';
    
    // Otherwise, we need to do some configuration and setup the routes
    var authConfig = config.authentication;
    
    // Setup Google OAuth 2 authentication
    everyauth.google
        .appId(authConfig.google.appId)
        .appSecret(authConfig.google.appSecret)
        .scope('email')
        .findOrCreateUser(function(session, accessToken, accessTokenExtra, googleUserMetadata) {
            return createUserAndLog('google', googleUserMetadata.email, googleUserMetadata);
        })
        .redirectPath(postLoginPath);
    
    // TODO: GitHub authentication
    
    // Lookup user information by just calling back with the userId
    everyauth.everymodule.findUserById(function(userId, callback) {
        callback(userId);
    });
    
    // Create a router to handle custom login routes or handoff to the express middleware
    var router = express.Router();
    
    // Page for user to select how to login
    router.get(authConfig.loginPath, function(req, res, next) {
        // If there is a parameter specifying where to go after login, save it in a cookie
        var redirectAfterLogin = req.query.redirectAfterLogin;
        if (redirectAfterLogin) {
            res.cookie('redirectAfterLogin', redirectAfterLogin, { signed: true });
        }
        
        // Show the view for logging in        
        res.render('login');
    });
    
    // Post-login redirect handler
    router.get(postLoginPath, function(req, res, next) {
        // See if there is somewhere we're supposed to send them after login
        var redirectTo = req.signedCookies.redirectAfterLogin;
        if (redirectTo) {
            res.clearCookie('redirectAfterLogin');
            res.redirect(redirectTo);
        } else {
            res.redirect('/');
        }
    });
    
    // Allow the everyauth middleware and its routes to handle requests
    router.use(everyauth.middleware());
    
    return router;
};