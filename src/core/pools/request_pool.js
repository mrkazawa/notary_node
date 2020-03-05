const HashMap = require('hashmap');

const CryptoUtil = require('../utils/crypto_util');
const Config = require('../config');
const config = new Config();

const PRIORITY_LEVEL = {
  low: 3,
  medium: 2,
  high: 1
};

class RequestPool {
  constructor() {
    if (RequestPool._instance) {
      throw new Error('RequestPool already has an instance!!!');
    }
    RequestPool._instance = this;

    this.pendingRequests = new HashMap();

    this.pendingLowPriority = new Set();
    this.pendingMediumPriority = new Set();
    this.pendingHighPriority = new Set();
  }

  add(request) {
    if (config.isBenchmarking()) {
      let id = CryptoUtil.generateId();
      this.pendingRequests.set(id, request);

      if (PRIORITY_LEVEL.low == request.priority) {
        this.pendingLowPriority.add(id);

      } else if (PRIORITY_LEVEL.medium == request.priority) {
        this.pendingMediumPriority.add(id);

      } else if (PRIORITY_LEVEL.high == request.priority) {
        this.pendingHighPriority.add(id);
        
      }
    
    } else {
      let hash = CryptoUtil.hash(request);
      if (this.pendingRequests.has(hash)) {
        return false;
      }
      this.pendingRequests.set(hash, request);
    }

    return (this.pendingRequests.size >= config.getRequestThreshold());
  }

  addToCorrespondingPool() {

  }

  getAllPendingRequests() {
    return this.pendingRequests.entries();
  }

  getAllAndDelete() {
    let requests =  this.pendingRequests.entries();
    this.pendingRequests.clear();
    return requests;
  }
}

module.exports = RequestPool;
