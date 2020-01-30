const HashMap = require('hashmap');

const Transaction = require("./transaction");
const { PENDING_TRANSACTION_THRESHOLD } = require("./config");

class TransactionPool {
  constructor() {
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

  exist(transaction) {
    return this.pendingTransactions.has(transaction.id);
  }

  clear() {
    this.pendingTransactions.clear();
    //console.log("TRANSACTION POOL CLEARED");
  }
}

module.exports = TransactionPool;
