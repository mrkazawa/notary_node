const CryptoUtil = require("./crypto_util");

const Config = require("./config");
const config = new Config();

class Transaction {
  constructor(data, wallet) {
    this.id = CryptoUtil.generateId();
    this.from = wallet.getPublicKey();
    this.input = { data: data, timestamp: Date.now() };
    this.hash = CryptoUtil.hash(this.input);
    this.signature = wallet.sign(this.hash);
  }

  static verifyTransaction(transaction) {
    if (config.isEDDSA()) {
      return CryptoUtil.verifySignature(
        transaction.from,
        transaction.signature,
        CryptoUtil.hash(transaction.input)
      );
    } else if (config.isHMAC()) {
      return CryptoUtil.verifyDigest(
        "secret",
        transaction.signature,
        CryptoUtil.hash(transaction.input)
      );
    } else if (config.isNOSIG()) {
      return true;
    }
  }
}

module.exports = Transaction;
