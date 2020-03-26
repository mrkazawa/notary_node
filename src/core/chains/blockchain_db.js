const levelup = require('levelup');
const leveldown = require('leveldown');
const chalk = require('chalk');
const log = console.log;

const Block = require('./block');
const Config = require('../config');
const config = new Config();

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
      log(chalk.bgRed(`FATAL ERROR ${err}`));
      return false;
    }
  }

  async getFromStore(key) {
    try {
      return JSON.parse(await this.blockchainDB.get(key));
      
    } catch (err) {
      log(chalk.bgRed(`FATAL ERROR ${err}`));
      return false;
    }
  }

  async doAddProcedure(block) {
    const result = await this.addToStore(block.hash, block);
      if (result) {
        this.latestBlock = block;
        this.numberOfTxs.push(this.countNumberOfTxInBlock(block));
        this.latestBlockHeight += 1;
        this.printLog(block.hash);

        return true;
      } else {
        log(chalk.red(`ERROR! Block ${block.hash} cannot be inserted!`));
        return false;
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
      log(chalk.red(`ERROR! Block ${block.hash} invalid!`));
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

  // calculates the next proposers by calculating a random index of the validators list
  // index is calculated using the hash of the latest block
  // TODO: need to investigate what happen to this when one node fails
  getCurrentProposer() {
    //const lastBlock = this.getLatestBlock();
    //let index = lastBlock.hash[0].charCodeAt(0) % config.getNumberOfNodes();
    //return this.validatorsList[index];
    
    return this.validatorsList[3]; // let notary4 always be the proposer
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

  // TODO: Because we change the structure of the block
  // Check if this still working
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

  printLog(blockHash) {
    log(chalk.bgWhite.black(`Added Block to Blockchain: ${blockHash}`));
  }
}

module.exports = Blockchain;