const HashMap = require('hashmap');

const CryptoUtil = require('../utils/crypto_util');
const Config = require('../config');
const config = new Config();

class RequestPool {
  constructor() {
    this.pendingRequests = new HashMap();
  }

  add(request) {
    if (config.isBenchmarking()) {
      let id = CryptoUtil.generateId();
      this.pendingRequests.set(id, request);
    
    } else {
      let hash = CryptoUtil.hash(request);
      if (this.pendingRequests.has(hash)) {
        return false;
      }
      this.pendingRequests.set(hash, request);
    }

    return (this.pendingRequests.size >= config.getRequestThreshold(request.priority));
  }

  getAllPendingRequests() {
    return this.pendingRequests.entries();
  }

  clear() {
    this.pendingRequests.clear();
  }

  getCurrentPendingSize() {
    return this.pendingRequests.size;
  }
}

module.exports = RequestPool;