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
  RESULT_DATA_PATH,
  isMasterNode
} = require('../config');

const DB = require('../db/sqlite_db');
const db = new DB();

const processCoreEvent = function (req, res) {
  console.log('Getting notification from Core Engine..');
  const start = performance.now();

  const block = req.body;
  const appRequests = tools.getAppRequestsFromBlock(block, APP_ID);

  if (appRequests.length > 0) {

    for (let appRequest of appRequests) {
      const taskId = appRequest.task_id;
      console.log(`Processing task id ${taskId}..`);

      if (taskId == TASK_ID.INSERT_NEW_CAR) {
        doInsertNewCarEvent(appRequest, start);

      } else if (taskId == TASK_ID.INSERT_PAYMENT_HASH) {
        doInsertPaymentHashEvent(appRequest, start);

      }
    }
  } else {
    return tools.logAndExit('Getting a block with no app request');
  }

  res.status(200).send('Notification received, not sure if the data is valid or not though');
};

const doInsertNewCarEvent = async function (appRequest, start) {
  const ipfsHash = appRequest.storage_address;

  if (!db.checkIfCarExist(ipfsHash)) {
    if (storageEngine.isValidIpfsHash(ipfsHash)) {

      const car = await storageEngine.getJsonFromIpfsHash(ipfsHash);
      if (car instanceof Error) {
        return tools.logAndExit(`Cannot getting ipfs content ${ipfsHash}`);
      }

      const info = db.insertNewCar(ipfsHash, car);

      if (info.changes > 0) {
        const end = performance.now();
        tools.savingResult('Getting App Update from Core Engine', RESULT_DATA_PATH, start, end);
        console.log(`car ${ipfsHash} is stored in database`);

      } else {
        return tools.logAndExit(`Cannot insert car ${ipfsHash} to database`);
      }

    } else {
      return tools.logAndExit(`Getting invalid ipfs hash: ${ipfsHash}`);
    }

  } else {
    return tools.logAndExit(`Not inserting, car ${ipfsHash} already exist`);
  }
};

const doInsertPaymentHashEvent = async function (appRequest, start) {
  // update tx hash to local database

  if (isMasterNode()) {
    console.log('Giving car access to renter..');


  } else {
    return tools.logAndExit(`this node is not a master`);
  }
};

exports.processCoreEvent = processCoreEvent;