const { regexOnlyNumbers } = require('./constants');

module.exports = (string) => string.match(regexOnlyNumbers).join('');
