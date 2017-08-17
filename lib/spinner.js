'use strict';

const INTERVAL = 1000;
const B = '\b';
const BLANK = ' ';
const list = [
	'◐ ',
	'◓ ',
	'◑ ',
	'◒ ',
];
var prevText;
var index = 0;
var timeout = null;

module.exports = {
	start: start,
	stop: stop
};

function start() {
	index = index < list.length - 1 ? index + 1 : 0;
	process.stdout.write(B + B);
	process.stdout.write(list[index]);
	timeout = setTimeout(start, INTERVAL);
}

function stop() {
	if (timeout) {
		clearTimeout(timeout);
		timeout = null;
	}
	process.stdout.write(B + B);
}

