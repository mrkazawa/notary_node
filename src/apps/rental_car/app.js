const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const uuidV1 = require('uuid/v1');
const {
  performance
} = require('perf_hooks');

const os = require("os");
const HOSTNAME = os.hostname();
const HTTP_PORT = process.env.HTTP_PORT || 3002;

const DB = require('./sqlite_db');
const db = new DB();

const storageEngine = require('../../storage/ipfs_engine');
const computeEngine = require('../../compute/ethereum_engine');
const paymentEngine = require('../../payment/iota_engine');
const tools = require('./tools');

// app params
const TASK_ID = {
  INSERT_NEW_CAR: 1,
  INSERT_PAYMENT_HASH: 2
};
const APP_ID = 1234;

// compute params
const CAR_RENTAL = require('./build/contracts/CarRentalContract.json');
const NETWORK_ID = '2020';

// core params
const CORE_ENGINE_URL = `http://127.0.0.1:3000/transact`;

// performance params
const RESULT_DATA_PATH = '/home/vagrant/result_rental_car.csv';
tools.clearFIle(RESULT_DATA_PATH);

const app = express();
app.use(bodyParser.json());

//----------------------------- Express Methods -----------------------------//

app.get('/contract_abi', (req, res) => {
  res.json(CAR_RENTAL);
});

app.get('/car_info', (req, res) => {
  res.json(db.getOneUnrentedCar());
});

/**
 * Endpoint for submitting app notification.
 * 
 * @param {object} block    The block object from Core Engine
 */
app.post('/notification', async (req, res) => {
  console.log('Getting notification from Core Engine..');
  const start = performance.now();

  const block = req.body;
  const appRequests = tools.getAppRequestsFromBlock(block, APP_ID);

  if (appRequests.length > 0) {

    for (let appRequest of appRequests) {
      const taskId = appRequest.task_id;
      console.log(`Processing task id ${taskId}..`);

      if (taskId == TASK_ID.INSERT_NEW_CAR) {
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

      } else if (taskId == TASK_ID.INSERT_PAYMENT_HASH) {

      }
    }

  } else {
    return tools.logAndExit('Getting a block with no app request');
  }

  res.status(200).send('Notification received, not sure if the data is valid or not though');
});

/**
 * Endpoint for submitting Tx hash.
 * Expect to get a JSON file with these parameters
 * 
 * @param {string} car_hash         The ipfs hash of the car that want to be rented
 * @param {string} payment_hash     The tail tx hash as proof of payment from iota
 * @param {string} renter_address   The eth address of the car renter
 */
app.post('/tx_hash', async (req, res) => {
  console.log('Getting the Tx hash from car renter..');
  const start = performance.now();

  const renter = req.body;
  const carHash = renter.car_hash;
  const paymentHash = renter.payment_hash;
  const renterAddress = renter.renter_address;

  const car = db.getCarByHash(carHash);
  const confirmed = await paymentEngine.isTxVerified(paymentHash);
  if (confirmed instanceof Error) {
    sendError(res, 500, `Oops error happen ${confirmed}`);
  }

  if (confirmed) {
    const paymentInfo = await paymentEngine.getPaymentInfo(paymentHash);
    if (paymentInfo instanceof Error) {
      sendError(res, 500, `Oops error happen ${paymentInfo}`);
    }

    const carFeeAddressWithoutChecksum = car.fee_address.slice(0, -9);
    if (
      carFeeAddressWithoutChecksum == paymentInfo[0] &&
      car.fee_amount == paymentInfo[1] &&
      car.fee_tag == paymentInfo[2]
    ) {

      const payload = {
        data: {
          app_id: APP_ID,
          task_id: TASK_ID.INSERT_PAYMENT_HASH,
          process_id: uuidV1(),
          payment_proof: paymentHash,
          renter_address: renterAddress,
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
        sendError(res, 500, `Error sending to Core Engine ${response}`);
      }

      const end = performance.now();
      tools.savingResult('Post Car Payment to Core Engine', RESULT_DATA_PATH, start, end);
      console.log('Tx hash stored in Core Engine');

      res.status(200).send('Tx hash received!');

    } else {
      sendError(res, 400, 'Tx hash does not match the car information');
    }

  } else {
    sendError(res, 400, 'Payment hash has not been verified yet');
  }
});

app.listen(HTTP_PORT, () => {
  console.log(`Hit me up on ${HOSTNAME}.local:${HTTP_PORT}`);
});

function sendError(res, status, messages) {
  console.log(messages);
  res.status(status).send(messages);
}

//----------------------------- Other Methods -----------------------------//

const contractAbi = CAR_RENTAL.abi;
const contractAddress = CAR_RENTAL.networks[NETWORK_ID].address;
const carRental = computeEngine.constructSmartContract(contractAbi, contractAddress);

/**
 * Processing event NewRentalCarAdded from eth engine.
 * Expect to get event with these parameters
 * 
 * @param {string} ipfsHash   The ipfs hash in bytes32 form
 * @param {string} carPwner   The eth address of the car owner
 */
carRental.events.NewRentalCarAdded({
  fromBlock: 0
}, async function (error, event) {
  if (error) console.log(error);

  console.log('Getting eth event and store to Core Engine..');
  const start = performance.now();

  const bytes32Hash = event.returnValues['ipfsHash'];
  const carOwner = event.returnValues['carOwner'];

  const ipfsHash = computeEngine.convertBytes32ToIpfsHash(bytes32Hash);

  if (storageEngine.isValidIpfsHash(ipfsHash)) {
    const car = await storageEngine.getJsonFromIpfsHash(ipfsHash);
    if (car instanceof Error) {
      return tools.logAndExit(`Getting invalid IPFS hash: ${ipfsHash}`);
    }

    if (carOwner == car.owner) {
      const info = db.insertNewCar(ipfsHash, car);

      if (info.changes > 0) {
        // TODO: If there are two notary nodes connected to the same compute engine with the same NETWORK ID
        // (no parallelism), both of them will get events.
        // Then how to choose which node should post info to the core engine
        const payload = {
          data: {
            app_id: APP_ID,
            task_id: TASK_ID.INSERT_NEW_CAR,
            process_id: uuidV1(),
            storage_address: ipfsHash,
            compute_address: contractAddress,
            compute_network_id: NETWORK_ID,
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
        return tools.logAndExit(`Cannot insert car ${ipfsHash} to database`);
      }

    } else {
      return tools.logAndExit(`Getting mismatch car owner: ${carOwner} with ${car.owner}`);
    }

  } else {
    return tools.logAndExit(`Getting invalid IPFS hash: ${ipfsHash}`);
  }
});