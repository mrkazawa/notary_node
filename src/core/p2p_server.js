const WebSocket = require("ws");
const HashMap = require('hashmap');
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
  commit: "COMMIT"
};

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
    this.pendingCommitedBlocks = new HashMap();
    this.timeoutCommitedBlocks = new HashMap();
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
    setInterval(function () {
      if (this.pendingCommitedBlocks.size > 0) {
        console.log('there are pending blocks');
        const keys = this.pendingCommitedBlocks.keys();
        keys.sort();

        let i;
        for (i = 0; i < keys.length; i++) {
          let sequenceId = keys[i];
          let blockHash = this.pendingCommitedBlocks.get(sequenceId);
          let blockObj = this.blockPool.get(blockHash);

          this.blockchain.addBlockToBlockhain(blockObj).then(isAdded => {
            if (isAdded) {
              this.blockPool.delete(blockHash);
              this.preparePool.delete(blockHash);
              this.commitPool.delete(blockHash);
              this.pendingCommitedBlocks.delete(sequenceId);

              // delete transactions that have been included in the blockchain
              let i;
              for (i = 0; i < blockObj.data.length; i++) {
                this.transactionPool.delete(blockObj.data[i][0]);
              }

            } else {
              if (!this.timeoutCommitedBlocks.has(sequenceId)) {
                this.timeoutCommitedBlocks.set(sequenceId, 0);
                console.log(`cannot insert leeh.. count = ${0}`);

              } else {
                let count = this.timeoutCommitedBlocks.get(sequenceId);
                count += 1;
                this.timeoutCommitedBlocks.set(sequenceId, count);
                console.log(`cannot insert again leeh.. count = ${count}`);
                if (count > 7) {
                  this.pendingCommitedBlocks.delete(sequenceId);
                }
              }
            }
          });
        }
      }

      if (this.blockchain.getCurrentProposer() == this.wallet.getPublicKey()) {
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

  //-------------------------- Receive Handlers --------------------------//

  messageHandler(socket) {
    socket.on("message", message => {
      const data = JSON.parse(message);

      switch (data.type) {
        //------------------ Transaction Process ------------------//

        case MESSAGE_TYPE.transaction: {
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
        }

        //------------------ PBFT Process (Pre-Prepare) ------------------//

        case MESSAGE_TYPE.pre_prepare: {
          if (config.isDebugging()) {
            log(chalk.yellow(`Receiving Block ${data.block.hash}`));
          }

          if (!this.validators.isValidValidator(data.block.proposer)) break;
          if (this.blockPool.isExist(data.block)) break;
          if (!this.blockPool.isValidBlock(data.block)) break;

          this.broadcastPrePrepare(data.block);
          this.blockPool.add(data.block);

          if (
            !this.preparePool.isInitiated(data.block.hash) &&
            !this.preparePool.isCompleted(data.block.hash)
          ) {
            let prepare = this.preparePool.init(
              data.block.hash,
              data.block.sequenceId,
              this.wallet
            );
            this.broadcastPrepare(prepare);
          }

          break;
        }

        //------------------ PBFT Process (Prepare) ------------------//

        case MESSAGE_TYPE.prepare: {
          if (config.isDebugging()) {
            log(chalk.yellow(`Receiving Prepare ${data.prepare.blockHash}`));
          }

          if (!this.validators.isValidValidator(data.prepare.from)) break;
          if (!this.preparePool.isInitiated(data.prepare.blockHash)) break;
          if (this.preparePool.isCompleted(data.prepare.blockHash)) break;
          if (this.preparePool.isExistFrom(data.prepare.blockHash, data.prepare.from)) break;
          if (!this.preparePool.isValid(data.prepare)) break;

          this.broadcastPrepare(data.prepare);

          let thresholdReached = this.preparePool.add(data.prepare);
          if (thresholdReached) {
            this.preparePool.finalize(data.prepare.blockHash);

            if (
              !this.commitPool.isInitiated(data.prepare.blockHash) &&
              !this.commitPool.isCompleted(data.prepare.blockHash)
            ) {
              let commit = this.commitPool.init(
                data.prepare.blockHash,
                data.prepare.sequenceId,
                this.wallet
              );
              this.broadcastCommit(commit);
            }
          }

          break;
        }

        //------------------ PBFT Process (Commit) ------------------//

        case MESSAGE_TYPE.commit: {
          if (config.isDebugging()) {
            log(chalk.yellow(`Receiving Commit ${data.commit.blockHash}`));
          }

          if (!this.validators.isValidValidator(data.commit.from)) break;
          if (!this.commitPool.isInitiated(data.commit.blockHash)) break;
          if (this.commitPool.isCompleted(data.commit.blockHash)) break;
          if (this.commitPool.isExistFrom(data.commit.blockHash, data.commit.from)) break;
          if (!this.commitPool.isValid(data.commit)) break;

          this.broadcastCommit(data.commit);

          let thresholdReached = this.commitPool.add(data.commit);
          if (thresholdReached) {
            this.commitPool.finalize(data.commit.blockHash);
            let blockObj = this.blockPool.get(data.commit.blockHash);

            this.blockchain.addBlockToBlockhain(blockObj).then(isAdded => {
              if (isAdded) {
                this.blockPool.delete(data.commit.blockHash);
                this.preparePool.delete(data.commit.blockHash);
                this.commitPool.delete(data.commit.blockHash);

                // delete transactions that have been included in the blockchain
                let i;
                for (i = 0; i < blockObj.data.length; i++) {
                  this.transactionPool.delete(blockObj.data[i][0]);
                }

              } else {
                console.log('add to pending pool');
                this.pendingCommitedBlocks.set(data.commit.sequenceId, data.commit.blockHash);
              }
            });
          }

          break;
        }
      }
    });
  }
}

module.exports = P2pServer;