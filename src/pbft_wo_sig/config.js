// Maximum number of transactions that can be present in a block and transaction pool
const TRANSACTION_THRESHOLD = 1000;

// Total number of nodes in the network
// FIXME: Investigate why this PBFT cannot work if more than 3 nodes
const NUMBER_OF_NODES = 3;

// Total number of tolerable faulty nodes in the network
const NUMBER_OF_FAULTY_NODES = 1;

// Mininum number of positive votes required for the message/block to be valid
//const MIN_APPROVALS = 2 * (NUMBER_OF_NODES / 3) + 1;
const MIN_APPROVALS = 2 * NUMBER_OF_FAULTY_NODES + 1;

module.exports = {
  TRANSACTION_THRESHOLD,
  NUMBER_OF_NODES,
  MIN_APPROVALS
};
