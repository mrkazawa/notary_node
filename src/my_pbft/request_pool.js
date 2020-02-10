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

    return (this.pendingRequests.size >= PENDING_REQUEST_THRESHOLD);
  }

  getAllPendingRequests() {
    let requests =  this.pendingRequests.entries();
    this.pendingRequests.clear();
    return requests;
  }
}

module.exports = RequestPool;
