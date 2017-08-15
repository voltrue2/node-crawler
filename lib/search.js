'use strict';

const crypto = require('crypto');
const req = require('request');

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

var ignores = [];
var errorCounter = {
	errors: 0,
	badUrls: 0,
	misc: 0	
};

module.exports = {
	reset: reset,
	run: run,
	getNumberOfErrors: getNumberOfErrors,
	getNumberOfUrls: getNumberOfUrls
};

function reset() {
	errorCounter = {
		errors: 0,
		badUrls: 0,
		misc: 0
	};
	ignores = [];
}

function getNumberOfErrors() {
	return errorCounter;
}

function getNumberOfUrls() {
	return ignores.length;
}

function run(url, opts, cb) {
	var hash = _makeHash(url);
	if (ignores.indexOf(hash) !== -1) {
		return cb(null, null, '');
	}

	ignores.push(hash);

	if (opts && opts.throttle) {
		setTimeout(function () {
			var params = {
				url: url,
				method: GET,
				timeout: TIMEOUT
			};
			req(params, _onRequest.bind({
				url: url,
				cb: cb
			}));
		}, opts.throttle);
		return;
	}
	
	var params = {
		url: url,
		method: GET,
		timeout: TIMEOUT,
		headers: {
			'User-Agent': _makeUa()
		}
	};
	req(params, _onRequest.bind({
		url: url,
		cb: cb
	}));
}

function _onRequest(error, res, body) {
	var url = this.url;
	var cb = this.cb;
	
	if (error) {
		errorCounter.errors += 1;
		return cb(null, null, '');
	}
	if (res && res.statusCode > 399) {
		errorCounter.badUrls += 1;
		return cb(null, null, '');
	}
	if (!body) {
		errorCounter.misc += 1;
		return cb(null, null, '');
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

