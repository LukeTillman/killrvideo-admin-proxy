/// <reference path="../typings/node/node.d.ts"/>
var path = require('path');
var bunyan = require('bunyan');
var config = require('config');
var mkdirp = require('mkdirp');

// Log path, resolved from the app.js root
var logPath = path.resolve(__dirname, '../', config.get('logPath'));
mkdirp.sync(logPath);

// Log to a file with a custom format for req/res objects
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
                headers: req.headers,
                user: req.user
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
        path: path.resolve(logPath, './all-logs.log'),
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