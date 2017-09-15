'use strict';

// split a string by 6 characters each
const SPLIT = /(.)*?\//g;
const REPLACE = /{(.)*?}/g;
const SYMBOLS = '01234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SLIST = SYMBOLS.split('');
const TAG = '{ }';
const SIZE = 3;
const LEN = SLIST.length - 1;
const mapByChunk = {};
const mapBySymbol = {};

var pos = 0;
var compressed = 0;
var total = 0;

module.exports = {
	convert: convert,
	revert: revert,
	ratio: ratio
};

function ratio() {
	var val = (compressed / total) * 100;
	return val.toFixed(2) + '%';
}

function convert(str) {
	var list = str.match(SPLIT);
	if (!list) {
		return str;
	}
	var original = '';
	for (var i = 0, len = list.length; i < len; i++) {
		original += list[i];
		list[i] = _convert(list[i]);
	}
	return str.replace(original, list.join(''));
}

function revert(str) {
	return str.replace(REPLACE, _revert);
}

function _convert(chunk) {
	if (mapByChunk[chunk]) {
		compressed += 1;
		total += 1;
		return mapByChunk[chunk];
	}
	if (chunk.length > SIZE && pos < LEN) {
		var symbol = TAG.replace(' ', SLIST[pos]);
		mapByChunk[chunk] = symbol;
		mapBySymbol[symbol] = chunk;
		pos += 1;
		compressed += 1;
		total += 1;
		return symbol;
	}
	total += 1;
	return chunk;
}

function _revert(symbol) {
	if (mapBySymbol[symbol]) {
		return mapBySymbol[symbol];
	}
	return symbol;
}
