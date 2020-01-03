const iota_engine = require('../payment/iota_engine');
const ipfs_engine = require('../storage/ipfs_engine');
const eth_engine = require('../compute/ethereum_engine');

const Web3Utils = require('web3-utils');
const fs = require('fs');

// payment params
const RECIPIENT_ADDRESS = 'OPWZTSFCTVNDYXFLCAJPOQAONK9THEHWZPDT9JMRPHXSJNXNM9PXARVBDUM9YTDG9YRYEPNJNIFZRWNZCZWDWBEGWY';
const TAG = createRandomIotaTag();
const RENT_FEE = 1;

// compute params
const OWNER_DATA_PATH = './car_owner.json';
const NOTARY_DATA_PATH = './notary.json';
const RENTER_DATA_PATH = './car_renter.json';

// storage params
const CAR_DATA_PATH = './car_data.json';
var carDataTemplate = {
    timestamp: 0,
    manufacturer: "Hyundai",
    model: "M15",
    color: "black",
    license: "LOST 1234",
    year: 2017,
    paymentAddress: RECIPIENT_ADDRESS,
    paymentTag: TAG,
    paymentFee: RENT_FEE,
};

async function main() {
    console.log("=======================================");
    console.log("    Car Rental Application Use Case    ");
    console.log("=======================================");

    console.log("Car owner preparing car data...");
    carDataTemplate.timestamp = Math.floor(new Date() / 1000); // get current timestmap in epoch
    var json = JSON.stringify(carDataTemplate);
    fs.writeFileSync(CAR_DATA_PATH, json, {encoding:'utf8', flag:'w'});

    console.log("Car owner storing car data in IPFS...");
    const ipfsHash = await ipfs_engine.storeFromLocalFile(CAR_DATA_PATH);
    if (ipfs_engine.isValidIpfs(ipfsHash)) {
        console.log("Storing car data done!", ipfsHash);
    }

    console.log("Notary node constructing smart contract...");
    const carRental = eth_engine.constructSmartContract(eth_engine.getContractABI(), eth_engine.getContractAddress());
    const carOwnerAddress = getEthereumAddress(OWNER_DATA_PATH);

    console.log("Car owner storing rental car to the smart contract...");
    const ipfsHashInBytes = eth_engine.getBytes32FromIpfsHash(ipfsHash);
    let tx = await carRental.methods.storeRentalCar(ipfsHashInBytes).send({
        from: carOwnerAddress,
        gas: 1000000
    });

    const event = tx.events.NewRentalCarAdded; 
    if (typeof event !== 'undefined') {
        console.log('Tx stored in the block!');
        console.log('From: ', event.returnValues['carOwner']);
        console.log('Car Hash: ', event.returnValues['ipfsHash']);

    } else {
        console.log('ERROR! Tx not stored!');
    }

    console.log("Car renter looking for car to rent...");
    // skip this

    console.log("Car renter getting payment address, tag, and fee...");
    const carObj = await ipfs_engine.getFromIpfsHash(ipfsHash);

    console.log("Car renter paying for the rent fee...");
    await iota_engine.getCurrentBalance(carObj.paymentAddress);
    const tailHash = await iota_engine.sendTransaction(carObj.paymentAddress, carObj.paymentFee, carObj.paymentTag);

    console.log("Car renter submitting the transaction proof...");
    // skip this

    console.log("Notary node check if this proof is valid...");
    // also need to check if we see use this tail hash sometime before
    const txResult = await iota_engine.verifyTransaction(tailHash, carObj.paymentAddress, carObj.paymentFee, carObj.paymentTag);
    if (txResult) {
        await iota_engine.getCurrentBalance(carObj.paymentAddress);

        console.log("Notary node storing tx proof to the smart contract...");
        const notaryAddress = getEthereumAddress(NOTARY_DATA_PATH);
        const carRenterAddress = getEthereumAddress(RENTER_DATA_PATH);

        let tx = await carRental.methods.authorizeRentalCar(ipfsHashInBytes, carRenterAddress).send({
            from: notaryAddress,
            gas: 1000000
        });

        const event = tx.events.RentalCarRented; 
        if (typeof event !== 'undefined') {
            console.log('Tx stored in the block!');
            console.log('New Renter: ', event.returnValues['carRenter']);
            console.log('Car Hash: ', event.returnValues['ipfsHash']);

        } else {
            console.log('ERROR! Tx not stored!');
        }

        console.log("Car renter accessing the rental car...");

    } else {
        console.log("Tx proof is invalid");
    }

    

    /*
    const ipfsHash = await ipfs_engine.storeFromLocalFile(CAR_DATA);
    if (ipfs_engine.isValidIpfs(ipfsHash)) {
        console.log("Storing Car Data Done!");
    }

    const carObj = await ipfs_engine.getFromIpfsHash(ipfsHash);
    console.log(carObj);
    */
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

function getEthereumAddress(path) {
    let data = fs.readFileSync(path, 'utf8');
    let obj = JSON.parse(data);

    return Web3Utils.toChecksumAddress(obj.address);
}

main();