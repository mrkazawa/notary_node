const express = require("express");
const bodyParser = require("body-parser");

const P2pServer = require("./p2p_server");
const Validators = require("./validators");
const Blockchain = require("./blockchain");
const Wallet = require("./wallet");

const RequestPool = require("./request_pool");
const TransactionPool = require("./transaction_pool");
const BlockPool = require("./block_pool"); // pre-prepare pool
const PreparePool = require("./prepare_pool");
const CommitPool = require("./commit_pool");
const RoundChangePool = require("./round_change_pool");

const { NUMBER_OF_NODES } = require("./config");
const HTTP_PORT = process.env.HTTP_PORT || 3001;

// Instantiate all objects
const app = express();
app.use(bodyParser.json());

// FIXME: Using other SECRET will not work only use NODE0, NODE1, and so on..
const wallet = new Wallet(process.env.SECRET);
// TODO: add proposer validator registraion procedure
const validators = new Validators(NUMBER_OF_NODES);
const blockchain = new Blockchain(validators);

const requestPool = new RequestPool();
const transactionPool = new TransactionPool();
const blockPool = new BlockPool();
const preparePool = new PreparePool();
const commitPool = new CommitPool();
const roundChangePool = new RoundChangePool();

const p2pServer = new P2pServer(
  blockchain,
  transactionPool,
  wallet,
  blockPool,
  preparePool,
  commitPool,
  roundChangePool,
  validators
);

// sends all requests in the request pool to the user
app.get("/requests", (req, res) => {
  res.json(requestPool.getAllPendingRequests());
});

// sends all transactions in the transaction pool to the user
app.get("/transactions", (req, res) => {
  res.json(transactionPool.getAllPendingTransactions());
});

// sends the entire chain to the user
app.get("/blocks", (req, res) => {
  res.json(blockchain.getAllBlocks());
});

// sends the current block height
app.get("/height", (req, res) => {
  res.json(blockchain.getBlockHeight());
});

// creates transactions for the sent data
app.post("/transact", (req, res) => {
  const { data } = req.body;
  const thresholdReached = requestPool.add(data);
  if (thresholdReached) {
    const tx_data = requestPool.getAllPendingRequests();
    const transaction = wallet.createTransaction(tx_data);
    p2pServer.broadcastTransaction(transaction);
  }
  res.status(200).send('transaction_received');
});

// starts the app server
app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});

// starts the p2p server
p2pServer.listen();