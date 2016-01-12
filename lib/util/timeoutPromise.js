/**
 * Created by tums on 12/1/16.
 */
'use strict';

module.exports = (promises, timeout)=> {
  timeout = timeout || 5000;
  let p = new Promise(function (resolve, reject) {
    setTimeout(()=> {
      let ex = new Error('timeout at `' + timeout + '`');
      reject(ex);
    }, timeout);
  });

  return Promise.race([...promises, p]);
};
