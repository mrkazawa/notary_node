const HashMap = require('hashmap');

const CryptoUtil = require("./crypto_util");
const Config = require("./config");
const config = new Config();

class PriorityPool {
  constructor() {
    if (PriorityPool._instance) {
      throw new Error('PriorityPool already has an instance!!!');
    }
    PriorityPool._instance = this;

    this.pendingPriorityRequests = new HashMap();
  }

  add(request) {
    if (config.isBenchmarking()) {
      let id = CryptoUtil.generateId();
      this.pendingPriorityRequests.set(id, request);

    } else {
      let hash = CryptoUtil.hash(request);
      if (this.pendingPriorityRequests.has(hash)) {
        return false;
      }
      this.pendingPriorityRequests.set(hash, request);
    }

    return (this.pendingPriorityRequests.size >= config.getPriorityThreshold());
  }

  getAllPendingPriorityRequests() {
    return this.pendingPriorityRequests.entries();
  }

  getAllAndDelete() {
    let requests =  this.pendingPriorityRequests.entries();
    this.pendingPriorityRequests.clear();
    return requests;
  }
}

module.exports = PriorityPool;