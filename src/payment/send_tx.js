const request = require('request');
const IOTA = require('@iota/core');

iota = IOTA.composeAPI({
    provider: 'http://localhost:14265'
});

const receiverAddress = "OPWZTSFCTVNDYXFLCAJPOQAONK9THEHWZPDT9JMRPHXSJNXNM9PXARVBDUM9YTDG9YRYEPNJNIFZRWNZCZWDWBEGWY";

var address = IOTA.generateAddress('SENDER99999999999999999999999999999999999999999999999999999999999999999999999999A',0);

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
    url: 'http://localhost:14265',
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
            console.log(parseInt(data.balances));
            //console.log(JSON.stringify(data,null,1));
        }
    });
}