/***
 * This is a SINGLETON object
 */
class Config {
  constructor() {
    if (Config._instance) {
      // this allows the constructor to be called multiple times
      // and refer to the same instance. Another option is to
      // throw an error.
      return Config._instance;
    }
    Config._instance = this;

    // Maximum number of transactions that can be present in a block and transaction pool
    this.PENDING_TRANSACTION_THRESHOLD = 50;
    // Maximum number of GENERAL request before the node bundles them in a transaction and then broadcast it to peers
    this.PENDING_REQUEST_THRESHOLD = 1;
    // Maximum number of PRIORITY request before the node bundles them in a transaction and then broadcast it to peers
    this.PENDING_PRIORITY_THRESHOLD = 3;

    // Total number of nodes in the network
    this.NUMBER_OF_NODES = 4;
    // Total number of tolerable faulty nodes in the network
    this.NUMBER_OF_FAULTY_NODES = 1;
    // Mininum number of positive votes required for the message/block to be valid
    this.MIN_APPROVALS = 2 * this.NUMBER_OF_FAULTY_NODES + 1;

    // Choose only one TRUE option below
    this.EDDSA_FLAG = true;
    this.HMAC_FLAG = false;
    this.NO_SIG_FLAG = false;

    this.BENCHMARK_FLAG = true; // set true during benchmarking
    this.DEBUGGING_FLAG = false; // set true to display log
  }

  setTransactionThreshold(newThreshold) {
    this.PENDING_TRANSACTION_THRESHOLD = newThreshold;
  }

  setRequestThreshold(newThreshold) {
    this.PENDING_REQUEST_THRESHOLD = newThreshold;
  }

  setPriorityThreshold(newThreshold) {
    this.PENDING_PRIORITY_THRESHOLD = newThreshold;
  }

  getTransactionThreshold() {
    return this.PENDING_TRANSACTION_THRESHOLD;
  }

  getRequestThreshold() {
    return this.PENDING_REQUEST_THRESHOLD;
  }

  getPriorityThreshold() {
    return this.PENDING_PRIORITY_THRESHOLD;
  }

  getNumberOfNodes() {
    return this.NUMBER_OF_NODES;
  }

  getMinApprovals() {
    return this.MIN_APPROVALS;
  }

  isEDDSA() {
    return this.EDDSA_FLAG;
  }

  isHMAC() {
    return this.HMAC_FLAG;
  }

  isNOSIG() {
    return this.NO_SIG_FLAG;
  }

  isBenchmarking() {
    return this.BENCHMARK_FLAG;
  }

  isDebugging() {
    return this.DEBUGGING_FLAG;
  }
}

module.exports = Config;
