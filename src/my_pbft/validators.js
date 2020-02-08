const CryptoUtil = require("./crypto_util");

class Validators {
  constructor(numberOfValidators) {
    if (Validators._instance) {
      throw new Error('Validators already has an instance!!!');
    }
    Validators._instance = this;

    this.list = this.generateAddresses(numberOfValidators);
  }

  // This function generates wallets and their public key
  // The secret key has been known for demonstration purposes
  // Secret will be passed from command line to generate the same wallet again
  // As a result the same public key will be generatedd
  generateAddresses(numberOfValidators) {
    let list = [];
    for (let i = 0; i < numberOfValidators; i++) {
      // TODO: Still using static SECRET for NODE+i
      // still construct the list of validators manually here
      list.push(CryptoUtil.generateKeyPair("NODE" + i).getPublic("hex"));
    }
    return list;
  }

  isValidValidator(validator) {
    return this.list.includes(validator);
  }
}

module.exports = Validators;
