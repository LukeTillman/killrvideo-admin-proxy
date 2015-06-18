var express = require('express');
var ServerResponse = require('http').ServerResponse;

// Express middleware
var requestLogger = require('../middleware/request-logger');
var subdomainVerify = require('../middleware/subdomain-verify');
var session = require('../middleware/session');
var authentication = require('../middleware/authentication');
var authorization = require('../middleware/authorization');
var subdomainProxy = require('../middleware/subdomain-proxy');
var errorLogger = require('../middleware/error-logger');

// Function that creates an "app" capable of handling upgrade requests for web sockets
// and proxying them to subdomains
module.exports = function subdomainSocketApp() {
    // We want to use some express middleware before proxying the socket
    var app = express();
    app.use(requestLogger());
    app.use(subdomainVerify());
    app.use(session());
    app.use(authentication(false));
    app.use(authorization());
    
    // Proxy the web socket
    app.use(subdomainProxy());
    
    // Always destroy the web socket on error
    app.use(function(err, req, res, next) {
        req.webSocket.socket.destroy();
        next(err);
    });
    
    // If not authorized, no need to do anything else
    app.use(function(err, req, res, next) {
        if (err === authorization.notAuthorizedToken) {
            return;
        }
        
        // Otherwise, allow error logger to run
        next(err);
    });
    
    // Log errors
    app.use(errorLogger());
    
    // The main handler
    return function subdomainSocketApp(req, socket, head) {
        // Create a response so the express handlers can have it
        var res = new ServerResponse(req);
        
        // Add web socket to request object
        req.webSocket = {
            socket: socket,
            head: head
        };
        
        // Handle with express
        app(req, res, function() {
            // Remove the web socket info we added to the request
            if (req.webSocket) {
                delete req.webSocket;
            }
        });
    };
};