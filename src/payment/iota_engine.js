const Converter = require('@iota/converter');
const Extract = require('@iota/extract-json');
const iota = require('./iota');

const DEPTH = 1;
const MINIMUM_WEIGHT_MAGNITUDE = 1;
const SECURITY_LEVEL = 0;
const SEED = 'SENDER99999999999999999999999999999999999999999999999999999999999999999999999999A';

var iota_engine = {
  getNodeInfo: async function () {
    try {
      return await iota.getNodeInfo();
    } catch (err) {
      return new Error(`Error getting node info: ${err}`);
    }
  },

  convertAsciiToTrytes: function (message) {
    try {
      return Converter.asciiToTrytes(message);
    } catch (err) {
      return new Error(`Error converting ascii to trytes ${err}`);
    }
  },

  sendTx: async function (transfers) {
    try {
      const trytes = await iota.prepareTransfers(SEED, transfers);
      const bundle = await iota.sendTrytes(trytes, DEPTH, MINIMUM_WEIGHT_MAGNITUDE);
      const tailTxHash = bundle[0].hash;

      return tailTxHash;
    } catch (err) {
      return new Error(`Error sending Tx: ${err}`);
    }
  },

  readTxMessage: async function (tailTxHash) {
    try {
      const bundle = await iota.getBundle(tailTxHash);
      return JSON.parse(Extract.extractJson(bundle));
    } catch (err) {
      return new Error(`Error reading Tx: ${err}`);
    }
  },

  generateAddress: async function () {
    try {
      return await iota.getNewAddress(SEED, {
        index: 0,
        securityLevel: SECURITY_LEVEL,
        total: 1
      });
    } catch (err) {
      return new Error(`Error generating new address: ${err}`);
    }
  },

  attachToTangle: async function (address) {
    const transfers = [{
      value: 0, // attach to tangle is a zero transaction value
      address: address
    }];

    try {
      const trytes = await iota.prepareTransfers(SEED, transfers);
      const bundle = await iota.sendTrytes(trytes, DEPTH, MINIMUM_WEIGHT_MAGNITUDE);
      const tailTxHash = bundle[0].hash;

      return tailTxHash;
    } catch (err) {
      return new Error(`Error attaching to tangle: ${err}`);
    }
  },

  isTxVerified: async function (tailTxHash) {
    try {
      const state = await iota.getLatestInclusion([tailTxHash]);
      return state[0];
    } catch (err) {
      return new Error(`Error checking tx: ${err}`);
    }
  },

  getBalances: async function (address) {
    try {
      const balance = await iota.getBalances([address], 100);
      return parseInt(balance.balances);
    } catch (err) {
      return new Error(`Error checking balances: ${err}`);
    }
  },
  
  getPaymentInfo: async function (tailTxHash) {
    try {
      const bundleObj = await iota.getBundle(tailTxHash);
      return [
        bundleObj[0].address,
        bundleObj[0].value,
        bundleObj[0].tag
      ];
    } catch (err) {
      return new Error(`Error getting payment info: ${err}`);
    }
  },

  getPaymentInfoAndMessages: async function (tailTxHash) {
    try {
      const bundle = await iota.getBundle(tailTxHash);
      const messages = JSON.parse(Extract.extractJson(bundle));
      return [
        bundle[0].address,
        messages.amount,
        bundle[0].tag
      ]
    } catch (err) {
      return new Error(`Error reading Tx: ${err}`);
    }
  },

  createRandomIotaTag: function () {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
    const charactersLength = characters.length;
    const length = 27; // IOTA tag length is 27 trytes

    var result = '';
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }
}

module.exports = iota_engine;