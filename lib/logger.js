var path = require('path');
var bunyan = require('bunyan');
var config = require('../conf');

var loggerConfig = { 
    name: 'killrvideo-admin-proxy',
    streams: [{
        type: 'rotating-file',
        path: path.resolve(__dirname, '../logs/all-logs.log'),
        period: '1d',
        count: 7,
        level: 'info'
    }]
};

// If we're in a development environment, add console stream logger
if (config.isDevelopment) {
    var bunyanFormat = require('bunyan-format');
    loggerConfig.streams.push({
        level: 'debug',
        stream: bunyanFormat({ outputMode: 'short' })
    });
}

// Main app logger
module.exports = bunyan.createLogger(loggerConfig);