'use strict';

/**
* Usage:
* node ekiten [*log path]
*/

const crawler = require('./');

const startUrl = 'http://www.nhk.or.jp/';
const limit = 2;
const rate = 100;
const encoding = 'UTF-8';
const logpath = process.argv[2] || null;

crawler.onData(function (url, dom) {
	// TODO: parse DOM here...
	dom = null;
});

crawler.start(startUrl, limit, rate, encoding, logpath);
