const iota_engine = require('../payment/iota_engine');
const ipfs_engine = require('../storage/ipfs_engine');

const Web3Utils = require('web3-utils');

const fs = require('fs');

// payment params
const RECIPIENT_ADDRESS = 'OPWZTSFCTVNDYXFLCAJPOQAONK9THEHWZPDT9JMRPHXSJNXNM9PXARVBDUM9YTDG9YRYEPNJNIFZRWNZCZWDWBEGWY';
const TAG = createRandomIotaTag();
const RENT_FEE = 1;

// compute params
const OWNER_DATA = './car_owner.json';

// storage params
const CAR_DATA = './car_data.json';
const MOCK_IPFS_HASH = 'QmYvDcdhRBh3aNR2tJn9rC5RVJBabtGXNBJrV8jaLS9L1M';

async function main() {
    const ipfsHash = await ipfs_engine.storeFromLocalFile(CAR_DATA);
    if (ipfs_engine.isValidIpfs(ipfsHash)) {
        console.log("Storing Car Data Done!");
    }

    const carObj = await ipfs_engine.getFromIpfsHash(ipfsHash);
    console.log(carObj);
}

//do_iota_payment();

async function do_iota_payment() {
    await iota_engine.getCurrentBalance(RECIPIENT_ADDRESS);
    const tailHash = await iota_engine.sendTransaction(RECIPIENT_ADDRESS, RENT_FEE, TAG);
    const txResult = await iota_engine.verifyTransaction(tailHash, RECIPIENT_ADDRESS, RENT_FEE, TAG);
    if (txResult) {
        console.log("Car Payment Done!");
    }
}

function createRandomIotaTag() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
    const charactersLength = characters.length;
    const length = 27; // IOTA tag length is 27 trytes

    var result = '';
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

function getCarOwnerAddress() {
    let data = fs.readFileSync(OWNER_DATA, 'utf8');
    let obj = JSON.parse(data);

    return Web3Utils.toChecksumAddress(obj.address);
}

main();