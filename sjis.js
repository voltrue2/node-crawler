'use strict';

const fs = require('fs');
const iconv = require('iconv-lite');

const PATH = process.argv[2];

if (!PATH) {
		console.error('Must provide the path to the file to convert...');
			process.exit(1);
}

var data = iconv.encode(fs.readFileSync(PATH, 'utf8'), 'Shift_JIS');

fs.writeFileSync(PATH, data);
