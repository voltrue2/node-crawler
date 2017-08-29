'use strict';

/**
Executes the script as an independent process
*/

const fs = require('fs');
const spawn = require('child_process').spawn;
const script = process.argv[2];

if (!script) {
	console.error('Error: Script to execute is missing');
	process.exit(1);
}


try {
	fs.statSync(script);
} catch (error) {
	console.error(error);
	process.exit(1);
}

var params = [ script ];

for (var i = 3; i < process.argv.length; i++) {
	params.push(process.argv[i]);
}

// try to start the script
spawn(process.execPath, params, { detached: true, stdio: 'ignore' });

console.log('Script launched:', script);

process.exit(0);

