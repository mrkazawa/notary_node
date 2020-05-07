const {
  performance
} = require('perf_hooks');
const uuidV1 = require('uuid/v1');

const paymentEngine = require('../../../payment/iota_engine');
const tools = require('../tools');

const {
  CoreEngineSendError,
  IotaExecutionError,
  DatabaseWriteError
} = require('../errors');

const {
  APP_ID,
  TASK_ID,
  CORE_ENGINE_URL,
  RESULT_DATA_PATH_VERIFY_PAYMENT
} = require('../config');

const CarDB = require('../db/car_db');
const carDB = new CarDB();
const PaymentDB = require('../db/payment_db');
const paymentDB = new PaymentDB();

/**
 * Process the submitted Tx hash from car renter.
 * The car renter can form a JSON object that include his tail transaction
 * hash in the IOTA as a proof of payment of the car.
 * 
 * @param {object} req    The request object from Express
 * @param {object} res    The response object from Express
 */
const processTxHash = async function (req, res) {
  console.log('Getting the Tx hash from car renter..');
  const start = performance.now();

  const renter = req.body;
  const carHash = renter.car_hash;
  const paymentHash = renter.payment_hash;
  const renterAddress = renter.renter_address;

  if (!await isPaymentValid(carHash, paymentHash)) {
    res.status(400).send('Tx hash is not valid');
  }

  updateLocalDatabase(carHash, paymentHash, renterAddress);
  await sendUpdateToCoreEngine(carHash, paymentHash, renterAddress);

  const end = performance.now();
  tools.savingResult('Post Car Payment to Core Engine', RESULT_DATA_PATH_VERIFY_PAYMENT, start, end);
  console.log('Tx hash stored in Core Engine');

  res.status(200).send('Tx hash received, please check log to see any errors');
  return;
};

async function isPaymentValid(carHash, paymentHash) {
  const isUsed = paymentDB.checkIfPaymentExist(paymentHash);
  if (isUsed) {
    return false;
  }

  const confirmed = await paymentEngine.isTxVerified(paymentHash);
  if (confirmed instanceof Error) {
    throw new IotaExecutionError(confirmed);
  }

  if (!confirmed) {
    return false;
  }

  const paymentInfo = await paymentEngine.getPaymentInfoAndMessages(paymentHash);
  if (paymentInfo instanceof Error) {
    throw new IotaExecutionError(paymentInfo);
  }

  const car = carDB.getCarByHash(carHash);
  const carFeeAddressWithoutChecksum = car.fee_address.slice(0, -9);
  if (
    carFeeAddressWithoutChecksum != paymentInfo[0] ||
    car.fee_amount != paymentInfo[1] ||
    car.fee_tag != paymentInfo[2]
  ) {
    return false;
  }

  return true;
}

function updateLocalDatabase(carHash, paymentHash, renterAddress) {
  const insert = paymentDB.insertNewPayment(paymentHash, renterAddress);
  if (insert.changes <= 0) {
    throw new DatabaseWriteError(paymentHash);
  }

  const update = carDB.authorizeCar(carHash, renterAddress);
  if (update.changes <= 0) {
    throw new DatabaseWriteError(carHash);
  }
}

async function sendUpdateToCoreEngine(carHash, paymentHash, renterAddress) {
  const payload = {
    data: {
      app_id: APP_ID,
      task_id: TASK_ID.AUTHORIZE_CAR,
      process_id: uuidV1(),
      car_hash: carHash,
      payment_proof: paymentHash,
      renter_address: renterAddress,
      priority_id: 3,
      timestamp: Date.now()
    }
  };

  const options = tools.formPostRequest(CORE_ENGINE_URL, payload);
  const response = await tools.sendRequest(options);
  if (response instanceof Error) {
    throw new CoreEngineSendError(paymentHash);
  }

  return response.data;
}

exports.processTxHash = processTxHash;