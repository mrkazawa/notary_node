const EDDSA = require('elliptic').eddsa;
const eddsa = new EDDSA('ed25519');
const uuidV1 = require('uuid/v1');
const SHA256 = require('crypto-js/sha256');
const hmacSHA256 = require('crypto-js/hmac-sha256');
const Base64 = require('crypto-js/enc-base64');

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

  static generateDigest(secretKey, dataHash) {
    return Base64.stringify(hmacSHA256(dataHash, secretKey));
  }

  static verifyDigest(secretKey, signature, dataHash) {
    let calculatedSignature = this.generateDigest(secretKey, dataHash);
    return (signature === calculatedSignature);
  }
}

module.exports = CryptoUtil;