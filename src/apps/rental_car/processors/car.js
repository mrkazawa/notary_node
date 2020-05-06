const {
  performance
} = require('perf_hooks');

const storageEngine = require('../../../storage/ipfs_engine');
const computeEngine = require('../../../compute/ethereum_engine');
const tools = require('../tools');

const {
  COMPUTE_NETWORK_ID,
  RESULT_DATA_PATH,
  CAR_RENTAL_CONTRACT
} = require('../config');

const {
  DatabaseWriteError,
  InvalidIpfsHashError,
  IpfsGetError,
  EthereumExecutionError
} = require('../errors');

const CarDB = require('../db/car_db');
const carDB = new CarDB();

const appCredsPath = '/home/vagrant/src/apps/rental_car/app_credentials.json';
const appAddress = computeEngine.convertToChecksumAddress(tools.readJsonFIle(appCredsPath).address);

const getUnrentedCar = function (req, res) {
  const unrentedCar = carDB.getOneUnrentedCar();
  res.status(200).send(JSON.stringify(unrentedCar));
};

const getContract = function (req, res) {
  res.status(200).send(JSON.stringify(CAR_RENTAL_CONTRACT));
}

const insertNewCar = async function (appRequest, start) {
  const ipfsHash = appRequest.storage_address;
  const contractAddress = appRequest.compute_address;
  const networkId = appRequest.compute_network_id;

  if (!carDB.checkIfCarExist(ipfsHash)) {
    if (!storageEngine.isValidIpfsHash(ipfsHash)) {
      throw new InvalidIpfsHashError(ipfsHash);
    }

    const car = await storageEngine.getJsonFromIpfsHash(ipfsHash);
    if (car instanceof Error) {
      throw new IpfsGetError(ipfsHash);
    }

    const info = carDB.insertNewCar(ipfsHash, car, contractAddress, networkId);
    if (info.changes <= 0) {
      throw new DatabaseWriteError(ipfsHash);
    }

    const end = performance.now();
    tools.savingResult('Getting App Update from Core Engine', RESULT_DATA_PATH, start, end);
    console.log(`car ${ipfsHash} is stored in database`);
  }
};

const authorizeCar = async function (appRequest, start) {
  const ipfsHash = appRequest.car_hash;
  const renterAddress = appRequest.renter_address;

  const info = carDB.authorizeCar(ipfsHash, renterAddress);
  if (info.changes <= 0) {
    throw new DatabaseWriteError(ipfsHash);
  }

  const contractAbi = CAR_RENTAL_CONTRACT.abi;
  const contractAddress = CAR_RENTAL_CONTRACT.networks[COMPUTE_NETWORK_ID].address;
  const carRental = computeEngine.constructSmartContract(contractAbi, contractAddress);

  const ipfsHashInBytes = computeEngine.convertIpfsHashToBytes32(ipfsHash);

  try {
    const tx = await carRental.methods.authorizeRentalCar(ipfsHashInBytes, renterAddress).send({
      from: appAddress,
      gas: 1000000
    });

    const event = tx.events.RentalCarRented; 
    if (typeof event !== 'undefined') {
      const end = performance.now();
      tools.savingResult('Authorize Car in ETH', RESULT_DATA_PATH, start, end);

      console.log('Authorize Car Tx stored in the block!');
      console.log('Car Renter: ', event.returnValues['carRenter']);
      console.log('Car Hash: ', event.returnValues['ipfsHash']);

    } else {
      console.log('Fail, not getting any event?');
    }

  } catch (err) {
    throw new EthereumExecutionError(err);
  }
};

exports.getUnrentedCar = getUnrentedCar;
exports.getContract = getContract;
exports.insertNewCar = insertNewCar;
exports.authorizeCar = authorizeCar;