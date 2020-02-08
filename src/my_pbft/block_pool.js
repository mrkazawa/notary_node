const HashMap = require('hashmap');

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
    //console.log("added block to pool");
  }

  getBlock(hash) {
    return this.pendingBlocks.get(hash);
  }

  exist(block) {
    return this.pendingBlocks.has(block.hash);
  }

  clear() {
    this.pendingBlocks.clear();
    //console.log("BLOCK POOL CLEARED");
  }
}

module.exports = BlockPool;
