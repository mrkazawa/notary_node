const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const rp = require('request-promise-native');
const uuidV1 = require('uuid/v1');
const {
  performance
} = require('perf_hooks');
const fs = require('fs');

const os = require("os");
const HOSTNAME = os.hostname();
const HTTP_PORT = process.env.HTTP_PORT || 3002;

const Database = require('better-sqlite3');
const db = new Database('rental-car.db');
createTable();
clearTable(); // for demo, we always start with clean state

// app params
const TASK_ID = {
  insert_new_car: 1,
  insert_payment_hash: 2
};
const APP_ID = 1234;

const storageEngine = require('../../storage/ipfs_engine');
const computeEngine = require('../../compute/ethereum_engine');
const paymentEngine = require('../../payment/iota_engine');
const tools = require('./tools');

// compute params
const CarRental = require('./build/contracts/CarRentalContract.json');
const NETWORK_ID = '2020';

// core params
const CORE_ENGINE_URL = `http://127.0.0.1:3000/transact`;

// performance params
const RESULT_DATA_PATH = '/home/vagrant/result_rental_car.csv';
fs.writeFileSync(RESULT_DATA_PATH, ""); // clear file

const app = express();
app.use(bodyParser.json());

//----------------------------- Express Methods -----------------------------//

app.get('/contract_abi', (req, res) => {
  res.json(CarRental);
});

app.get('/car_info', (req, res) => {
  res.json(getOneUnrentedCar());
});

app.post('/notification', async (req, res) => {
  const startGetAppUpdateCheckpoint = performance.now();

  const block = req.body;
  const appRequests = getAppRequestsFromBlock(block);

  if (appRequests.length > 0) {

    for (let appRequest of appRequests) {
      const ipfsHash = appRequest.storage_address;

      if (!checkIfCarExist(ipfsHash)) {
        if (storageEngine.isValidIpfsHash(ipfsHash)) {
          const car = await storageEngine.getJsonFromIpfsHash(ipfsHash);
          const info = insertNewCar(ipfsHash, car);

          if (info.changes > 0) {
            console.log(`${ipfsHash} is stored in SQLite database`);

            const endGetAppUpdateCheckpoint = performance.now();
            savingResult('Getting App Update from Core', startGetAppUpdateCheckpoint, endGetAppUpdateCheckpoint);

          } else {
            console.log('ERROR! cannot insert to SQLite database');
          }

        } else {
          console.log('ERROR! IPFS hash is invalid');
        }

      } else {
        console.log('No insert, hash already exist');
      }
    }
  }

  res.status(200).send('notification received!');
});

/**
 * Endpoint for submitting Tx hash.
 * 
 * Accepting body of JSON, e.g.
 * 
 * {
 *    car_hash: 'ipfs hash of the car that want to be rented',
 *    payment_hash: 'the tail tx hash as proof of payment from iota',
 *    renter_address: 'the eth address of the car renter'
 * }
 */
app.post('/tx_hash', async (req, res) => {
  console.log('Getting the Tx hash from car renter..');
  const start = performance.now();

  const renter = req.body;
  const carHash = renter.car_hash;
  const paymentHash = renter.payment_hash;
  const renterAddress = renter.renter_address;

  const car = getCarByHash(carHash);
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
          task_id: TASK_ID.insert_payment_hash,
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

const contractAbi = CarRental.abi;
const contractAddress = CarRental.networks[NETWORK_ID].address;
const carRental = computeEngine.constructSmartContract(contractAbi, contractAddress);

carRental.events.NewRentalCarAdded({
  fromBlock: 0
}, async function (error, event) {
  if (error) console.log(error);

  const startGetEventCheckpoint = performance.now();

  const bytes32Hash = event.returnValues['ipfsHash'];
  const ipfsHash = computeEngine.getIpfsHashFromBytes32(bytes32Hash);

  if (storageEngine.isValidIpfsHash(ipfsHash)) {
    const carOwner = event.returnValues['carOwner'];
    const car = await storageEngine.getJsonFromIpfsHash(ipfsHash);

    if (carOwner == car.owner) {
      const info = insertNewCar(ipfsHash, car);

      if (info.changes > 0) {
        console.log(`${ipfsHash} is stored in SQLite database`);

        const endGetEventCheckpoint = performance.now();
        const startPostCoreCheckpoint = performance.now();

        // TODO: If there are two notary nodes connected to the same compute engine with the same NETWORK ID
        // (no parallelism), then how to choose which node should post info to the core engine
        const body = {
          data: {
            app_id: APP_ID,
            task_id: TASK_ID.insert_new_car,
            process_id: uuidV1(),
            storage_address: ipfsHash,
            compute_address: contractAddress,
            compute_network_id: NETWORK_ID,
            payment_proof: '',
            other: '',
            priority_id: 3,
            timestamp: Date.now()
          }
        };

        const options = {
          method: 'POST',
          uri: CORE_ENGINE_URL,
          body: body,
          resolveWithFullResponse: true,
          json: true
        };

        rp(options).then(async function (response) {
          if (response.statusCode == 200) {
            console.log("Stored in core engine...");

            const endPostCoreCheckpoint = performance.now();
            savingResult('Getting Event from ETH', startGetEventCheckpoint, endGetEventCheckpoint);
            savingResult('Post Car to Core Engine', startPostCoreCheckpoint, endPostCoreCheckpoint);
          }

        }).catch(function (err) {
          console.log(`Error when sending to Core Engine: ${err}`);
        });

      } else {
        console.log('ERROR! cannot insert to SQLite database');
      }

    } else {
      console.log('ERROR! car owner data mismatched');
    }

  } else {
    console.log('ERROR! IPFS hash is invalid');
  }
});

//----------------------------- SQL Queries -----------------------------//

function clearTable() {
  const sql = 'DELETE FROM rental_cars';
  db.prepare(sql).run();
}

function createTable() {
  const sql = ' \
    CREATE TABLE IF NOT EXISTS rental_cars ( \
      hash TEXT PRIMARY KEY, \
      owner TEXT NOT NULL, \
      fee_amount INTEGER NOT NULL, \
      fee_address TEXT NOT NULL, \
      fee_tag TEXT NOT NULL, \
      is_rented INTEGER NOT NULL, \
      renter TEXT \
    );';

  db.prepare(sql).run();
}

function checkIfCarExist(ipfsHash) {
  const sql = `SELECT hash FROM rental_cars \
    WHERE hash = '${ipfsHash}'`;
  rows = db.prepare(sql).all();

  return (rows.length == 1);
}

function insertNewCar(ipfsHash, car) {
  const sql = `INSERT INTO rental_cars \
    (hash, owner, fee_amount, fee_address, fee_tag, is_rented) \
    VALUES \
    ('${ipfsHash}', '${car.owner}', '${car.paymentFee}', '${car.paymentAddress}', '${car.paymentTag}', 0)
  `;
  return db.prepare(sql).run();
}

function getOneUnrentedCar() {
  const sql = `SELECT * FROM rental_cars \
    WHERE is_rented = 0 \
    LIMIT 1`;
  return db.prepare(sql).get();
}

function getCarByHash(ipfsHash) {
  const sql = `SELECT * FROM rental_cars \
    WHERE hash = '${ipfsHash}'`;
  return db.prepare(sql).get();
}

/**
 * Parse core engine block object to get the application data.
 * It go deep to the object and extract only data related to this
 * application by comparing the app_id.
 * It returns array of object for this application.
 * 
 * @param {object} block  The block from core engine
 */
function getAppRequestsFromBlock(block) {
  let appRequests = [];
  const txs = block.data;

  for (let j = 0; j < txs.length; j++) {
    const tx = txs[j][1];
    const requests = tx.input.data;

    for (let k = 0; k < requests.length; k++) {
      let request = requests[k][1];

      if (request.app_id == APP_ID) {
        appRequests.push(request);
      }
    }
  }

  return appRequests;
}

/**
 * Appending delta of performance.now() checkpoint to file.
 * 
 * @param {string} scenario   The scenario description of this delta
 * @param {number} start      The start point of performance.now()
 * @param {number} end        The end point of performance.now()
 */
function savingResult(scenario, start, end) {
  const delta = end - start;
  const row = scenario + "," +
    delta + "," +
    "\r\n";
  fs.appendFileSync(RESULT_DATA_PATH, row);
}