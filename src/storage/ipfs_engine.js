const ipfsClient = require('ipfs-http-client');
const isIPFS = require('is-ipfs');

// specify the location of the IPFS daemon
const ipfs = ipfsClient({
  host: 'localhost',
  port: '5001',
  protocol: 'http'
});

var ipfs_engine = {
  /**
   * Check whether the given IPFS string is a correct Content Identifiers (CID).
   * More example can be found in https://www.npmjs.com/package/is-ipfs
   * This function will return true if the IPFS string is valid.
   * 
   * @param {string} ipfsString   The IPFS string
   */
  isValidIpfsHash: function (ipfsString) {
    return isIPFS.cid(ipfsString);
  },

  /**
   * Store the JSON file from the local path to the IPFS network.
   * This function will return the IPFS hash.
   * 
   * @param {string} filePath     The path to the file that you want to store in IPFS
   */
  storeJsonFromLocalFile: async function (filePath) {
    const results = await ipfs.addFromFs(filePath);
    return results[0].hash;
  },

  /**
   * Get the contents of the JSON file from given IPFS hash.
   * This will return the file as an object.
   * 
   * @param {string} ipfsHash     The IPFS hash CID of the file 
   */
  getJsonFromIpfsHash: async function (ipfsHash) {
    const files = await ipfs.get(ipfsHash);

    var result;
    files.forEach((file) => {
      result = JSON.parse(file.content.toString('utf8'));
    })

    return result;
  }
}

module.exports = ipfs_engine;