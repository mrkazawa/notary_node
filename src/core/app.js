const express = require('express');
const bodyParser = require('body-parser');
const os = require('os');
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
const MESSAGE_TYPE = config.MESSAGE_TYPE;

const HTTP_PORT = process.env.HTTP_PORT || 3001;

const app = express();
app.use(bodyParser.json());

// FIXME: Using other SECRET string will not work only use NODE0, NODE1, and so on..
const wallet = new Wallet(process.env.SECRET);
// TODO: add validator registration procedure
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

// starts the p2p server
p2pServer.listen();

//------------------ Express Methods ------------------//

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

app.get('/pools_size', (req, res) => {
  let poolSizes = [];

  poolSizes.push({
    requestPool: requestPool.getCurrentPendingSize()
  });
  poolSizes.push({
    transactionPool: transactionPool.getCurrentPendingSize()
  });
  poolSizes.push({
    blockPool: blockPool.getCurrentPendingSize()
  });
  poolSizes.push({
    preparePool: preparePool.getCurrentPendingSize()
  });
  poolSizes.push({
    commitPool: commitPool.getCurrentPendingSize()
  });
  poolSizes.push({
    preparePoolFinal: preparePool.getCurrentCompletedSize()
  });
  poolSizes.push({
    commitPoolFinal: commitPool.getCurrentCompletedSize()
  });

  res.json(poolSizes);
});

app.post('/transact', (req, res) => {
  const {
    data
  } = req.body;

  requestCount++;
  const thresholdReached = requestPool.add(data);

  if (thresholdReached) {
    const tx_data = requestPool.getAllPendingRequests();
    requestPool.clear();

    const transaction = wallet.createTransaction(tx_data);
    p2pServer.broadcast(MESSAGE_TYPE.transaction, transaction);
  }

  res.status(200).send('transaction_received');
});

// starts the express server
app.listen(HTTP_PORT, () => {
  log(chalk.blue(`Listening on requests on port : ${HTTP_PORT}`));
});

//------------------ Timer Methods ------------------//

let requestCount = 0;
let isOverload = false;

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

function isCurrentlyOverload() {
  const one_minute_avg_load = os.loadavg()[0];
  if (one_minute_avg_load > 1) {
    isOverload = true;
    console.log('SYSTEM IS OVERLOAD!!!');
  } else {
    isOverload = false;
  }
}

// starts request rate detection timers
if (config.isUsingDynamicRequestPool()) {
  setInterval(adjustReqeustThreshold, 1000);
}

// timer every 5 seconds to detect if the system overload
setInterval(isCurrentlyOverload, 5000);