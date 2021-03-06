'use strict';

const request = require('request');
const iconv = require('iconv-lite');
const async = require('./async');
const extract = require('./extract');
const compress = require('./compress');
const logger = require('./logger');
const mark = require('./mark');

const TAB = '\t';
const DEFAULT_ENCODING = 'UTF-8';
const GET = 'get';
const TIMEOUT = 30000;
const WLIST = [
	'.html',
	'.htm',
	'.xml',
	'.rss'
];

const pending = [];
const errors = {};

var prevPendingCount = 0;
var seen = 0;
var encoding = DEFAULT_ENCODING;
var limit = 1;
var rate = 100;
var anchorUrl;
var host;
var _onEachGet;
var collected = 0;

module.exports = {
	start: start,
	get: get,
	getHost: getHost,
	isActive: isActive,
	getSeen: getSeen,
	getCollectedUrls: getCollectedUrls,
	getErrors: getErrors,
	addIgnore: extract.addIgnore,
	getIgnores: extract.getIgnores,
	addWhiteList: extract.addWhiteList,
	getWhiteList: extract.getWhiteList
};

function isActive() {
	return pending.length - seen > 0;
}

function getHost() {
	return host;
}

function getSeen() {
	return seen;
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
		var protocol = anchorUrl.substring(0, anchorUrl.indexOf('://') + 3);
		var domainName = anchorUrl.replace(protocol, '');
		var index = domainName.indexOf('/');
		if (index !== -1) {
			domainName = domainName.substring(0, index);
		}
		host = protocol + domainName;
		logger.write('Host: ' + host);
	}

	url = url.replace(host, '');

	url = compress.convert(url);

	if (pending.indexOf(url) > -1) {
		return;
	}
	
	pending.push(url);
}

function _dispatcher() {
	var list = [];
	for (var i = seen, len = pending.length; i < len; i++) {
		list.push(pending[i]);
		seen += 1;
		if (list.length === limit) {
			break;
		}
	}
	async.forEach(list, _dispatch, _onDispatched);
}

function _onDispatched() {
	setTimeout(_dispatcher, rate);
}

function _dispatch(url, next) {
	
	var reverted = compress.revert(url);
	
	var params = {
		encoding: null, // we want body as binary
		followRedirect: true,
		url: host + reverted,
		method: GET,
		timeout: TIMEOUT,
	};

	request(params, _onRequest.bind({
		encoding: encoding,
		url: reverted,
		compressed: url !== reverted,
		next: next
	}));
}

function _onRequest(error, res, body) {
	var encoding = this.encoding;
	var url = this.url;
	var compressed = this.compressed;
	var next = this.next;

	var current = pending.length - seen;
	var delta = prevPendingCount > 0 ? '(' + (current - prevPendingCount) + ')' : '(0)';
	logger.write(
		mark.get(error, res) + ' ' +
		current + TAB + delta +
		TAB + seen + TAB +
		collected + TAB +
		compress.ratio() + TAB +
		(compressed ? 'yes' : 'no') + TAB +
		url
	);

	prevPendingCount = current;
	
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
		// remove host
		var uri = links[i].replace(host, '');
		if (res.indexOf(uri) === -1) {
			res.push(uri);
		}
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
		if (
			WLIST.indexOf(suburl.substring(suburl.lastIndexOf('.'))) === -1 &&
			suburl[suburl.length - 1] !== '/'
		) {
			suburl += '/';
		}
		return suburl + params;
	}
	if (
		WLIST.indexOf(url.substring(url.lastIndexOf('.'))) === -1 &&
		url[url.length - 1] !== '/'
	) {
		url += '/';
	}
	return url;
}

