/**
 * Created by tums on 7/1/16.
 */
'use strict';

var types = require('./types.json');

module.exports = function (next) {
  return function (type, value) {
    if (type === types.SHORT) {
      return 'S';
    }

    return next(type, value);
  };
};
