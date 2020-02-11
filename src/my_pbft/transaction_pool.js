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
    return (this.pendingTransactions.size >= PENDING_TRANSACTION_THRESHOLD);
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
