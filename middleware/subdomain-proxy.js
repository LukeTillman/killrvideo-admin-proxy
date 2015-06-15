var path = require('path');
var express = require('express');
var vhost = require('vhost');

var config = require('../conf');

var requestLogger = require('./request-logger');
var cookies = require('./cookies');
var session = require('./session');
var authentication = require('./authentication');
var authorization = require('./authorization');
var proxy = require('./proxy');
var notAuthorized = require('./not-authorized');
var errorHandler = require('./error-handler');

// Returns middleware for proxying subdomain requests
module.exports = function subdomainProxy() {
    var app = express();
    
    // Save the main domain for use in templates
    app.locals.domain = config.domain;
    
    // Figure out the subdomain offset by parsing the main domain name
    var domainParts = config.domain.split('.');
    app.set('subdomain offset', domainParts.length);
    
    // Setup the view engine so the subdomain can show error handler views
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'jade');
    
    // Log requests
    app.use(requestLogger());
    
    // Allow cookies
    app.use(cookies());
    
    // Enable sessions
    app.use(session());

    // Populate any authentication information but don't actually host routes for auth here
    app.use(authentication(false));

    // Must be authorized to access handlers below
    app.use(authorization());

    // Proxy requests to backend services
    app.use(proxy());

    // Error Handlers
    app.use(notAuthorized());
    app.use(errorHandler());
    
    // Pass any requests to subdomains to our new express app
    return vhost('*.' + config.domain, app);
};