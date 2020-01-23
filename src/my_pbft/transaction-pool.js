const NodeCache = require( "node-cache" );

// Import transaction class used for verification
const Transaction = require("./transaction");

// Transaction threshold is the limit or the holding capacity of the nodes
// Once this exceeds a new block is generated
const { TRANSACTION_THRESHOLD } = require("./config");

class TransactionPool {
  constructor() {
    this.transactions = new NodeCache();
  }

  // pushes transactions in the list
  // returns true if it is full
  // else returns false
  addTransaction(transaction) {
    this.transactions.set(transaction.id, transaction);
    let stats = this.transactions.getStats();
    if (stats.keys >= TRANSACTION_THRESHOLD) {
      return true;
    } else {
      return false;
    }
  }

  // wrapper function to verify transactions
  verifyTransaction(transaction) {
    return Transaction.verifyTransaction(transaction);
  }

  // checks if transactions exists or not
  transactionExists(transaction) {
    let value = this.transactions.get(transaction.id);
    return (value != undefined);
  }

  // empties the pool
  clear() {
    //console.log("TRANSACTION POOL CLEARED");
    this.transactions.flushAll();
  }
}

module.exports = TransactionPool;
