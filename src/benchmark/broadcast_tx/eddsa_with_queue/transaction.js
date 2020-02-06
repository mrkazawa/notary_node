const CryptoUtil = require("./crypto_util");

class Transaction {
  constructor(data, wallet) {
    this.id = CryptoUtil.generateId();
    this.from = wallet.getPublicKey();
    this.input = { data: data, timestamp: Date.now() };
    this.hash = CryptoUtil.hash(this.input);
    this.signature = wallet.sign(this.hash);
  }

  static verifyTransaction(transaction) {
    return CryptoUtil.verifySignature(
      transaction.from,
      transaction.signature,
      CryptoUtil.hash(transaction.input)
    );
  }
}

module.exports = Transaction;
