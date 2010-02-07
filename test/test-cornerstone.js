var assert = require('assert');
var sys = require('sys');
var cornerstone = require('../src/cornerstone');

(function testPathHandlerMapResolver() {
  var resolver = new cornerstone.PathHandlerArrayResolver([
    ['/abc', 'first'], ['/xyz', 'second'], ['/', 'last']
  ]);

  [
    ['/abc', 'first'],
    ['/abc/', 'first'],
    ['/abc/def', 'first'],
    ['/abcdef', 'last'],
    ['/xyz', 'second'],
    ['/xyz/', 'second'],
    ['/xyz/wuv', 'second'],
    ['/xyzwuv', 'last'],
    ['/', 'last'],
    ['/a', 'last'],
    ['abc', null],
    ['xyz', null]
  ].forEach(function(testRun) {
    var path = testRun[0];
    var expected = testRun[1];
    var actual = resolver.handle({input: {path: path}});
    assert.equal(expected, actual, 'path=' + sys.inspect(path) +
        ' expected=' + sys.inspect(expected) + '; actual=' + sys.inspect(actual));
  });
})();

(function testPathHandler() {
  var response = [];
  var handler = [];
  for (var i = 0; i < 3; i++) {
    response[i] = "response" + i;
    handler[i] = new cornerstone.Handler();
    handler[i].handle = new Function('request', 'return "' + response[i] + '"');
  }

  var pathHandler = new cornerstone.IndirectHandler(new cornerstone.PathHandlerArrayResolver([
    ['/abc/123', handler[0]], ['/abc', handler[1]], ['/', handler[2]]
  ]));

  [
    ['/', response[2]],
    ['/abc', response[1]],
    ['/abc/123', response[0]],
    ['/xyz', response[2]],
  ].forEach(function(testRun) {
    var path = testRun[0];
    var expected = testRun[1];
    var actual = pathHandler.handle({input: {path: path}});
    assert.equal(expected, actual, 'path=' + sys.inspect(path) +
        ' expected=' + sys.inspect(expected) + '; actual=' + sys.inspect(actual));
  });
})();
