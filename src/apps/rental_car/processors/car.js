const {
  performance
} = require('perf_hooks');

const storageEngine = require('../../../storage/ipfs_engine');
const tools = require('../tools');

const {
  APP_ID,
  TASK_ID,
  COMPUTE_NETWORK_ID,
  CORE_ENGINE_URL,
  CAR_RENTAL_CONTRACT,
  RESULT_DATA_PATH,
  isMasterNode
} = require('../config');

const {
  DatabaseInsertError,
  InvalidIpfsHashError,
  IpfsGetError
} = require('../errors');

const CarDB = require('../db/car_db');
const carDB = new CarDB();

const getUnrentedCar = function (req, res) {
  const unrentedCar = carDB.getOneUnrentedCar();
  res.status(200).send(JSON.stringify(unrentedCar));
};

const getContract = function (req, res) {
  res.status(200).send(JSON.stringify(CAR_RENTAL_CONTRACT));
}

const insertNewCar = async function (appRequest, start) {
  const ipfsHash = appRequest.storage_address;

  if (!carDB.checkIfCarExist(ipfsHash)) {
    if (!storageEngine.isValidIpfsHash(ipfsHash)) {
      throw new InvalidIpfsHashError(ipfsHash);
    }

    const car = await storageEngine.getJsonFromIpfsHash(ipfsHash);
    if (car instanceof Error) {
      throw new IpfsGetError(ipfsHash);
    }

    const info = carDB.insertNewCar(ipfsHash, car);
    if (info.changes <= 0) {
      throw new DatabaseInsertError(ipfsHash);
    }

    const end = performance.now();
    tools.savingResult('Getting App Update from Core Engine', RESULT_DATA_PATH, start, end);
    console.log(`car ${ipfsHash} is stored in database`);
  }
};

const authorizeCar = async function (appRequest, start) {
  // update tx hash to local database

  if (isMasterNode()) {
    console.log('Giving car access to renter..');
  }
};

exports.getUnrentedCar = getUnrentedCar;
exports.getContract = getContract;
exports.insertNewCar = insertNewCar;
exports.authorizeCar = authorizeCar;