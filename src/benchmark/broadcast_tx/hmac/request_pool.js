const HashMap = require('hashmap');

const CryptoUtil = require("./crypto_util");
const { PENDING_REQUEST_THRESHOLD } = require("./config");

class RequestPool {
  constructor() {
    this.pendingRequests = new HashMap();
  }

  add(request) {
    // To ease our testing, we disable checking of same requests during benchmarking
    // Instead, we generate random id per request
    /*let hash = CryptoUtil.hash(request);
    if (this.pendingRequests.has(hash)) {
      return false;
    }*/
    let hash = CryptoUtil.generateId();

    this.pendingRequests.set(hash, request);
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
    //console.log("REQUEST POOL CLEARED");
  }
}

module.exports = RequestPool;
