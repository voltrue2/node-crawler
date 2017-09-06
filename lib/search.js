// we cannot use strict mode b/c we use octal literals for coloring the output texts

const iconv = require('iconv-lite');
const crypto = require('crypto');
const req = require('request');
const logger = require('./logger');

const DEFAULT_ENC = 'UTF-8';
const GET = 'get';
const HASH_LEN = 24;
const TIMEOUT = 30000;
const UA = 'Mozilla/{0} (Linux; Android {1}; Nexus {2} Build/_BuildID_) AppleWebKit/{3.0}.{3.1} (KHTML, like Gecko) Version/{4.0}.{4.1} Chrome/{5.0}.{5.1} Mobile Safari/{6.0}.{6.1}';

function _makeUa() {
	var ua = UA.replace('{0}', _rand(1, 20))
		.replace('{1}', _rand(1, 10))
		.replace('{2}', _rand(4, 10))
		.replace('{3.0}', _rand(1, 600))
		.replace('{3.1}', _rand(0, 999))
		.replace('{4.0}', _rand(1, 999))
		.replace('{4.1}', _rand(0, 999))
		.replace('{5.0}', _rand(1, 999))
		.replace('{5.1}', _rand(0, 999))
		.replace('{6.0}', _rand(1, 999))
		.replace('{6.1}', _rand(0, 999));
}

var pending = {};
var seenUrls = [];
var badUrls = [];
var errorCounter = {
	errors: 0,
	badUrls: 0,
	misc: 0	
};

module.exports = {
	isActive: isActive,
	reset: reset,
	run: run,
	isRedundant: isRedundant,
	getBadUrls: getBadUrls,
	getNumberOfErrors: getNumberOfErrors,
	getNumberOfUrls: getNumberOfUrls
};

// mainloop MUST be required here
const mainloop = require('./mainloop');

function isActive() {
	return Object.keys(pending).length > 0;
}

function isRedundant(url) {
	if (seenUrls.indexOf(_makeHash(url)) === -1) {
		return false;
	}
	return true;
}

function reset() {
	errorCounter = {
		errors: 0,
		badUrls: 0,
		misc: 0
	};
	seenUrls = [];
	badUrls = [];
}

function getNumberOfErrors() {
	return errorCounter;
}

function getNumberOfUrls() {
	return seenUrls.length;
}

function getBadUrls() {
	return badUrls.concat([]);
}

function run(url, opts, cb) {
	var hash = _makeHash(url);
	if (seenUrls.indexOf(hash) !== -1) {
		return cb(null, null, '');
	}
	
	mainloop.resetInactiveCount();
	pending[hash] = true;

	seenUrls.push(hash);
	
	var params = {
		encoding: null, // we want body as binary
		followRedirect: true,	
		url: url,
		method: GET,
		timeout: TIMEOUT,
		headers: {
			'User-Agent': _makeUa()
		}
	};
	req(params, _onRequest.bind({
		encoding: (opts && opts.encoding ? opts.encoding : DEFAU_ENC),
		url: url,
		hash: hash,
		cb: cb
	}));
}

function _onRequest(error, res, body) {
	var encoding = this.encoding;
	var url = this.url;
	var hash = this.hash;
	var cb = this.cb;
	
	if (error) {
		errorCounter.errors += 1;
		_callback(url, hash, true, function () {
			cb(error, url, '');
		});
		return;
	}
	if (res && res.statusCode > 399) {
		errorCounter.badUrls += 1;
		badUrls.push(res.statusCode + ' ' + url);
		_callback(url, hash, true, function () {
			cb(null, null, '');
		});
		return;
	}
	if (!body) {
		errorCounter.misc += 1;
		_callback(url, hash, true, function () {
			cb(null, null, '');
		});
		return;
	}
	
	if (encoding !== DEFAULT_ENC) {
		// something else...
		body = iconv.decode(body, encoding);	
	} else {
		// UTF-8
		body = body.toString();
	}
	_callback(url, hash, false, function () {
		cb(null, url, body);
	});
}

function _callback(url, hash, isbad, cb) {
	cb();
	delete pending[hash];
	logger.write(
		(isbad ? '\033[0;31m×\033[0m' : '\033[0;32m✓\033[0m') + '  ' +
		seenUrls.length + '  ' +
		Object.keys(pending).length + '  ' +
		url
	);
}

function _makeHash(url) {
	if (url.length > HASH_LEN) {
		return crypto.createHash('md5')
			.update(url).digest('base64');
	}
	return url;
}

function _rand(min, max) {
	var offset = max - min;
	var rand   = Math.floor(Math.random() * (offset + 1));
	return rand + min;
}

