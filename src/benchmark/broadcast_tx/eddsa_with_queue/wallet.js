const CryptoUtil = require("./crypto_util");
const Transaction = require("./transaction");

class Wallet {
  // The secret phase is passed an argument when creating a wallet
  // The keypair generated for a secret phrase is always the same
  constructor(secret) {
    this.keyPair = CryptoUtil.generateKeyPair(secret);
    this.publicKey = this.keyPair.getPublic("hex");
  }

  toString() {
    return `Wallet publicKey: ${this.publicKey.toString()}`;
  }

  sign(dataHash) {
    return this.keyPair.sign(dataHash).toHex();
  }

  createTransaction(data) {
    return new Transaction(data, this);
  }

  getPublicKey() {
    return this.publicKey;
  }
}

module.exports = Wallet;
