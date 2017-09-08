
module.exports = {
	get: get
};

function get(error, res) {
	if (error) {
		return _error();
	}
	if (res && res.statusCode >= 399) {
		return _bad();
	}
	return _good();
}

function _error() {
	return '\033[0;31m×\033[0m';
}

function _good() {
	return '\033[0;32m✓\033[0m';
}

function _bad() {
	return '\033[0;35m⊝\033[0m';
}

