/// <reference path="typings/node/node.d.ts"/>
var http = require('http');
var express = require('express');
var path = require('path');

var config = require('./conf');
var logger = require('./lib/logger');

var requestLogger = require('./middleware/request-logger');
var subdomainProxy = require('./middleware/subdomain-proxy');
var cookies = require('./middleware/cookies');
var session = require('./middleware/session');
var authentication = require('./middleware/authentication');
var authorization = require('./middleware/authorization');
var notAuthorized = require('./middleware/not-authorized');
var errorHandler = require('./middleware/error-handler');

// The main express app
var app = express();

// Save the main domain for use in templates
app.locals.domain = config.domain;

// Setup the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Setup request logging
app.use(requestLogger());

// Route subdomain requests to proxy app
app.use(subdomainProxy());

// All other requests handled by the main app below here

// Static content
app.use(express.static(path.join(__dirname, 'public')));

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
    res.render('index');
});

// Error Handlers
app.use(notAuthorized());
app.use(errorHandler());

// Start the Web Server
var httpServer = http.createServer(app);
httpServer.listen(config.bindPort, config.bindIp, function(err) {
    if (err) {
        logger.error(err, "Failed to bind to %s:%d", config.bindIp, config.bindPort);
        process.exit(1);
    }
  
    logger.info("Listening on %s:%d", config.bindIp, config.bindPort);
});