const levelup = require('levelup');
const leveldown = require('leveldown');
const chalk = require('chalk');
const log = console.log;

const Config = require('./config');
const config = new Config();
const Block = require('./block');

class Blockchain {
  constructor(validators) {
    if (Blockchain._instance) {
      throw new Error('Blockchain already has an instance!!!');
    }
    Blockchain._instance = this;

    this.validatorsList = validators.list;
    // TODO: Open exisitng blockchain data scenario
    this.blockchainDB = levelup(leveldown('./blockchain_data'));
    this.includedBlockHash = new Set();
    this.addGenesisBlock();
  }
  
  async addToStore(key, value) {
    if (this.includedBlockHash.has(key)) {
      return false;
    }

    try {
      await this.blockchainDB.put(key, JSON.stringify(value));
      return true;

    } catch (err) {
      log(chalk.red(`ERROR ${err}`));
      return false;
    }
  }

  async getFromStore(key) {
    if (!this.includedBlockHash.has(key)) {
      return false;
    }

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
      this.includedBlockHash.add(genesisBlock.hash);
      log(chalk.bgWhite.black(`Added Block to Blockchain ${genesisBlock.hash}`));
    }
  }

  async addBlockToBlockhain(blockObj, prepareObj, commitObj) {
    if (this.isValidBlock(blockObj)) {
      blockObj.prepareMessages = prepareObj;
      blockObj.commitMessages = commitObj;

      const result = await this.chainthis.addToStore(blockObj.hash, blockObj);
      if (result) {
        this.includedBlockHash.add(genesisBlock.hash);
        log(chalk.bgWhite.black(`Added Block to Blockchain ${blockObj.hash}`));

        return true;
      } else {
        return false;
      }      
    } else {
      return false;
    }
  }

  async createBlock(transactions, wallet) {
    const block = Block.createBlock(
      await this.getLatestBlock(),
      transactions,
      wallet
    );
    return block;
  }

  // calculates the next proposers by calculating a random index of the validators list
  // index is calculated using the hash of the latest block
  // TODO: need to investigate what happen to this when one node fails
  async getCurrentProposer() {
    const latestBlock = await this.getLatestBlock();
    let index = latestBlock.hash[0].charCodeAt(0) % config.getNumberOfNodes();
    return this.validatorsList[index];
  }

  async isValidBlock(block) {
    const lastBlock = await this.getLatestBlock();
    return (
      block.sequenceNo == lastBlock.sequenceNo + 1 &&
      block.lastHash === lastBlock.hash &&
      Block.verifyBlockHash(block, block.hash) &&
      Block.verifyBlockSignature(block) &&
      Block.verifyBlockProposer(block, this.getCurrentProposer())
    );
  }

  async getLatestBlock() {
    const latestHash = this.getLastValueFromSet(this.includedBlockHash);
    return await this.getFromStore(latestHash);
  }

  getBlockHeight() {
    return this.includedBlockHash.length;
  }

  getLastValueFromSet(set){
    let value;
    for(value of set);
    return value;
  }

  countNumberOfTx(txData) {
    let number_of_tx = 0;
    let j;

    for (j = 0; j < txData.length; j++) {
      let tx = txData[j][1];
      let requests = tx.input.data;
      number_of_tx += requests.length;
    }

    return number_of_tx;
  }
}

module.exports = Blockchain;