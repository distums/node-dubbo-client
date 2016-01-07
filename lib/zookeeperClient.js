'use strict';
var zookeeper = require('node-zookeeper-client');
var url = require('url');
var qs = require('querystring');

var ZK = function (conn, path, env) {
    this.conn = conn;
    this.path = '/dubbo/' + path + '/providers';
    this.env = env;
    this.methods = [];
};

ZK.prototype.connect = function (conn) {
    !this.conn && (this.conn = conn);

    this.client = zookeeper.createClient(this.conn);
    this.client.connect();
};

ZK.prototype.getZoo = function (cb) {
    this.connect();
    var self = this;

    this.client.once('connected', connect);

    function connect() {
        self.client.getChildren(self.path, handleEvent, handleResult);
    }

    function handleEvent(event) {
        console.log('Got watcher event: %s', event);
        self.getZoo();
    }

    function handleResult(err, children, stat) {
        var zoo, urlparsed;
        if (err) {
            cb(err);
            return;
        }
        if (children && children.length) {
            for (var i = 0, l = children.length; i < l; i++) {
                zoo = qs.parse(decodeURIComponent(children[i]));
                if (zoo.version == self.env) {
                    break;
                }
            }
        }

        urlparsed = url.parse(Object.keys(zoo)[0]);
        self.methods = zoo.methods.split(',');
        cb(null, {host: urlparsed.hostname, port: urlparsed.port});
        self.client.close();
    }
};

module.exports = ZK;
