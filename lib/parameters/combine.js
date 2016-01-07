/**
 * Created by tums on 7/1/16.
 */
'use strict';

module.exports = function (next) {
  return function (type, value) {
    if (type.indexOf('.') >= 0) {
      return 'L' + type.replace(/\./gi, '/') + ';'
    }

    return next(type, value);
  }
};
