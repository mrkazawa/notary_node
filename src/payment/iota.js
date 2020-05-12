const Iota = require('@iota/core');

// specify the location of the IRI node
const iota = Iota.composeAPI({
  provider: 'http://10.0.0.11:14265'
});

module.exports = iota;