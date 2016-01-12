'use strict';

var hashStream = require('./hash-stream'),
    concat = require('concat-stream'),
    constants = require('../constants'),
    url = require('url'),
    util = require('util'),
    defaultTimeout = constants.capabilityTimeoutInSeconds;

module.exports = function isRequestValid(context, req, cb) {
  var timeout = context.capabilityTimeoutInSeconds || defaultTimeout;
  var uri = url.parse(req.url, true);
  if(uri.query.messageHash && uri.query.dt) {
      var headers = req.headers,
      queryString = uri.query,
      requestDate = new Date(queryString.dt),
      currentDate = new Date(),
      diff = (currentDate - requestDate) / 1000,
      messageHash = decodeURI(queryString.messageHash);
       
      if(Object.keys(req.body).length == 0) {
        return cb(new Error(util.format("Unauthorized access from %s -- Missing request body", headers.host)));  
      }
      
      var bodyKeys = Object.keys(req.body);
      var bodyString = "";
      
      for(var i = 0; i < bodyKeys.length; i++) {
          bodyString += (bodyKeys[i] + '=' + req.body[bodyKeys[i]]);
          if(i < (bodyKeys.length - 1)) {
              bodyString += '&';
          }
      }
          
      req.pipe(hashStream(context.sharedSecret, queryString.dt, bodyString)).pipe(concat(function (hash) {
        if (hash !== messageHash || diff > timeout) {
          return cb(new Error(util.format("Unauthorized access from %s, %s, %s Computed: %s", headers.host, messageHash, queryString.dt, hash)));
        } else {
          return cb(null);
        }
      }));
  } else {
    var headers = req.headers,
        body = JSON.stringify(req.body),
        requestDate = new Date(headers.date),
        currentDate = new Date(),
        diff = (currentDate - requestDate) / 1000;
    
    if(!headers.date || !headers[constants.headerPrefix + constants.headers['SHA256']]) {
        return cb(new Error(util.format("Unauthorized access from %s -- Missing one or more headers", headers.host)));
    }
    if(Object.keys(req.body).length == 0) {
        return cb(new Error(util.format("Unauthorized access from %s -- Missing request body", headers.host)));
    }
    req.pipe(hashStream(context.sharedSecret, headers.date, body)).pipe(concat(function (hash) {
        if (hash !== headers[constants.headerPrefix + constants.headers['SHA256']] || diff > timeout) {
        return cb(new Error(util.format("Unauthorized access from %s, %s, %s Computed: %s", headers.host, headers[constants.headerPrefix + constants.headers['SHA256']], headers.date, hash)));
        } else {
        return cb(null);
        }
    }));
  }
};