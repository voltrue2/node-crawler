'use strict';

const MAX_COUNTER = 0xffffffffffffffff;
const INTERVAL = 200;
const B = '\b';
const S = ' ';
const BLANK = ' ';
//const list = ('⡀⡁⡂⡃⡄⡅⡆⡇⡈⡉⡊⡋⡌⡍⡎⡏⡐⡑⡒⡓⡔⡕⡖⡗⡘⡙⡚⡛⡜⡝⡞⡟⡠⡡⡢⡣⡤⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿⢀⢁⢂⢃⢄⢅⢆⢇⢈⢉⢊⢋⢌⢍⢎⢏⢐⢑⢒⢓⢔⢕⢖⢗⢘⢙⢚⢛⢜⢝⢞⢟⢠⢡⢢⢣⢤⢥⢦⢧⢨⢩⢪⢫⢬⢭⢮⢯⢰⢱⢲⢳⢴⢵⢶⢷⢸⢹⢺⢻⢼⢽⢾⢿⣀⣁⣂⣃⣄⣅⣆⣇⣈⣉⣊⣋⣌⣍⣎⣏⣐⣑⣒⣓⣔⣕⣖⣗⣘⣙⣚⣛⣜⣝⣞⣟⣠⣡⣢⣣⣤⣥⣦⣧⣨⣩⣪⣫⣬⣭⣮⣯⣰⣱⣲⣳⣴⣵⣶⣷⣸⣹⣺⣻⣼⣽⣾⣿').split('');
//const list = ('⣾⣽⣻⢿⡿⣟⣯⣷').split('');
//const list = ('▖▘▝▗').split('');
//const list = ('▉▊▋▌▍▎▏▎▍▌▋▊▉').split('');
const list = ('◐◓◑◒').split('');
//const list = ('←↖↑↗→↘↓↙').split('');
//const list = ('-/|\\').split('');
var prevText;
var counter = 0;
var index = 0;
var timeout = null;
var started = false;

module.exports = {
	start: start,
	stop: stop
};

function start() {
	if (started) {
		return;
	}
	started = true;
	_start();
}

function _start() {
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
	timeout = setTimeout(_start, INTERVAL);
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
	started = false;
	counter = 0;
}

