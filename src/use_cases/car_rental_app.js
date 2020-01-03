const iota_engine = require('../payment/iota_engine');
const ipfs_engine = require('../storage/ipfs_engine');
const eth_engine = require('../compute/ethereum_engine');

const fs = require('fs');
const rp = require('request-promise-native');

// payment params
const RECIPIENT_ADDRESS = 'OPWZTSFCTVNDYXFLCAJPOQAONK9THEHWZPDT9JMRPHXSJNXNM9PXARVBDUM9YTDG9YRYEPNJNIFZRWNZCZWDWBEGWY';
const TAG = iota_engine.createRandomIotaTag();
const RENT_FEE = 1;

// compute params
const OWNER_DATA_PATH = '/home/vagrant/src/use_cases/car_owner.json';
const NOTARY_DATA_PATH = '/home/vagrant/src/use_cases/notary.json';
const RENTER_DATA_PATH = '/home/vagrant/src/use_cases/car_renter.json';

// storage params
const CAR_DATA_PATH = '/home/vagrant/src/use_cases/car_data.json';
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

// car params
const CAR_ACCESS_ENDPOINT = 'http://localhost:6901/access';

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
    const carOwnerAddress = eth_engine.getEthereumAddressFromJsonFile(OWNER_DATA_PATH);

    console.log("Car owner storing rental car to the smart contract...");
    const ipfsHashInBytes = eth_engine.getBytes32FromIpfsHash(ipfsHash);
    let tx = await carRental.methods.storeRentalCar(ipfsHashInBytes).send({
        from: carOwnerAddress,
        gas: 1000000
    });

    const event = tx.events.NewRentalCarAdded; 
    if (typeof event !== 'undefined') {
        console.log('Tx stored in the block!');
        console.log('Car Owner: ', event.returnValues['carOwner']);
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
        const notaryAddress = eth_engine.getEthereumAddressFromJsonFile(NOTARY_DATA_PATH);
        const carRenterAddress = eth_engine.getEthereumAddressFromJsonFile(RENTER_DATA_PATH);

        let tx = await carRental.methods.authorizeRentalCar(ipfsHashInBytes, carRenterAddress).send({
            from: notaryAddress,
            gas: 1000000
        });

        const event = tx.events.RentalCarRented; 
        if (typeof event !== 'undefined') {
            console.log('Tx stored in the block!');
            console.log('Car Renter: ', event.returnValues['carRenter']);
            console.log('Car Hash: ', event.returnValues['ipfsHash']);

        } else {
            console.log('ERROR! Tx not stored!');
        }

        console.log("Car renter accessing the rental car...");
        const renterPrivateKey = eth_engine.getPrivateKeyFromJsonFile(RENTER_DATA_PATH);
        const signature = eth_engine.signMessage(ipfsHash, renterPrivateKey);
        const payload = {
            carHash: ipfsHash,
            signature: signature
        }

        let options = {
            method: 'POST',
            uri: CAR_ACCESS_ENDPOINT,
            body: payload,
            resolveWithFullResponse: true,
            json: true // Automatically stringifies the body to JSON
        };
        rp(options).then(function (response) {
            console.log('Response status code: ', response.statusCode)
            console.log('Response body: ', response.body);
        }).catch(function (err) {
            console.log(err);
        });

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



main();