const fs = require('fs');
const Web3 = require('web3');



// connect to ganache network
// run the following command to activate ganache
// ganache-cli -m dongseo
const web3 = new Web3(new Web3.providers.HttpProvider('http://notary2.local:8545'));

var self = {
        /**
     * Read JSON file and return the contents of the file in object.
     * Also convert the address of Ethereum (if any) to checksum format.
     * @param {string} path     path to the JSON file.
     */
    readFile: function (path) {
        
    }
}

var ethereum_engine = {


}

module.exports = ethereum_engine;