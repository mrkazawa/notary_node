const WebSocket = require("ws");
const chalk = require('chalk');
const log = console.log;

const Config = require("./config");
const config = new Config();

const P2P_PORT = process.env.P2P_PORT || 5001;
const PEERS = process.env.PEERS ? process.env.PEERS.split(",") : [];

const MESSAGE_TYPE = {
  transaction: "TRANSACTION",
  prepare: "PREPARE",
  pre_prepare: "PRE_PREPARE",
  commit: "COMMIT",
  round_change: "ROUND_CHANGE"
};

class P2pServer {
  constructor(
    blockchain,
    transactionPool,
    wallet,
    blockPool,
    preparePool,
    commitPool,
    roundChangePool,
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
    this.roundChangePool = roundChangePool;
    this.validators = validators;
    this.sockets = [];
  }

  // Creates a server on a given port
  listen() {
    const server = new WebSocket.Server({
      port: P2P_PORT
    });
    server.on("connection", socket => {
      this.connectSocket(socket);
    });
    this.connectToPeers();
    log(chalk.blue(`Listening for peer to peer connection on port : ${P2P_PORT}`));

    // timer for proposing a block
    setInterval(async function() {
      if (await this.blockchain.getCurrentProposer() == this.wallet.getPublicKey()) {
        let transactions = this.transactionPool.getAllPendingTransactions();
        let block = this.blockchain.createBlock(transactions, this.wallet);
        this.broadcastPrePrepare(block);
      }
    }.bind(this), 1000);
  }

  // connects to a given socket and registers the message handler on it
  connectSocket(socket) {
    this.sockets.push(socket);
    log(chalk.blue("Socket connected"));
    this.messageHandler(socket);
  }

  // connects to the peers passed in command line
  connectToPeers() {
    PEERS.forEach(peer => {
      const socket = new WebSocket(peer);
      socket.on("open", () => this.connectSocket(socket));
    });
  }

  //-------------------------- Send Broadcasts --------------------------//

  broadcastTransaction(transaction) {
    this.sockets.forEach(socket => {
      this.sendTransaction(socket, transaction);
    });
  }

  sendTransaction(socket, transaction) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.transaction,
        transaction: transaction
      })
    );
  }

  broadcastPrePrepare(block) {
    this.sockets.forEach(socket => {
      this.sendPrePrepare(socket, block);
    });
  }

  sendPrePrepare(socket, block) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.pre_prepare,
        block: block
      })
    );
  }

  broadcastPrepare(prepare) {
    this.sockets.forEach(socket => {
      this.sendPrepare(socket, prepare);
    });
  }

  sendPrepare(socket, prepare) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.prepare,
        prepare: prepare
      })
    );
  }

  broadcastCommit(commit) {
    this.sockets.forEach(socket => {
      this.sendCommit(socket, commit);
    });
  }

  sendCommit(socket, commit) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.commit,
        commit: commit
      })
    );
  }

  broadcastRoundChange(roundChange) {
    this.sockets.forEach(socket => {
      this.sendRoundChange(socket, roundChange);
    });
  }

  sendRoundChange(socket, roundChange) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.round_change,
        roundChange: roundChange
      })
    );
  }

  //-------------------------- Receive Handlers --------------------------//

  messageHandler(socket) {
    socket.on("message", message => {
      const data = JSON.parse(message);

      switch (data.type) {
        case MESSAGE_TYPE.transaction:
          if (config.isDebugging()) {
            log(chalk.cyan(`Receiving Transaction ${data.transaction.id}`));
          }

          if (
            this.validators.isValidValidator(data.transaction.from) &&
            !this.transactionPool.isExist(data.transaction) &&
            this.transactionPool.isValidTransaction(data.transaction)
          ) {
            this.broadcastTransaction(data.transaction);
            this.transactionPool.add(data.transaction);
          }
          break;

        case MESSAGE_TYPE.pre_prepare:
          if (config.isDebugging()) {
            log(chalk.yellow(`Receiving Block ${data.block.hash}`));
          }

          if (
            this.validators.isValidValidator(data.block.proposer) &&
            !this.blockPool.isExist(data.block) &&
            this.blockPool.isValidBlock(data.block)
          ) {
            this.broadcastPrePrepare(data.block);

            this.blockPool.add(data.block);

            if (
              !this.preparePool.isInitiated(data.block.hash) &&
              !this.preparePool.isFinalized(data.block.hash)
            ) {
              let prepare = this.preparePool.initPrepare(data.block, this.wallet);
              this.broadcastPrepare(prepare);
            }
          }
          break;

        case MESSAGE_TYPE.prepare:
          if (config.isDebugging()) {
            log(chalk.yellow(`Receiving Prepare ${data.prepare.blockHash}`));
          }

          if (
            this.validators.isValidValidator(data.prepare.publicKey) &&
            this.preparePool.isInitiated(data.prepare.blockHash) &&
            !this.preparePool.isFinalized(data.prepare.blockHash) &&
            !this.preparePool.isExist(data.prepare) &&
            this.preparePool.isValidPrepare(data.prepare)
          ) {
            this.broadcastPrepare(data.prepare);

            let thresholdReached = this.preparePool.add(data.prepare);
            if (thresholdReached) {
              this.preparePool.finalize(data.prepare.blockHash);

              if (
                !this.commitPool.isInitiated(data.prepare.blockHash) &&
                !this.commitPool.isFinalized(data.prepare.blockHash)
              ) {
                let commit = this.commitPool.initCommit(data.prepare, this.wallet);
                this.broadcastCommit(commit);
              }
            }
          }
          break;

        case MESSAGE_TYPE.commit:
          if (config.isDebugging()) {
            log(chalk.yellow(`Receiving Commit ${data.commit.blockHash}`));
          }

          if (
            this.validators.isValidValidator(data.commit.publicKey) &&
            this.commitPool.isInitiated(data.commit.blockHash) &&
            !this.commitPool.isFinalized(data.commit.blockHash) &&
            !this.commitPool.isExist(data.commit) &&
            this.commitPool.isValidCommit(data.commit)
          ) {
            this.broadcastCommit(data.commit);

            let thresholdReached = this.commitPool.add(data.commit);
            if (thresholdReached) {
              this.commitPool.finalize(data.commit.blockHash);

              let blockObj = this.blockPool.get(data.commit.blockHash);
              let prepareObj = this.preparePool.get(data.commit.blockHash);
              let commitObj = this.commitPool.get(data.commit.blockHash);

              let isAdded = this.blockchain.addBlockToBlockhain(blockObj, prepareObj, commitObj);
              if (isAdded) {
                // delete transactions that have been included in the blockchain
                let i;
                for (i = 0; i < blockObj.data.length; i++) {
                  this.transactionPool.delete(blockObj.data[i][0]);
                }

                if (
                  !this.roundChangePool.isInitiated(data.commit.blockHash) &&
                  !this.roundChangePool.isFinalized(data.commit.blockHash)
                ) {
                  let roundChange = this.roundChangePool.initRoundChange(data.commit, this.wallet);
                  this.broadcastRoundChange(roundChange);
                }
              }
            }
          }
          break;

        case MESSAGE_TYPE.round_change:
          if (config.isDebugging()) {
            log(chalk.green(`Receiving Round Change ${data.roundChange.blockHash}`));
          }

          if (
            this.validators.isValidValidator(data.roundChange.publicKey) &&
            this.roundChangePool.isInitiated(data.roundChange.blockHash) &&
            !this.roundChangePool.isFinalized(data.roundChange.blockHash) &&
            !this.roundChangePool.isExist(data.roundChange) &&
            this.roundChangePool.isValidRoundChange(data.roundChange)
          ) {
            this.broadcastRoundChange(data.roundChange);

            let thresholdReached = this.roundChangePool.add(data.roundChange);
            if (thresholdReached) {
              this.roundChangePool.finalize(data.roundChange.blockHash);

              this.blockPool.delete(data.roundChange.blockHash);
              this.preparePool.delete(data.roundChange.blockHash);
              this.commitPool.delete(data.roundChange.blockHash);
              this.roundChangePool.delete(data.roundChange.blockHash);
            }
          }
          break;
      }
    });
  }
}

module.exports = P2pServer;