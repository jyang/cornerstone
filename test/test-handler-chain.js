var assert = require('assert');
var sys = require('sys');
var csf = require('../src/cornerstone');

function hello(request) {
  return 'hello,' + request;
};

function addA(request, nextHandler) {
  return nextHandler(request) + '[a]';
};

function addB(request, nextHandler) {
  return nextHandler(request) + '[b]';
};

var handler = csf.handler.createChain([hello]);
assert.equal('hello,world', handler('world'));

handler = csf.handler.createChain([addB, addA, addB, hello]);
assert.equal('hello,world[b][a][b]', handler('world'));

// alternative interceptor pattern

function openA(request) {
  return request + '<a>';
};

function closeA(response) {
  return response + '</a>'
};

function openB(request) {
  return request + '<b>';
};

function closeB(response) {
  return response + '</b>'
};

function echo(request) {
  return request;
}

var interceptor = {
  chain: csf.handler.createChain,
  around: function(before, after) {
    return function(request, intercepted) {
      return after(intercepted(before(request)));
    }
  },
  before: function(before) {
    return function(request, intercepted) {
      return intercepted(before(request));
    };
  },
  after: function(after) {
    return function(request, intercepted) {
      return after(intercepted(request));
    };
  }
};

var handler = interceptor.chain([
  interceptor.around(openA, closeA),
  interceptor.around(openB, closeB),
  echo
]);
assert.equal('world<a><b></b></a>', handler('world'));

var handler = interceptor.chain([
  interceptor.before(openA),
  interceptor.after(closeB),
  echo
]);
assert.equal('world<a></b>', handler('world'));
