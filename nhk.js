'use strict';

/**
* Usage:
* node nhk [*log path]
*/

const crawler = require('./');

const startUrl = 'http://www.nhk.or.jp/';
const limit = 100;
const rate = 100;
const encoding = 'UTF-8';
const logpath = process.argv[2] || null;

crawler.onData(function (url, dom, loader) {
	// TODO: parse DOM here...
});

crawler.start(startUrl, limit, rate, encoding, logpath);
