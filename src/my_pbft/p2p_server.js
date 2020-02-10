const WebSocket = require("ws");

const P2P_PORT = process.env.P2P_PORT || 5001;
const peers = process.env.PEERS ? process.env.PEERS.split(",") : [];

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
      console.log("new connection");
      this.connectSocket(socket);
    });
    this.connectToPeers();
    console.log(`Listening for peer to peer connection on port : ${P2P_PORT}`);
  }

  // connects to a given socket and registers the message handler on it
  connectSocket(socket) {
    this.sockets.push(socket);
    console.log("Socket connected");
    this.messageHandler(socket);
  }

  // connects to the peers passed in command line
  connectToPeers() {
    peers.forEach(peer => {
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
          if (
            this.validators.isValidValidator(data.transaction.from) &&
            !this.transactionPool.isExist(data.transaction) &&
            this.transactionPool.isValidTransaction(data.transaction)
          ) {
            this.broadcastTransaction(data.transaction);

            let thresholdReached = this.transactionPool.add(data.transaction);
            if (thresholdReached) {
              // check if the current node is the proposer
              // WARNING!!! Below if code only happen in one node
              if (this.blockchain.getCurrentProposer() == this.wallet.getPublicKey()) {
                let transactions = this.transactionPool.getAllPendingTransactions();
                let block = this.blockchain.createBlock(transactions, this.wallet);
                this.broadcastPrePrepare(block);
              }
            }
          }
          break;

        case MESSAGE_TYPE.pre_prepare:
          if (
            this.validators.isValidValidator(data.block.proposer) &&
            !this.blockPool.isExist(data.block) &&
            this.blockPool.isValidBlock(data.block)
          ) {
            this.broadcastPrePrepare(data.block);

            this.blockPool.add(data.block);

            if (!this.preparePool.isInitiated(data.block.hash)) {
              let prepare = this.preparePool.initPrepare(data.block, this.wallet);
              this.broadcastPrepare(prepare);
            }
          }
          break;

        case MESSAGE_TYPE.prepare:
          if (
            this.validators.isValidValidator(data.prepare.publicKey) &&
            this.preparePool.isInitiated(data.prepare.blockHash) &&
            !this.preparePool.isExist(data.prepare) &&
            this.preparePool.isValidPrepare(data.prepare)
          ) {
            this.broadcastPrepare(data.prepare);

            let thresholdReached = this.preparePool.add(data.prepare);
            if (thresholdReached) {
              if (!this.commitPool.isInitiated(data.prepare.blockHash)) {
                let commit = this.commitPool.initCommit(data.prepare, this.wallet);
                this.broadcastCommit(commit);
              }
            }
          }
          break;

        case MESSAGE_TYPE.commit:
          if (
            this.validators.isValidValidator(data.commit.publicKey) &&
            this.commitPool.isInitiated(data.commit.blockHash) &&
            !this.commitPool.isExist(data.commit) &&
            this.commitPool.isValidCommit(data.commit)
          ) {
            this.broadcastCommit(data.commit);

            let thresholdReached = this.commitPool.add(data.commit);
            if (thresholdReached) {
              let blockHash = data.commit.blockHash;
              let blockObj = this.blockPool.get(blockHash);
              let prepareObj = this.preparePool.get(blockHash);
              let commitObj = this.commitPool.get(blockHash);

              this.blockchain.addBlockToBlockhain(blockObj, prepareObj, commitObj);

              // delete transactions that have been included in the blockchain
              let i;
              for (i = 0; i < blockObj.data.length; i++) {
                this.transactionPool.delete(blockObj.data[i][0]);
              }

              if (!this.roundChangePool.isInitiated(data.commit.blockHash)) {
                let roundChange = this.roundChangePool.initRoundChange(data.commit, this.wallet);
                this.broadcastRoundChange(roundChange);
              }
            }
          }
          break;

        case MESSAGE_TYPE.round_change:
          if (
            this.validators.isValidValidator(data.roundChange.publicKey) &&
            this.roundChangePool.isInitiated(data.roundChange.blockHash) &&
            !this.roundChangePool.isExist(data.roundChange) &&
            this.roundChangePool.isValidRoundChange(data.roundChange)
          ) {
            this.broadcastRoundChange(data.roundChange);

            let thresholdReached = this.roundChangePool.add(data.roundChange);
            if (thresholdReached) {
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