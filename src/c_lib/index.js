const testAddon = require('./build/Release/testaddon.node');

console.log('addon',testAddon);
console.log(testAddon.hello());
console.log(testAddon.hash("test"));

module.exports = testAddon;