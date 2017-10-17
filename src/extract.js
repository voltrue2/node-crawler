'use strict';

const search = require('./search');

const LINK_TAG = /href="(.*?)"/g;
const HREF_TAGS = [
	/href="/g,
	/"/g
];
const HTTP_TAG = 'http';
const FILES = [
	'.pjpeg',
	'.node',
	'.pptx',
	'.pptm',
	'.ppt',
	'javascript',
	'.ttf',
	'.otf',
	'.avi',
	'.ogg',
	'.flv',
	'.fla',
	'.wma',
	'.rtf',
	'.csv',
	'.tsv',
	'.doc',
	'.docx',
	'.docm',
	'.xls',
	'.xlsx',
	'.xlsm',
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
const ignores = [];
const whitelist = [];

module.exports = {
	addIgnore: addIgnore,
	addWhileList: addWhiteList,
	getIgnores: getIgnores,
	getWhiteList: getWhiteList,
	getLinks: getLinks
};

function addIgnore(urlFragment) {
	ignores.push(urlFragment);
}

function addWhiteList(urlFragment) {
	whilelist.push(urlFragment);
}

function getIgnores() {
	return ignores.concat([]);
}

function getWhiteList() {
	return whitelist.concat([]);
}

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
		// ignore file download
		var ext = _getFileExtension(path);
		if (FILES.indexOf(ext) !== -1) {
			continue;
		}
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
		if (!allowCrossSite && domainName && path.indexOf(protocol + domainName) !== 0) {
			// the link leads to different domain
			continue;
		}
		// remove #
		path = _removeHash(path);
		// handle trailing slash
		path = _handleTrailingSlash(path);
		// check ignore or whitelist
		if (_isIgnored(path)) {
			continue;
		}
		// ignore duplicates
		if (res.indexOf(path) !== -1) {
			continue;
		}
		res.push(path);
	}
	return res;
}

function _isIgnored(path) {
	if (!_isInWhiteList(path)) {
		return false;
	}
	for (var i = 0, len = ignores.length; i < len; i++) {
		if (path.indexOf(ignores[i]) > -1) {
			return true;
		}
	}
	return false;
}

function _isInWhiteList(path) {
	if (whitelist.length === 0) {
		// no whitelist
		return true;
	}
	for (var i = 0, len = whitelist.length; i < len; i++) {
		if (path.indexOf(whilelist[i]) > -1) {
			return true;
		}
	}
	return false;
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
	path = path.replace(/\/\//g, '/');
	if (path.indexOf(domainName) > -1) {
		path = path.replace(domainName, '');
	}
	if (domainName[domainName.length - 1] !== '/' && path[0] !== '/') {
		domainName += '/';
	}
	return protocol +  domainName + path;
}

