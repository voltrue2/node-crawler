'use strict';

const req = require('request');
const iconv = require('iconv-lite');

const params = {
	encoding: null, // we want the body to be a binary
	url: 'http://nora-ebisu.com/'
};

req(params, function (error, res, body) {
	if (error) {
		return console.error(error);
	}
	var data = iconv.decode(body, 'Shift_JIS');
	//var data = iconv.decode(body, 'EUC-JP');
	console.log(data);
});
