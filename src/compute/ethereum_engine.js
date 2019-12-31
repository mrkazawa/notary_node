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
    // Return bytes32 hex string from base58 encoded ipfs hash,
    // stripping leading 2 bytes from 34 byte IPFS hash
    // Assume IPFS defaults: function:0x12=sha2, size:0x20=256 bits
    // E.g. "QmNSUYVKDSvPUnRLKmuxk9diJ6yS96r1TrAXzjTiBcCLAL" -->
    // "0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231"
    getBytes32FromIpfsHash(ipfsListing) {
        return "0x"+bs58.decode(ipfsListing).slice(2).toString('hex')
    },
    // Return base58 encoded ipfs hash from bytes32 hex string,
    // E.g. "0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231"
    // --> "QmNSUYVKDSvPUnRLKmuxk9diJ6yS96r1TrAXzjTiBcCLAL"
    getIpfsHashFromBytes32(bytes32Hex) {
        // Add our default ipfs values for first 2 bytes:
        // function:0x12=sha2, size:0x20=256 bits
        // and cut off leading "0x"
        const hashHex = "1220" + bytes32Hex.slice(2)
        const hashBytes = Buffer.from(hashHex, 'hex');
        const hashStr = bs58.encode(hashBytes)
        return hashStr
    }

}

module.exports = ethereum_engine;