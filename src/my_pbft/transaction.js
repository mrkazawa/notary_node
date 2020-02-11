const CryptoUtil = require("./crypto_util");

const { EDDSA_FLAG, HMAC_FLAG, NO_SIG_FLAG } = require("./config");

class Transaction {
  constructor(data, wallet) {
    this.id = CryptoUtil.generateId();
    this.from = wallet.getPublicKey();
    this.input = { data: data, timestamp: Date.now() };
    this.hash = CryptoUtil.hash(this.input);
    this.signature = wallet.sign(this.hash);
  }

  static verifyTransaction(transaction) {
    if (EDDSA_FLAG) {
      return CryptoUtil.verifySignature(
        transaction.from,
        transaction.signature,
        CryptoUtil.hash(transaction.input)
      );
    } else if (HMAC_FLAG) {
      return CryptoUtil.verifyDigest(
        "secret",
        transaction.signature,
        CryptoUtil.hash(transaction.input)
      );
    } else if (NO_SIG_FLAG) {
      return true;
    }
  }
}

module.exports = Transaction;
