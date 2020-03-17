const HashMap = require('hashmap');

const Transaction = require('../chains/transaction');

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

  getCurrentPendingSize() {
    return this.pendingTransactions.size;
  }

  delete(transactionId) {
    this.pendingTransactions.delete(transactionId);
  }
}

module.exports = TransactionPool;