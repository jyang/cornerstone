var sys = require('sys');
var http = require('http');
var url = require('url');
var csf = require('../src/cornerstone');

function echoPath(request) {
  return {output: {body: 'Hello, ' + request.input.path + '!'}, status: 200};
};

var rootHandler = csf.handler.createChain([
  csf.handler.dumpRequestResponse,
  csf.handler.handlePathPrefixArray.create([
      ['/hello', echoPath], ['/world', echoPath]
  ])
]);

csf.server.createNodeServer(rootHandler, 8000);
sys.puts('Cornestone Server for Node @ http://localhost:8000/');
