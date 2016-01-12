/**
 * Created by tums on 7/1/16.
 */
'use strict';

var types = require('./lib/parameters/types.json');
const DubboTcpClient = require('./lib/dubboTcpClient');

module.exports = {
  Service: require('./lib/service'),
  types,
  DubboTcpClient
};
