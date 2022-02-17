const fs = require('fs').promises;

module.exports = (data) =>
  fs.writeFile('./people.json', JSON.stringify(data, null, 2)).then(() => 'ok');
