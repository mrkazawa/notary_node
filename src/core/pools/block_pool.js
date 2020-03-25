const HashMap = require('hashmap');
const NodeCache = require("node-cache");

const Block = require('../chains/block');

class BlockPool {
  constructor() {
    if (BlockPool._instance) {
      throw new Error('BlockPool already has an instance!!!');
    }
    BlockPool._instance = this;

    this.pendingBlocks = new NodeCache({
      stdTTL: 30,
      checkperiod: 10
    });

    this.pendingBlocks.on( "expired", function( key, value ){
      console.log(`${key} expired`);
    });
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
    this.pendingBlocks.del(blockHash);
  }

  getCurrentPendingSize() {
    return this.pendingBlocks.getStats();
  }

  clear() {
    this.pendingBlocks.flushAll();
  }

}

module.exports = BlockPool;