const express = require('express');
const bodyParser = require('body-parser');

const os = require("os");
const HOSTNAME = os.hostname();
const HTTP_PORT = process.env.HTTP_PORT || 3002;

const Database = require('better-sqlite3');
const db = new Database('rental-car.db');
createTable();
clearTable(); // for demo, we always start with clean state

// compute params
const CarRental = require('./build/contracts/CarRentalContract.json');
const NETWORK_ID = '2020';
const computeEngine = require('../../compute/ethereum_engine');

// storage params
const storageEngine = require('../../storage/ipfs_engine');

const app = express();
app.use(bodyParser.json());

//----------------------------- Express Methods -----------------------------//

app.get('/contract_abi', (req, res) => {
  res.json(CarRental);
});

app.listen(HTTP_PORT, () => {
  console.log(`Hit me up on ${HOSTNAME}.local:${HTTP_PORT}`);
});

//----------------------------- Other Methods -----------------------------//

const carRental = computeEngine.constructSmartContract(CarRental.abi, CarRental.networks[NETWORK_ID].address);

carRental.events.NewRentalCarAdded({
  fromBlock: 0
}, async function (error, event) {
  if (error) console.log(error);

  const bytes32Hash = event.returnValues['ipfsHash'];
  const ipfsHash = computeEngine.getIpfsHashFromBytes32(bytes32Hash);

  if (storageEngine.isValidIpfsHash(ipfsHash)) {
    const car = await storageEngine.getJsonFromIpfsHash(ipfsHash);
    const carOwner = event.returnValues['carOwner'];

    const sql = `INSERT INTO rental_cars \
      (hash, owner, fee_amount, fee_address, fee_tag, is_rented) \
      VALUES \
      ('${ipfsHash}', '${carOwner}', '${car.paymentFee}', '${car.paymentAddress}', '${car.paymentTag}', 0)
    `;
    const info = db.prepare(sql).run();

    if (info.changes > 0) {
      console.log(`${ipfsHash} is stored in SQLite database`);
    } else {
      console.log('ERROR! cannot insert to SQLite database');
    }

  } else {
    console.log('ERROR! IPFS hash is invalid');
  }
});

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