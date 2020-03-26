const HashMap = require('hashmap');
const NodeCache = require("node-cache");
const chalk = require('chalk');
const log = console.log;

const CryptoUtil = require('../utils/crypto_util');
const Config = require('../config');
const config = new Config();

// default TTL (Time-To-Live) in seconds
// when it expires, the entry will be deleted
const DEFAULT_TTL = 30;

// check interval to check for TTL in seconds
// shorter duration is better,
// longer duration cause the system to take time to delete entries
const CHECK_PERIOD = 10;

class PBFTMessagePool {
  constructor() {
    this.pendingPBFTMessages = new HashMap();

    this.completedPBFTMessages = new NodeCache({
      stdTTL: DEFAULT_TTL,
      checkperiod: CHECK_PERIOD
    });

    if (config.isDebugging()) {
      this.completedPBFTMessages.on("expired", function (key, value) {
        log(chalk.bgGreen.black(`NEW EVENT: ${key} expired from PBFT Pool`));
      });
    }
  }

  init(blockHash, sequenceId, wallet) {
    if (this.pendingPBFTMessages.has(blockHash)) {
      log(chalk.bgRed.black(`FATAL ERROR! PBFT Message Pool should be empty!`));
      process.exitCode = 1;
    }

    let message = this.createMessage(blockHash, sequenceId, wallet);
    let valueMap = new Map();
    valueMap.set(message.from, message.signature);
    this.pendingPBFTMessages.set(message.blockHash, valueMap);

    return message;
  }

  createMessage(blockHash, sequenceId, wallet) {
    return {
      blockHash: blockHash,
      sequenceId: sequenceId,
      from: wallet.getPublicKey(),
      signature: wallet.sign(blockHash)
    };
  }

  add(message) {
    let valueMap = this.pendingPBFTMessages.get(message.blockHash);
    valueMap.set(message.from, message.signature);
    this.pendingPBFTMessages.set(message.blockHash, valueMap);

    return (valueMap.size >= config.getMinApprovals());
  }

  isInitiated(blockHash) {
    return this.pendingPBFTMessages.has(blockHash);
  }

  isExistFrom(blockHash, from) {
    let valueMap = this.pendingPBFTMessages.get(blockHash);
    return valueMap.has(from);
  }

  finalize(blockHash) {
    this.completedPBFTMessages.set(blockHash);
  }

  isCompleted(blockHash) {
    return this.completedPBFTMessages.has(blockHash);
  }

  isValid(message) {
    if (config.isEDDSA()) {
      return CryptoUtil.verifySignature(
        message.from,
        message.signature,
        message.blockHash
      );
    } else if (config.isHMAC()) {
      return CryptoUtil.verifyDigest(
        'secret',
        message.signature,
        message.blockHash
      );
    } else if (config.isNOSIG()) {
      return true;
    }
  }

  delete(blockHash) {
    let valueMap = this.pendingPBFTMessages.get(blockHash);
    valueMap.clear();
    this.pendingPBFTMessages.delete(blockHash);
  }

  getAllCompleted() {
    return this.completedPBFTMessages;
  }

  deleteCompleted(blockHash) {
    this.completedPBFTMessages.del(blockHash);
  }

  getCurrentPendingSize() {
    return this.pendingPBFTMessages.size;
  }

  getCurrentCompletedSize() {
    return this.completedPBFTMessages.getStats().keys;
  }
}

module.exports = PBFTMessagePool;