'use strict';

const fs = require('fs');
const rows = [];
const duplicates = [];

if (!process.argv[2]) {
	console.error('Path to the CSV file must be provided');
	process.exit(1);
}

const data = fs.readFileSync(process.argv[2], 'utf8').split('\n');

for (var i = 0, len = data.length; i < len; i++) {
	var row = data[i].split(',');
	var phone = row[4];
	if (duplicates.indexOf(phone) !== -1) {
		continue;
	}
	duplicates.push(phone);
	rows.push(row.join(','));
}

const res = rows.join('\n');

fs.writeFileSync(process.argv[2], res);

