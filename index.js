'use strict';

/***
node index.js [target URL] [*throttle in milliseconds]
**/

const req = require('request');
const extract = require('./lib/extract');
const search = require('./lib/search');

const FINISH_TIMEOUT = 10000;

var url = process.argv[2];
var throttle = process.argv[3] ? parseInt(process.argv[3]) : 0;

if (!url) {
	console.error('missing URL');
	process.exit(1);
}

var protocol = url.substring(0, url.indexOf('://'));

if (!protocol) {
	console.error('missing protocol');
	process.exit(1);
}

var domainName = url.replace(protocol + '://', '');
var index = domainName.indexOf('/') === -1 ? domainName.length : domainName.indexOf('/');
domainName = domainName.substring(0, index);

var finishTimeout;

// TODO: this is only for test: remove it later ////////
var startTime = Date.now();
start(function () {}, function () {
	console.log('[DONE]');
	console.log('Time in milliseconds:', Date.now() - startTime);
	console.log('Collected URLs:', search.getNumberOfUrls());
	console.log('Error URLs:', search.getNumberOfErrors());
	process.exit(0);
});
////////////////////////////////////////////////////////

module.exports = {
	start: start
};

function start(each, done) {
	_search(url, each, done);
}

function _search(url, each, done) {
	var pending = 0;
	var _searchChild = function () {
		pending -= 1;
		if (!pending) {
			done();
		}
	};
	search.run(url, { throttle: throttle }, function (error, _url, body) {

		if (error) {
			console.error(error);
			process.exit(1);
			return;
		}
	
		// if _url is null, it means the body is empty
		if (_url) {
			// parse body on each(...)
			each(_url, body);
		}

		var links = extract.getLinks(body, protocol, domainName, false);
		
		pending += links.length;
	
		if (_url) {	
			console.log(pending + '    ' + _url);
		}

		if (!pending) {
			done();
			return;
		}

		for (var i = 0, len = links.length; i < len; i++) {
			_search(links[i], each, _searchChild);
		}
	});
}

