const HashMap = require('hashmap');

const CryptoUtil = require("./crypto_util");
const { MIN_APPROVALS } = require("./config");

class RoundChangePool {
  constructor() {
    if (RoundChangePool._instance) {
      throw new Error('MessagePool already has an instance!!!');
    }
    RoundChangePool._instance = this;

    this.pendingRoundChangeMessages = new HashMap();
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

    return (roundChangeMap.size >= MIN_APPROVALS);
  }

  isInitiated(roundChange) {
    return this.pendingRoundChangeMessages.has(roundChange.blockHash);
  }

  isExist(roundChange) {
    let roundChangeMap = this.pendingRoundChangeMessages.get(roundChange.blockHash);
    return roundChangeMap.has(roundChange.publicKey);
  }

  isValidRoundChange(roundChange) {
    return CryptoUtil.verifySignature(
      roundChange.publicKey,
      roundChange.signature,
      roundChange.blockHash
    );
  }

  delete(blockHash) {
    this.pendingRoundChangeMessages.delete(blockHash);
  }
}

module.exports = RoundChangePool;
