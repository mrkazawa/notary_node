const HashMap = require('hashmap');

const CryptoUtil = require("./crypto_util");
const Config = require("./config");
const config = new Config();

class RequestPool {
  constructor() {
    if (RequestPool._instance) {
      throw new Error('RequestPool already has an instance!!!');
    }
    RequestPool._instance = this;

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

    return (this.pendingRequests.size >= config.getRequestThreshold());
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
