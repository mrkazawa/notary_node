const HashMap = require('hashmap');

const CryptoUtil = require("./crypto_util");
const { MIN_APPROVALS } = require("./config");

class PreparePool {
  constructor() {
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
    let prepare = {
      blockHash: block.hash,
      publicKey: wallet.getPublicKey(),
      signature: wallet.sign(block.hash)
    };

    return prepare;
  }

  addPrepare(prepare) {
    if (!this.pendingPrepareMessages.has(prepare.blockHash)) {
      return false;
    }

    let prepareMap = this.pendingPrepareMessages.get(prepare.blockHash);
    prepareMap.set(prepare.publicKey, prepare.signature);
    this.pendingPrepareMessages.set(prepare.blockHash, prepareMap);

    if (prepareMap.size >= MIN_APPROVALS) {
      return true;
    } else {
      return false;
    }
  }

  get(hash) {
    return this.pendingPrepareMessages.get(hash).entries();
  }

  existingPrepare(prepare) {
    if (!this.pendingPrepareMessages.has(prepare.blockHash)) {
      return false;
    }

    let prepareMap = this.pendingPrepareMessages.get(prepare.blockHash);
    return prepareMap.has(prepare.publicKey);
  }

  isValidPrepare(prepare) {
    return CryptoUtil.verifySignature(
      prepare.publicKey,
      prepare.signature,
      prepare.blockHash
    );
  }
}

module.exports = PreparePool;
