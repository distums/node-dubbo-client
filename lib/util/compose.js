/**
 * Created by tums on 7/1/16.
 */
'use strict';

module.exports = function (arrs) {
  return (arrs || []).filter(function (fn) {
    return typeof fn === 'function';
  }).reduceRight(function (prev, current) {
    return current(prev);
  });
};
