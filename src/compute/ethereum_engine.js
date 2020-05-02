const bs58 = require('bs58');
const web3 = require('./web3');

var ethereum_engine = {
  /**
   * Construct a web3 object of the smart contract.
   * 
   * @param {string} abi      the ABI of the contract.
   * @param {string} address  the address of the deployed contract.
   */
  constructSmartContract: function (abi, address) {
    return new web3.eth.Contract(abi, address);
  },

  /**
   * Convert Ethereum address to its checksummed variant.
   * 
   * @param {string} address    The address to be converted
   */
  convertToChecksumAddress: function (address) {
    return web3.utils.toChecksumAddress(address);
  },

  /**
   * Convert IPFS hash string to bytes32 for smart contract storage.
   * 
   * Return bytes32 hex string from base58 encoded ipfs hash,
   * stripping leading 2 bytes from 34 byte IPFS hash.
   * Assume IPFS defaults: function:0x12=sha2, size:0x20=256 bits
   * E.g. "QmNSUYVKDSvPUnRLKmuxk9diJ6yS96r1TrAXzjTiBcCLAL" -->
   * "0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231"
   * 
   * @param {string} ipfsListing      The IPFS hash to be converted
   */
  convertIpfsHashToBytes32: function (ipfsListing) {
    return "0x" + bs58.decode(ipfsListing).slice(2).toString('hex');
  },

  /**
   * Convert bytes32 to an IPFS hash string format.
   * 
   * Return base58 encoded ipfs hash from bytes32 hex string,
   * E.g. "0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231"
   * --> "QmNSUYVKDSvPUnRLKmuxk9diJ6yS96r1TrAXzjTiBcCLAL"
   * 
   * @param {bytes32} bytes32Hex      The IPFS bytes32 to be converted
   */
  convertBytes32ToIpfsHash: function (bytes32Hex) {
    // Add our default ipfs values for first 2 bytes:
    // function:0x12=sha2, size:0x20=256 bits
    // and cut off leading "0x"
    const hashHex = "1220" + bytes32Hex.slice(2);

    const hashBytes = Buffer.from(hashHex, 'hex');
    const hashStr = bs58.encode(hashBytes);

    return hashStr;
  },

  /**
   * Sign the given message with the given private key.
   * This function will return the signature.
   * 
   * @param {string} message      The message to be signed
   * @param {string} privateKey   The private key to sign the message
   */
  signMessage: function (message, privateKey) {
    let m = web3.eth.accounts.sign(message, privateKey);
    return m.signature;
  },

  /**
   * Verify whether the given message and signature is valid.
   * It returns true if indeed the given address has signed this messsage.
   * 
   * @param {string} message      The message
   * @param {string} signature    The corresponding signature of the message
   * @param {string} address      The corresponding address that signs the message
   */
  verifySignature: function (message, signature, address) {
    let addr = web3.eth.accounts.recover(message, signature);
    return (addr == address);
  }
}

module.exports = ethereum_engine;