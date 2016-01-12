/**
 * Created by tums on 12/1/16.
 */
'use strict';

const net = require('net');
const hessian = require('hessian.js');
const EventEmitter = require('events');
const handlers = require('./parameters');
const assert = require('assert');
const compose = require('./util/compose');
const timeoutPromise = require('./util/timeoutPromise');

const HEAD_LENGTH = 16;
const TIMEOUT = 60000;

function socket(port, host, timeout) {
  return data=> {
    const client = net.connect(port, host, ()=> {
      client.write(data);
    });

    let connect = new Promise(function (resovle, reject) {
      let length, buffer;

      client.on('data', chunk=> {
        if (buffer === undefined) {
          buffer = chunk;
          length = buffer.readUInt32BE(HEAD_LENGTH - 4) + HEAD_LENGTH;
        } else {
          buffer = Buffer.concat([buffer, chunk]);
        }

        if (buffer.length >= length) {
          client.destroy();
          resovle(buffer);
        }
      });

      client.on('error', err=>reject(err));
    });

    return timeoutPromise([connect], timeout)
      .catch(ex=> {
        client.destory();
        throw ex;
      });
  }
}

class DubboTcpClient extends EventEmitter {
  constructor(opts) {
    super();

    assert.equal(typeof opts.port, 'number', '`opts.port` must be a number');
    assert.equal(typeof opts.path, 'string', '`opts.path` must be a string');
    assert(opts.env != null, '`opts.env` is required');

    this._path = opts.path;
    this._env = opts.env.toUpperCase();
    this._version = opts.version || '2.5.3.3';
    this._bodyContainsLength = opts.bodyContainsLength != null ? opts.bodyContainsLength : true;
    this._handlers = [...handlers];
    let timeout = opts.timeout || TIMEOUT;
    this._attchments = {
      $class: 'java.util.HashMap',
      $: {
        path: this._path,
        interface: this._path,
        version: this._env,
        timeout
      }
    };
    this._socket = socket(opts.port, opts.host || '0.0.0.0', timeout);
  }

  execute(method, args) {
    assert.equal(typeof method, 'string', '`method` must be string');

    let parameterHandler = compose(this._handlers);
    let parameterTypes = (args || []).filter(arg=>arg.hasOwnProperty('$class'))
      .map(arg=>parameterHandler(arg['$class'], arg['$'])).join('');
    let buffer = this.createBuffer(method, parameterTypes, args);
    return this._socket(buffer).then(res=> {
      return this.getResponse(res);
    });
  }

  createBuffer(method, parameterTypes, args) {
    let bufferBody = this._createBufferBody(method, parameterTypes, args);
    let bufferHead = this._createBufferHead(bufferBody.length);
    return Buffer.concat([bufferHead, bufferBody]);
  }

  _createBufferHead(length) {
    let headBuf = new Buffer([0xda, 0xbb, 0xc2, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    let lengthBuf = new Buffer(4);
    lengthBuf.writeUInt32BE(length, 0);
    return Buffer.concat([headBuf, lengthBuf]);
  }

  _createBufferBody(method, type, args) {
    let encoder = new hessian.EncoderV2();

    encoder.write(this._version);
    encoder.write(this._path);
    encoder.write(this._env);
    encoder.write(method);
    encoder.write(type);
    if (args && args.length) {
      args.forEach(arg=>encoder.write(arg));
    }
    encoder.write(this._attchments);

    return encoder.byteBuffer._bytes.slice(0, encoder.byteBuffer._offset);
  }

  getResponse(data) {
    let response;
    if (data[3] === 70) {
      let errMsg = data.slice(19, this._bodyContainsLength ? data.length - 1 : data.length).toString()
      throw new Error(errMsg);
    }
    else if (data[15] === 3) {
      response = 'void return';
    }
    else {
      let buf = new hessian.DecoderV2(data.slice(17, this._bodyContainsLength ? data.length - 1 : data.length));
      let result = buf.read();
      try {
        response = JSON.stringify(result);
      } catch (e) {
        response = result;
      }
    }

    return response;
  }
}

module.exports = DubboTcpClient;
