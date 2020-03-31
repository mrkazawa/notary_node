const levelup = require('levelup');
const leveldown = require('leveldown');
const chalk = require('chalk');
const log = console.log;

const Block = require('./block');

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
    this.numberOfTxs.push(this.countNumberOfTxInBlock(block));
    this.latestBlockHeight += 1;

    const result = await this.addToStore(block.hash, block);
    if (result) {
      this.printLog(block);

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
    return this.numberOfTxs;
  }

  countNumberOfTxInBlock(block) {
    let txs = block.data;
    let number_of_tx = 0;
    let j;

    for (j = 0; j < txs.length; j++) {
      let tx = txs[j][1];
      let requests = tx.input.data;
      number_of_tx += requests.length;
    }

    return number_of_tx;
  }

  printLog(block) {
    log(chalk.bgWhite.black(`Added Block to Blockchain: ID ${block.sequenceId} HASH ${block.hash}`));
  }
}

module.exports = Blockchain;