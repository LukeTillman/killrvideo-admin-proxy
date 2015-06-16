var httpProxy = require('http-proxy');

// Returns middleware that proxies requests to backend services
module.exports = function subdomainProxy() {
    // Create a proxy server to service requests
    var proxy = httpProxy.createProxyServer({xfwd: true});
    
    return function subdomainProxy(req, res, next) {
        // Make sure we have proxy information
        if (!req.proxyTo) {
            next(new Error('No proxy information found on the request'));
            return;
        }
        
        var target = 'http://' + req.proxyTo.upstream;
        
        // If web socket information is present, proxy the socket
        if (req.webSocket) {
            proxy.ws(req, req.webSocket.socket, req.webSocket.head, { target: target }, function(err) {
                if (!err) return;
                next(err);
            });
            return;
        }
        
        // Otherwise proxy the request and handle errors
        proxy.web(req, res, { target: target }, function(err) {
            if (!err) return;
            next(err);
        });
    };
};