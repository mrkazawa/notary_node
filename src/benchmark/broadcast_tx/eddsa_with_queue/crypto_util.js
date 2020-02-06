const EDDSA = require("elliptic").eddsa;
const eddsa = new EDDSA("ed25519");
const uuidV1 = require("uuid/v1");
const SHA256 = require("crypto-js/sha256");

class CryptoUtil {
  static generateKeyPair(secret) {
    return eddsa.keyFromSecret(secret);
  }

  static generateId() {
    return uuidV1();
  }

  static hash(data) {
    return SHA256(JSON.stringify(data)).toString();
  }

  static verifySignature(publicKey, signature, dataHash) {
    return eddsa.keyFromPublic(publicKey).verify(dataHash, signature);
  }
}

module.exports = CryptoUtil;
