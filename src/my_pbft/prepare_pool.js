const HashMap = require('hashmap');

const CryptoUtil = require("./crypto_util");
const Config = require("./config");
const config = new Config();

class PreparePool {
  constructor() {
    if (PreparePool._instance) {
      throw new Error('PreparePool already has an instance!!!');
    }
    PreparePool._instance = this;

    this.pendingPrepareMessages = new HashMap();
    this.finalPrepareMessages = new Set();
  }

  initPrepare(block, wallet) {
    if (this.pendingPrepareMessages.has(block.hash)) {
      console.log("ERROR! Prepare Pool should be empty");
      process.exitCode = 1;
    }

    let prepare = this.createPrepare(block, wallet);
    let prepareMap = new HashMap();
    prepareMap.set(prepare.publicKey, prepare.signature);
    this.pendingPrepareMessages.set(prepare.blockHash, prepareMap);

    return prepare;
  }

  createPrepare(block, wallet) {
    return {
      blockHash: block.hash,
      publicKey: wallet.getPublicKey(),
      signature: wallet.sign(block.hash)
    };
  }

  add(prepare) {
    let prepareMap = this.pendingPrepareMessages.get(prepare.blockHash);
    prepareMap.set(prepare.publicKey, prepare.signature);
    this.pendingPrepareMessages.set(prepare.blockHash, prepareMap);

    return (prepareMap.size >= config.getMinApprovals());
  }

  isInitiated(blockHash) {
    return this.pendingPrepareMessages.has(blockHash);
  }

  isExist(prepare) {
    let prepareMap = this.pendingPrepareMessages.get(prepare.blockHash);
    return prepareMap.has(prepare.publicKey);
  }

  finalize(blockHash) {
    this.finalPrepareMessages.add(blockHash);
  }

  isFinalized(blockHash) {
    return this.finalPrepareMessages.has(blockHash);
  }

  isValidPrepare(prepare) {
    if (config.isEDDSA()) {
      return CryptoUtil.verifySignature(
        prepare.publicKey,
        prepare.signature,
        prepare.blockHash
      );
    } else if (config.isHMAC()) {
      return CryptoUtil.verifyDigest(
        "secret",
        prepare.signature,
        prepare.blockHash
      );
    } else if (config.isNOSIG()) {
      return true;
    }
  }

  get(blockHash) {
    return this.pendingPrepareMessages.get(blockHash).entries();
  }

  delete(blockHash) {
    this.pendingPrepareMessages.delete(blockHash);
  }
}

module.exports = PreparePool;
