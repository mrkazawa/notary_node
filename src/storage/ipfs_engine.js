const ipfsClient = require('ipfs-http-client');
const isIPFS = require('is-ipfs');

const ipfs = ipfsClient({ host: 'localhost', port: '5001', protocol: 'http' });

var ipfs_engine = {
    isValidIpfs: function(ipfsString) {
        return isIPFS.cid(ipfsString);
    },

    storeFromLocalFile: async function (filePath) {
        const results = await ipfs.addFromFs(filePath);
        return results[0].hash;
    },

    getFromIpfsHash: async function (ipfsHash) {
        const files = await ipfs.get(ipfsHash);

        var result;
        files.forEach((file) => {
            result = JSON.parse(file.content.toString('utf8'));
        })

        return result;
    }
}

module.exports = ipfs_engine;