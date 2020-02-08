const HashMap = require('hashmap');

const Transaction = require("./transaction");
const { PENDING_TRANSACTION_THRESHOLD } = require("./config");

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
    if (this.pendingTransactions.size >= PENDING_TRANSACTION_THRESHOLD) {
      return true;
    } else {
      return false;
    }
  }

  getAllPendingTransactions() {
    return this.pendingTransactions.entries();
  }

  isValidTransaction(transaction) {
    return Transaction.verifyTransaction(transaction);
  }

  exist(transaction) {
    return this.pendingTransactions.has(transaction.id);
  }

  clear() {
    this.pendingTransactions.clear();
  }
}

module.exports = TransactionPool;
