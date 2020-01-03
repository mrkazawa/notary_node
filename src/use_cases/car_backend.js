const eth_engine = require('../compute/ethereum_engine');

const express = require('express');

const CAR_DATA_PATH = '/home/vagrant/src/use_cases/config/car.json';
const CONTRACT_PATH = '/home/vagrant/src/use_cases/config/contract.json';
const CONTRACT_ABI_PATH = '/home/vagrant/src/compute/build/contracts/CarRentalContract.json';
const APP_PORT = 6901;

console.log("Car backend constructing smart contract object...");
const contractAbi = eth_engine.getContractAbiFromJsonFile(CONTRACT_ABI_PATH);
const contractAddress = eth_engine.getEthereumAddressFromJsonFile(CONTRACT_PATH);
const carRental = eth_engine.constructSmartContract(contractAbi, contractAddress);

const app = express();
app.use(express.json());

app.post('/access', async (req, res) => {
    // get the data from the http request
    const signature = req.body.signature;
    const carHash = req.body.carHash;

    const carAddress = eth_engine.getEthereumAddressFromJsonFile(CAR_DATA_PATH);
    const ipfsHashInBytes = eth_engine.getBytes32FromIpfsHash(carHash);
    const carObj = await carRental.methods.getRentalCarDetail(ipfsHashInBytes).call({
        from: carAddress
    });
    const carRenter = carObj[1];
    const isValue = carObj[2];
    const isRented = carObj[3];

    if (!isValue) {
        res.status(404).send('car hash not found!');
    }
    if (!isRented) {
        res.status(403).send('car is not rented!');
    }
    if (!eth_engine.verifySignature(carHash, signature, carRenter)) {
        res.status(403).send('invalid signature!');
    }

    res.status(200).send('car access successful');
});

// main
app.listen(APP_PORT, () =>
    console.log('Car Backend is listening on port', APP_PORT),
);