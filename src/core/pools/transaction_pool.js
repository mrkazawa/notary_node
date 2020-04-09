const HashMap = require('hashmap');

const Transaction = require('../chains/transaction');
const Config = require('../config');
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
  }

  isExist(transaction) {
    return this.pendingTransactions.has(transaction.id);
  }

  isValidTransaction(transaction) {
    return Transaction.verifyTransaction(transaction);
  }

  getAllPendingTransactions() {
    const MAX_TX_IN_BLOCK = 8000;
    const trimLimit = MAX_TX_IN_BLOCK / config.getRequestThreshold();
    const pendings = this.pendingTransactions.entries();

    if (pendings.length > trimLimit) {
      return pendings.splice(0, trimLimit);
    } else {
      return pendings;
    }
  }

  getCurrentPendingSize() {
    return this.pendingTransactions.size;
  }

  delete(transactionId) {
    this.pendingTransactions.delete(transactionId);
  }
}

module.exports = TransactionPool;