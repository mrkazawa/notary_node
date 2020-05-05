const {
  performance
} = require('perf_hooks');

const carProcessor = require('./car');
const tools = require('../tools');

const {
  APP_ID,
  TASK_ID,
  isMasterNode
} = require('../config');

const {
  InvalidDomain
} = require('../errors');

/**
 * Processing appliation notifications that is sent by the Core Engine.
 * The body of the request will contain the recently included block
 * in the Core Engine.
 * 
 * Note that this method is for internal use only.
 * Therefore, only localhost are allowed to access this resource.
 * 
 * @param {object} req    The request object from Express
 * @param {object} res    The response object from Express
 */
const processCoreEvent = function (req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (ip !== '::ffff:127.0.0.1') {
    throw new InvalidDomain(ip);
  }

  console.log('Getting notification from Core Engine..');
  const start = performance.now();

  const block = req.body;
  const appRequests = tools.getAppRequestsFromBlock(block, APP_ID);

  if (appRequests.length > 0) {

    for (let appRequest of appRequests) {
      const taskId = appRequest.task_id;
      console.log(`Getting TASK ID of ${taskId}..`);

      if (taskId == TASK_ID.INSERT_NEW_CAR) {
        carProcessor.insertNewCar(appRequest, start);

      } else if (taskId == TASK_ID.AUTHORIZE_CAR) {
        if (isMasterNode()) {
          carProcessor.authorizeCar(appRequest, start);
        }
      }
    }
  }

  res.status(200).send('Notification received, please check log to see any errors');
};

exports.processCoreEvent = processCoreEvent;