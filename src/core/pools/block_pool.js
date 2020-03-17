const HashMap = require('hashmap');

const Block = require('../chains/block');

class BlockPool {
  constructor() {
    if (BlockPool._instance) {
      throw new Error('BlockPool already has an instance!!!');
    }
    BlockPool._instance = this;

    this.pendingBlocks = new HashMap();
  }

  add(block) {
    this.pendingBlocks.set(block.hash, block);
  }

  isExist(block) {
    return this.pendingBlocks.has(block.hash);
  }

  isValidBlock(block) {
    return Block.verifyBlockSignature(block);
  }

  get(blockHash) {
    return this.pendingBlocks.get(blockHash);
  }

  delete(blockHash) {
    this.pendingBlocks.delete(blockHash);
  }

  getCurrentPendingSize() {
    return this.pendingBlocks.size;
  }

  clear() {
    this.pendingBlocks.clear();
  }
}

module.exports = BlockPool;