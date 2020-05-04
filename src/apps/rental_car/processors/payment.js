const http = require('http');
const {
  performance
} = require('perf_hooks');
const uuidV1 = require('uuid/v1');

const paymentEngine = require('../../../payment/iota_engine');
const tools = require('../tools');

const {
  CoreEngineSendError,
  IotaExecutionError
} = require('../errors');

const {
  APP_ID,
  TASK_ID,
  CORE_ENGINE_URL,
  RESULT_DATA_PATH
} = require('../config');

const DB = require('../db/sqlite_db');
const db = new DB();

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

  const car = db.getCarByHash(carHash);
  const confirmed = await paymentEngine.isTxVerified(paymentHash);
  if (confirmed instanceof Error) {
    throw new IotaExecutionError(confirmed);
  }

  if (confirmed) {
    const paymentInfo = await paymentEngine.getPaymentInfo(paymentHash);
    if (paymentInfo instanceof Error) {
      throw new IotaExecutionError(paymentInfo);
    }

    const carFeeAddressWithoutChecksum = car.fee_address.slice(0, -9);
    if (
      carFeeAddressWithoutChecksum == paymentInfo[0] &&
      car.fee_amount == paymentInfo[1] &&
      car.fee_tag == paymentInfo[2]
    ) {

      const payload = {
        data: {
          app_id: APP_ID,
          task_id: TASK_ID.INSERT_PAYMENT_HASH,
          process_id: uuidV1(),
          payment_proof: paymentHash,
          renter_address: renterAddress,
          priority_id: 3,
          timestamp: Date.now()
        }
      };

      const options = {
        method: 'post',
        url: CORE_ENGINE_URL,
        data: payload,
        httpAgent: new http.Agent({
          keepAlive: false
        })
      };

      const response = await tools.sendRequest(options);
      if (response instanceof Error) {
        throw new CoreEngineSendError(paymentHash);
      }

      const end = performance.now();
      tools.savingResult('Post Car Payment to Core Engine', RESULT_DATA_PATH, start, end);
      console.log('Tx hash stored in Core Engine');

      res.status(200).send('Tx hash received, please check log to see any errors');

    } else {
      res.status(400).send('Tx hash does not match the car information');
    }

  } else {
    res.status(400).send('Payment hash has not been verified yet');
  } 
};

exports.processTxHash = processTxHash;