'use strict';

const req = require('request');
const iconv = require('iconv-lite');

const params = {
	encoding: null, // we want the body to be a binary
	url: 'http://www.ekiten.jp/cat_psychiatry/index_p6.html'
};

req(params, function (error, res, body) {
	if (error) {
		return console.error(error);
	}
	//var data = iconv.decode(body, 'Shift_JIS');
	var data = iconv.decode(body, 'EUC-JP');
	console.log(data);
});
