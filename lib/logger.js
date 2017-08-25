'use strict';

const fs = require('fs');

var path;

module.exports.setPath = function (_path) {
	try {
		var d = getTime();
		fs.appendFileSync(_path, 'Started at: ' + d);
		path = _path;
		console.log('Logging enabled:', path);
	} catch (error) {
		// well that is that... logger disabled
		console.log('Logging disabled');
	}
};

module.exports.write = function (text) {
	if (!path) {
		console.log(text);
		return;
	}
	var out = '[' + getTime() + '] ' +
		text + '\n';
	fs.appendFile(path, out, doNothing);
};

function getTime() {
	var today = new Date();
	return today.getFullYear() +
		'/' + pad2(today.getMonth() + 1) +
		'/' + pad2(today.getDate()) +
		' ' + pad2(today.getHours()) +
		':' + pad2(today.getMinutes()) +
		':' + pad2(today.getSeconds()) +
		'.' + pad3(today.getMilliseconds());
}

function pad2(n) {
	if (n < 10) {
		return '0' + n;
	}
	return n;
}

function pad3(n) {
	if (n < 10) {
		return '00' + n;
	} else if (n < 100) {
		return '0' + n;
	}
	return n;
}

function doNothing() {

}

