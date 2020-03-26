const NodeCache = require("node-cache");
const chalk = require('chalk');
const log = console.log;

const Block = require('../chains/block');
const Config = require('../config');
const config = new Config();

// default TTL (Time-To-Live) in seconds
// when it expires, the entry will be deleted
const DEFAULT_TTL = 30;

// check interval to check for TTL in seconds
// shorter duration is better,
// longer duration cause the system to take time to delete entries
const CHECK_PERIOD = 10;

class BlockPool {
  constructor() {
    if (BlockPool._instance) {
      throw new Error('BlockPool already has an instance!!!');
    }
    BlockPool._instance = this;

    this.pendingBlocks = new NodeCache({
      stdTTL: DEFAULT_TTL,
      checkperiod: CHECK_PERIOD
    });

    if (config.isDebugging()) {
      this.pendingBlocks.on("expired", function (key, value) {
        log(chalk.bgGreen(`NEW EVENT: ${key} expired`));
      });
    }
  }

  add(block) {
    this.pendingBlocks.set(block.hash, block);
  }

  isExist(blockHash) {
    return this.pendingBlocks.has(blockHash);
  }

  isValidBlock(block) {
    return Block.verifyBlockSignature(block);
  }

  get(blockHash) {
    return this.pendingBlocks.get(blockHash);
  }

  getCurrentPendingSize() {
    return this.pendingBlocks.getStats();
  }

  delete(blockHash) {
    this.pendingBlocks.del(blockHash);
  }

  clear() {
    this.pendingBlocks.flushAll();
  }
}

module.exports = BlockPool;