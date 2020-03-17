const HashMap = require('hashmap');
const chalk = require('chalk');
const log = console.log;

const CryptoUtil = require('../utils/crypto_util');
const Config = require('../config');
const config = new Config();

class PBFTMessagePool {
  constructor() {
    this.pendingPBFTMessages = new HashMap();
    this.completedPBFTMessages = new Set();
  }

  init(blockHash, sequenceId, wallet) {
    if (this.pendingPBFTMessages.has(blockHash)) {
      log(chalk.red(`ERROR! PBFT Message Pool should be empty!`));
      process.exitCode = 1;
    }

    let message = this.createMessage(blockHash, sequenceId, wallet);
    let messageMap = new HashMap();
    messageMap.set(message.from, message.signature);
    this.pendingPBFTMessages.set(message.blockHash, messageMap);

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
    let messageMap = this.pendingPBFTMessages.get(message.blockHash);
    messageMap.set(message.from, message.signature);
    this.pendingPBFTMessages.set(message.blockHash, messageMap);

    return (messageMap.size >= config.getMinApprovals());
  }

  isInitiated(blockHash) {
    return this.pendingPBFTMessages.has(blockHash);
  }

  isExistFrom(blockHash, from) {
    let messageMap = this.pendingPBFTMessages.get(blockHash);
    return messageMap.has(from);
  }

  finalize(blockHash) {
    this.completedPBFTMessages.add(blockHash);
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
    this.pendingPBFTMessages.delete(blockHash);
  }

  getAllCompleted() {
    return this.completedPBFTMessages;
  }

  deleteCompleted(blockHash) {
    this.completedPBFTMessages.delete(blockHash);
  }

  getCurrentPendingSize() {
    return this.pendingPBFTMessages.size;
  }

  getCurrentCompletedSize() {
    return this.completedPBFTMessages.size;
  }
}

module.exports = PBFTMessagePool;