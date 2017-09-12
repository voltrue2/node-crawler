'use strict';

const crypto = require('crypto');
const request = require('request');
const iconv = require('iconv-lite');
const async = require('./async');
const extract = require('./extract');
const logger = require('./logger');
const mark = require('./mark');

const DEFAULT_ENCODING = 'UTF-8';
const GET = 'get';
const TIMEOUT = 30000;
const WLIST = [
	'.html',
	'.htm',
	'.xml',
	'.rss'
];

const seen = [];
const pending = [];
const errors = {};

var encoding = DEFAULT_ENCODING;
var limit = 1;
var rate = 100;
var anchorUrl;
var _onEachGet;
var collected = 0;

module.exports = {
	start: start,
	get: get,
	isActive: isActive,
	getSeenUrls: getSeenUrls,
	getCollectedUrls: getCollectedUrls,
	getErrors: getErrors,
	addIgnore: addIgnore,
	getIgnores: getIgnores
};

function addIgnore(urlFragment) {
	extract.addIgnore(urlFragment);
}

function getIgnores() {
	return extract.getIgnores();
}

function isActive() {
	return pending.length > 0;
}

function getSeenUrls() {
	return seen.concat([]);
}

function getCollectedUrls() {
	return collected;
}

function getErrors() {
	return JSON.parse(JSON.stringify(errors));
}

function start(params, __onEachGet) {
	if (params && params.encoding) {
		encoding = params.encoding;
	}
	if (params && params.limit) {
		limit = params.limit;
	}
	if (params && params.rate) {
		rate = params.rate;
	}
	_onEachGet = __onEachGet;
	_dispatcher();
}

function get(url) {

	url = _enforceTrailingSlash(url);

	// never crawls outside of anchorUrl
	if (!anchorUrl) {
		anchorUrl = url;	
	}

	var hash = _hash(url);
	
	if (seen.indexOf(hash) > -1) {
		return;
	}
	
	pending.push(url);
}

function _dispatcher() {
	var list = [];
	while (list.length < limit && pending.length) {
		var url = pending.shift();
		if (!url) {
			break;
		}
		var hash = _hash(url);
		if (seen.indexOf(hash) > -1) {
			continue;
		}
		seen.push(hash);
		list.push(url);
	}
	async.forEach(list, _dispatch, _onDispatched);
}

function _onDispatched() {
	setTimeout(_dispatcher, rate);
}

function _dispatch(url, next) {
	var params = {
		encoding: null, // we want body as binary
		followRedirect: true,
		url: url,
		method: GET,
		timeout: TIMEOUT,
	};
	request(params, _onRequest.bind({
		encoding: encoding,
		url: url,
		next: next
	}));
}

function _onRequest(error, res, body) {
	var encoding = this.encoding;
	var url = this.url;
	var next = this.next;

	logger.write(
		mark.get(error, res) + '  ' +
		pending.length + '  ' +
		seen.length + '  ' +
		collected + '  ' +
		url 
	);
	
	if (error) {
		if (!errors[error.message]) {
			errors[error.message] = 0;
		}
		errors[error.message] += 1;
		next();
		return;
	}

	if (res && res.statusCode > 399) {
		if (!errors[res.statusCode]) {
			errors[res.statusCode] = 0;
		}
		errors[res.statusCode] += 1;
		next();
		return;
	}
	if (!body) {
		next();
		return;
	}

	if (encoding !== DEFAULT_ENCODING) {	
		body = iconv.decode(body, encoding);
	} else {
		body = body.toString();
	}
	var links = _getLinks(url, body);
	collected += 1;
	_onEachGet(url, body, links);
	next();
}

function _getLinks(url, body) {
	var protocol = anchorUrl.substring(0, anchorUrl.indexOf('://') + 3);
	var domainName = anchorUrl.replace(protocol, '');
	if (domainName.indexOf('/') > -1) {
		domainName = domainName.substring(0, domainName.indexOf('/'));
	}
	var allowCrossSite = false;
	var links = extract.getLinks(body, protocol, domainName, allowCrossSite);
	var res = [];
	// remove redundancies
	for (var i = 0, len = links.length; i < len; i++) {
		if (seen.indexOf(_hash(links[i])) > -1) {
			continue;
		}
		res.push(links[i]);
	}
	return res;
}

function _enforceTrailingSlash(url) {
	var hashIndex = url.indexOf('#');
	var paramIndex = url.indexOf('?');
	var index = paramIndex;
	if (hashIndex > -1 && hashIndex < paramIndex) {
		index = hashIndex;
	}
	if (index > -1) {
		var suburl = url.substring(0, index);	
		var params = url.substring(index);
		if (suburl[suburl.length - 1] !== '/') {
			suburl += '/';
		}
		return suburl + params;
	}
	if (url[url.length - 1] !== '/') {
		url += '/';
	}
	return url;
}

function _hash(url) {
	return crypto.createHash('md5').update(url).digest('base64');
}

