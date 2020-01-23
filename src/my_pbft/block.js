// Import SHA256 used for hashing and ChainUtil for verifying signature
const SHA256 = require("crypto-js/sha256");
const ChainUtil = require("./chain-util");

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

  // A function to print the block
  toString() {
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
      `genesis time`,
      "----",
      "genesis-hash",
      [],
      "P4@P@53R",
      "SIGN",
      0
    );
  }

  // creates a block using the passed lastblock, transactions and wallet instance
  static createBlock(lastBlock, data, wallet) {
    let timestamp = Date.now();
    const lastHash = lastBlock.hash;
    let hash = this.calculateBlockHash(timestamp, lastHash, data);
    let proposer = wallet.getPublicKey();
    let signature = wallet.sign(hash);
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

  // hashes the passed values
  static calculateBlockHash(timestamp, lastHash, data) {
    return SHA256(JSON.stringify(`${timestamp}${lastHash}${data}`)).toString();
  }

  // returns the hash of a block
  static getBlockHash(block) {
    const { timestamp, lastHash, data } = block;
    return this.calculateBlockHash(timestamp, lastHash, data);
  }

  // checks if the block is valid
  static verifyBlock(block) {
    return ChainUtil.verifySignature(
      block.proposer,
      block.signature,
      this.calculateBlockHash(block.timestamp, block.lastHash, block.data)
    );
  }

  // verifies the proposer of the block with the passed public key
  static verifyProposer(block, proposer) {
    return (block.proposer == proposer);
  }
}

module.exports = Block;
