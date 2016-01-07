'use strict';
var net = require('net');
var hessian = require('hessian.js');
var ZK = require('./zookeeperClient');
var compose = require('./util/compose');
var handlers = require('./parameters');

var Service = function (opt) {
  this._version = opt.version || '2.5.3.3';
  this._path = opt.path;
  this._env = opt.env.toUpperCase();
  this._bodyContainsLength = opt.bodyContainsLength != null ? opt.bodyContainsLength : true;
  this._handlers = handlers.slice(0);

  this._attchments = {
    $class: 'java.util.HashMap',
    $: {
      path: this._path,
      interface: this._path,
      version: this._env,
      timeout: '60000'
    }
  };
  this.zoo = new ZK(opt.conn, this._path, this._env);
};

Service.prototype.execute = function (method, args, cb) {
  if (!method) {
    throw new TypeError('argument `method` should not be empty!');
  }
  var _method = method;
  var _arguments = typeof args !== 'function' ? args : null;
  cb = typeof args !== 'function' ? cb : args;
  if (typeof cb !== 'function') {
    throw new TypeError('argument `cb` should be a function!');
  }

  var parameterHandler = compose(this._handlers);
  var _parameterTypes = (_arguments || []).filter(function (arg) {
    return arg.hasOwnProperty('$class');
  }).map(function (arg) {
    var type = arg['$class'];
    var value = arg['$'];
    return parameterHandler(type, value);
  }).join('');

  var buffer = this.buffer(_method, _parameterTypes, _arguments);
  var self = this;

  this.zoo.getZoo(zooData);

  function zooData(err, zoo) {
    if (err) {
      cb(err);
      return;
    }

    if (!~self.zoo.methods.indexOf(_method)) {
      throw new SyntaxError("can't find this method, pls check it!")
    }

    var client = new net.Socket();
    var host = zoo.host;
    var port = zoo.port;

    client.connect(port, host, function () {
      client.write(buffer);
    });

    var length, buffData;
    client.on('data', function (data) {
      if (buffData === undefined) {
        buffData = data;
        length = buffData.readUInt32BE(12) + 16;
      } else {
        buffData = Buffer.concat([buffData, data]);
      }

      if (buffData.length >= length) {
        getBuffData(buffData);
      }
    });

    function getBuffData(data) {
      var err = null, response = null;
      if (data[3] === 70) {
        err = data.slice(19, self._bodyContainsLength ? data.length - 1 : data.length).toString()
      }
      else if (data[15] === 3) {
        response = 'void return';
      }
      else {
        var buf = new hessian.DecoderV2(data.slice(17, self._bodyContainsLength ? data.length - 1 : data.length));
        var result = buf.read();
        try {
          response = JSON.stringify(result);
        } catch (e) {
          response = result;
        }
      }
      cb(err, response);
      client.destroy();
    }
  }
};

Service.prototype.register = function (fn) {
  var fnArr = Array.isArray(fn) ? fn : [fn];
  fnArr = fnArr.filter(function (fn) {
    return typeof fn === 'function';
  });

  this._handlers = fnArr.concat(this._handlers);
};

Service.prototype.buffer = function (method, type, args) {
  var bufferBody = this.bufferBody(method, type, args);
  var bufferHead = this.bufferHead(bufferBody.length);
  return Buffer.concat([bufferHead, bufferBody]);
};

Service.prototype.bufferHead = function (length) {
  var head = [0xda, 0xbb, 0xc2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  if (length - 256 > 0) {
    head.splice(14, 1, length / 256 | 0);
    head.splice(15, 1, length % 256);
  } else {
    head.splice(15, 1, length - 256)
  }
  return new Buffer(head);
};

Service.prototype.bufferBody = function (method, type, args) {
  var encoder = new hessian.EncoderV2();

  encoder.write(this._version);
  encoder.write(this._path);
  encoder.write(this._env);
  encoder.write(method);
  encoder.write(type);
  if (args && args.length) {
    for (var i = 0, len = args.length; i < len; ++i) {
      encoder.write(args[i]);
    }
  }
  encoder.write(this._attchments);
  encoder = encoder.byteBuffer._bytes.slice(0, encoder.byteBuffer._offset);

  return encoder;
};

module.exports = Service;
