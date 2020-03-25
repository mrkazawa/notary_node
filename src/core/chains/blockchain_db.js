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
    
    // TODO: Open exisitng blockchain data scenario
    this.blockchainDB = levelup(leveldown('./blockchain_data'));
    this.blockchainDB.clear();
    if (!this.blockchainDB.supports.permanence) {
      throw new Error('Persistent storage is required');
    }

    this.latestBlock = {} // temporary object to store the latest block
    this.latestBlockHeight = 0; // temporary to store the latest block height
    this.numberOfTxs = [];
  }
  
  async addToStore(key, value) {
    try {
      //await this.blockchainDB.put(key, JSON.stringify(value));
      return true;

    } catch (err) {
      log(chalk.red(`ERROR ${err}`));
      return false;
    }
  }

  async getFromStore(key) {
    try {
      return JSON.parse(await this.blockchainDB.get(key));
      
    } catch (err) {
      log(chalk.red(`ERROR ${err}`));
      return false;
    }
  }

  async addGenesisBlock() {
    const genesisBlock = Block.genesis();
    const result = await this.addToStore(genesisBlock.hash, genesisBlock);
    if (result) {
      this.latestBlock = genesisBlock;
      this.numberOfTxs.push(this.countNumberOfTxInBlock(this.getLatestBlock()));
      this.latestBlockHeight += 1;
      this.printLog(genesisBlock.hash);
    } else {
      log(chalk.red(`ERROR! Genesis block cannot be created!`));
    }
  }

  async addBlockToBlockhain(blockObj) {
    if (this.isValidBlock(blockObj)) {
      const result = await this.addToStore(blockObj.hash, blockObj);
      if (result) {
        this.latestBlock = blockObj;
        this.numberOfTxs.push(this.countNumberOfTxInBlock(this.getLatestBlock()));
        this.latestBlockHeight += 1;
        this.printLog(blockObj.hash);

        return true;
      } else {
        log(chalk.red(`ERROR! Block ${blockObj.hash} cannot be inserted!`));
        return false;
      }      
    } else {
      log(chalk.red(`ERROR! Block ${blockObj.hash} invalid!`));
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

  getLastValueFromSet(set){
    let value;
    for(value of set);
    return value;
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

  printLog(blockHash) {
    log(chalk.bgWhite.black(`Added Block to Blockchain: ${blockHash}`));
  }
}

module.exports = Blockchain;