'use strict';

/**
* Usage:
* node index [URL] [*limit] [*rate] [*encoding] [*log path]
*/

const mainloop = require('./src/mainloop');
const search = require('./src/search');
const logger = require('./src/logger');

const startUrl = process.argv[2];
const limit = process.argv[3] || null;
const rate = process.argv[4] || null;
const encoding = process.argv[5] || null;
const logpath = process.argv[6] || null;
const startTime = Date.now();

if (!startUrl) {
	console.error('Missing URL: app [URL] [*limit] [*rate] [*encoding] [*log path]');
	process.exit(1);
}

if (logpath) {
	logger.setPath(logpath);
}

process.on('uncaughtException', function (error) {
	logger.write('Exception: ' + error.message + '\n' + error.stack);
});

process.on('exit', function () {
	logger.write('[DONE]');
	logger.write('Time in milliseconds:' + (Date.now() - startTime));
	logger.write('Searched URLs:' + search.getSeenUrls().length);
	logger.write('Collected URLs:' + search.getCollectedUrls().length);
	logger.write('Errors:' + JSON.stringify(search.getErrors(), null, 2));
});

// start main loop
mainloop.start();

search.start({
	limit: parseInt(limit),
	rate: parseInt(rate),
	encoding: encoding
}, _onEachGet);

search.get(startUrl);

var _onData;

module.exports = {
	onData: onData
};

function onData(__onData) {
	if (typeof __onData !== 'function') {
		throw new Error('onData must be a function');
	}
	_onData = __onData;
}

function _onEachGet(url, dom, links) {
	
	if (dom) {
		// TODO: parse dom here
		if (_onData) {
			_onData(url, dom);
		}
	}
	// move on to more links
	if (links) {
		for (var i = 0, len = links.length; i < len; i++) {
			search.get(links[i]);
		}
	}
}

