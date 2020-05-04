const {
  performance
} = require('perf_hooks');

const storageEngine = require('../../../storage/ipfs_engine');
const tools = require('../tools');

const {
  DatabaseInsertError,
  InvalidIpfsHashError,
  IpfsGetError
} = require('../errors');

const {
  APP_ID,
  TASK_ID,
  RESULT_DATA_PATH,
  isMasterNode
} = require('../config');

const DB = require('../db/sqlite_db');
const db = new DB();

/**
 * Processing appliation notifications that is sent by the Core Engine.
 * The body of the request will contain the recently included block
 * in the Core Engine.
 * 
 * @param {object} req    The request object from Express
 * @param {object} res    The response object from Express
 */
const processCoreEvent = function (req, res) {
  // TODO: need to make sure that outsiders cannot send this request.
  // It only be done from localhost only.

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
  }

  res.status(200).send('Notification received, please check log to see any errors');
};

const doInsertNewCarEvent = async function (appRequest, start) {
  const ipfsHash = appRequest.storage_address;

  if (!db.checkIfCarExist(ipfsHash)) {
    if (storageEngine.isValidIpfsHash(ipfsHash)) {

      const car = await storageEngine.getJsonFromIpfsHash(ipfsHash);
      if (car instanceof Error) {
        throw new IpfsGetError(ipfsHash);
      }

      const info = db.insertNewCar(ipfsHash, car);

      if (info.changes > 0) {
        const end = performance.now();
        tools.savingResult('Getting App Update from Core Engine', RESULT_DATA_PATH, start, end);
        console.log(`car ${ipfsHash} is stored in database`);

      } else {
        throw new DatabaseInsertError(ipfsHash);
      }

    } else {
      throw new InvalidIpfsHashError(ipfsHash);
    }
  }
};

const doInsertPaymentHashEvent = async function (appRequest, start) {
  // update tx hash to local database

  if (isMasterNode()) {
    console.log('Giving car access to renter..');
  }
};

exports.processCoreEvent = processCoreEvent;