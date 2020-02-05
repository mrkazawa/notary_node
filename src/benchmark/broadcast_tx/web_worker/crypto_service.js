const { workerData, parentPort } = require('worker_threads');

const uuidV1 = require("uuid/v1");
const SHA256 = require("crypto-js/sha256");

const EDDSA = require("elliptic").eddsa;
const eddsa = new EDDSA("ed25519");

let result;

switch (workerData.messageType) {
    case 'get-public-key':
        result = getPublicKey(workerData.secret);
        break;
    case 'generate-id':
        result = generateId();
        break;
    case 'generate-hash':
        result = generateHash(workerData.data);
        break;
    case 'generate-signature':
        result = generateSignature(workerData.dataHash, workerData.secret);
        break;
    case 'verify-signature':
        result = verifySignature(workerData.signature, workerData.dataHash, workerData.publicKey);
        break;
}

parentPort.postMessage(result);

function generateKeyPair(secret) {
    if (secret == undefined) {
        throw new Error('Invalid Secret Input');
    }
    return eddsa.keyFromSecret(secret);
}

function getPublicKey(secret) {
    const keyPair = generateKeyPair(secret);
    return keyPair.getPublic("hex");
}

function generateId() {
    return uuidV1();
}

function generateHash(data) {
    if (data == undefined) {
        throw new Error('Invalid Data Input');
    }
    return SHA256(JSON.stringify(data)).toString();
}

function generateSignature(dataHash, secret) {
    if (dataHash == undefined) {
        throw new Error('Invalid Data Hash Input');
    }
    const keyPair = generateKeyPair(secret);
    return keyPair.sign(dataHash).toHex();
}

function verifySignature(signature, dataHash, publicKey) {
    if (publicKey == undefined) {
        throw new Error('Invalid Public Key Input');
    } else if (signature == undefined) {
        throw new Error('Invalid Signature Input');
    } else if (dataHash == undefined) {
        throw new Error('Invalid Data Hash Input');
    }
    return eddsa.keyFromPublic(publicKey).verify(dataHash, signature);
}