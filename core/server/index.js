var https = require('https');
var fs = require('fs');
var express = require('express');
var vhost = require('vhost');
var config = require('config');
var Promise = require('bluebird');

var logger = require('./lib/logger');
var rootApp = require('./root-app');
var subdomainApp = require('./subdomain-app');
var subdomainSocketApp = require('./subdomain-socket-app');


// Main Server class that can be started/stopped
function Server(expressApp, socketApp, options) {
    this.expressApp = expressApp;
    this.socketApp = socketApp;
    this.options = options;
    
    this.httpsServer = null;
    this.bindIp = config.get('bindIp');
    this.bindPort = config.get('bindPort');
}

// Start the server
Server.prototype.start = function() {
    // Already started?
    if (this.httpsServer !== null) {
        return Promise.resolve(this);
    }
    
    return Promise.bind(this)
        .then(function() {
            var readFileAsync = Promise.promisify(fs.readFile);
            return [
                readFileAsync(this.options.certPath + '/key.pem'),
                readFileAsync(this.options.certPath + '/cert.pem')
            ];
        })
        .spread(function(key, cert) {
            // Create the server and handle websocket upgrade requests
            var server = https.createServer({
                key: key,
                cert: cert
            }, this.expressApp);
            server.on('upgrade', this.socketApp);
            
            var resolve, reject;
            var p = new Promise(function(fn1, fn2) {
                resolve = fn1;
                reject = fn2;
            });
            server.on('listening', resolve);
            server.on('error', reject);
            this.httpsServer = server;
            
            // Start listening
            this.httpsServer.listen(this.bindPort, this.bindIp);
            
            return p;
        })
        .then(function() {
            logger.info('Listening on %s:%d', this.bindIp, this.bindPort);
            return this;
        })
        .catch(function(err) {
            logger.error(err, 'Failed to bind to %s:%d', this.bindIp, this.bindPort);
            this.httpsServer = null;
        });
};

// Stops the server
Server.prototype.stop = function() {
    if (this.httpsServer === null) {
        return Promise.resolve(this);
    }
    
    return this.httpsServer
        .closeAsync()
        .then(function() {
            logger.info('Successfully shutdown');
            return this;
        });
};

// Restarts the server
Server.prototype.restart = function() {
    return this.stop().then(function(server) {
        return server.start();
    });
};

// Export a function that creates the server and returns an instance of the server
module.exports = function createServer(options) {
    return Promise.try(function(opt) {
        // Create the main express app
        var app = express();
        
        // Route all subdomain requests to the subdomain app
        app.use(vhost('*.' + config.get('domain'), subdomainApp()));
        
        // All other requests go to the root app
        app.use(rootApp(opt.publicAssetPaths));
        
        // Create an app for handling websocket requests
        var socketApp = subdomainSocketApp();
        
        return new Server(app, socketApp, opt);
    }, options);
};

