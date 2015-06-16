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
        
        // Proxy the request and handle errors
        proxy.web(req, res, { target: 'http://' + req.proxyTo.upstream }, function(err) {
            if (!err) return;
            next(err);
        });
    };
};