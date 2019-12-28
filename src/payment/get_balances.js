const request = require('request');
const iota = require('@iota/core');

Iota = iota.composeAPI({
    provider: 'http://notary1.local:14265'
});

var address = iota.generateAddress('SENDER99999999999999999999999999999999999999999999999999999999999999999999999999A',0);

getBalance(address);

function getBalance(address) {

    var command = {
    'command': 'getBalances',
    'addresses': [
    address
    ],
    'threshold':100
    }

    var options = {
    url: 'http://notary1.local:14265',
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    'X-IOTA-API-Version': '1',
    'Content-Length': Buffer.byteLength(JSON.stringify(command))
    },
    json: command
    };

    request(options, function (error, response, data) {
        if (!error && response.statusCode == 200) {
        console.log(JSON.stringify(data,null,1));
        }
    });
}