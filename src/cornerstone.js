var sys = require('sys');
var http = require('http');

// errors

var error = {
  SUBCLASS_RESPONSIBILITY: 'subclass responsibility'
};

// ---------------------
// handlePathPrefixArray

/**
 * Resolves handler by looking up a path handler map.
 * this.pathPrefixHandlers
 */
function handlePathPrefixArray(request) {
  if (request && request.input && request.input.path) {
    for (var i = 0; i < this.pathPrefixHandlers.length; i++) {
      var pathPrefixHandler = this.pathPrefixHandlers[i];
      var pathPrefix = pathPrefixHandler[0];
      if (request.input.path.indexOf(pathPrefix) == 0 &&
          (request.input.path.length == pathPrefix.length ||
              pathPrefix.charAt(pathPrefix.length - 1) == '/' ||
              request.input.path.charAt(pathPrefix.length) == '/')) {
        // path is proper prefix of request URL
        var handler = pathPrefixHandler[1];
        return handler(request);
      }
    };
  }

  return {output: {body: 'resource not found'}, status: 404};
};

/**
 * Creates a handlePathPrefixArray.
 * @param pathPrefixHandlers Array of [pathPrefix, handler].
 *     E.g. [['/abc', handler1], ['/', handler2]]
 */
handlePathPrefixArray.create = function(pathPrefixHandlers) {
  return handlePathPrefixArray.bind({pathPrefixHandlers: pathPrefixHandlers});
};

// -----
// Chain

/**
 * Creates a handler equivalent to calling all handlers in sequence.
 * @param {Object} handlers Handlers out of which to create chain of handlers
 */
createChain = function(handlers) {
  if (handlers.length == 0) {
    throw new Error('empty handlers');
  } else if (handlers.length == 1) {
    return handlers[0];
  } else {
    var chainedHandler = [];
    chainedHandler[handlers.length - 1] = handlers[handlers.length - 1];
    for (var i = handlers.length - 2; i >= 0; i--) {
      chainedHandler[i] = (function(i) {
        return function(request) {
          return handlers[i](request, chainedHandler[i + 1]);
        }
      })(i);
    }
    return chainedHandler[0];
  }
};

// -----------
// cornerstone

Function.prototype.bind = function(selfObj, var_args) {
  var fn = this;
  var context = selfObj || process;

  if (arguments.length > 1) {
    var boundArgs = Array.prototype.slice.call(arguments, 1);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs);
    };

  } else {
    return function() {
      return fn.apply(context, arguments);
    };
  }
};

function toIsoDateString(d) {
  function pad(n) {
    return n < 10 ? '0' + n : n;
  };
  function pad3(n) {
    return n < 10 ? '00' + n : n < 100 ? '0' + n : n;
  };
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' +
      pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' +
      pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' +
      pad3(d.getUTCMilliseconds()) + 'Z';
};

function log(message) {
  sys.puts(toIsoDateString(new Date()) + ' ' + message);
};

function dumpRequestResponse(request, nextHandler) {
  log('request: ' + sys.inspect(request));

  var response = nextHandler(request);

  log('response: ' + sys.inspect(response));
  return response;
};

// ----
// Node

createNodeServer = function(rootHandler, port, opt_host) {
  http.createServer(function(request, response) {
    var requestUrl = require('url').parse(request.url, true);
    var requestMessage = {
      header: request.headers,
      input: {
        url: requestUrl, path: requestUrl.pathname, body: request.body
      },
      __request: request,
      __response: response
    };

    var responseMessage = rootHandler(requestMessage);
    response.sendHeader(responseMessage.status,
        {'Content-Type': responseMessage.contentType || 'text/plain'});
    response.sendBody(responseMessage.output.body);
    response.finish();
  }).listen(port, opt_host);
};

/**
 * Starts one root context with some path handlers.
 * @param {Object} pathPrefixHandlers e.g. [['/abc', handler1], ['/', handler2]]
 * @param {Object} port
 * @param {Object} opt_host
 */
start = function(pathPrefixHandlers, port, opt_host) {
  var rootHandler = createChain([
      dumpRequestResponse,
      handlePathPrefixArray.create(pathPrefixHandlers)
  ]);
  createNodeServer(rootHandler, port, opt_host);
};

// -------
// exports

exports.error = error;

exports.handler = {
  dumpRequestResponse: dumpRequestResponse,
  handlePathPrefixArray: handlePathPrefixArray,
  createChain: createChain
};

exports.server = {
  createNodeServer: createNodeServer,
  start: start
};

exports.util = {
  log: log
};