const HashMap = require('hashmap');

const CryptoUtil = require("./crypto_util");
const { MIN_APPROVALS } = require("./config");

class CommitPool {
  constructor() {
    if (CommitPool._instance) {
      throw new Error('CommitPool already has an instance!!!');
    }
    CommitPool._instance = this;

    this.pendingCommitMessages = new HashMap();
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

  addCommit(commit) {
    if (!this.pendingCommitMessages.has(commit.blockHash)) {
      return false;
    }

    let commitMap = this.pendingCommitMessages.get(commit.blockHash);
    commitMap.set(commit.publicKey, commit.signature);
    this.pendingCommitMessages.set(commit.blockHash, commitMap);

    if (commitMap.size >= MIN_APPROVALS) {
      return true;
    } else {
      return false;
    }
  }

  get(hash) {
    return this.pendingCommitMessages.get(hash).entries();
  }

  existingCommit(commit) {
    if (!this.pendingCommitMessages.has(commit.blockHash)) {
      return false;
    }

    let commitMap = this.pendingCommitMessages.get(commit.blockHash);
    return commitMap.has(commit.publicKey);
  }

  isValidCommit(commit) {
    return CryptoUtil.verifySignature(
      commit.publicKey,
      commit.signature,
      commit.blockHash
    );
  }

  clear() {
    this.pendingCommitMessages.clear();
  }
}

module.exports = CommitPool;
