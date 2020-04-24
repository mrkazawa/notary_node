const express = require('express');
const bodyParser = require('body-parser');

const os = require("os");
const HOSTNAME = os.hostname();
const HTTP_PORT = process.env.HTTP_PORT || 3002;

const CarRental = require('./build/contracts/CarRentalContract.json');
const NETWORK_ID = '2020';
const computeEngine = require('../../compute/ethereum_engine');

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
}, function (error, event) {
  if (error) console.log(error);
  console.log(event.returnValues['carOwner']);
  console.log(event.returnValues['ipfsHash']);
})