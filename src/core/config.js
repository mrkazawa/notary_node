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

    // The list of PBFT message types
    this.MESSAGE_TYPE = {
      transaction: 'TRANSACTION',
      prepare: 'PREPARE',
      pre_prepare: 'PRE_PREPARE',
      commit: 'COMMIT'
    };

    // The list of priority types
    this.PRIORITY_TYPE = {
      high: 1,
      medium: 2,
      low: 3
    };

    // Maximum number of GENERAL request before the node bundles them in a transaction and then broadcast it to peers
    this.PENDING_REQUEST_THRESHOLD = 1;

    // How long the period of block generation (in milliseconds)
    this.BLOCK_INTERVAL = 1000; // every 1 second

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
    this.DYNAMIC_REQUEST_POOL_FLAG = false; // set true to enable dynamic request pool size
  }

  setRequestThreshold(newThreshold) {
    this.PENDING_REQUEST_THRESHOLD = newThreshold;
  }

  getRequestThreshold() {
    return this.PENDING_REQUEST_THRESHOLD;
  }

  getBlockInterval() {
    return this.BLOCK_INTERVAL;
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

  isUsingDynamicRequestPool() {
    return this.DYNAMIC_REQUEST_POOL_FLAG;
  }

  isUsingPriority() {
    return this.PRIORITY_FLAG;
  }
}

module.exports = Config;