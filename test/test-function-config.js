var assert = require('assert');
var sys = require('sys');
var cornerstone = require('../src/cornerstone');

var config = {a: 1};
function f() {
  assert.equal(config, this, 'f config not bound correctly');
};
f = cornerstone.util.bind(f, config);

f();
