'use strict';

/**
* Usage:
* node ekiten [*log path]
*/

const crawler = require('./');

const startUrl = 'https://nodejs.org/';
const limit = 100;
const rate = 100;
const encoding = 'EUC-JP';
const logpath = process.argv[2] || null;

if (logpath) {
	logger.setPath(logpath);
}

crawler.addIgnore('/feed');
crawler.addIgnore('-nightly');
crawler.start(startUrl, limit, rate, encoding, logpath);
