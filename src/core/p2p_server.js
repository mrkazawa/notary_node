const WebSocket = require('ws');
const HashMap = require('hashmap');
const NodeCache = require('node-cache');
const chalk = require('chalk');
const log = console.log;

const Config = require('./config');
const config = new Config();
const MESSAGE_TYPE = config.MESSAGE_TYPE;

const P2P_PORT = process.env.P2P_PORT || 5001;
const PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];

// default TTL (Time-To-Live) in seconds
// when it expires, the entry will be deleted
const DEFAULT_TTL = 25;

// check interval to check for TTL in seconds
// shorter duration is better,
// longer duration cause the system to take time to delete entries
const CHECK_PERIOD = 10;

class P2pServer {
  constructor(
    blockchain,
    transactionPool,
    wallet,
    blockPool,
    preparePool,
    commitPool,
    validators
  ) {
    if (P2pServer._instance) {
      throw new Error('P2pServer already has an instance!!!');
    }
    P2pServer._instance = this;

    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.blockPool = blockPool;
    this.preparePool = preparePool;
    this.commitPool = commitPool;
    this.validators = validators;

    this.sockets = [];

    // store pending out of order commits
    this.pendingCommitedBlocks = new NodeCache({
      stdTTL: DEFAULT_TTL,
      checkperiod: CHECK_PERIOD
    });

    if (config.isDebugging()) {
      this.pendingCommitedBlocks.on("expired", function (key, value) {
        log(chalk.bgGreen.black(`NEW EVENT: ${key} expired from PBFT Pool`));
      });
    }
  }

  // TODO: Implement detect and restore broken connection scenario
  listen() {
    const server = new WebSocket.Server({
      port: P2P_PORT,
      perMessageDeflate: false
    });
    server.on('connection', socket => {
      this.connectSocket(socket);
    });
    this.connectToPeers();
    log(chalk.blue(`Listening for peer to peer connection on port : ${P2P_PORT}`));

    // timer for proposing a block
    setInterval(this.proposeBlock.bind(this), config.getBlockInterval());
  }

  connectSocket(socket) {
    this.sockets.push(socket);
    log(chalk.blue('Socket connected'));
    this.messageHandler(socket);
  }

  // connects to the peers passed in command line
  connectToPeers() {
    PEERS.forEach(peer => {
      const socket = new WebSocket(peer, {
        perMessageDeflate: false
      });
      socket.on('open', () => this.connectSocket(socket));
    });
  }

  broadcast(type, payload) {
    this.sockets.forEach(socket => {
      this.sendPayload(socket, type, payload);
    });
  }

  sendPayload(socket, type, payload) {
    socket.send(
      JSON.stringify({
        type: type,
        payload: payload
      })
    );
  }

  //-------------------------- Receive Handlers --------------------------//

  messageHandler(socket) {
    socket.on('message', message => {
      const data = JSON.parse(message);

      switch (data.type) {
        //------------------ Transaction Process ------------------//

        case MESSAGE_TYPE.transaction: {
          const transaction = data.payload;

          if (config.isDebugging()) {
            log(chalk.cyan(`Receiving Transaction ${transaction.id}`));
          }

          if (!this.validators.isValidValidator(transaction.from)) break;
          if (this.transactionPool.isExist(transaction)) break;
          if (!this.transactionPool.isValidTransaction(transaction)) break;

          this.broadcast(MESSAGE_TYPE.transaction, transaction);
          this.transactionPool.add(transaction);

          break;
        }

        //------------------ PBFT Process (Pre-Prepare) ------------------//

        case MESSAGE_TYPE.pre_prepare: {
          const block = data.payload;

          if (config.isDebugging()) {
            log(chalk.yellow(`Receiving Block ${block.hash}`));
          }

          if (!this.validators.isValidValidator(block.proposer)) break;
          if (this.blockPool.isExist(block.hash)) break;
          if (!this.blockPool.isValidBlock(block)) break;

          this.broadcast(MESSAGE_TYPE.pre_prepare, block);
          this.blockPool.add(block);

          if (
            !this.preparePool.isInitiated(block.hash) &&
            !this.preparePool.isCompleted(block.hash)
          ) {
            const prepare = this.preparePool.init(
              block.hash,
              block.sequenceId,
              this.wallet
            );
            this.broadcast(MESSAGE_TYPE.prepare, prepare);
          }

          break;
        }

        //------------------ PBFT Process (Prepare) ------------------//

        case MESSAGE_TYPE.prepare: {
          const prepare = data.payload;

          if (config.isDebugging()) {
            log(chalk.yellow(`Receiving Prepare ${prepare.blockHash}`));
          }

          if (!this.validators.isValidValidator(prepare.from)) break;
          if (!this.preparePool.isInitiated(prepare.blockHash)) break;
          if (this.preparePool.isCompleted(prepare.blockHash)) break;
          if (this.preparePool.isExistFrom(prepare.blockHash, prepare.from)) break;
          if (!this.preparePool.isValid(prepare)) break;

          this.broadcast(MESSAGE_TYPE.prepare, prepare);

          const thresholdReached = this.preparePool.add(prepare);
          if (thresholdReached) {
            this.preparePool.finalize(prepare.blockHash);

            if (
              !this.commitPool.isInitiated(prepare.blockHash) &&
              !this.commitPool.isCompleted(prepare.blockHash)
            ) {
              const commit = this.commitPool.init(
                prepare.blockHash,
                prepare.sequenceId,
                this.wallet
              );
              this.broadcast(MESSAGE_TYPE.commit, commit);
            }
          }

          break;
        }

        //------------------ PBFT Process (Commit) ------------------//

        case MESSAGE_TYPE.commit: {
          const commit = data.payload;

          if (config.isDebugging()) {
            log(chalk.yellow(`Receiving Commit ${commit.blockHash}`));
          }

          if (!this.validators.isValidValidator(commit.from)) break;
          if (!this.commitPool.isInitiated(commit.blockHash)) break;
          if (this.commitPool.isCompleted(commit.blockHash)) break;
          if (this.commitPool.isExistFrom(commit.blockHash, commit.from)) break;
          if (!this.commitPool.isValid(commit)) break;

          this.broadcast(MESSAGE_TYPE.commit, commit);

          const thresholdReached = this.commitPool.add(commit);
          if (thresholdReached) {
            this.commitPool.finalize(commit.blockHash);
            const block = this.blockPool.get(commit.blockHash);
            if (block == undefined) break;

            this.blockchain.addBlockToBlockhain(block).then(isAdded => {
              if (isAdded) {
                this.deleteAlreadyIncludedPBFTMessages(block.hash);
                this.deleteAlreadyIncludedTransactions(block);

              } else {
                this.pendingCommitedBlocks.set(block.sequenceId, block.hash);
              }
            });
          }

          break;
        }
      }
    });
  }

  deleteAlreadyIncludedPBFTMessages(blockHash) {
    this.blockPool.delete(blockHash);
    this.preparePool.delete(blockHash);
    this.commitPool.delete(blockHash);
  }

  deleteAlreadyIncludedTransactions(block) {
    for (let i = 0; i < block.data.length; i++) {
      this.transactionPool.delete(block.data[i][0]);
    }
  }

  proposeBlock() {
    // if it is our first time, create the genesis
    if (this.blockchain.getBlockHeight() == 0) {
      this.blockchain.addGenesisBlock();

    } else {
      // if we have pending commits because of out of order delivery, complete it first
      if (this.pendingCommitedBlocks.getStats().keys > 0) {
        const keys = this.pendingCommitedBlocks.keys();
        keys.sort(); // begin inserting from the lowest sequence id

        for (let i = 0; i < keys.length; i++) {
          const sequenceId = keys[i];
          const blockHash = this.pendingCommitedBlocks.get(sequenceId);
          if (blockHash == undefined) break;
          const block = this.blockPool.get(blockHash);
          if (block == undefined) break;

          this.blockchain.addBlockToBlockhain(block).then(isAdded => {
            if (isAdded) {
              this.deleteAlreadyIncludedPBFTMessages(block.hash);
              this.deleteAlreadyIncludedTransactions(block);
              this.pendingCommitedBlocks.del(sequenceId);
            }
          });
        }
      }

      // if it is our turn to create a block, we propose it
      if (this.blockchain.getCurrentProposer() == this.wallet.getPublicKey()) {
        const transactions = this.transactionPool.getAllPendingTransactions();
        const block = this.blockchain.createBlock(transactions, this.wallet);
        this.broadcast(MESSAGE_TYPE.pre_prepare, block);
      }
    }
  }
}

module.exports = P2pServer;