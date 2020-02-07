const WebSocket = require("ws");

const { MIN_APPROVALS } = require("./config");

const P2P_PORT = process.env.P2P_PORT || 5001;
const peers = process.env.PEERS ? process.env.PEERS.split(",") : [];

// message types used to avoid typing messages
// also used in swtich statement in message handlers
const MESSAGE_TYPE = {
  transaction: "TRANSACTION",
  prepare: "PREPARE",
  pre_prepare: "PRE-PREPARE",
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
    messagePool,
    validators
  ) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.blockPool = blockPool;
    this.preparePool = preparePool;
    this.commitPool = commitPool;
    this.messagePool = messagePool;
    this.validators = validators;
    this.sockets = [];
  }

  // Creates a server on a given port
  listen() {
    const server = new WebSocket.Server({ port: P2P_PORT });
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

  // broadcasts transactions
  broadcastTransaction(transaction) {
    this.sockets.forEach(socket => {
      this.sendTransaction(socket, transaction);
    });
  }

  // sends transactions to a perticular socket
  sendTransaction(socket, transaction) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.transaction,
        transaction: transaction
      })
    );
  }

  // broadcasts preprepare
  broadcastPrePrepare(block) {
    this.sockets.forEach(socket => {
      this.sendPrePrepare(socket, block);
    });
  }

  // sends preprepare to a particular socket
  sendPrePrepare(socket, block) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.pre_prepare,
        block: block
      })
    );
  }

  // broadcast prepare
  broadcastPrepare(prepare) {
    this.sockets.forEach(socket => {
      this.sendPrepare(socket, prepare);
    });
  }

  // sends prepare to a particular socket
  sendPrepare(socket, prepare) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.prepare,
        prepare: prepare
      })
    );
  }

  // broadcasts commit
  broadcastCommit(commit) {
    this.sockets.forEach(socket => {
      this.sendCommit(socket, commit);
    });
  }

  // sends commit to a particular socket
  sendCommit(socket, commit) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.commit,
        commit: commit
      })
    );
  }

  // broacasts round change
  broadcastRoundChange(message) {
    this.sockets.forEach(socket => {
      this.sendRoundChange(socket, message);
    });
  }

  // sends round change message to a particular socket
  sendRoundChange(socket, message) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.round_change,
        message: message
      })
    );
  }

  //-------------------------- Receive Handlers --------------------------//

  // handles any message sent to the current node
  messageHandler(socket) {
    // registers message handler
    socket.on("message", message => {
      const data = JSON.parse(message);

      //console.log("RECEIVED", data.type);

      // select a perticular message handler
      switch (data.type) {
        case MESSAGE_TYPE.transaction:
          // check if transactions is valid
          if (
            !this.transactionPool.exist(data.transaction) &&
            this.transactionPool.isValidTransaction(data.transaction) &&
            this.validators.isValidValidator(data.transaction.from)
          ) {
            // send transactions to other nodes
            this.broadcastTransaction(data.transaction);

            let thresholdReached = this.transactionPool.add(data.transaction);
            // check if limit reached
            if (thresholdReached) {
              console.log("THRESHOLD REACHED");
              // check if the current node is the proposer
              if (this.blockchain.getCurrentProposer() == this.wallet.getPublicKey()) {
                console.log("PROPOSING BLOCK");
                // if the node is the proposer, create a block and broadcast it
                let block = this.blockchain.createBlock(
                  this.transactionPool.getAllPendingTransactions(),
                  this.wallet
                );
                this.broadcastPrePrepare(block);
              }
            } else {
              console.log("Transaction Added");
            }
          }
          break;

        case MESSAGE_TYPE.pre_prepare:
          // check if block is valid
          if (
            !this.blockPool.exist(data.block) &&
            this.blockchain.isValidBlock(data.block)
          ) {
            // send to other nodes
            this.broadcastPrePrepare(data.block);

            console.log("Block Received");

            // add block to pool
            this.blockPool.add(data.block);

            // create and broadcast a prepare message
            let prepare = this.preparePool.initPrepare(data.block, this.wallet);
            this.broadcastPrepare(prepare);
          }
          break;

        case MESSAGE_TYPE.prepare:
          // check if the prepare message is valid
          if (
            !this.preparePool.existingPrepare(data.prepare) &&
            this.preparePool.isValidPrepare(data.prepare, this.wallet) &&
            this.validators.isValidValidator(data.prepare.publicKey)
          ) {
            // send to other nodes
            this.broadcastPrepare(data.prepare);

            // add prepare message to the pool
            let thresholdReached =  this.preparePool.addPrepare(data.prepare);
            if (thresholdReached) {
              let commit = this.commitPool.commit(data.prepare, this.wallet);
              this.broadcastCommit(commit);
            } else {
              console.log("Pre-prepare Added");
            }
          }
          break;

        case MESSAGE_TYPE.commit:
          // check the validity commit messages
          if (
            !this.commitPool.existingCommit(data.commit) &&
            this.commitPool.isValidCommit(data.commit) &&
            this.validators.isValidValidator(data.commit.publicKey)
          ) {
            // add to pool
            this.commitPool.addCommit(data.commit);

            // send to other nodes
            this.broadcastCommit(data.commit);

            // if no of commit messages reaches minimum required
            // add updated block to chain
            if (
              this.commitPool.list[data.commit.blockHash].length >=
              MIN_APPROVALS
            ) {
              this.blockchain.addUpdatedBlock(
                data.commit.blockHash,
                this.blockPool,
                this.preparePool,
                this.commitPool
              );
            }
            // Send a round change message to nodes
            let message = this.messagePool.createMessage(
              this.blockchain.chain[this.blockchain.chain.length - 1].hash,
              this.wallet
            );
            this.broadcastRoundChange(message);
          }
          break;

        case MESSAGE_TYPE.round_change:
          // check the validity of the round change message
          /* if (
            !this.messagePool.existingMessage(data.message) &&
            this.messagePool.isValidMessage(data.message) &&
            this.validators.isValidValidator(data.message.publicKey)
          ) { */
          if (
            !this.messagePool.existingMessage(data.message) &&
            this.validators.isValidValidator(data.message.publicKey)
          ) {
            // add to pool
            this.messagePool.addMessage(data.message);

            // send to other nodes
            this.broadcastRoundChange(message);

            // if enough messages are received, clear the pools
            if (
              this.messagePool.list[data.message.blockHash].length >=
              MIN_APPROVALS
            ) {
              this.transactionPool.clear();
              // TODO: Add clear for blockPool, preparePool, commitPool, and messagePool
            }
          }
          break;
      }
    });
  }
}

module.exports = P2pServer;
