'use strict';

const search = require('./search');

const LINK_TAG = /href="(.*?)"/g;
const HREF_TAGS = [
	/href="/g,
	/"/g
];
const HTTP_TAG = 'http';
const FILES = [
	'javascript',
	'.csv',
	'.tsv',
	'.doc',
	'.docx',
	'.xls',
	'.xlsx',
	'.gpg',
	'.pdb',
	'.ico',
	'.icon',
	'.psd',
	'.asc',
	'.md',
	'.tgz',
	'.7z',
	'.zip',
	'.tar',
	'.gz',
	'.xz',
	'.txt',
	'.sig',
	'.msi',
	'.pkg',
	'.exe',
	'.pdf',
	'.jpg',
	'.jpeg',
	'.gif',
	'.bitmap',
	'.png',
	'.mp3',
	'.mpeg4',
	'.mp4',
	'.svg',
	'.css',
	'.js'
];

module.exports = {
	getLinks: getLinks
};

function getLinks(_data, protocol, domainName, allowCrossSite) {
	var data = _data.toLowerCase();
	var list = data.match(LINK_TAG);
	var res = []; 
	if (!list) {
		return [];
	}
	for (var i = 0, len = list.length; i < len; i++) {
		var path = list[i]
			.replace(HREF_TAGS[0], '')
			.replace(HREF_TAGS[1], '');
		if (path.indexOf(HTTP_TAG) !== 0) {
			// either different protocol such as ws(websocket) or only URI
			if (path.indexOf(':') !== -1) {
				// different protocol
				continue;
			}
			// path that is URI: add protocol and domain name if provided
			if (protocol && domainName) {
				path = _createUrl(protocol, domainName, path);	
			}
		}
		if (!allowCrossSite && domainName && path.indexOf(protocol + '://' + domainName) !== 0) {
			// the link leads to different domain
			continue;
		}
		// remove #
		path = _removeHash(path);
		// handle trailing slash
		path = _handleTrailingSlash(path);
		// ignore seen URL
		if (search.isRedundant(path)) {
			continue;
		}
		// ignore duplicates
		if (res.indexOf(path) !== -1) {
			continue;
		}
		// ignore file download
		var ext = _getFileExtension(path);
		if (FILES.indexOf(ext) !== -1) {
			continue;
		}
		res.push(path);
	}
	return res;
}

function _removeHash(path) {
	var index = path.lastIndexOf('#');
	if (index === -1) {
		return path;
	}
	return path.substring(0, index);
}

function _handleTrailingSlash(path) {
	/* we will allow redundant URLs with or without a trailing slash...
	if (path[path.length - 1] === '/') {
		return path.substring(0, path.length - 1);
	}
	*/
	return path;
}

function _getFileExtension(path) {
	if (path.indexOf('?') !== -1) {
		path = path.substring(0, path.lastIndexOf('?'));
	}
	return path.substring(path.lastIndexOf('.'));
}

function _createUrl(protocol, domainName, path) {
	if (domainName[domainName.length - 1] !== '/' && path[0] !== '/') {
		domainName += '/';
	}
	return protocol + '://' + domainName + path;
}

