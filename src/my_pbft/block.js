const CryptoUtil = require("./crypto_util");

const { EDDSA_FLAG, HMAC_FLAG } = require("./config");

class Block {
  constructor(
    timestamp,
    lastHash,
    hash,
    data,
    proposer,
    signature,
    sequenceNo
  ) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.proposer = proposer;
    this.signature = signature;
    this.sequenceNo = sequenceNo;
  }

  static toString() {
    return `Block - 
        Timestamp   : ${this.timestamp}
        Last Hash   : ${this.lastHash}
        Hash        : ${this.hash}
        Data        : ${this.data}
        Proposer    : ${this.proposer}
        Signature   : ${this.signature}
        Sequence No : ${this.sequenceNo}`;
  }

  // The first block by default will the genesis block
  // this function generates the genesis block with random values
  static genesis() {
    return new this(
      `genesis time`, // timestamp
      "----", // lastHash
      "genesis-hash", // hash
      [], // data
      "P4@P@53R", // proposer
      "SIGN", // signature
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
      1 + lastBlock.sequenceNo
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
    if (EDDSA_FLAG) {
      return CryptoUtil.verifySignature(
        block.proposer,
        block.signature,
        this.calculateBlockHash(block.lastHash, block.data)
      );
    } else if (HMAC_FLAG) {
      return CryptoUtil.verifyDigest(
        "secret",
        block.signature,
        this.calculateBlockHash(block.lastHash, block.data)
      );
    }
  }

  static verifyBlockProposer(block, proposer) {
    return (block.proposer == proposer);
  }
}

module.exports = Block;
