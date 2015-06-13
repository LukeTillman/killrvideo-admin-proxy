var path = require('path');
var expressBunyan = require('express-bunyan-logger');
var logger = require('../lib/logger');
var config = require('../conf');

// Returns middleware for logging all requests to the site
module.exports = function requestLogger() {
    logger.debug('Setting up request logging (isDevelopment = %s)', config.isDevelopment);
    
    // Always log requests to a file
    var expressFileLogger = expressBunyan({
        name: 'request-logger',
        format: ' ',
        parseUA: false,
        excludes: [
            'req', 'res', 'req-headers', 'res-headers', 'body', 'short-body', 'incoming'
        ],
        streams: [{
            type: 'rotating-file',
            path: path.resolve(__dirname, '../logs/request-logs.log'),
            period: '1d',
            count: 7,
            level: 'info'
        }]
    });
    
    // Log requests to the console also in development environments using morgan dev output
    if (config.isDevelopment) {
        var morgan = require('morgan');
        var expressMorgan = morgan('dev');
        return [ expressFileLogger, expressMorgan ];
    } else {
        return expressFileLogger;
    }
};