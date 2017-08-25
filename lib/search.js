'use strict';

const iconv = require('iconv-lite');
const crypto = require('crypto');
const req = require('request');
const logger = require('./logger');
const spinner = require('./spinner');

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

var seenUrls = [];
var badUrls = [];
var errorCounter = {
	errors: 0,
	badUrls: 0,
	misc: 0	
};

module.exports = {
	reset: reset,
	run: run,
	isRedundant: isRedundant,
	getBadUrls: getBadUrls,
	getNumberOfErrors: getNumberOfErrors,
	getNumberOfUrls: getNumberOfUrls
};

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
	
	spinner.start();
	
	var hash = _makeHash(url);
	if (seenUrls.indexOf(hash) !== -1) {
		return cb(null, null, '');
	}

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
		cb: cb
	}));
}

function _onRequest(error, res, body) {
	var encoding = this.encoding;
	var url = this.url;
	var cb = this.cb;
	
	if (error) {
		errorCounter.errors += 1;
		return cb(error, null, '');
	}
	if (res && res.statusCode > 399) {
		errorCounter.badUrls += 1;
		badUrls.push(res.statusCode + ' ' + url);
		return cb(null, null, '');
	}
	if (!body) {
		errorCounter.misc += 1;
		return cb(null, null, '');
	}


	spinner.stop();

	logger.write(seenUrls.length + '    ' + url);
	
	if (encoding !== DEFAULT_ENC) {
		// something else...
		body = iconv.decode(body, encoding);	
	} else {
		// UTF-8
		body = body.toString();
	}
	cb(null, url, body);
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

