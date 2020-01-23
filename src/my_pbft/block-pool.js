const HashMap = require('hashmap');

class BlockPool {
  constructor() {
    this.pendingBlocks = new HashMap();
  }

  // pushes block to the chain
  add(block) {
    this.pendingBlocks.set(block.hash, block);
    //console.log("added block to pool");
  }

  // returns the blcok for the given hash
  getBlock(hash) {
    return this.pendingBlocks.get(hash);
  }

  // check if the block exisits or not
  exist(block) {
    return this.pendingBlocks.has(block.hash);
  }
}

module.exports = BlockPool;
