var Promise = require('bluebird');
var logger = require('./logger');

// A "promisified" version of an HTTP/HTTPS server that can be started/stopped
function Server(server, port, host) {
    this.server = Promise.promisifyAll(server);
    this.host = host;
    this.port = port;
}

// Starts the server
Server.prototype.start = function() {
    return Promise.bind(this)
        .then(function() {
            var resolve, reject;
            var p = new Promise(function(fn1, fn2) {
                resolve = fn1;
                reject = fn2;
            });
            this.server.on('listening', resolve);
            this.server.on('error', reject);
            
            // Start listening
            this.server.listen(this.port, this.host);
            
            return p;
        })
        .then(function() {
            logger.info('Listening on %s:%d', this.host, this.port);
            return this;
        })
        .catch(function(err) {
            logger.error(err, 'Failed to bind to %s:%d', this.host, this.port);
            throw err;
        });
};

// Stops the server
Server.prototype.stop = function() {
    return this.server.closeAsync()
        .bind(this)
        .then(function() {
            logger.info('Shutdown on %s:%d', this.host, this.port);
            return this;
        })
        .catch(function(err) {
            logger.error(err, 'Failed to shutdown on %s:%d', this.host, this.port);
            throw err;
        });
};

// Restarts the server
Server.prototype.restart = function() {
    return this.server.stop()
        .then(function(server) {
            return server.start();
        });
};

module.exports = Server;