'use strict';

/***
node index.js [target URL] [*encoding] [*limit]
**/

const async = require('async');
const req = require('request');
const extract = require('./lib/extract');
const search = require('./lib/search');

var url = process.argv[2];
var encoding = process.argv[3] || 'UTF-8';
var limit = process.argv[4] || 0;

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

var opts = {
	encoding: encoding
};

// TODO: this is only for test: remove it later ////////
var startTime = Date.now();
startSync(function () {}, function () {
	console.log('[DONE]');
	console.log('Time in milliseconds:', Date.now() - startTime);
	console.log('Searched URLs:', search.getNumberOfUrls());
	console.log('Error URLs:', search.getNumberOfErrors());
	console.log(
		'Collected URLs:',
		search.getNumberOfUrls() -
			(search.getNumberOfErrors().errors +
				search.getNumberOfErrors().badUrls +
					search.getNumberOfErrors().misc)
	);
	process.exit(0);
});
////////////////////////////////////////////////////////

module.exports = {
	startSync: startSync,
	start: start
};

function startSync(each, done) {
	_startSync(url, each, done);
}

function _startSync(_url, each, done) {
	search.run(_url, opts, function (error, __url, body) {

		if (error) {
			console.error(error);
			process.exit(1);
			return;
		}
	
		// if _url is null, it means the body is empty
		if (__url) {
			// parse body on each(...)
			each(__url, body);
		}

		var links = extract.getLinks(body, protocol, domainName, false);

		if (!links.length) {
			done();
			return;
		}

		if (limit && limit < links.length) {
			var res = [];
			var tmp = [];
			for (var i = 0, len = links.length; i < len; i++) {
				tmp.push(links[i]);
				if (i % limit) {
					res.push(tmp);
					tmp = [];
					continue;			
				}
			}
			links = res;
		} else {
			links = [ links ];
		}

		async.forEachSeries(links, function (items, next) {
			async.forEach(items, function (link, moveon) {
				_startSync(link, each, moveon);
			}, next);
		}, done);
	});
}

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
	search.run(url, opts, function (error, _url, body) {

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

		if (!pending) {
			done();
			return;
		}

		for (var i = 0, len = links.length; i < len; i++) {
			_search(links[i], each, _searchChild);
		}
	});
}

