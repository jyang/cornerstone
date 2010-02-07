var sys = require('sys');
var http = require('http');

// errors

var error = {
  SUBCLASS_RESPONSIBILITY: 'subclass responsibility'
};

// ------------------
// handlePathPrefixArray

/**
 * Resolves handler by looking up a path handler map.
 * this: pathHandlers
 */
function handlePathPrefixArray(request) {
  if (request && request.input && request.input.path) {
    for (var i = 0; i < this.length; i++) {
      var pathHandler = this[i];
      var pathPrefix = pathHandler[0];
      var handler = pathHandler[1];
      if (request.input.path.indexOf(pathPrefix) == 0 &&
          (request.input.path.length == pathPrefix.length ||
              pathPrefix.charAt(pathPrefix.length - 1) == '/' ||
              request.input.path.charAt(pathPrefix.length) == '/')) {
        // path is proper prefix of request URL
        return handler(request);
      }
    };
  }

  return {output: {body: 'resource not found'}, status: 404};
};

/**
 * Creates a handlePathPrefixArray.
 * @param pathHandlers e.g. [['/abc', handler1], ['/', handler2]]
 */
handlePathPrefixArray.create = function(pathHandlers) {
  return bind(handlePathPrefixArray, pathHandlers);
};

// -----
// Chain

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

function bind(fn, selfObj, var_args) {
  var context = selfObj || process;

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
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

function dumpRequestResponse(request, nextHandler) {
  sys.puts('request@' + new Date() + ': ' + sys.inspect(request));
  var response = nextHandler(request);
  sys.puts('response@' + new Date() + ': ' + sys.inspect(response));
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
      }
    };

    var responseMessage = rootHandler(requestMessage);
    response.sendHeader(responseMessage.status,
        {'Content-Type': responseMessage.contentType || 'text/plain'});
    response.sendBody(responseMessage.output.body);
    response.finish();
  }).listen(port, opt_host);
};

// -------
// exports

exports.error = error;

exports.util = {
  bind: bind
};

exports.handler = {
  dumpRequestResponse: dumpRequestResponse,
  handlePathPrefixArray: handlePathPrefixArray,
  createChain: createChain
};

exports.server = {
  createNodeServer: createNodeServer
};
