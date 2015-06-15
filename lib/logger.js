var path = require('path');
var bunyan = require('bunyan');
var config = require('config');

var loggerConfig = { 
    name: 'killrvideo-admin-proxy',
    serializers: {
        req: function serializeRequest(req) {
            return {
                method: req.method,
                hostname: req.hostname,
                originalUrl: req.originalUrl,
                httpVersionMajor: req.httpVersionMajor,
                httpVersionMinor: req.httpVersionMinor,
                ip: req.ip,
                headers: req.headers
            };
        },
        res: function serializeResponse(res) {
            return {
                statusCode: res.statusCode,
                _headers: res._headers
            };
        }
    },
    streams: [{
        type: 'rotating-file',
        path: path.resolve(__dirname, '../logs/all-logs.log'),
        period: '1d',
        count: 7,
        level: 'info'
    }]
};

// If we're in a development environment, add console stream logger
if (config.get('isDevelopment')) {
    var bunyanFormat = require('bunyan-format');
    loggerConfig.streams.push({
        level: 'debug',
        stream: bunyanFormat({ outputMode: 'short' })
    });
}

// Main app logger
module.exports = bunyan.createLogger(loggerConfig);