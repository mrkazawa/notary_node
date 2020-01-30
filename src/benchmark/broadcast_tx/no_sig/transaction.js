const CryptoUtil = require("./crypto_util");

class Transaction {
  constructor(data, wallet) {
    this.id = CryptoUtil.generateId();
    this.from = wallet.getPublicKey();
    this.input = { data: data, timestamp: Date.now() };
    this.hash = CryptoUtil.hash(this.input);
  }
}

module.exports = Transaction;
