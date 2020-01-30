// Import all required modeles
const express = require("express");
const bodyParser = require("body-parser");

const Wallet = require("./wallet");
const TransactionPool = require("./transaction_pool");
const Validator = require("./validator");
const { NUMBER_OF_NODES } = require("./config");
const P2pServer = require("./p2p_server");

const HTTP_PORT = process.env.HTTP_PORT || 3001;


// Instantiate all objects
const app = express();
app.use(bodyParser.json());

// FIXME: Using other SECRET will not work only use NODE0, NODE1, and so on..
const wallet = new Wallet(process.env.SECRET);
const transactionPool = new TransactionPool();
// TODO: add proposer validator registraion procedure
const validators = new Validator(NUMBER_OF_NODES);
const p2pServer = new P2pServer(
  transactionPool,
  wallet,
  validators
);

// sends all transactions in the transaction pool to the user
app.get("/transactions", (req, res) => {
  res.json(transactionPool.getAllPendingTransactions());
});

// creates transactions for the sent data
app.post("/transact", (req, res) => {
  const { data } = req.body;
  const transaction = wallet.createTransaction(data);
  p2pServer.broadcastTransaction(transaction);

  res.status(200).send('transaction_received');
});

// starts the app server
app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});

// starts the p2p server
p2pServer.listen();
