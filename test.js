'use strict';

const cheerio = require('cheerio');
const Jsdom = require('jsdom').JSDOM;
const req = require('request');
const iconv = require('iconv-lite');

const params = {
	encoding: null, // we want the body to be a binary
	url: 'http://www.ekiten.jp'
};

req(params, function (error, res, body) {
	if (error) {
		return console.error(error);
	}
	var data = iconv.decode(body, 'EUC-JP');
	// Jsdom
	var dom = new Jsdom(data);
	var doc = dom.window.document;
	var list = doc.querySelectorAll('.l-footer-ekiten_link a');
	for (var i = 0, len = list.length; i < len; i++) {
		console.log(i, list[i].textContent);
	}
	console.log('----------------------------------------');
	// cheerio
	var $ = cheerio.load(data);
	var list = $('a', '.l-footer-ekiten_link');
	for (var i = 0, len = list.length; i < len; i++) {
		console.log(i, $(list[i]).text());
	}
});
