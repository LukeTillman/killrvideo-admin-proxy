var winston = require('winston');
var morgan = require('morgan');
var logger = require('../lib/logger');
var config = require('../conf');

// Shared file logger for production setups
var requestFileLogger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: './logs/request-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        })
    ],
    exitOnError: false
});

// Returns middleware for logging all requests to the site
module.exports = function requestLogger() {
    logger.debug('Setting up request logging (isDevelopment = %s)', config.isDevelopment);
    
    // For development, just use morgan with the default dev setup (log to console)
    if (config.isDevelopment) {
        return morgan('dev');
    } 
    
    // For production, hook morgan up to winston to log to a file
    return morgan('combined', {
        stream: {
            write: function(message, encoding) {
                requestFileLogger.info(message);
            }
        }
    });
};