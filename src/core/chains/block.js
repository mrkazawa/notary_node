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
      0 // sequenceNo
    );
  }

  static createBlock(lastBlock, data, wallet) {
    const lastHash = lastBlock.hash;
    let hash = this.calculateBlockHash(lastHash, data);
    let proposer = wallet.getPublicKey();
    let signature = wallet.sign(hash);
    let timestamp = Date.now();
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

  static calculateBlockHash(lastHash, data) {
    return CryptoUtil.hash(`${lastHash}${data}`);
  }

  static verifyBlockHash(block, hash) {
    const { lastHash, data } = block;
    return (hash === this.calculateBlockHash(lastHash, data));
  }

  static verifyBlockSignature(block) {
    if (config.isEDDSA()) {
      return CryptoUtil.verifySignature(
        block.proposer,
        block.signature,
        this.calculateBlockHash(block.lastHash, block.data)
      );
    } else if (config.isHMAC()) {
      return CryptoUtil.verifyDigest(
        'secret',
        block.signature,
        this.calculateBlockHash(block.lastHash, block.data)
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