'use strict';

const logger = require('./logger');
const search = require('./search');

const POLLING_INTERVAL = 10000;
const INACTIVE_LIMIT = 10;

var inactiveCount = 0;

module.exports = {
	start: start,
	resetInactiveCount: resetInactiveCount
};

function start() {
	logger.write('Main loop start');
	setTimeout(polling, POLLING_INTERVAL);
}

function resetInactiveCount() {
	inactiveCount = 0;
}

function polling() {
	var isActive = search.isActive();
	if (!isActive) {
		inactiveCount += 1;
	} else {
		resetInactiveCount();
	}

	logger.write('Inactive count: ' + inactiveCount);

	if (inactiveCount === INACTIVE_LIMIT) {
		logger.write('All operations completed: exit process');
		process.exit(0);
		return;
	}
	setTimeout(polling, POLLING_INTERVAL);
}
