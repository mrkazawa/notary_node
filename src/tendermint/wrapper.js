const express = require("express");
const bodyParser = require("body-parser");
const request = require('request');
const uuid = require("uuid");

const HTTP_PORT = 3000;

const app = express();
app.use(bodyParser.json());

app.post("/transactions", (req, res) => {
    const { data } = req.body;

    const payloadArray = [];
    payloadArray.push(data.app_id);
    payloadArray.push(data.task_id);
    payloadArray.push(data.process_id);
    payloadArray.push(data.storage_address);
    payloadArray.push(data.compute_address);
    payloadArray.push(data.compute_network_id);
    payloadArray.push(data.payment_proof);

    // sending a transaction to tendermint key-store app
    const URL = 'http://localhost:26657/broadcast_tx_commit?tx="' + uuid.v4() + '=' + payloadArray.join('_') + '"';

    request(URL, function (error, response, body) {
        if (response.statusCode == 200) {
            res.status(200).send('transaction_received');
        } else {
            res.status(500).send('tendermint_node_error');
        }
    });
});

// starts the app server
app.listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
});