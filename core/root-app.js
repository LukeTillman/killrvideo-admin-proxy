var path = require('path');
var express = require('express');
var config = require('config');
var _ = require('lodash');

// Middleware
var favicon = require('serve-favicon');
var requestLogger = require('../middleware/request-logger');
var subdomainProxy = require('../middleware/subdomain-proxy');
var cookies = require('../middleware/cookies');
var session = require('../middleware/session');
var authentication = require('../middleware/authentication');
var authorization = require('../middleware/authorization');
var notAuthorized = require('../middleware/not-authorized');
var errorLogger = require('../middleware/error-logger');
var errorHandler = require('../middleware/error-handler');

// Function that returns an express app for handling requests on the root of
// the site (i.e. no subdomains)
module.exports = function rootApp() {
    // The main express app
    var app = express();
    
    // Save the main domain for use in templates
    var domain = config.get('domain');
    app.locals.domain = domain;
    
    // Figure out the subdomain offset by parsing the main domain name
    var domainParts = domain.split('.');
    app.set('subdomain offset', domainParts.length);
    
    // Setup the view engine
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'jade');
    
    // Serve favicon requests
    app.use(favicon(path.join(__dirname, '../public') + '/favicon.ico'));
    
    // Log requests
    app.use(requestLogger());
    
    // Static content
    app.use(express.static(path.join(__dirname, '../public')));
    
    // Enable cookie parsing
    app.use(cookies());
    
    // Enable sessions
    app.use(session());
    
    // Allow users to authenticate
    app.use(authentication(true));
    
    // Must be authorized to access handlers below
    app.use(authorization());
    
    // Main view for selecting where to go once authorized
    app.get('/', function(req, res, next) {
        var resources = _.map(config.get('subdomains'), function(val) {
            return {
                subdomain: val.subdomain,
                name: val.name,
                description: val.description,
                image: val.image
            };
        });
        
        res.render('index', {
            resources: resources
        });
    });
    
    // Error Handlers
    app.use(notAuthorized());
    app.use(errorLogger());
    app.use(errorHandler());
    
    // Return the app
    return app;
};