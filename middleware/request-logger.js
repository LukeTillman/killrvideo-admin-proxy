var path = require('path');
var bunyan = require('bunyan');
var expressBunyan = require('express-bunyan-logger');
var logger = require('../lib/logger');
var config = require('config');

// Just create one logger instance and reuse it if middleware is created multiple times
var fileLogger = bunyan.createLogger({
    name: 'request-logger',
    serializers: {
        // Customize request serialization so we only include auth information if present
        req: function serializeRequest(req) {
            var reqInfo = {
                hostname: req.hostname,
                subdomains: req.subdomains,
                loggedIn: false,
                userId: null
            };
            if (req.session && req.session.auth) {
                reqInfo.loggedIn = req.session.auth.loggedIn;
                reqInfo.userId = req.session.auth.userId;
            }
            return reqInfo;
        }
    },
    streams: [{
        type: 'rotating-file',
        path: path.resolve(__dirname, '../logs/request-logs.log'),
        period: '1d',
        count: 7,
        level: 'info'
    }]
});

// Returns middleware for logging all requests to the site
module.exports = function requestLogger() {
    // Always log requests to a file
    var expressFileLogger = expressBunyan({
        logger: fileLogger,
        parseUA: false,
        excludes: [
            'res', 'req-headers', 'res-headers', 'body', 'short-body', 'incoming'
        ]
    });
    
    // Log requests to the console also in development environments using morgan dev output
    if (config.get('isDevelopment')) {
        var morgan = require('morgan');
        var expressMorgan = morgan('dev');
        return [ expressFileLogger, expressMorgan ];
    } else {
        return expressFileLogger;
    }
};