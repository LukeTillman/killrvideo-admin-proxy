var everyauth = require('everyauth');
var express = require('express');
var logger = require('../lib/logger');
var config = require('../conf');
var _ = require('lodash');

// Create a "user" object used by everyauth and logs the successful login
function createUserAndLog(accessMethod, emailAddress, additionalData) {
    var authInfo = {
        loginMethod: accessMethod,
        emailAddress: emailAddress,
        metadata: additionalData
    };
    logger.info({ authInfo: authInfo }, 'Successful authentication');
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
            
    // Setup GitHub OAuth authentication
    everyauth.github
        .appId(authConfig.github.appId)
        .appSecret(authConfig.github.appSecret)
        .scope('user:email,read:org')
        .findOrCreateUser(function(session, accessToken, accessTokenExtra, githubUserMetadata) {
            // Create the user from the data that comes back in the initial metadata
            var user = createUserAndLog('github', githubUserMetadata.email, githubUserMetadata);
            
            // GitHub doesn't return orgs in the initial metadata, so we need to make a 2nd call to get them
            var p = this.Promise();
            this.oauth.get(this.apiHost() + '/user/orgs', accessToken, function(err, data) {
                if (err) return p.fail(err);
                
                // Store the orgs along with the auth info in session
                var orgs = JSON.parse(data);
                session.auth = session.auth || {};
                session.auth.github = session.auth.github || {};
                session.auth.github.orgs = _.map(orgs, 'login');    // Use the login property of the returned orgs
                p.fulfill(user);
            });
            return p;
        })
        .redirectPath(postLoginPath);
    
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