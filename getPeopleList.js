const fs = require('fs').promises;
module.exports = () =>
  fs.readFile('./people.json', 'utf-8').then((talker) => JSON.parse(talker));
