var path = require('path');
var express = require('express');
var vhost = require('vhost');

var config = require('config');

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
    
    
    // Pass any requests to subdomains to our new express app
    return vhost('*.' + domain, app);
};