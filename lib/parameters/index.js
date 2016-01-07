/**
 * Created by tums on 7/1/16.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var fileNames = fs.readdirSync(__dirname).filter(function (name) {
  return name !== 'index.js' && name !== 'types.json';
});

module.exports = fileNames.map(function (name) {
  return require(path.join(__dirname, name));
}).concat([function () {
  return '';
}]);
