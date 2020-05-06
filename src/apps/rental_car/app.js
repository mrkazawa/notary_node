const express = require('express');
const bodyParser = require('body-parser');

const os = require("os");
const HOSTNAME = os.hostname();
const HTTP_PORT = process.env.HTTP_PORT || 3002;

const ethEvent = require('./processors/eth_event');
const coreEvent = require('./processors/core_event');
const iotaProcessor = require('./processors/iota_payment');
const carProcessor = require('./processors/car');

const { RESULT_DATA_PATH } = require('./config');
const tools = require('./tools');
tools.clearFIle(RESULT_DATA_PATH);

const app = express();
app.use(bodyParser.json());

// GET contract abi
app.get('/contract_abi', carProcessor.getContract);

// GET car info
app.get('/car_info', carProcessor.getUnrentedCar);

// POST app notification
app.post('/notification', coreEvent.processCoreEvent);

// POST tx hash payment
app.post('/tx_hash', iotaProcessor.processTxHash);

app.listen(HTTP_PORT, () => {
  console.log(`Hit me up on ${HOSTNAME}.local:${HTTP_PORT}`);
});

ethEvent.addNewRentalCarListener();