/// <reference path="typings/node/node.d.ts"/>
var http = require('http');
var express = require('express');
var vhost = require('vhost');
var config = require('config');

var logger = require('./lib/logger');
var rootApp = require('./core/root-app');
var subdomainApp = require('./core/subdomain-app');

// Create the main express app
var app = express();

// Route all subdomain requests to the subdomain app
app.use(vhost('*.' + config.get('domain'), subdomainApp()));

// All other requests go to the root app
app.use(rootApp());

// Start the Web Server
var httpServer = http.createServer(app);
var bindIp = config.get('bindIp');
var bindPort = config.get('bindPort');
httpServer.listen(bindPort, bindIp, function(err) {
    if (err) {
        logger.error(err, "Failed to bind to %s:%d", bindIp, bindPort);
        process.exit(1);
    }
  
    logger.info("Listening on %s:%d", bindIp, bindPort);
});