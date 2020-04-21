const bs58 = require('bs58')

module.exports = {
  /**
   * Convert string IPFS hash to bytes32 for smart contract.
   * 
   * @param {string} ipfsListing  The IPFS hash to be converted
   */
  getBytes32FromIpfsHash(ipfsListing) {
    return "0x" + bs58.decode(ipfsListing).slice(2).toString('hex')
  },

  /**
   * Convert bytes32 string from smart contract to IPFS hash.
   * 
   * @param {string} bytes32Hex   The bytes32 string to be converted
   */
  getIpfsHashFromBytes32(bytes32Hex) {
    // Add our default ipfs values for first 2 bytes:
    // function: 0x12=sha2, size: 0x20=256 bits
    // and cut off leading "0x"
    const hashHex = "1220" + bytes32Hex.slice(2)
    const hashBytes = Buffer.from(hashHex, 'hex');
    const hashStr = bs58.encode(hashBytes)
    return hashStr
  }
}