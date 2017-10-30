'use strict';

/**
* Usage:
* node index [URL] [*limit] [*rate] [*encoding] [*log path]
*/

const cheerio = require('cheerio');
//const JsDom = require('jsdom').JSDOM;
const mainloop = require('./src/mainloop');
const search = require('./src/search');
const logger = require('./src/logger');

const startTime = Date.now();

process.on('uncaughtException', function (error) {
	logger.write('Exception: ' + error.message + '\n' + error.stack);
});

process.on('exit', function () {
	logger.write('[DONE]');
	logger.write('Time in milliseconds:' + (Date.now() - startTime));
	logger.write('Searched URLs:' + search.getSeen());
	logger.write('Collected URLs:' + search.getCollectedUrls());
	logger.write('Errors:' + JSON.stringify(search.getErrors(), null, 2));
});

var _onData;

module.exports = {
	onData: onData,
	addIgnore: addIgnore,
	start: start,
	getHost: search.getHost
};

function addIgnore(path) {
	search.addIgnore(path);
}

function start(startUrl, limit, rate, encoding, logpath) {
	// set log path
	if (logpath) {
		logger.setPath(logpath);
	}
	var whitelist = search.getWhiteList();
	for (var j = 0, jen = whitelist.length; j < jen; j++) {
		logger.write('White Listed URL fragment: ' + whitelist[i]);
	}
	var ignores = search.getIgnores();
	for (var i = 0, len = ignores.length; i < len; i++) {
		logger.write('Ignored URL fragment: ' + ignores[i]);
	}

	// start main loop
	mainloop.start();
	// start crawling
	search.start({
		limit: parseInt(limit),
		rate: parseInt(rate),
		encoding: encoding
	}, _onEachGet);
	// add the URL link to the pending list
	search.get(startUrl);
}

function onData(__onData) {
	if (typeof __onData !== 'function') {
		throw new Error('onData must be a function');
	}
	_onData = __onData;
}

function _onEachGet(url, body, links) {
	var useful = true;
	if (_onData) {
		useful = _onData(url, body, cheerio.load, function () {
			// we do not need this page nor the links on this page
			if (!useful) {
				return;
			}
			// add the URL links on the page to the pending list
			for (var i = 0, len = links.length; i < len; i++) {
				search.get(links[i]);
			}
		});
		return;
	}
	if (!useful) {
		// we do not need this page nor the links on this page
		return;
	}
	// move on to more links
	if (!links) {
		return;
	}
	// add the URL links on the page to the pending list
	for (var i = 0, len = links.length; i < len; i++) {
		search.get(links[i]);
	}
}

