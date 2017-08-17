'use strict';

const MAX_COUNTER = 0xffffffffffffffff;
const INTERVAL = 1000;
const B = '\b';
const S = ' ';
const BLANK = ' ';
const list = [
	'◐ ',
	'◓ ',
	'◑ ',
	'◒ ',
];
var prevText;
var counter = 0;
var index = 0;
var timeout = null;

module.exports = {
	start: start,
	stop: stop
};

function start() {
	index = index < list.length - 1 ? index + 1 : 0;
	if (prevText) {
		var b = '';
		for (var i = 0, len = prevText.length; i < len; i++) {
			b += B;
		}
		process.stdout.write(b);
	}
	var cs = counter.toString();
	var text = list[index] + S + cs;
	process.stdout.write(text);
	prevText = text;	
	if (counter >= MAX_COUNTER) {
		counter = 0;
	}
	counter += 1;
	timeout = setTimeout(start, INTERVAL);
}

function stop() {
	if (timeout) {
		clearTimeout(timeout);
		timeout = null;
	}
	if (prevText) {
		var b = '';
		for (var i = 0, len = prevText.length; i < len; i++) {
			b += B;
		}
		process.stdout.write(b);
		prevText = null;
	}
	counter = 0;
}

