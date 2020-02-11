const HashMap = require('hashmap');

const CryptoUtil = require("./crypto_util");
const { MIN_APPROVALS, EDDSA_FLAG, HMAC_FLAG, NO_SIG_FLAG } = require("./config");

class CommitPool {
  constructor() {
    if (CommitPool._instance) {
      throw new Error('CommitPool already has an instance!!!');
    }
    CommitPool._instance = this;

    this.pendingCommitMessages = new HashMap();
    this.finalCommitMessages = new Set();
  }

  initCommit(prepare, wallet) {
    if (this.pendingCommitMessages.has(prepare.blockHash)) {
      console.log("ERROR! Commit Pool should be empty");
      process.exitCode = 1;
    }

    let commit = this.createCommit(prepare, wallet);
    let commitMap = new HashMap();
    commitMap.set(commit.publicKey, commit.signature);
    this.pendingCommitMessages.set(commit.blockHash, commitMap);

    return commit;
  }

  createCommit(prepare, wallet) {
    return {
      blockHash: prepare.blockHash,
      publicKey: wallet.getPublicKey(),
      signature: wallet.sign(prepare.blockHash)
    };
  }

  add(commit) {
    let commitMap = this.pendingCommitMessages.get(commit.blockHash);
    commitMap.set(commit.publicKey, commit.signature);
    this.pendingCommitMessages.set(commit.blockHash, commitMap);

    return (commitMap.size >= MIN_APPROVALS);
  }

  isInitiated(blockHash) {
    return this.pendingCommitMessages.has(blockHash);
  }

  isExist(commit) {
    let commitMap = this.pendingCommitMessages.get(commit.blockHash);
    return commitMap.has(commit.publicKey);
  }

  finalize(blockHash) {
    this.finalCommitMessages.add(blockHash);
  }

  isFinalized(blockHash) {
    return this.finalCommitMessages.has(blockHash);
  }

  isValidCommit(commit) {
    if (EDDSA_FLAG) {
      return CryptoUtil.verifySignature(
        commit.publicKey,
        commit.signature,
        commit.blockHash
      );
    } else if (HMAC_FLAG) {
      return CryptoUtil.verifyDigest(
        "secret",
        commit.signature,
        commit.blockHash
      );
    } else if (NO_SIG_FLAG) {
      return true;
    }
  }

  get(blockHash) {
    return this.pendingCommitMessages.get(blockHash).entries();
  }

  delete(blockHash) {
    this.pendingCommitMessages.delete(blockHash);
  }
}

module.exports = CommitPool;
