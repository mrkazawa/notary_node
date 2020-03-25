const CryptoUtil = require('../utils/crypto_util');
const Config = require('../config');
const config = new Config();

class Block {
  constructor(
    timestamp,
    lastHash,
    hash,
    data,
    proposer,
    signature,
    sequenceId
  ) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.proposer = proposer;
    this.signature = signature;
    this.sequenceId = sequenceId;
  }

  static genesis() {
    return new this(
      `genesis time`, // timestamp
      '----', // lastHash
      'genesis-hash', // hash
      [], // data
      'P4@P@53R', // proposer
      'SIGN', // signature
      0 // sequenceId
    );
  }

  static createBlock(lastBlock, data, wallet) {
    const lastHash = lastBlock.hash;
    let timestamp = Date.now();
    let hash = this.calculateBlockHash(lastHash, data, timestamp);
    let proposer = wallet.getPublicKey();
    let signature = wallet.sign(hash);
    return new this(
      timestamp,
      lastHash,
      hash,
      data,
      proposer,
      signature,
      1 + lastBlock.sequenceId
    );
  }

  static calculateBlockHash(lastHash, data, timestamp) {
    return CryptoUtil.hash(`${lastHash}${data}${timestamp}`);
  }

  static verifyBlockSignature(block) {
    if (config.isEDDSA()) {
      return CryptoUtil.verifySignature(
        block.proposer,
        block.signature,
        this.calculateBlockHash(block.lastHash, block.data, block.timestamp)
      );
    } else if (config.isHMAC()) {
      return CryptoUtil.verifyDigest(
        'secret',
        block.signature,
        this.calculateBlockHash(block.lastHash, block.data, block.timestamp)
      );
    } else if (config.isNOSIG()) {
      return true;
    }
  }

  static verifyBlockProposer(block, proposer) {
    return (block.proposer == proposer);
  }
}

module.exports = Block;