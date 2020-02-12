const express = require("express");
const bodyParser = require("body-parser");
const chalk = require('chalk');
const log = console.log;

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

const Config = require("./config");
const config = new Config();
const HTTP_PORT = process.env.HTTP_PORT || 3001;

// Instantiate all objects
const app = express();
app.use(bodyParser.json());

// FIXME: Using other SECRET will not work only use NODE0, NODE1, and so on..
const wallet = new Wallet(process.env.SECRET);
// TODO: add proposer validator registraion procedure
const validators = new Validators(config.getNumberOfNodes());
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

var generalRequestsCount = 0;
var priorityRequestsCount = 0;

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

app.get("/tx_count_per_block", (req, res) => {
  let results = [];
  let totalTx = 0;
  let storedBlocks = blockchain.getAllBlocks();
  let i;

  for (i = 1; i < storedBlocks.length; i++) {
    let storedBlock = storedBlocks[i];
    let txs = storedBlock.data;
    let number_of_tx = 0;
    let j;

    for (j = 0; j < txs.length; j++) {
      let tx = txs[j][1];
      let requests = tx.input.data;
      number_of_tx += requests.length;
    }

    totalTx += number_of_tx;
    results.push(number_of_tx);
  }
  results.push(totalTx);

  res.json(results);
});

// creates transactions for the sent data
app.post("/transact", (req, res) => {
  const { data } = req.body;
  if (data.priority) {
    priorityRequestsCount++;
  } else {
    generalRequestsCount++;
  }
  
  const thresholdReached = requestPool.add(data);

  if (thresholdReached) {
    const tx_data = requestPool.getAllAndDelete();
    const transaction = wallet.createTransaction(tx_data);
    p2pServer.broadcastTransaction(transaction);
  }

  res.status(200).send('transaction_received');
});

function adjustGeneralReqeustThreshold() {
  if (generalRequestsCount > 500) {
    config.setRequestThreshold(500);
  } else if (generalRequestsCount > 250 && generalRequestsCount <= 500) {
    config.setRequestThreshold(250);
  } else if (generalRequestsCount > 100 && generalRequestsCount <= 250) {
    config.setRequestThreshold(100);
  } else if (generalRequestsCount > 50 && generalRequestsCount <= 100) {
    config.setRequestThreshold(50);
  } else if (generalRequestsCount <= 50) {
    config.setRequestThreshold(1);
  }

  generalRequestsCount = 0;
}

// starts request rate detection timers
setInterval(adjustGeneralReqeustThreshold, 1000);

// starts the app server
app.listen(HTTP_PORT, () => {
  log(chalk.blue(`Listening on requests on port : ${HTTP_PORT}`));
});

// starts the p2p server
p2pServer.listen();