var sys = require('sys');
var http = require('http');

// ---------------------
// handlePathPrefixArray

/**
 * Resolves handler by looking up a path handler map.
 * this.pathPrefixHandlers
 */
function handlePathPrefixArray(request, handleResponse) {
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
        handler(request, handleResponse);
        return;
      }
    };
  }

  handleResponse(output(404,
      'no handler for path \'' + request.input.path + '\''));
};

/**
 * Creates a handlePathPrefixArray.
 * @param pathPrefixHandlers Array of [pathPrefix, handler].
 *     E.g. [['/abc', handler1], ['/', handler2]]
 */
handlePathPrefixArray.create = function(pathPrefixHandlers) {
  return handlePathPrefixArray.bind({pathPrefixHandlers: pathPrefixHandlers});
};

// --------
// handlers

/**
 * Creates a handler equivalent to calling all handlers in sequence.
 * @param {Object} handlers Handlers out of which to create chain of handlers
 */
createHandlerChain = function(handlers) {
  if (handlers.length == 0) {
    throw new Error('no handlers');
  } else if (handlers.length == 1) {
    return handlers[0];
  } else {
    var intercepted = [];
    intercepted[handlers.length - 1] = handlers[handlers.length - 1];
    for (var i = handlers.length - 2; i >= 0; i--) {
      intercepted[i] = (function(i) {
        return function(request, handleResponse) {
          return handlers[i](request, handleResponse, intercepted[i + 1]);
        }
      })(i);
    }
    return intercepted[0];
  }
};

createAroundInterceptor = function(before, after) {
  return function(request, handleResponse, intercepted) {
    intercepted(before(request), function(response) {
      handleResponse(after(response));
    });
  };
};

createBeforeInterceptor = function(before) {
  return function(request, handleResponse, intercepted) {
    intercepted(before(request), handleResponse);
  };
};

createAfterInterceptor = function(after) {
  return function(request, handleResponse, intercepted) {
    intercepted(request, function(response) {
      handleResponse(after(response));
    });
  };
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

function dumpRequest(request){
  log('request: ' + sys.inspect(request));
  return request;
};

function dumpResponse(response) {
  log('response: ' + sys.inspect(response));
  return response;
};

function output(status, message, opt_headers) {
  return {output: {body: message}, status: status, headers: opt_headers};
}

// ----
// Node

function isBodyUtf8(message) {
  var contentType = message.headers ? message.headers['Content-Type'] : null;
  return contentType && contentType.indexOf('utf-8') > 0;  
};

function countUtf8Bytes(s) {
  return encodeURI(s).replace(/%[0-9,A-F][0-9,A-F]/g, 'a').length;
};

startHandler = function(handler, port, opt_host) {
  http.createServer(function(request, response) {
    var start = Date.now();

    var chain = createHandlerChain([
      createBeforeInterceptor(function(request) {
        var requestUrl = require('url').parse(request.url, true);
        return {
          header: request.headers,
          input: {
            url: requestUrl, path: requestUrl.pathname, body: request.body
          },
          __request: request,
          __response: response
        };
      }),
      handler
    ]);

    chain(request, function(responseMessage) {
      var headers = responseMessage.headers || {};
      headers['Content-Type'] = headers['Content-Type'] || 'text/plain';
      if (responseMessage.output && responseMessage.output.body) {
        headers['Content-Length'] = isBodyUtf8(responseMessage) ?
            countUtf8Bytes(responseMessage.output.body) :
            responseMessage.output.body.length;
      }
      response.sendHeader(responseMessage.status, headers);

      if (responseMessage.output && responseMessage.output.body) {
        if (isBodyUtf8(responseMessage)) {
          response.write(responseMessage.output.body, 'utf8');
        } else {
          response.write(responseMessage.output.body);
        }
      }

      response.close();

      var end = Date.now();
      log('elapsed=' + (end - start) + 'ms');
    });
  }).listen(port, opt_host);
};

/**
 * Starts one root context with some path handlers.
 * @param {Object} pathPrefixHandlers e.g. [['/abc', handler1], ['/', handler2]]
 * @param {Object} port
 * @param {Object} opt_host
 */
startPathHandlers = function(pathPrefixHandlers, port, opt_host) {
  var rootHandler = createHandlerChain([
      createAroundInterceptor(dumpRequest, dumpResponse),
      handlePathPrefixArray.create(pathPrefixHandlers)
  ]);
  startHandler(rootHandler, port, opt_host);
};

// -------
// exports

exports.handler = {
  dumpRequest: dumpRequest,
  dumpResponse: dumpResponse,
  handlePathPrefixArray: handlePathPrefixArray,
  chain: createHandlerChain
};

exports.interceptor = {
  around: createAroundInterceptor,
  before: createBeforeInterceptor,
  after: createAfterInterceptor
};

exports.server = {
  startHandler: startHandler,
  startPathHandlers: startPathHandlers
};

exports.util = {
  log: log,
  output: output
};
