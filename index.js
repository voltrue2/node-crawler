'use strict';

/**
* Usage:
* node index [URL] [*limit] [*rate] [*encoding] [*log path]
*/

const cheerio = require('cheerio');
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
	logger.write('Searched URLs:' + search.getSeenUrls().length);
	logger.write('Collected URLs:' + search.getCollectedUrls());
	logger.write('Errors:' + JSON.stringify(search.getErrors(), null, 2));
});

var _onData;

module.exports = {
	onData: onData,
	addIgnore: addIgnore,
	start: start
};

function addIgnore(path) {
	search.addIgnore(path);
}

function start(startUrl, limit, rate, encoding, logpath) {
	// set log path
	if (logpath) {
		logger.setPath(logpath);
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
	search.get(startUrl);
}

function onData(__onData) {
	if (typeof __onData !== 'function') {
		throw new Error('onData must be a function');
	}
	_onData = __onData;
}

function _onEachGet(url, body, links) {
	if (_onData) {
		_onData(url, body, cheerio.load(body));
	}
	// move on to more links
	if (!links) {
		return;
	}
	for (var i = 0, len = links.length; i < len; i++) {
		search.get(links[i]);
	}
}

