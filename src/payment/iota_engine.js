const IOTA = require('@iota/core');

const DEPTH = 3;
const MINIMUM_WEIGHT_MAGNITUDE = 9;
const SECURITY_LEVEL = 0;

const SEED = 'SENDER99999999999999999999999999999999999999999999999999999999999999999999999999A';

// connect to Tangle (IOTA Network)
iota = IOTA.composeAPI({
    provider: 'http://localhost:14265'
});

// TODO: Implement the generate address and attach to Tangle to correct way

var self = {
    generateNextAddress: function () {
        return IOTA.generateAddress(SEED, SECURITY_LEVEL);
    },

    attachToTangle: async function (address) {
        const transfers = [{
            address: address,
            value: 0, // attach to tangle is a zero transaction value
        }]
    
        // sending transactions to the network
        const trytes = await iota.prepareTransfers(SEED, transfers);
        const bundle = await iota.sendTrytes(trytes, DEPTH, MINIMUM_WEIGHT_MAGNITUDE);
        const tailTransactionHash = bundle[0].hash;
    
        console.log("attaching address to tangle...");
        while (true) {
            const confirmed = await iota.getLatestInclusion([tailTransactionHash]);
            if (confirmed[0]) {
                console.log(address, "is attached to tangle!!!");
                break;
            }
        }

        return tailTransactionHash;
    }
}

var iota_engine = {    
    /**
     * Get the current balance for given address in the Tangle (IOTA Network).
     * 
     * @param {string} address      the IOTA address (90 trytes)
     */
    getCurrentBalance: async function (address) {
        const balanceObj = await iota.getBalances([address], 100);
        const balance = parseInt(balanceObj.balances)
        console.log(address, "balance is", balance);
    
        return balance;
    },

    /**
     * Send a transaction to the Tangle (IOTA Network).
     * 
     * @param {string} recipientAddress     the recipient IOTA address that should be in the transaction (90 trytes)
     * @param {number} amount               the amount of IOTA that should be in the transaction
     * @param {string} tag                  the tag that should be in the transaction (27 trytes)
     */
    sendTransaction: async function (recipientAddress, amount, tag) {
        let senderAddress = self.generateNextAddress();
        await self.attachToTangle(senderAddress);

        const transfers = [{
            address: recipientAddress,
            value: amount,
            tag: tag
        }]

        // sending transactions to the network
        const trytes = await iota.prepareTransfers(SEED, transfers);
        const bundle = await iota.sendTrytes(trytes, DEPTH, MINIMUM_WEIGHT_MAGNITUDE);
        const tailTransactionHash = bundle[0].hash;

        console.log("waiting until Tx is confirmed...");
        while (true) {
            const confirmed = await iota.getLatestInclusion([tailTransactionHash]);
            if (confirmed[0]) {
                console.log("transaction for", recipientAddress, "is confirmed!!!");
                break;
            }
        }

        return tailTransactionHash;
    },

    /**
     * Verify if the given hash from the transaction is valid in Tangle (IOTA Network).
     * 
     * @param {string} tailHash             the tail hash of the bundle in the transaction
     * @param {string} recipientAddress     the recipient IOTA address that should be in the transaction (90 trytes)
     * @param {number} amount               the amount of IOTA that should be in the transaction
     * @param {string} tag                  the tag that should be in the transaction (27 trytes)
     */
    verifyTransaction: async function (tailHash, recipientAddress, amount, tag) {
        // remove the checksums
        recipientAddress = recipientAddress.slice(0, -9);
        const confirmed = await iota.getLatestInclusion([tailHash]);

        if (confirmed[0]) {
            const bundleObj = await iota.getBundle(tailHash);
            const txRecipientAddress = bundleObj[0].address;
            const txRecipientAmount = bundleObj[0].value;
            const txRecipientTag = bundleObj[0].tag;

            if (recipientAddress != txRecipientAddress) {
                console.log("transaction is invalid, recipient address does not match");
            } else if (amount != txRecipientAmount) {
                console.log("transaction is invalid, amount does not match");
            } else if (tag != txRecipientTag) {
                console.log("transaction is invalid, tag does not match");
            } else {
                console.log("transaction is valid, according to the given params");

                return true;
            }
        } else {
            console.log("transaction is not confirmed by the network yet");
        }

        return false;
    },

    /**
     * Create a random IOTA tag for transactions.
     */
    createRandomIotaTag: function () {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
        const charactersLength = characters.length;
        const length = 27; // IOTA tag length is 27 trytes
    
        var result = '';
        for ( var i = 0; i < length; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
    
        return result;
    }
}

module.exports = iota_engine;