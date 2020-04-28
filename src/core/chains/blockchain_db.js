const levelup = require('levelup');
const leveldown = require('leveldown');
const rp = require('request-promise-native');
const chalk = require('chalk');
const log = console.log;

const Config = require('../config');
const config = new Config();
const Block = require('./block');

// TODO: a cleaner way to get list of apps notification backend
const rentalCarURL = `http://127.0.0.1:3002/notification`;

class Blockchain {
  constructor(validators) {
    if (Blockchain._instance) {
      throw new Error('Blockchain already has an instance!!!');
    }
    Blockchain._instance = this;

    this.validatorsList = validators.list;

    this.blockchainDB = levelup(leveldown('./blockchain_data'));
    if (!this.blockchainDB.supports.permanence) {
      throw new Error('Persistent storage is required');
    }

    // TODO: Open exisitng blockchain data scenario
    this.blockchainDB.clear();

    this.latestBlock = {} // temporary object to store the latest block
    this.latestBlockHeight = 0; // temporary to store the latest block height

    this.numberOfTxs = []; // to store lists of number of transacttions per block
    this.numberOfHighPriorityTxs = [];
    this.numberOfMediumPriorityTxs = [];
    this.numberOfLowPriorityTxs = [];
  }

  async addToStore(key, value) {
    try {
      await this.blockchainDB.put(key, JSON.stringify(value));
      return true;

    } catch (err) {
      log(chalk.bgRed.black(`FATAL ERROR ${err}`));
      return process.exit(69);
    }
  }

  async getFromStore(key) {
    try {
      return JSON.parse(await this.blockchainDB.get(key));

    } catch (err) {
      log(chalk.bgRed.black(`FATAL ERROR ${err}`));
      return process.exit(69);
    }
  }

  async doAddProcedure(block) {
    this.latestBlock = block;
    this.latestBlockHeight += 1;

    const counts = this.countNumberOfTxInBlock(block);
    this.numberOfTxs.push(counts[0]);
    this.numberOfHighPriorityTxs.push(counts[1]);
    this.numberOfMediumPriorityTxs.push(counts[2]);
    this.numberOfLowPriorityTxs.push(counts[3]);

    console.log([
      counts[0],
      counts[1] / counts[0] * 100,
      counts[2] / counts[0] * 100,
      counts[3] / counts[0] * 100
    ]);

    const result = await this.addToStore(block.hash, block);
    if (result) {
      this.printLog(block);

      // TODO: need a better or cleaner way to notify apps
      // notify app only when there is transaction in the block
      if (counts[0] > 0) {
        
        const options = {
          method: 'POST',
          uri: rentalCarURL,
          body: block,
          resolveWithFullResponse: true,
          json: true
        };

        rp(options).then(async function (response) {
          if (response.statusCode == 200) {
            console.log("Rental car app is notified");
          }

        }).catch(function (err) {
          console.log(`Error when notifying app: ${err}`);
        });
      }

      return true;
    }
  }

  async addGenesisBlock() {
    const genesisBlock = Block.genesis();
    return await this.doAddProcedure(genesisBlock);
  }

  async addBlockToBlockhain(block) {
    if (this.isValidBlock(block)) {
      return await this.doAddProcedure(block);
    } else {
      log(chalk.bgYellow.black(`WARNING! Block ID ${block.sequenceId} HASH ${block.hash} invalid!`));
      return false;
    }
  }

  createBlock(transactions, wallet) {
    const block = Block.createBlock(
      this.getLatestBlock(),
      transactions,
      wallet
    );
    return block;
  }

  // TODO: Implement a better leader election scheme
  getCurrentProposer() {
    return this.validatorsList[this.validatorsList.length - 1];
  }

  isValidBlock(block) {
    const lastBlock = this.getLatestBlock();
    return (
      block.sequenceId == lastBlock.sequenceId + 1 &&
      block.lastHash === lastBlock.hash &&
      Block.verifyBlockSignature(block) &&
      Block.verifyBlockProposer(block, this.getCurrentProposer())
    );
  }

  getLatestBlock() {
    return this.latestBlock;
  }

  getBlockHeight() {
    return this.latestBlockHeight;
  }

  getListNumberOfTxs() {
    return [
      this.numberOfTxs,
      this.numberOfHighPriorityTxs,
      this.numberOfMediumPriorityTxs,
      this.numberOfLowPriorityTxs
    ];
  }

  countNumberOfTxInBlock(block) {
    const txs = block.data;
    let all = 0;
    let high_priority = 0;
    let medium_priority = 0;
    let low_priority = 0;

    for (let j = 0; j < txs.length; j++) {
      const tx = txs[j][1];
      const requests = tx.input.data;
      all += requests.length;

      for (let k = 0; k < requests.length; k++) {
        let request = requests[k][1];

        if (request.priority_id == config.PRIORITY_TYPE.high) {
          high_priority += 1;

        } else if (request.priority_id == config.PRIORITY_TYPE.medium) {
          medium_priority += 1;

        } else if (request.priority_id == config.PRIORITY_TYPE.low) {
          low_priority += 1;

        } else {
          log(chalk.red(`ERROR! ${priority_id} is unknowned`));
        }
      }
    }

    return [all, high_priority, medium_priority, low_priority];
  }

  printLog(block) {
    log(chalk.bgWhite.black(`Added Block to Blockchain: ID ${block.sequenceId} HASH ${block.hash}`));
  }
}

module.exports = Blockchain;