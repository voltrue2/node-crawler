// we cannot use strict mode b/c we use octal literals for coloring the output texts

const redis = require('redis');
const iconv = require('iconv-lite');
const crypto = require('crypto');
const req = require('request');
const logger = require('./logger');

// ttl is 48 hours
const TTL = 60000 * 60 * 48;
const DEFAULT_ENC = 'UTF-8';
const GET = 'get';
const TIMEOUT = 30000;
const UA = 'Mozilla/{0} (Linux; Android {1}; Nexus {2} Build/_BuildID_) AppleWebKit/{3.0}.{3.1} (KHTML, like Gecko) Version/{4.0}.{4.1} Chrome/{5.0}.{5.1} Mobile Safari/{6.0}.{6.1}';
const SUFFIX = Date.now();

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

var retries = [];
var pending = {};
var badUrls = [];
var seenCount = 0;
var errorCounter = {
	errors: 0,
	badUrls: 0,
	misc: 0	
};
var _onReady;
// connects to 127.0.0.1:6379
var client = redis.createClient();
client.on('ready', function () {
	if (_onReady) {
		_onReady();
		_onReady = null;
	}
});

module.exports = {
	onReady: onReady,
	isActive: isActive,
	getRetries: getRetries,
	run: run,
	getBadUrls: getBadUrls,
	getNumberOfErrors: getNumberOfErrors,
	getNumberOfUrls: getNumberOfUrls
};

// mainloop MUST be required here
const mainloop = require('./mainloop');

function onReady(cb) {
	_onReady = cb;
}

function isActive() {
	return Object.keys(pending).length > 0;
}

function getRetries() {
	var copy = retries.concat([]);
	retries = [];
	return copy;
}

function getNumberOfErrors() {
	return errorCounter;
}

function getNumberOfUrls() {
	return seenCount;
}

function getBadUrls() {
	return badUrls.concat([]);
}

function run(url, opts, cb) {
	
	client.get(url + SUFFIX, function (err, resp) {
		if (err) {
			return cb(null, null, '');
		}

		if (resp) {
			return cb(null, null, '');
		}

		mainloop.resetInactiveCount();
		pending[url] = true;

		seenCount += 1;
		var multi = client.multi();
		multi.set(url + SUFFIX, 1);
		multi.expire(url + SUFFIX, TTL);		
		multi.exec(function () {
			// we do not check the error from redis...
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
		});
	
	});
}

function _onRequest(error, res, body) {
	var encoding = this.encoding;
	var url = this.url;
	var cb = this.cb;
	
	if (error) {
		errorCounter.errors += 1;
		retries.push(url);
		_callback(url, 2, function () {
			cb(error, url, '');
		});
		return;
	}
	if (res && res.statusCode > 399) {
		errorCounter.badUrls += 1;
		badUrls.push(res.statusCode + ' ' + url);
		_callback(url, 1, function () {
			cb(null, null, '');
		});
		return;
	}
	if (!body) {
		errorCounter.misc += 1;
		retries.push(url);
		_callback(url, 3, function () {
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
	_callback(url, 0, function () {
		cb(null, url, body);
	});
}

function _callback(url, res, cb) {
	cb();
	delete pending[url];
	var mark;
	if (res === 3) {
		// empty response
		mark = '\033[0;33m?\033[0m';
	} else if (res === 2) {
		// error such as failed to connect
		mark = '\033[0;31m×\033[0m';
	} else if (res === 1) {
		// http response error such as 404
		mark = '\033[0;35m⊝\033[0m';
	} else {
		mark = '\033[0;32m✓\033[0m';
	}
	logger.write(
		mark + '  ' +
		seenCount + '  ' +
		Object.keys(pending).length + '  ' +
		retries.length + '  ' +
		url
	);
}

function _rand(min, max) {
	var offset = max - min;
	var rand   = Math.floor(Math.random() * (offset + 1));
	return rand + min;
}

