# node-dubbo-client
node dubbo client base https://github.com/p412726700/node-zookeeper-dubbo
require Node.js>=5.x.x

###config DubboTcpClient
##### env
envirmoment,hessian version
##### host
tcp host
#### port
tcp port
#### timeout
tcp timeout
##### path
service path
##### version
dubbo version

### Example
```javascript
'use strict';

const DubboTcpClient = require('../index').DubboTcpClient;
const types = require('../index').types;

var opt = {
  env: '0.0.0',
  host: '127.0.0.1',
  port: 8888,
  path: 'com.customer.Service'
};

var method = "getUserByID";
var arg1 = {$class: types.INT, $: 1};
var args = [arg1];

var service = new DubboTcpClient(opt);
service.execute(method, args).then(data=> {
  console.log('result:', data);
}, err=> {
  console.log(err);
});
```

### config Service
##### env
envirmoment,hessian version
##### conn
zookeeper conn url
##### path
the service you need
##### version
dubbo version

### Example
```javascript
var Service=require('node-zookeeper-dubbo').Service;

var opt={
  env:'test',
  conn:'127.0.0.1:2180',
  path:'com.customer.Service'
}

var method="getUserByID";
var arg1={$class:'int',$:123}
var arguments=[arg1];

var service = new Service(opt);
service.excute(method,arguments,function(err,data){
  if(err){
    console.log(err);
    return;
  }
  console.log(data)
})
```
you can use  [js-to-java](https://github.com/node-modules/js-to-java)
```javascript
var arg1={$class:'int',$:123};
//equivalent
var arg1=java('int',123);
```
### Contributors
[PanEW](https://github.com/p412726700)

[zhanghua](https://github.com/zhanghua499)

[caomu](https://github.com/caomu)

[zhchj126](https://github.com/zhchj126)

[maochendong](https://github.com/maochendong)



[npm-image]:http://img.shields.io/npm/v/node-zookeeper-dubbo.svg?style=flat-square
[npm-url]:https://npmjs.org/package/node-zookeeper-dubbo?style=flat-square
[downloads-image]:http://img.shields.io/npm/dm/node-zookeeper-dubbo.svg?style=flat-square
