const IOTA = require('@iota/core');
const Converter = require('@iota/converter');
const Extract = require('@iota/extract-json')

const depth = 3;
const minimumWeightMagnitude = 9;

// Define a seed and an address.
// These do not need to belong to anyone or have IOTA tokens.
// They must only contain a maximum of 81 trytes
// or 90 trytes with a valid checksum
const recipientAddress = 'OPWZTSFCTVNDYXFLCAJPOQAONK9THEHWZPDT9JMRPHXSJNXNM9PXARVBDUM9YTDG9YRYEPNJNIFZRWNZCZWDWBEGWY';
const seed = 'SENDER99999999999999999999999999999999999999999999999999999999999999999999999999A';

iota = IOTA.composeAPI({
    provider: 'http://localhost:14265'
});
var senderAddress = IOTA.generateAddress(seed, 0);

// start
//getCurrentBalance(senderAddress);
getCurrentBalance(recipientAddress);
//attachToTangle(senderAddress);

// send
sendTransaction(recipientAddress, 1);

// end
//getCurrentBalance(senderAddress);
getCurrentBalance(recipientAddress);


async function getCurrentBalance(address) {
    const balance = await iota.getBalances([address], 100);
    console.log(address, "balance is", parseInt(balance.balances));
}

async function attachToTangle(address) {
    const transfers = [{
        address: address,
        value: 0, // 0Ki
        tag: '', // optional tag of `0-27` trytes
        message: '' // optional message in trytes
    }]

    // sending transactions to the network
    const trytes = await iota.prepareTransfers(seed, transfers);
    const bundle = await iota.sendTrytes(trytes, depth, minimumWeightMagnitude);
    const tailTransactionHash = bundle[0].hash;

    console.log("attaching address to tangle...");
    while (true) {
        // to check if the transactions has been included in the main tangle
        // a.k.a check transaction confirmation.
        const confirmed = await iota.getLatestInclusion([tailTransactionHash]);
        if (confirmed[0]) {
            console.log(address, "is attached to tangle!!!");
            break;
        }
    }
}

async function sendTransaction(recipientAddress, amount) {
    const transfers = [{
        address: recipientAddress,
        value: amount, // 0Ki
        tag: '', // optional tag of `0-27` trytes
        message: '' // optional message in trytes
    }]

    // sending transactions to the network
    const trytes = await iota.prepareTransfers(seed, transfers);
    const bundle = await iota.sendTrytes(trytes, depth, minimumWeightMagnitude);
    const tailTransactionHash = bundle[0].hash;

    console.log("waiting until Tx is confirmed...");
    while (true) {
        const confirmed = await iota.getLatestInclusion([tailTransactionHash]);
        if (confirmed[0]) {
            console.log(recipientAddress, "transaction is confirmed!!!");
            getCurrentBalance(recipientAddress);
            break;
        }
    }
}




/*
iota.getBalances([senderAddress], 100).then(({ balances }) => {
    console.log("========= sender balance =========");
    console.log(parseInt(balances));
}).catch(err => {
    console.log(parseInt(err));
})

iota.getBalances([receiverAddress], 100).then(({ balances }) => {
    console.log("========= receiver balance =========");
    console.log(parseInt(balances));
}).catch(err => {
    console.log(parseInt(err));
})

// Define a JSON message to send.
// This message must include only ASCII characters.
const message = JSON.stringify({ "message": "Hello world" });

// Convert the message to trytes
const messageInTrytes = Converter.asciiToTrytes(message);

// Define a zero-value transaction object
// that sends the message to the address
const transfers = [
    {
        value: 1,
        address: receiverAddress,
        message: messageInTrytes
    }
];

// Create a bundle from the `transfers` array
// and send the transaction to the node
iota
    .prepareTransfers(seed, transfers)
    .then(trytes => iota.sendTrytes(trytes, depth, minimumWeightMagnitude))
    .then(bundle => {

        //console.log(bundle);

        // The message can be read from the Tangle, using the tail transaction hash
        const tailTransactionHash = bundle[0].hash; // NOLIVEQNRHIIRPDPHYTGJOVSGOUXVAACDNAPNTTRFNNCVNJMDZFPURTDNVTAKHPSLSJRYZGQHYBBAE999

        console.log(tailTransactionHash);

        // Get the tail transaction's bundle from the Tangle
        return iota.getBundle(tailTransactionHash)
            .then(bundle => {
                // Get your hello world message from the transaction's `signatureMessageFragment` field and print it to the console
                console.log(JSON.parse(Extract.extractJson(bundle)));
            })
    })
    .catch(err => {
        console.error(err)
    });

iota.getBalances([address], 100).then(({ balances }) => {
    console.log("========= sender balance =========");
    console.log(parseInt(balances));
}).catch(err => {
    console.log(parseInt(err));
})

iota.getBalances([receiverAddress], 100).then(({ balances }) => {
    console.log("========= receiver balance =========");
    console.log(parseInt(balances));
}).catch(err => {
    console.log(parseInt(err));
})


let hash = 'NEPXVBJHGBEFZBQKFCNUIKQVJUFOJ9YBJLOLOKXKLWKRW9WNAMEUCWJ9ZJSYZDFEQTYOPCSNNCRUNV999';
let hashes = [hash];

let senderAddress = 'VZAWPZERLCVLNUCPGPKLNDDDGQLIODLWZNXVRYZVRHGDMKCSEEHRMJXBACJVLPGAQS9GKRJDMSMZEWKUYUGYDIRPFB';

iota.findTransactions({ addresses: [senderAddress] })
    .then(hashes => iota.getTransactionObjects(hashes)
        .then(transactions => {
            console.log(transactions);
        })
        .catch(err => {
            // handle errors
        })
    )
    .catch(err => {
        // handle errors here
    })

// to check if the transactions has been included in the main tangle
// a.k.a check transaction confirmation.
iota.getLatestInclusion(hashes)
    .then(states => {
        console.log(states);
    })
    .catch(err => {
        console.log(err);
    })

function isTxConfirmed(hashes) {
    iota.getLatestInclusion(hashes)
    .then(states => {
        console.log(states);
    })
    .catch(err => {
        console.log(err);
    })
}




// Must be truly random & 81-trytes long.
const seed = ' your seed here '

// Array of transfers which defines transfer recipients and value transferred in IOTAs.
const transfers = [{
    address: ' recipient address here ',
    value: 0, // 0Ki
    tag: '', // optional tag of `0-27` trytes
    message: '' // optional message in trytes
}]

// Depth or how far to go for tip selection entry point.
const depth = 3 

// Difficulty of Proof-of-Work required to attach transaction to tangle.
// Minimum value on mainnet is `14`, `7` on spamnet and `9` on devnet and other testnets.
const minWeightMagnitude = 14

// Prepare a bundle and signs it.
iota.prepareTransfers(seed, transfers)
    .then(trytes => {
        // Persist trytes locally before sending to network.
        // This allows for reattachments and prevents key reuse if trytes can't
        // be recovered by querying the network after broadcasting.

        // Does tip selection, attaches to tangle by doing PoW and broadcasts.
        return iota.sendTrytes(trytes, depth, minWeightMagnitude)
    })

    */