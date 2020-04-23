const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const os = require("os");
const HOSTNAME = os.hostname();

const HTTP_PORT = process.env.HTTP_PORT || 3002;

const CONTRACT_ABI_PATH = '/home/vagrant/src/compute/build/contracts/CarRentalContract.json';

const app = express();
app.use(bodyParser.json());

app.get('/contract_abi', (req, res) => {
  try {
    if (fs.existsSync(CONTRACT_ABI_PATH)) {
      const rawdata = fs.readFileSync(CONTRACT_ABI_PATH);
      const contractAbi = JSON.parse(rawdata);
      res.json(contractAbi);

    } else {
      res.status(500).send(`Cannot find ABI in ${CONTRACT_ABI_PATH}. \
      Possible reason: The notary node has not build the contract yet.`);
    }

  } catch(err) {
    res.status(500).send(`Some errors happen: ${err}`);
  }
});

app.listen(HTTP_PORT, () => {
  console.log(`Hit me up on ${HOSTNAME}.local:${HTTP_PORT}`);
});