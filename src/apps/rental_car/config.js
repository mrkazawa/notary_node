const os = require("os");
const HOSTNAME = os.hostname();

/**
 * Specify one hostname to be a master.
 * 
 * If there are two or more notary nodes connected to the same compute engine
 * with the same NETWORK ID and (no parallelism), both of them will get events.
 * Moreover, all notary nodes will also get notification from the Core Engine.
 * Then, we have to determine which node is the leader to process the next
 * application steps.
 * 
 * Since, we do not have a leader election algorithm yet in the notary nodes.
 * We hard coded the role of master in this file.
 * 
 * TODO: do the leader election for this.
 */
const MASTER = 'notary1';

/**
 * Each of the IoT applications in the notary node will have a uniques
 * Application Identifier to distinguish one another.
 * 
 * This is SYSTEM-DEFINED, so far it is still hard-coded.
 * 
 * TODO: create a system-wide app id assignment.
 */
const APP_ID = 1234;

/**
 * An IoT application can defined their own Task identifiers to
 * differentiate one task from another.
 * This will ease their operation during synchronization between apps
 * in multiple notary nodes.
 * 
 * This is APPLICATION-DEFINED.
 */
const TASK_ID = {
  INSERT_NEW_CAR: 1,
  AUTHORIZE_CAR: 2
};

/**
 * The network id for the compute engine.
 * In the parallelism concept, each network will have separate network id.
 * The app can choose to use any network id that is available.
 */
const COMPUTE_NETWORK_ID = '2020';

/**
 * The endpoint to store a blockchain data to the Core Engine.
 */
const CORE_ENGINE_URL = `http://127.0.0.1:3000/transact`;

/**
 * The location of the contract ABI object.
 */
const CAR_RENTAL_CONTRACT = require('./build/contracts/CarRentalContract.json');

// the path to store performance measurements
const RESULT_DATA_PATH_INSERT_CAR = '/home/vagrant/result_rental_car_insert_car.csv';
const RESULT_DATA_PATH_VERIFY_PAYMENT = '/home/vagrant/result_rental_car_verify_payment.csv';
const RESULT_DATA_PATH_TASK_1 = '/home/vagrant/result_rental_car_task_1.csv';
const RESULT_DATA_PATH_TASK_2 = '/home/vagrant/result_rental_car_task_2.csv';

const isMasterNode = function () {
  return (HOSTNAME == MASTER);
}

exports.APP_ID = APP_ID;
exports.TASK_ID = TASK_ID;
exports.COMPUTE_NETWORK_ID = COMPUTE_NETWORK_ID;
exports.CORE_ENGINE_URL = CORE_ENGINE_URL;
exports.CAR_RENTAL_CONTRACT = CAR_RENTAL_CONTRACT;
exports.RESULT_DATA_PATH_INSERT_CAR = RESULT_DATA_PATH_INSERT_CAR;
exports.RESULT_DATA_PATH_VERIFY_PAYMENT = RESULT_DATA_PATH_VERIFY_PAYMENT;
exports.RESULT_DATA_PATH_TASK_1 = RESULT_DATA_PATH_TASK_1;
exports.RESULT_DATA_PATH_TASK_2 = RESULT_DATA_PATH_TASK_2;
exports.isMasterNode = isMasterNode;