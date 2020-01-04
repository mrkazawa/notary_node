const iota_engine = require('../payment/iota_engine');
const ipfs_engine = require('../storage/ipfs_engine');
const eth_engine = require('../compute/ethereum_engine');

const fs = require('fs');
const { performance } = require('perf_hooks');
const rp = require('request-promise-native');

// payment params
const RECIPIENT_ADDRESS = 'OPWZTSFCTVNDYXFLCAJPOQAONK9THEHWZPDT9JMRPHXSJNXNM9PXARVBDUM9YTDG9YRYEPNJNIFZRWNZCZWDWBEGWY';
const TAG = iota_engine.createRandomIotaTag();
const RENT_FEE = 1;

// compute params
const CONTRACT_PATH = '/home/vagrant/src/use_cases/config/contract.json';
const CONTRACT_ABI_PATH = '/home/vagrant/src/compute/build/contracts/CarRentalContract.json';

const OWNER_DATA_PATH = '/home/vagrant/src/use_cases/config/car_owner.json';
const NOTARY_DATA_PATH = '/home/vagrant/src/use_cases/config/notary.json';
const RENTER_DATA_PATH = '/home/vagrant/src/use_cases/config/car_renter.json';

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

// performance params
const RESULT_DATA_PATH = '/home/vagrant/result.csv';

// TODO: Add error handling for this use case

async function main() {
    console.log("=======================================");
    console.log("    Car Rental Application Use Case    ");
    console.log("=======================================");

    // FIXME: initialize, also APP_START_TIME
    var t0 = performance.now();

    console.log("Car owner preparing car data...");
    carDataTemplate.timestamp = Math.floor(new Date() / 1000); // get current timestmap in epoch
    var json = JSON.stringify(carDataTemplate);
    fs.writeFileSync(CAR_DATA_PATH, json, {encoding:'utf8', flag:'w'});

    console.log("Car owner storing car data in IPFS...");
    const ipfsHash = await ipfs_engine.storeJsonFromLocalFile(CAR_DATA_PATH);
    if (ipfs_engine.isValidIpfsHash(ipfsHash)) {
        console.log("Storing car data done!", ipfsHash);
    }

    // FIXME: storing car details in IPFS time
    var t1 = performance.now();

    console.log("Notary node constructing smart contract...");
    const contractAbi = eth_engine.getContractAbiFromJsonFile(CONTRACT_ABI_PATH);
    const contractAddress = eth_engine.getEthereumAddressFromJsonFile(CONTRACT_PATH);
    const carRental = eth_engine.constructSmartContract(contractAbi, contractAddress);

    console.log("Car owner storing rental car to the smart contract...");
    const carOwnerAddress = eth_engine.getEthereumAddressFromJsonFile(OWNER_DATA_PATH);
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

        // FIXME: storing car metadata in EVM time
        var t2 = performance.now();

        console.log("Car renter looking for car to rent...");
        // TODO: implement the web service for this
        // skip this
    
        console.log("Car renter getting payment address, tag, and fee...");
        const carObj = await ipfs_engine.getJsonFromIpfsHash(ipfsHash);
    
        console.log("Car renter paying for the rent fee...");
        await iota_engine.getCurrentBalance(carObj.paymentAddress);
        const tailHash = await iota_engine.sendTransaction(carObj.paymentAddress, carObj.paymentFee, carObj.paymentTag);

        // FIXME: sending payment to IOTA time
        var t3 = performance.now();
    
        console.log("Car renter submitting the transaction proof...");
        // TODO: implement the web service for this
        // skip this
    
        console.log("Notary node check if this proof is valid...");
        // TODO: also need to check if we see use this tail hash sometime before
        const txResult = await iota_engine.verifyTransaction(tailHash, carObj.paymentAddress, carObj.paymentFee, carObj.paymentTag);
        if (txResult) {
            await iota_engine.getCurrentBalance(carObj.paymentAddress);

            // FIXME: verifying tx proof in IOTA time
            var t4 = performance.now();
    
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

                // FIXME: authorizing car access in EVM time
                var t5 = performance.now();

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

                    // FIXME: accessing car time, also APP_END_TIME
                    var t6 = performance.now();

                    // appending result to file
                    const time_result = t0+","+t1+","+t2+","+t3+","+t4+","+t5+","+t6+"\r\n";
                    fs.appendFileSync(RESULT_DATA_PATH, time_result);

                }).catch(function (err) {
                    console.warn(err);
                });
    
            } else {
                console.warn('ERROR! Tx not stored!');
            }
        } else {
            console.warn("Tx proof is invalid");
        }
    } else {
        console.warn('ERROR! Tx not stored!');
    }
}

main();