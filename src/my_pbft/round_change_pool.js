const HashMap = require('hashmap');

const CryptoUtil = require("./crypto_util");
const Config = require("./config");
const config = new Config();

class RoundChangePool {
  constructor() {
    if (RoundChangePool._instance) {
      throw new Error('MessagePool already has an instance!!!');
    }
    RoundChangePool._instance = this;

    this.pendingRoundChangeMessages = new HashMap();
    this.finalRoundChangeMessages = new Set();
  }

  initRoundChange(commit, wallet) {
    if (this.pendingRoundChangeMessages.has(commit.blockHash)) {
      console.log("ERROR! Round Change Pool should be empty");
      process.exitCode = 1;
    }

    let roundChange = this.createRoundChange(commit, wallet);
    let roundChangeMap = new HashMap();
    roundChangeMap.set(roundChange.publicKey, roundChange.signature);
    this.pendingRoundChangeMessages.set(roundChange.blockHash, roundChangeMap);

    return roundChange;
  }

  createRoundChange(commit, wallet) {
    return {
      blockHash: commit.blockHash,
      publicKey: wallet.getPublicKey(),
      signature: wallet.sign(commit.blockHash)
    };
  }

  add(roundChange) {
    let roundChangeMap = this.pendingRoundChangeMessages.get(roundChange.blockHash);
    roundChangeMap.set(roundChange.publicKey, roundChange.signature);
    this.pendingRoundChangeMessages.set(roundChange.blockHash, roundChangeMap);

    return (roundChangeMap.size >= config.getMinApprovals());
  }

  isInitiated(blockHash) {
    return this.pendingRoundChangeMessages.has(blockHash);
  }

  isExist(roundChange) {
    let roundChangeMap = this.pendingRoundChangeMessages.get(roundChange.blockHash);
    return roundChangeMap.has(roundChange.publicKey);
  }

  finalize(blockHash) {
    this.finalRoundChangeMessages.add(blockHash);
  }

  isFinalized(blockHash) {
    return this.finalRoundChangeMessages.has(blockHash);
  }

  isValidRoundChange(roundChange) {
    if (config.isEDDSA()) {
      return CryptoUtil.verifySignature(
        roundChange.publicKey,
        roundChange.signature,
        roundChange.blockHash
      );
    } else if (config.isHMAC()) {
      return CryptoUtil.verifyDigest(
        "secret",
        roundChange.signature,
        roundChange.blockHash
      );
    } else if (config.isNOSIG()) {
      return true;
    }
  }

  delete(blockHash) {
    this.pendingRoundChangeMessages.delete(blockHash);
  }
}

module.exports = RoundChangePool;
