var https = require('https');
var http = require('http');
var fs = require('fs');
var express = require('express');
var vhost = require('vhost');
var config = require('config');
var Promise = require('bluebird');

var Server = require('./lib/server');
var logger = require('./lib/logger');
var rootApp = require('./root-app');
var subdomainApp = require('./subdomain-app');
var subdomainSocketApp = require('./subdomain-socket-app');
var redirectApp = require('./redirect-app');

// Main Server class that can be started/stopped
function AdminProxyServer(mainExpressApp, options) {
    this.mainExpressApp = mainExpressApp;
    this.options = options;
    this.redirectApp = redirectApp;
    this.socketApp = subdomainSocketApp();
    this.redirectApp = redirectApp();
    
    this.bindIp = config.get('bindIp');
    this.bindHttpsPort = config.get('bindHttpsPort');
    this.bindHttpPort = config.get('bindHttpPort');
    
    this.httpServer = null;
    this.httpsServer = null;
}

// Start the server
AdminProxyServer.prototype.start = function() {
    // Start main server on HTTPS port
    var startHttpsServer = Promise.bind(this)
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
            }, this.mainExpressApp);
            server.on('upgrade', this.socketApp);
            
            var httpsServer = new Server(server, this.bindHttpsPort, this.bindIp);
            return httpsServer.start();
        })
        .then(function(httpsServer) {
            this.httpsServer = httpsServer;
        });
    
    // Start second server on HTTP port
    var startHttpServer = Promise.bind(this)
        .then(function() {
            // Create server for redirecting to HTTPS
            var server = http.createServer(this.redirectApp);
            var httpServer = new Server(server, this.bindHttpPort, this.bindIp);
            return httpServer.start();
        })
        .then(function(httpServer) {
            this.httpServer = httpServer;
        });
    
    // Wait until both servers are started
    return Promise.all([ startHttpsServer, startHttpServer ])
        .bind(this)
        .then(function() {
            logger.info('AdminProxyServer successfully started.');
        })
        .return(this)
        .catch(function(err) {
            // Figure out which server failed and stop the other one
            var stopServer = this.httpServer === null 
                ? this.httpsServer.stop() 
                : this.httpServer.stop();
            
            // After the other server is stopped, rethrow
            return stopServer.throw(err);
        });
};

// Stops the server
AdminProxyServer.prototype.stop = function() {
    return Promise.all([ this.httpsServer.stop(), this.httpServer.stop() ])
        .bind(this)
        .return(this)
        .finally(function() {
            this.httpsServer = null;
            this.httpServer = null;
        });
};

// Restarts the server
AdminProxyServer.prototype.restart = function() {
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
        
        return new AdminProxyServer(app, opt);
    }, options);
};

