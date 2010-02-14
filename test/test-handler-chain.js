var assert = require('assert');
var sys = require('sys');
var csf = require('../src/cornerstone');

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

function echo(request, handleResponse) {
  return handleResponse(request);
};

var chain = csf.handler.chain([
  csf.interceptor.around(openA, closeA),
  csf.interceptor.before(openA),
  csf.interceptor.after(closeB),
  echo
]);
chain('world', function(response) {
  assert.equal('world<a><a></b></a>', response);
});

var nestedChain = csf.handler.chain([
  csf.interceptor.around(openA, closeA),
  csf.interceptor.before(openA),
  csf.interceptor.after(closeB),
  chain
]);
nestedChain('world', function(response) {
  assert.equal('world<a><a><a><a></b></a></b></a>', response);
});
