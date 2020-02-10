// Maximum number of transactions that can be present in a block and transaction pool
const PENDING_TRANSACTION_THRESHOLD = 10;

// Maximum number of request before the node bundles them in a transaction
// and then broadcast it to peers
const PENDING_REQUEST_THRESHOLD = 50;

// Total number of nodes in the network
const NUMBER_OF_NODES = 3;

// Total number of tolerable faulty nodes in the network
const NUMBER_OF_FAULTY_NODES = 1;

// Mininum number of positive votes required for the message/block to be valid
const MIN_APPROVALS = 2 * NUMBER_OF_FAULTY_NODES + 1;

// Choose only one TRUE option below:
const EDDSA_FLAG = true;
const HMAC_FLAG = false;
const NO_SIG_FLAG = false;

// Set to TRUE during benchmarking
const BENCHMARK_FLAG = true;

module.exports = {
  PENDING_TRANSACTION_THRESHOLD,
  PENDING_REQUEST_THRESHOLD,
  NUMBER_OF_NODES,
  MIN_APPROVALS,
  EDDSA_FLAG,
  HMAC_FLAG,
  NO_SIG_FLAG,
  BENCHMARK_FLAG
};
