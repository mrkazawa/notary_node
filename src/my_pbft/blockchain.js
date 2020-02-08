const { NUMBER_OF_NODES } = require("./config");
const Block = require("./block");

class Blockchain {
  // the constructor takes an argument validators class object
  // this is used to create a list of validators
  constructor(validators) {
    if (Blockchain._instance) {
      throw new Error('Blockchain already has an instance!!!');
    }
    Blockchain._instance = this;

    this.validatorList = validators.list;
    this.chain = [Block.genesis()];
  }

  // pushes confirmed blocks into the chain
  addBlock(block) {
    this.chain.push(block);
    console.log("NEW BLOCK ADDED TO CHAIN");
    return block;
  }

  // wrapper function to create blocks
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
    return this.validatorList[index];
  }

  // checks if the received block is valid
  isValidBlock(block) {
    const lastBlock = this.getLatestBlock();
    if (
      block.sequenceNo == lastBlock.sequenceNo + 1 &&
      block.lastHash === lastBlock.hash &&
      Block.verifyBlockHash(block, block.hash) &&
      Block.verifyBlockSignature(block) &&
      Block.verifyBlockProposer(block, this.getCurrentProposer())
    ) {
      console.log("BLOCK VALID");
      return true;
    } else {
      console.log("BLOCK INVALID");
      return false;
    }
  }

  // updates the block by appending the prepare and commit messages to the block
  addUpdatedBlock(hash, blockPool, preparePool, commitPool) {
    let block = blockPool.getBlock(hash);
    block.prepareMessages = preparePool.get(hash);
    block.commitMessages = commitPool.list[hash];
    this.addBlock(block);
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
