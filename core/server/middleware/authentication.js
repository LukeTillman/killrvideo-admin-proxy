var express = require('express');
var config = require('config');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var GitHubStrategy = require('../lib/passport-github').Strategy;
var logger = require('../lib/logger');
var _ = require('lodash');

// Creates and logs a user from the profile
function createUser(provider, email, name, picture, groups, metadata) {
    var user = {
        provider: provider,
        email: email,
        name: name,
        picture: picture,
        groups: groups
    };
    logger.info({ authUser: user, authMetadata: metadata }, 'Successful authentication');
    return user;
}

// Middleware function to add the req.user property to the res.locals so it's available in views
function addUserToResponseLocals(req, res, next) {
    res.locals.user = req.user;
    next();
}

// Do passport configuration
var domain = config.get('domain');

// Serialize the entire user object to/from session (since we don't have a DB to lookup users in)
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// Configure Google Auth
var google = new GoogleStrategy({
    clientID: config.get('authentication.google.appId'),
    clientSecret: config.get('authentication.google.appSecret'),
    callbackURL: 'https://' + domain + '/auth/google/callback'
}, function(token, tokenSecret, profile, done) {
    var rawdata = profile._json;
    var user = createUser('google', rawdata.emails[0].value, rawdata.displayName, rawdata.image.url, 
                          [ rawdata.domain ], rawdata);
    done(null, user);
});

// Configure GitHub auth
var github = new GitHubStrategy({
    clientID: config.get('authentication.github.appId'),
    clientSecret: config.get('authentication.github.appSecret'),
    callbackURL: 'https://' + domain + '/auth/github/callback'
}, function(accessToken, refreshToken, profile, done) {
    // Custom strategy returns raw JSON data as profile
    var orgs = _.map(profile.orgs, 'login');
    var user = createUser('github', profile.email, profile.name, profile.avatar_url, orgs, profile);
    done(null, user);
});

// Tell passport to use our strategies
passport.use(google);
passport.use(github);


// Returns middleware that authenticates a user or handles authentication-related tasks
module.exports = function authentication(setupRoutes) {
    // If we're not setting up routes, we just need the passport initialize and session middleware
    if (!setupRoutes) {
        return [ passport.initialize(), passport.session(), addUserToResponseLocals ];
    }
    
    // Setup routes for authentication
    var loginPath = config.get('authentication.loginPath');
    var postLoginPath = '/auth/postlogin';
    var loginRedirectOpts = {
        successRedirect: postLoginPath,
        failureRedirect: loginPath
    };
    
    var router = express.Router();
    
    // Use passport to authenticate users on these routes
    router.get('/auth/google', passport.authenticate('google', { scope: [ 'email', 'profile' ] }));
    router.get('/auth/google/callback', passport.authenticate('google', loginRedirectOpts));
    router.get('/auth/github', passport.authenticate('github', { scope: [ 'user:email', 'read:org'] }));
    router.get('/auth/github/callback', passport.authenticate('github', loginRedirectOpts));
    
    // View for selecting how to login
    router.get(loginPath, function(req, res, next) {
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
    
    // Logout handler
    router.get('/auth/logout', function(req, res, next) {
        req.logout();
        res.redirect(loginPath);
    });
    
    return [
        passport.initialize(),
        passport.session(),
        router,
        addUserToResponseLocals
    ];
    
    
        /*
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
        */
};