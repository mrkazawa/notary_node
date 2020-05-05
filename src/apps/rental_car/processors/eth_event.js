const http = require('http');
const {
  performance
} = require('perf_hooks');
const uuidV1 = require('uuid/v1');

const storageEngine = require('../../../storage/ipfs_engine');
const computeEngine = require('../../../compute/ethereum_engine');
const tools = require('../tools');

const {
  CoreEngineSendError,
  DatabaseInsertError,
  CarOwnerMismatchedError,
  InvalidIpfsHashError,
  IpfsGetError
} = require('../errors');

const {
  APP_ID,
  TASK_ID,
  COMPUTE_NETWORK_ID,
  CORE_ENGINE_URL,
  CAR_RENTAL_CONTRACT,
  RESULT_DATA_PATH,
  isMasterNode
} = require('../config');

const CarDB = require('../db/car_db');
const carDB = new CarDB();

const contractAbi = CAR_RENTAL_CONTRACT.abi;
const contractAddress = CAR_RENTAL_CONTRACT.networks[COMPUTE_NETWORK_ID].address;
const carRental = computeEngine.constructSmartContract(contractAbi, contractAddress);

const addNewRentalCarListener = function () {
  carRental.events.NewRentalCarAdded({
    fromBlock: 0
  }, function (error, event) {
    if (error) console.log(error);

    const bytes32Hash = event.returnValues['ipfsHash'];
    const carOwner = event.returnValues['carOwner'];

    doNewRentalCarEvent(bytes32Hash, carOwner, contractAddress);
  });
}

/**
 * Processing event NewRentalCarAdded from eth engine.
 * 
 * @param {string} bytes32Hash        The ipfs hash in bytes32 form
 * @param {string} carPwner           The eth address of the car owner
 * @param {string} contractAddress    The contract address of the rental car app
 */
const doNewRentalCarEvent = async function (bytes32Hash, carOwner, contractAddress) {
  console.log('Getting eth event and store to Core Engine..');
  const start = performance.now();

  const ipfsHash = computeEngine.convertBytes32ToIpfsHash(bytes32Hash);

  if (!storageEngine.isValidIpfsHash(ipfsHash)) {
    throw new InvalidIpfsHashError(ipfsHash);
  }

  const car = await storageEngine.getJsonFromIpfsHash(ipfsHash);
  if (car instanceof Error) {
    throw new IpfsGetError(ipfsHash);
  }

  if (carOwner != car.owner) {
    throw new CarOwnerMismatchedError(car.owner, carOwner);
  }

  const info = carDB.insertNewCar(ipfsHash, car);
  if (info.changes <= 0) {
    throw new DatabaseInsertError(ipfsHash);
  }

  if (isMasterNode()) {
    const payload = {
      data: {
        app_id: APP_ID,
        task_id: TASK_ID.INSERT_NEW_CAR,
        process_id: uuidV1(),
        storage_address: ipfsHash,
        compute_address: contractAddress,
        compute_network_id: COMPUTE_NETWORK_ID,
        priority_id: 3,
        timestamp: Date.now()
      }
    };

    const options = {
      method: 'post',
      url: CORE_ENGINE_URL,
      data: payload,
      httpAgent: new http.Agent({
        keepAlive: false
      })
    };

    const response = await tools.sendRequest(options);
    if (response instanceof Error) {
      throw new CoreEngineSendError(ipfsHash);
    }

    const end = performance.now();
    tools.savingResult('Getting event from ETH and posting Car to Core Engine', RESULT_DATA_PATH, start, end);
    console.log(`${ipfsHash} sent to Core Engine`);
  }
};

exports.addNewRentalCarListener = addNewRentalCarListener;