'use strict';

const request = require('request');
const iconv = require('iconv-lite');
const JsDom = require('jsdom').JSDOM;
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

const collected = [];
const seen = [];
const pending = [];
const errors = {};

var encoding = DEFAULT_ENCODING;
var limit = 1;
var rate = 100;
var anchorUrl;

module.exports = {
	start: start,
	get: get,
	isActive: isActive,
	getSeenUrls: getSeenUrls,
	getCollectedUrls: getCollectedUrls,
	getErrors: getErrors
};

function isActive() {
	return pending.length > 0;
}

function getSeenUrls() {
	return seen.concat([]);
}

function getCollectedUrls() {
	return collected.concat([]);
}

function getErrors() {
	return JSON.parse(JSON.stringify(errors));
}

function start(params) {
	if (params && params.encoding) {
		encoding = params.encoding;
	}
	if (params && params.limit) {
		limit = params.limit;
	}
	if (params && params.rate) {
		rate = params.rate;
	}
	_dispatcher();
}

function get(url, cb) {

	// never crawls outside of anchorUrl
	if (!anchorUrl) {
		anchorUrl = url;	
	}

	if (seen.indexOf(url) > -1) {
		return cb();
	}

	seen.push(url);
	
	pending.push({
		url: url,
		cb: cb
	});
}

function _dispatcher() {
	var list = pending.splice(0, limit);	
	async.forEach(list, _dispatch, _onDispatched);
}

function _onDispatched() {
	setTimeout(_dispatcher, rate);
}

function _dispatch(item, next) {
	var url = item.url;
	var cb = item.cb;
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
		cb: cb,
		next: next
	}));
}

function _onRequest(error, res, body) {
	var encoding = this.encoding;
	var url = this.url;
	var cb = this.cb;
	var next = this.next;

	logger.write(
		mark.get(error, res) + '  ' +
		seen.length + '  ' +
		pending.length + '  ' +
		collected.length + '  ' +
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
	var dom = new JsDom(body).window.document;
	var links = _getLinks(url, body);
	collected.push(url);
	cb(url, dom, links, body);
	next();
}

function _getLinks(url, body) {
	var protocol = anchorUrl.substring(0, anchorUrl.indexOf('://') + 3);
	var domainName = anchorUrl.replace(protocol, '');
	if (domainName.indexOf('/') > -1) {
		domainName = substring(0, domainName.indexOf('/'));
	}
	var allowCrossSite = false;
	return extract.getLinks(body, protocol, domainName, allowCrossSite);
}

