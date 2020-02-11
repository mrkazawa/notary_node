const HashMap = require('hashmap');

const CryptoUtil = require("./crypto_util");
const { MIN_APPROVALS, EDDSA_FLAG, HMAC_FLAG } = require("./config");

class PreparePool {
  constructor() {
    if (PreparePool._instance) {
      throw new Error('PreparePool already has an instance!!!');
    }
    PreparePool._instance = this;

    this.pendingPrepareMessages = new HashMap();
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

    return (prepareMap.size >= MIN_APPROVALS);
  }

  isInitiated(blockHash) {
    return this.pendingPrepareMessages.has(blockHash);
  }

  isExist(prepare) {
    let prepareMap = this.pendingPrepareMessages.get(prepare.blockHash);
    return prepareMap.has(prepare.publicKey);
  }

  isValidPrepare(prepare) {
    if (EDDSA_FLAG) {
      return CryptoUtil.verifySignature(
        prepare.publicKey,
        prepare.signature,
        prepare.blockHash
      );
    } else if (HMAC_FLAG) {
      return CryptoUtil.verifyDigest(
        "secret",
        prepare.signature,
        prepare.blockHash
      );
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
