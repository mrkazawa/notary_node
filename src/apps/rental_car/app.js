const express = require('express');
const bodyParser = require('body-parser');

const os = require("os");
const HOSTNAME = os.hostname();
const HTTP_PORT = process.env.HTTP_PORT || 3002;

const ethProcessor = require('./processors/compute');
const coreProcessor = require('./processors/core');
const paymentProcessor = require('./processors/payment');
const carProcessor = require('./processors/car');

const { RESULT_DATA_PATH } = require('./config');
const tools = require('./tools');
tools.clearFIle(RESULT_DATA_PATH);

const app = express();
app.use(bodyParser.json());

//----------------------------- Express Methods -----------------------------//

// GET contract abi
app.get('/contract_abi', ethProcessor.getContract);

// GET car info
app.get('/car_info', carProcessor.getUnrentedCar);

// POST app notification
app.post('/notification', coreProcessor.processCoreEvent);

// POST tx hash payment
app.post('/tx_hash', paymentProcessor.processTxHash);

app.listen(HTTP_PORT, () => {
  console.log(`Hit me up on ${HOSTNAME}.local:${HTTP_PORT}`);
});

//----------------------------- Other Methods -----------------------------//

ethProcessor.addNewRentalCarListener();