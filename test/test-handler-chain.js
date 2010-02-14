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

var handler = csf.handler.chain([
  csf.interceptor.before(openA),
  csf.interceptor.after(closeB),
  echo
]);
handler('world', function(response) {
  assert.equal('world<a></b>', response);
});
