const ipfsClient = require('ipfs-http-client');
const isIPFS = require('is-ipfs');

const ipfs = ipfsClient({ host: 'notary1.local', port: '5001', protocol: 'http' });

var ipfs_engine = {
    isValidIpfs: function(ipfsUrl) {
        return isIPFS.cid(ipfsUrl);
    },

    storeFromLocalFile: async function (filePath) {
        const results = await ipfs.addFromFs(filePath);
        return results[0].hash;
    },

    getJson: async function (ipfsHash) {
        const queriedData = await ipfs.get(ipfsHash);
        return JSON.parse(queriedData);
    }
}

module.exports = ipfs_engine;