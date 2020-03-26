const WebSocket = require('ws');
const HashMap = require('hashmap');
const chalk = require('chalk');
const log = console.log;

const Config = require('./config');
const config = new Config();
const MESSAGE_TYPE = config.MESSAGE_TYPE;

const P2P_PORT = process.env.P2P_PORT || 5001;
const PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];

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
    this.pendingCommitedBlocks = new HashMap(); // store pending out of order commits
    this.timeoutCommitedBlocks = new HashMap(); // store commits that cannot be inserted after multiple trials
  }

  // Creates a server on a given port
  // TODO: detect and restore broken connection scenario
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
    // timer for garbage process
    setInterval(this.doGarbageProcessing.bind(this), config.getGarbageInterval());
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

          /*
          // test: direct add to blockchain
          let blockObj = block;
          this.blockchain.addBlockToBlockhain(blockObj).then(isAdded => {
            if (isAdded) {
              this.deleteAlreadyIncludedPBFTMessages(blockObj.hash);
              this.deleteAlreadyIncludedTransactions(blockObj);

            } else {
              this.pendingCommitedBlocks.set(blockObj.sequenceId, blockObj.hash);
            }
          });*/

          
          if (
            !this.preparePool.isInitiated(block.hash) &&
            !this.preparePool.isCompleted(block.hash)
          ) {
            let prepare = this.preparePool.init(
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

          let thresholdReached = this.preparePool.add(prepare);
          if (thresholdReached) {
            this.preparePool.finalize(prepare.blockHash);

            /*
            // test: direct add to blockchain
            let blockObj = this.blockPool.get(prepare.blockHash);
            this.blockchain.addBlockToBlockhain(blockObj).then(isAdded => {
              if (isAdded) {
                this.deleteAlreadyIncludedPBFTMessages(blockObj.hash);
                this.deleteAlreadyIncludedTransactions(blockObj);

              } else {
                this.pendingCommitedBlocks.set(blockObj.sequenceId, blockObj.hash);
              }
            });*/

            
            if (
              !this.commitPool.isInitiated(prepare.blockHash) &&
              !this.commitPool.isCompleted(prepare.blockHash)
            ) {
              let commit = this.commitPool.init(
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

          let thresholdReached = this.commitPool.add(commit);
          if (thresholdReached) {
            this.commitPool.finalize(commit.blockHash);
            let blockObj = this.blockPool.get(commit.blockHash);

            this.blockchain.addBlockToBlockhain(blockObj).then(isAdded => {
              if (isAdded) {
                this.deleteAlreadyIncludedPBFTMessages(blockObj.hash);
                this.deleteAlreadyIncludedTransactions(blockObj);

              } else {
                this.pendingCommitedBlocks.set(blockObj.sequenceId, blockObj.hash);
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

  // TODO: Because we change the structure of the block
  // Check if this still working
  deleteAlreadyIncludedTransactions(block) {
    let i;
    for (i = 0; i < block.data.length; i++) {
      this.transactionPool.delete(block.data[i][0]);
    }
  }

  proposeBlock() {
    // if first time, create the genesis
    if (this.blockchain.getBlockHeight() == 0) {
      this.blockchain.addGenesisBlock();

    } else {
      // check if we have pending commits because of out of order delivery
      if (this.pendingCommitedBlocks.size > 0) {
        const keys = this.pendingCommitedBlocks.keys();
        keys.sort(); // begin inserting from the lowest sequence id

        let i;
        for (i = 0; i < keys.length; i++) {
          let sequenceId = keys[i];
          let blockHash = this.pendingCommitedBlocks.get(sequenceId);
          let blockObj = this.blockPool.get(blockHash);

          this.blockchain.addBlockToBlockhain(blockObj).then(isAdded => {
            if (isAdded) {
              this.deleteAlreadyIncludedPBFTMessages(blockObj.hash);
              this.deleteAlreadyIncludedTransactions(blockObj);
              this.pendingCommitedBlocks.delete(sequenceId);

            } else {
              if (!this.timeoutCommitedBlocks.has(sequenceId)) {
                this.timeoutCommitedBlocks.set(sequenceId, 0);

              } else {
                let count = this.timeoutCommitedBlocks.get(sequenceId);
                count += 1;
                this.timeoutCommitedBlocks.set(sequenceId, count);

                if (count > config.getOldMessagesTimeout()) {
                  this.deleteAlreadyIncludedPBFTMessages(blockObj.hash); // seems like out of order block
                  this.pendingCommitedBlocks.delete(sequenceId);
                  this.timeoutCommitedBlocks.delete(sequenceId);
                }
              }
            }
          });
        }
      }

      // if it is our turn to create a block, we propose it
      if (this.blockchain.getCurrentProposer() == this.wallet.getPublicKey()) {
        //log('I am proposing');
        let transactions = this.transactionPool.getAllPendingTransactions();
        let block = this.blockchain.createBlock(transactions, this.wallet);
        this.broadcast(MESSAGE_TYPE.pre_prepare, block);
      }
    }
  }

  doGarbageProcessing() {
    // FIXME: Should delete PBFT messages that already insert in the blockchain,
    // Not the only that has passed APPROVAL in the COMMIT phase
    const completeCommits = this.commitPool.getAllCompleted();
    const completeSize = completeCommits.size;
    const toDelete = completeSize - config.getNumberOfTempMessages();
    
    var deleted = 0;
    for (let item of completeCommits) {
      this.preparePool.deleteCompleted(item);
      this.commitPool.deleteCompleted(item);
      deleted += 1;
      if (deleted == toDelete) {
        break;
      }
    }

    //this.blockPool.clear();

    /*
    log(chalk.yellow(`Tx Pool Size: ${this.transactionPool.getCurrentPendingSize()}`));
    log(chalk.yellow(`Block Pool Size: ${this.blockPool.getCurrentPendingSize()}`));
    log(chalk.yellow(`Prepare Pool Size: ${this.preparePool.getCurrentPendingSize()}`));
    log(chalk.yellow(`Commit Pool Size: ${this.commitPool.getCurrentPendingSize()}`));
    log(chalk.yellow(`Prepare FINAL Pool Size: ${this.preparePool.getCurrentCompletedSize()}`));
    log(chalk.yellow(`Commit FINAL Size: ${this.commitPool.getCurrentCompletedSize()}`));
    log(chalk.yellow(`Pending Commited Block Pool Size: ${this.pendingCommitedBlocks.size}`));
    log(chalk.yellow(`Timeout Commited Block Pool Size: ${this.timeoutCommitedBlocks.size}`));
    */
  }
}

module.exports = P2pServer;