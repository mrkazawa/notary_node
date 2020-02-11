const chalk = require('chalk');
const log = console.log;

const { NUMBER_OF_NODES } = require("./config");
const Block = require("./block");

class Blockchain {
  constructor(validators) {
    if (Blockchain._instance) {
      throw new Error('Blockchain already has an instance!!!');
    }
    Blockchain._instance = this;

    this.validatorsList = validators.list;
    this.chain = [Block.genesis()];
  }

  createBlock(transactions, wallet) {
    const block = Block.createBlock(
      this.chain[this.chain.length - 1],
      transactions,
      wallet
    );
    return block;
  }

  // calculates the next proposers by calculating a random index of the validators list
  // index is calculated using the hash of the latest block
  // TODO: need to investigate what happen to this when one node fails
  getCurrentProposer() {
    let index = this.getLatestBlock().hash[0].charCodeAt(0) % NUMBER_OF_NODES;
    return this.validatorsList[index];
  }

  isValidBlock(block) {
    const lastBlock = this.getLatestBlock();
    return (
      block.sequenceNo == lastBlock.sequenceNo + 1 &&
      block.lastHash === lastBlock.hash &&
      Block.verifyBlockHash(block, block.hash) &&
      Block.verifyBlockSignature(block) &&
      Block.verifyBlockProposer(block, this.getCurrentProposer())
    );
  }

  addBlockToBlockhain(blockObj, prepareObj, commitObj) {
    if (this.isValidBlock(blockObj)) {
      blockObj.prepareMessages = prepareObj;
      blockObj.commitMessages = commitObj;
      this.chain.push(blockObj);
      log(chalk.bgWhite.black(`Added Block to Blockchain ${blockObj.hash}`));
    }
  }

  getAllBlocks() {
    return this.chain;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  getBlockHeight() {
    return this.chain.length;
  }
}
module.exports = Blockchain;
