'use strict';

const fs = require('fs');
const rows = [];
const duplicates = [];
const HEADER = '"URL","名称","ジャンル","カテゴリー","電話番号","住所/都道府県","住所/市町村","住所","ウェブサイト","クレジットカード"';

if (!process.argv[2]) {
	console.error('Path to the CSV file must be provided');
	process.exit(1);
}

const data = fs.readFileSync(process.argv[2], 'utf8').split('\n');

for (var i = 0, len = data.length; i < len; i++) {
	if (i > 0 && data[i] === HEADER) {
		// we do NOT want the header more than once...
		continue;
	}
	var row = data[i].split(',');
	var url = row[0];
	var id = url.substring(url.indexOf('shop_') + 5);
	id = id.substring(0, id.indexOf('/'));
	if (duplicates.indexOf(id) !== -1) {
		continue;
	}
	duplicates.push(id);
	rows.push(row.join(','));
}

const res = rows.join('\n');

fs.writeFileSync(process.argv[2], res);

