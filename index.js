'use strict';

/***
node index.js [target URL] [*encoding] [*limit] [*throttle] [*log path]
**/

const req = require('request');
const logger = require('./lib/logger');
const async = require('./lib/async');
const extract = require('./lib/extract');
const search = require('./lib/search');
const mainloop = require('./lib/mainloop');

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
	console.log('[*log path]	Optional absolut path for log output to a file');
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
var limit = process.argv[4] || 1;
var throttle = process.argv[5] || 0;
var logpath = process.argv[6] || null;

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

// limit must not be smaller than 1
if (limit < 1) {
	limit = 1;
}

var domainName = url.replace(protocol + '://', '');
var index = domainName.indexOf('/') === -1 ? domainName.length : domainName.indexOf('/');
domainName = domainName.substring(0, index);

var opts = {
	encoding: encoding
};

process.on('uncaughtException', function (error) {
	logger.write('Exception: ' + error.message + '\n' + error.stack);
});

process.on('exit', function () {
	logger.write('[DONE]');
	logger.write('Time in milliseconds:' + (Date.now() - startTime));
	logger.write('Searched URLs:' + search.getNumberOfUrls());
	logger.write('Error URLs:' + JSON.stringify(search.getNumberOfErrors(), null, 2));
	logger.write(
		'Collected URLs: ' + (
		search.getNumberOfUrls() -
			(search.getNumberOfErrors().errors +
				search.getNumberOfErrors().badUrls +
					search.getNumberOfErrors().misc)
	));
	var badUrls = search.getBadUrls();
	for (var i = 0, len = Math.min(10, badUrls.length); i< len; i++) {
		logger.write('Bad URL: ' + badUrls[i]);
	}
});
	
// start main loop
mainloop.start();

// TODO: this is only for test: remove it later ////////
var startTime = Date.now();
startSync(function () {}, function () {});
////////////////////////////////////////////////////////

module.exports = {
	start: startSync,
};

function startSync(each, done) {
	// set logging file path
	logger.setPath(logpath);
	// url is set once on the start of the process from the argument
	_startSync(url, each, done);
}

function _startSync(_url, each, done) {
	var _callback = function (error, __url, body) {
		if (error) {
			done(error, __url);
			return;
		}
	
		// if _url is null, it means the body is empty
		if (__url) {
			// parse body on each(...)
			each(__url, body);
		}

		var links = extract.getLinks(body, protocol, domainName, false);
		
		if (!links.length) {
			done(null, __url);
			return;
		}

		var list = [];
		var index = 0;
		for (var i = 0, len = links.length; i < len; i++) {
			if (i > 0 && i % limit === 0) {
				index += 1;
			}
			if (!list[index]) {
				list[index] = [];
			}
			list[index].push(links[i]);
		}

		async.forEachSeries(list, function (items, next) {
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

