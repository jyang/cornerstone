var sys = require('sys');
var csf = require('../src/cornerstone');

function echoPath(request, handleResponse) {
  handleResponse({
		output:{
			body: 'Hello, ' + request.input.path + '!'
		},
		status: 200
	});
};

csf.server.start([
  ['/hello', echoPath],
	['/world', echoPath]
], 8000);
sys.puts('Cornestone Server for Node @ http://localhost:8000/');
