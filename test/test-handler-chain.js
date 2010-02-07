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
