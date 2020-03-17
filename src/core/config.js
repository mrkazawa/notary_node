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

    // Maximum number of GENERAL request before the node bundles them in a transaction and then broadcast it to peers
    this.PENDING_REQUEST_THRESHOLD = 500;

    // How long the system has to wait before it starts to delete old messages
    this.OLD_MESSAGES_TIMEOUT = 10;

    // How many temporary past PBFT messages that the system has to keep before the garbage collector deletes them
    this.NUMBER_OF_TEMP_MESSAGES = 40;

    // How long the period of block generation (in milliseconds)
    this.BLOCK_INTERVAL = 2000; // every 1 second
    // How long the period of garbage collector process (in milliseconds)
    this.GARBAGE_INTERVAL = this.OLD_MESSAGES_TIMEOUT * this.BLOCK_INTERVAL;

    // Total number of nodes in the network
    this.NUMBER_OF_NODES = 4;
    // Total number of tolerable faulty nodes in the network
    this.NUMBER_OF_FAULTY_NODES = 1;
    // Mininum number of positive votes required for the message/block to be valid
    this.MIN_APPROVALS = 2 * this.NUMBER_OF_FAULTY_NODES + 1;

    // Choose only one TRUE option below
    this.EDDSA_FLAG = false;
    this.HMAC_FLAG = false;
    this.NO_SIG_FLAG = true;

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

  getNumberOfTempMessages() {
    return this.NUMBER_OF_TEMP_MESSAGES;
  }

  getOldMessagesTimeout() {
    return this.OLD_MESSAGES_TIMEOUT;
  }

  getBlockInterval() {
    return this.BLOCK_INTERVAL;
  }

  getGarbageInterval() {
    return this.GARBAGE_INTERVAL;
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
}

module.exports = Config;