'use strict';

/**
* Usage:
* node ekiten [*log path]
*/

const crawler = require('./');

const startUrl = 'http://www.ekiten.jp/';
const limit = 2;
const rate = 100;
const encoding = 'EUC-JP';
const logpath = process.argv[2] || null;

crawler.addIgnore('/history');
crawler.addIgnore('/user_');
crawler.addIgnore('/photo');
crawler.addIgnore('/documents');
crawler.addIgnore('.xml');
crawler.addIgnore('/charge');
crawler.addIgnore('/check');

crawler.onData(function (url, dom) {
	// TODO: parse DOM here...
	dom = null;
});

crawler.start(startUrl, limit, rate, encoding, logpath);
