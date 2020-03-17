const express = require('express');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const log = console.log;

const Blockchain = require('./chains/blockchain_db');

const Validators = require('./utils/validators');
const Wallet = require('./utils/wallet');

const RequestPool = require('./pools/request_pool');
const TransactionPool = require('./pools/transaction_pool');
const BlockPool = require('./pools/block_pool'); // pre-prepare pool
const PBFTPool = require('./pools/pbft_pool');

const P2pServer = require('./p2p_server');
const Config = require('./config');
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
const preparePool = new PBFTPool();
const commitPool = new PBFTPool();

const p2pServer = new P2pServer(
  blockchain,
  transactionPool,
  wallet,
  blockPool,
  preparePool,
  commitPool,
  validators
);

var requestCount = 0;

app.get('/pending_requests', (req, res) => {
  res.json(requestPool.getAllPendingRequests());
});

app.get('/pending_transactions', (req, res) => {
  res.json(transactionPool.getAllPendingTransactions());
});

app.get('/latest_block', (req, res) => {
  res.json(blockchain.getLatestBlock());
});

app.get('/block_height', (req, res) => {
  res.json(blockchain.getBlockHeight());
});

app.get('/tx_count_per_block', (req, res) => {
  res.json(blockchain.getListNumberOfTxs());
});

// creates transactions for the sent data
app.post('/transact', (req, res) => {
  const { data } = req.body;
  
  requestCount++;
  const thresholdReached = requestPool.add(data);

  if (thresholdReached) {
    const tx_data = requestPool.getAllAndDelete();
    const transaction = wallet.createTransaction(tx_data);
    p2pServer.broadcastTransaction(transaction);
  }

  res.status(200).send('transaction_received');
});

app.get('/clear_block_pool', (req, res) => {
  blockPool.clear();
  res.status(200).send('block_pool_cleared');
});

app.get('/block_pool_size', (req, res) => {
  res.json(blockPool.getCurrentPendingSize());
});

function adjustReqeustThreshold() {
  if (requestCount > 500) {
    config.setRequestThreshold(500);
  } else if (requestCount > 250 && requestCount <= 500) {
    config.setRequestThreshold(250);
  } else if (requestCount > 100 && requestCount <= 250) {
    config.setRequestThreshold(100);
  } else if (requestCount > 50 && requestCount <= 100) {
    config.setRequestThreshold(50);
  } else if (requestCount <= 50) {
    config.setRequestThreshold(1);
  }

  requestCount = 0;
}

// starts request rate detection timers
if (config.isUsingDynamicRequestPool()) {
  setInterval(adjustReqeustThreshold, 1000);
}

// starts the app server
app.listen(HTTP_PORT, () => {
  log(chalk.blue(`Listening on requests on port : ${HTTP_PORT}`));
});

// starts the p2p server
p2pServer.listen();

setInterval(() => {
  log(chalk.yellow(`Request Pool Size : ${requestPool.getCurrentPendingSize()}`));
}, 2000);