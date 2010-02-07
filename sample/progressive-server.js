var sys = require('sys');
var csf = require('../src/cornerstone');

var echoHello = function(request) {
  return {body: 'Hello, ' + request.input.path + '!', status: 200};
};

var echoHelloByPath = function(request) {
  return request.input.path == '/hello' ? echoHello(request) :
      {status: 404, body: 'resource not found'}
};

var handlePathArray = function(request) {
  for (var i = 0; i < this.length; i++) {
    if (request.input.path == this[i][0]) {
      return this[i][1](request);
    }
  }
  return {status: 404, body: 'resource not found'}
};
echoHelloByPathArray = csf.util.bind(handlePathArray,
   [['/hello', echoHello],['/world', echoHello]]);

// csf.server.createNodeServer(echoHello, 8000);
// csf.server.createNodeServer(echoHelloByPath, 8000);
csf.server.createNodeServer(handlePathArray, 8000);
sys.puts('CSF Node Server created @ http://localhost:8000/');
