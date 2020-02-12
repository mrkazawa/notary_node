const HashMap = require('hashmap');

const Transaction = require("./transaction");
const Config = require("./config");
const config = new Config();

class TransactionPool {
  constructor() {
    if (TransactionPool._instance) {
      throw new Error('TransactionPool already has an instance!!!');
    }
    TransactionPool._instance = this;

    this.pendingTransactions = new HashMap();
  }

  add(transaction) {
    this.pendingTransactions.set(transaction.id, transaction);
    return (this.pendingTransactions.size >= config.getTransactionThreshold());
  }

  isExist(transaction) {
    return this.pendingTransactions.has(transaction.id);
  }

  isValidTransaction(transaction) {
    return Transaction.verifyTransaction(transaction);
  }

  getAllPendingTransactions() {
    return this.pendingTransactions.entries();
  }

  delete(transactionId) {
    this.pendingTransactions.delete(transactionId);
  }
}

module.exports = TransactionPool;
