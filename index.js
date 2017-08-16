'use strict';

/***
node index.js [target URL] [*encoding] [*limit] [*throttle]
**/

const req = require('request');
const async = require('./lib/async');
const extract = require('./lib/extract');
const search = require('./lib/search');

/**
* Help:
node index.js --help
node index.js -h
*/
if (process.argv[2] === '--help' || process.argv[2] === '-h') {
	console.log('');
	console.log('Command options: Options must follow the following order');
	console.log('[target URL] [*encoding] [*limit] [*throttle]');
	console.log('*********************************************');
	console.log('[target URL]	The starting URL to start crawling');
	console.log('[*encoding]	Optional encoding of the crawled content: UTF-8, EUC-JP, Shift_JS etc.');
	console.log('[*limit]	Optional integer to limit the number of parallel URL access');
	console.log('[*throttle]	Optional milliseconds to regulate the URL access');
	console.log('*********************************************');
	console.log('Example:	https:/nodejs.org UTF-8 10 500');
	console.log('Above options would mean:',
		'Starts crawling from https://nodejs.org,',
		'decode the content as UTF-8,',
		'access upto 10 URLs at a time,',
		'and wait 500 milliseconds to access each URL.');
	console.log('');
	process.exit(0);
}

var url = process.argv[2];
var encoding = process.argv[3] || 'UTF-8';
var limit = process.argv[4] || 0;
var throttle = process.argv[5] || 0;

if (!url) {
	console.error('missing URL');
	process.exit(1);
}

var protocol = url.substring(0, url.indexOf('://'));

if (!protocol) {
	console.error('missing protocol');
	process.exit(1);
}

limit = parseInt(limit);
throttle = parseInt(throttle);

var domainName = url.replace(protocol + '://', '');
var index = domainName.indexOf('/') === -1 ? domainName.length : domainName.indexOf('/');
domainName = domainName.substring(0, index);

var opts = {
	encoding: encoding
};

// TODO: this is only for test: remove it later ////////
var startTime = Date.now();
startSync(function () {}, function () {
	var badUrls = search.getBadUrls();
	for (var i = 0, len = Math.min(10, badUrls.length); i< len; i++) {
		console.log('Bad URL:', badUrls[i]);
	}
	process.exit(0);
});
////////////////////////////////////////////////////////

module.exports = {
	start: startSync,
};

function startSync(each, done) {
	_startSync(url, each, function () {
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
		done();	
	});
}

function _startSync(_url, each, done) {
	var _callback = function (error, __url, body) {
		if (error) {
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
				if (i % limit === 0) {
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
			var counter = 0;
			async.forEach(items, function (link, moveon) {
				if (throttle) {
					counter += 1;
					setTimeout(function () {
						_startSync(link, each, moveon);
					}, throttle * counter);
					return;
				}
				process.nextTick(function () {
					_startSync(link, each, moveon);
				});
			}, next);
		}, done);
	};
	
	search.run(_url, opts, _callback);
}

