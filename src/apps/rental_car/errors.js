class RentalCarError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class CoreEngineSendError extends RentalCarError {
  constructor(data) {
    super(`Cannot send ${data} to the Core Engine.`);
  }
}

class DatabaseInsertError extends RentalCarError {
  constructor(data) {
    super(`Cannot insert ${data} to the local database.`);
  }
}

class CarOwnerMismatchedError extends RentalCarError {
  constructor(expectedOwner, givenOwner) {
    super(`Car owner does not match (expected: ${expectedOwner} but given: ${givenOwner}).`);
  }
}

class InvalidIpfsHashError extends RentalCarError {
  constructor(ipfsHash) {
    super(`${ipfsHash} is not an IPFS hash.`);
  }
}

class IpfsGetError extends RentalCarError {
  constructor(ipfsHash) {
    super(`Cannot get ${ipfsHash} content.`);
  }
}

class IotaExecutionError extends RentalCarError {
  constructor(error) {
    super(`IOTA error: ${error}`);
  }
}

module.exports = {
  CoreEngineSendError,
  DatabaseInsertError,
  CarOwnerMismatchedError,
  InvalidIpfsHashError,
  IpfsGetError,
  IotaExecutionError
}