var path = require('path');
var express = require('express');
var config = require('config');

// Middleware
var requestLogger = require('./middleware/request-logger');
var cookies = require('./middleware/cookies');
var session = require('./middleware/session');
var authentication = require('./middleware/authentication');
var authorization = require('./middleware/authorization');
var subdomainVerify = require('./middleware/subdomain-verify')
var subdomainRedirectRoot = require('./middleware/subdomain-redirect-root');
var subdomainProxy = require('./middleware/subdomain-proxy');
var notAuthorized = require('./middleware/not-authorized');
var errorLogger = require('./middleware/error-logger');
var errorHandler = require('./middleware/error-handler');

// Function for creating the app that serves regular requests to subdomains
// (i.e. not web socket requests)
module.exports = function subdomainApp() {
    var app = express();
    
    // Save the main domain for use in templates
    var domain = config.get('domain');
    app.locals.domain = domain;
    
    // Figure out the subdomain offset by parsing the main domain name
    var domainParts = domain.split('.');
    app.set('subdomain offset', domainParts.length);
    
    // Setup the view engine so the subdomain can show error handler views
    app.set('views', path.join(__dirname, './views'));
    app.set('view engine', 'jade');
    
    // Log requests
    app.use(requestLogger());
    
    // Verify subdomains
    app.use(subdomainVerify());
    
    // Allow cookies
    app.use(cookies());
    
    // Enable sessions
    app.use(session());

    // Populate any authentication information but don't actually host routes for auth here
    app.use(authentication(false));

    // Must be authorized to access handlers below
    app.use(authorization());
    
    // Allow root requests to be redirected if configured
    app.use(subdomainRedirectRoot());

    // Proxy requests to backend services
    app.use(subdomainProxy());

    // Error Handlers
    app.use(notAuthorized());
    app.use(errorLogger());
    app.use(errorHandler());
    
    // Return the configured app
    return app;
};