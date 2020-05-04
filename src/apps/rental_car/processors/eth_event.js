const http = require('http');
const {
  performance
} = require('perf_hooks');
const uuidV1 = require('uuid/v1');

const storageEngine = require('../../../storage/ipfs_engine');
const computeEngine = require('../../../compute/ethereum_engine');
const tools = require('../tools');

const {
  APP_ID,
  TASK_ID,
  COMPUTE_NETWORK_ID,
  CORE_ENGINE_URL,
  RESULT_DATA_PATH,
  isMasterNode
} = require('../config');

const DB = require('../db/sqlite_db');
const db = new DB();

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

  if (storageEngine.isValidIpfsHash(ipfsHash)) {
    const car = await storageEngine.getJsonFromIpfsHash(ipfsHash);
    if (car instanceof Error) {
      return tools.logAndExit(`Getting invalid IPFS hash: ${ipfsHash}`);
    }

    if (carOwner == car.owner) {
      const info = db.insertNewCar(ipfsHash, car);

      if (info.changes > 0) {
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
            return tools.logAndExit(`Cannot send ${ipfsHash} to Core Engine`);
          }

          const end = performance.now();
          tools.savingResult('Getting event from ETH and posting Car to Core Engine', RESULT_DATA_PATH, start, end);
          console.log(`${ipfsHash} sent to Core Engine`);

        } else {
          return tools.logAndExit(`This node is not a master`);
        }

      } else {
        return tools.logAndExit(`Cannot insert car ${ipfsHash} to database`);
      }

    } else {
      return tools.logAndExit(`Getting mismatch car owner: ${carOwner} with ${car.owner}`);
    }

  } else {
    return tools.logAndExit(`Getting invalid IPFS hash: ${ipfsHash}`);
  }
}

exports.doNewRentalCarEvent = doNewRentalCarEvent;