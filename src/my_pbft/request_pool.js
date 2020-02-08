const HashMap = require('hashmap');

const CryptoUtil = require("./crypto_util");
const { PENDING_REQUEST_THRESHOLD, BENCHMARK_FLAG } = require("./config");

class RequestPool {
  constructor() {
    if (RequestPool._instance) {
      throw new Error('RequestPool already has an instance!!!');
    }
    RequestPool._instance = this;

    this.pendingRequests = new HashMap();
  }

  add(request) {
    if (BENCHMARK_FLAG) {
      let id = CryptoUtil.generateId();
      this.pendingRequests.set(id, request);
    } else {
      let hash = CryptoUtil.hash(request);
      if (this.pendingRequests.has(hash)) {
        return false;
      }
      this.pendingRequests.set(hash, request);
    }

    if (this.pendingRequests.size >= PENDING_REQUEST_THRESHOLD) {
      return true;
    } else {
      return false;
    }
  }

  getAllPendingRequests() {
    return this.pendingRequests.entries();
  }

  clear() {
    this.pendingRequests.clear();
  }
}

module.exports = RequestPool;
