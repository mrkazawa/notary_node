const WebSocket = require("ws");

// import the min approval constant which will be used to compare the count the messages
const { MIN_APPROVALS } = require("./config");

// decalre a p2p server port on which it would listen for messages
// we will pass the port through command line
const P2P_PORT = process.env.P2P_PORT || 5001;

// the neighbouring nodes socket addresses will be passed in command line
// this statemet splits them into an array
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
    transactionPool,
    wallet,
    validators
  ) {
    this.transactionPool = transactionPool;
    this.wallet = wallet;
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

  //-------------------------- Receive Handlers --------------------------//

  // handles any message sent to the current node
  messageHandler(socket) {
    // registers message handler
    socket.on("message", message => {
      const data = JSON.parse(message);

      // select a perticular message handler
      switch (data.type) {
        case MESSAGE_TYPE.transaction:
          // check if transactions is valid
          if (
            !this.transactionPool.exist(data.transaction) &&
            this.transactionPool.isValidTransaction(data.transaction) &&
            this.validators.isValidValidator(data.transaction.from)
          ) {
            let thresholdReached = this.transactionPool.add(
              data.transaction
            );
            // send transactions to other nodes
            this.broadcastTransaction(data.transaction);

            // check if limit reached
            if (thresholdReached) {
              console.log("THRESHOLD REACHED");
            } else {
              console.log("Transaction Added");
            }
          }
          break;

      }
    });
  }
}

module.exports = P2pServer;
